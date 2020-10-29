/// <reference types="cypress" />

describe('Mutation: detachPaymentMethod', () => {
    let paymentMethodId = "";
    let resourceId = "";

    it('should pass if the mutation errors because payment method id does not exist with given arguments', () => {
        const gqlQuery = `mutation {
            detachPaymentMethod(input:{
              paymentMethodId: "${paymentMethodId}"
              resourceId: "${resourceId}"
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
          detachPaymentMethod {
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
});