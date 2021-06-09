/// <reference types="cypress" />

describe("Mutation: createPaymentMethod", () => {
  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
        createPaymentMethod {
          code
          error
          status
        }
      }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should successfuly create a pending payment method", () => {
    cy.generateWePayToken().then((wepayToken) => {
      console.log(`wepay short lived token was ${wepayToken}`);
      cy.convertPayfacPaymentMethodToken(wepayToken).then((id) => {
        console.log(`convertPayfacPaymentMethodToken was ${id}`);

        cy.getPaymentMethodById(id).then((paymentMethod) => {
          let status = paymentMethod.status;
          assert.notEqual(status, "PROCESSING");
          const gqlQuery = `mutation {
              createPaymentMethod(input: {
                token: "${paymentMethod.id}"
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
            }`;
          cy.postGQL(gqlQuery).then((res) => {
            cy.expect(res.isOkStatusCode).to.be.equal(true);
            assert.exists(res.body.data);
          });
        });
      });
    });
  });
});
