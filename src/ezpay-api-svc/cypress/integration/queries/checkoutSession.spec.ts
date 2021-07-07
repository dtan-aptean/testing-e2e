/// <reference types="cypress" />

describe("Query: checkout session", () => {
    it("should pass if the query has at least one return type", () => {

      // create a new session
      cy.createCheckoutSession().then((res)=>{
        const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;
  
        const gqlQuery = `query {
          checkoutSession(input: { id: "${sessionId}" }) {
            amount
            cancelUrl
            checkoutUrl
            currency
            customData
            orderDetails {
              orderType
            }
            payerDetails {
              address {
                country
              }
            }
          }
        }           
        `;

        cy.postGQLCheckoutConsumer(gqlQuery).then((queryResult) => {
          // should be 200 ok
          cy.expect(queryResult.isOkStatusCode).to.be.equal(true);
    
          // no errors
          assert.notExists(queryResult.body.errors, 'no errors');
    
          // has data
          assert.exists(queryResult.body.data);
  
          // return type should not be null
          assert.isNotNull(queryResult.body.data.checkoutSession.id);
        });
      });
    });
  
    it("should fail if input argument is empty", () => {
      const gqlQuery = `query {
        checkoutSession(input: { id: "" }) 
      }
      `;
  
      cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
        // should have errors
        assert.exists(res.body.errors);
  
        // no data
        assert.notExists(res.body.data);
      });
    });
  
    it("should fail if no return type is provided", () => {

      // create a new session
      cy.createCheckoutSession().then((res)=>{
        const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

        const gqlQuery = `query {
          checkoutSession(input: { id: "${sessionId}" }) 
        }
        `;
    
        cy.postGQLCheckoutConsumer(gqlQuery).then((queryResult) => {
          // should have errors
          assert.exists(queryResult.body.errors);
    
          // no data
          assert.notExists(queryResult.body.data);
        });
      });      
    });
  });
  