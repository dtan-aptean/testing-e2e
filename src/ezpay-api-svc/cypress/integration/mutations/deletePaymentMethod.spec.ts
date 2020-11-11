/// <reference types="cypress" />

describe('Mutation: deletePaymentMethod', () => {
    let paymentMethodId = "";

    it('should pass if the mutation errors because payment method id does not exist with given arguments', () => {
        const gqlQuery = `mutation {
            deletePaymentMethod(input:{
              paymentMethodId: "${paymentMethodId}"
            }) {
              code
              message
              error
            }
          }`
        
        cy.postGQL(gqlQuery).then(res => {
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
    
        // should have errors due to payment method id not existing
        assert.exists(res.body.errors);
        assert.notExists(res.body.data);
        });
    });

    it('should fail if no argument is provided', () => {
        const gqlQuery = `mutation {
          deletePaymentMethod {
            code
            error
            status
          }
        }`;
    
        cy.postGQL(gqlQuery).then(res => {
          // should not be 200 ok
          cy.expect(res.isOkStatusCode).to.be.equal(false);
    
          // should have errors
          assert.exists(res.body.errors);
    
          // no data
          assert.notExists(res.body.data);
        });
    });

    it('should successfully delete a payment method', () => {
      cy.generatePaymentMethodId().then(id => {
        const gqlQuery = `mutation {
          deletePaymentMethod(input: {
            paymentMethodId: "${id}"
          }) {
            paymentMethod {
              id
              owner {
                tenantId
              }
            }
          }
        }`
        cy.postGQL(gqlQuery).then(res => {
          cy.expect(res.isOkStatusCode).to.be.equal(true);
          assert.exists(res.body.data);
        });
      });
    }); 
});
