/// <reference types="cypress" />

describe("Mutation: createPaymentMethodClaim", () => {
  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
      createPaymentMethodClaim {
          code
          error
          status
        }
      }`;

    cy.postGQLWithoutTenantSecret(gqlQuery).then((res) => {
      cy.log(JSON.stringify(res));
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
      createPaymentMethodClaim(input: { token: "id", singleUse: true, expirationDate: ""}){}
    }`;

    cy.postGQLWithoutTenantSecret(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no x-aptean-account is passed in the headers", () => {
    const gqlQuery = `mutation {
      createPaymentMethodClaim {
          code
          message
          error
        }
      }
      `;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the x-aptean-account header is not the right value", () => {
    const gqlQuery = `mutation {
      createPaymentMethodClaim {
          code
          message
          error
        }
      }
      `;

    const headers = {
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-account": "some-wrong-value",
    };

    cy.postGQLWithHeaders(gqlQuery, headers).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if input argument is empty", () => {
    const gqlQuery = `mutation {
      createPaymentMethodClaim {
          code
          message
          error
        }
      }
      `;

    cy.postGQLWithoutTenantSecret(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should successfully create a single use payment method claim", () => {
    cy.generateWePayToken().then((wepayToken) => {
      cy.log(JSON.stringify(wepayToken));
      cy.convertPayfacPaymentMethodToken(wepayToken).then((id) => {
        cy.log(JSON.stringify(id));
        cy.getPaymentMethodById(id).then((paymentMethod) => {
          cy.log(JSON.stringify(paymentMethod));
          let status = paymentMethod.status;
          assert.notEqual(status, "PROCESSING");
          const gqlQuery = `mutation {
                          createPaymentMethodClaim(
                            input: { token: "${paymentMethod.id}", singleUse: true, expirationDate: ""}
                          ) {
                            code
                            message
                            error
                            errorReason {
                              code
                              message
                              details {
                                code
                                message
                              }
                            }
                            paymentMethodClaim {
                              id
                              singleUse
                              expirationDate
                              owner {
                                tenantId
                              }
                            }
                          }
                        }
                        `;
          cy.postGQLWithoutTenantSecret(gqlQuery).then((res) => {
            cy.log(JSON.stringify(res));
            cy.expect(res.isOkStatusCode).to.be.equal(true);
            assert.exists(res.body.data);
            assert.exists(res.body.data.createPaymentMethodClaim);
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
                .expirationDate
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim.id
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim.owner
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
                .singleUse
            );
          });
        });
      });
    });
  });

  it("should successfully create a payment method claim", () => {
    cy.generateWePayToken().then((wepayToken) => {
      cy.log(JSON.stringify(wepayToken));
      cy.convertPayfacPaymentMethodToken(wepayToken).then((id) => {
        cy.log(JSON.stringify(id));
        cy.getPaymentMethodById(id).then((paymentMethod) => {
          cy.log(JSON.stringify(paymentMethod));
          let status = paymentMethod.status;
          assert.notEqual(status, "PROCESSING");
          const gqlQuery = `mutation {
                          createPaymentMethodClaim(
                            input: { token: "${paymentMethod.id}", expirationDate: ""}
                          ) {
                            code
                            message
                            error
                            errorReason {
                              code
                              message
                              details {
                                code
                                message
                              }
                            }
                            paymentMethodClaim {
                              id
                              singleUse
                              expirationDate
                              owner {
                                tenantId
                              }
                            }
                          }
                        }
                        `;
          cy.postGQLWithoutTenantSecret(gqlQuery).then((res) => {
            cy.log(JSON.stringify(res));
            cy.expect(res.isOkStatusCode).to.be.equal(true);
            assert.exists(res.body.data);
            assert.exists(res.body.data.createPaymentMethodClaim);
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
                .expirationDate
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim.id
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim.owner
            );
            assert.exists(
              res.body.data.createPaymentMethodClaim.paymentMethodClaim
                .singleUse
            );
          });
        });
      });
    });
  });
});
