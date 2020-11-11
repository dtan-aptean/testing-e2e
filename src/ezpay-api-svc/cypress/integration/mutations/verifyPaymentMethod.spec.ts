/// <reference types="cypress" />

describe('Mutation: verifyPaymentMethod', () => {
    let paymentMethodId = "";
    it('should pass if the mutation verifies that payment method does not exist with given arguments', () => {
        const gqlQuery = `mutation {
            verifyPaymentMethod(
                input: {
                    paymentMethodId: "${paymentMethodId}"
                    microDeposits: [0, 0]
                }
            ) {
                code
                error
            }
        }`
        cy.postGQL(gqlQuery).then(res => {
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
    
        // should have errors due to payment method id not existing
        assert.exists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);
        });
    });

    it('should fail if no argument is provided', () => {
        const gqlQuery = `mutation {
          verifyPaymentMethod {
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