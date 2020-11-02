/// <reference types="cypress" />

describe('Mutation: createPaymentMethod', () => {
  let paymentMethodId: string;

  beforeEach(() => {
    paymentMethodId = cy.generatePaymentMethodToken();
  });
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
  it('should error out becuase short lived token does not exist', () => {
    const gqlQuery = `mutation {
      createPaymentMethod(input: {
        token: "${paymentMethodId}"
        type: CREDIT_CARD
        attachToResourceId: "${Cypress.env("x-aptean-tenant")}"
      }) {
        code
        error
        message
      }
    }`

    cy.postGQL(gqlQuery).then(res => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });
});