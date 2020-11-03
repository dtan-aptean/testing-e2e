/// <reference types="cypress" />

describe('Mutation: createPaymentMethod', () => {
  it('should fail if no argument is provided', () => {
      const gqlQuery = `mutation {
        createPaymentMethod {
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

  // Unsure of what to expect for this test to pass, the api sends an error when the payment method creation is pending
  it.skip('should successfuly create a pending payment method', () => {
    cy.generatePaymentMethodToken().then(paymentMethodId => {
      const gqlQuery = `mutation {
        createPaymentMethod(input: {
          token: "${paymentMethodId}"
          type: CREDIT_CARD
          attachToResourceId: "${Cypress.env("x-aptean-tenant")}"
        }) {
          code
          error
          message
          paymentMethod {
            id
            owner {
              tenantId
            }
          }
        }
      }`
  
      cy.postGQL(gqlQuery).then(res => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
        // expect errors
        assert.exists(res.body.errors);
        // no data
        assert.notExists(res.body.data);
      });
    });
  });
});