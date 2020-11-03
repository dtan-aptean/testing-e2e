/// <reference types="cypress" />

describe('Mutation: attachPaymentMethod', () => {
    let paymentMethodId = "";
    let resourceId = "";
    let isDefault = false;

    it('should pass if the mutation errors because payment method id does not exist with given arguments', () => {
        const gqlQuery = `mutation {
            attachPaymentMethod(input:{
              paymentMethodId: "${paymentMethodId}"
              resourceId: "${resourceId}"
              isDefault: ${isDefault}
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
          attachPaymentMethod {
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
    
    //TODO: Current tests to detach a payment method do not reliably pass. Revisit after finding reliable ways to detach a payment method id
    it.skip('should succesfully attach a detached payment method id to the tenant', () => {
      //generate detached payment method id

      const gqlQuery = `mutation {
        attachPaymentMethod(input: {
          resourceId: "${Cypress.env('x-aptean-tenant')}"
          paymentMethodId: "PAYMENT_METHOD_ID"
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
      })
    });
});