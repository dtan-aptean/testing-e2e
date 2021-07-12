/// <reference types="cypress" />

describe("Mutation: convertPaymentMethodClaim", () => {
  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
        convertPaymentMethodClaim {
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

  it("should successfully create a single use payment method claim and convert twice", () => {
    cy.generateWePayToken().then((wepayToken) => {
      cy.convertPayfacPaymentMethodToken(wepayToken).then((id) => {
        cy.log(JSON.stringify(id));
        cy.getPaymentMethodById(id).then((paymentMethod) => {
          cy.log(JSON.stringify(paymentMethod));
          let status = paymentMethod.status;
          assert.notEqual(status, "PROCESSING");
          let gqlQuery = `mutation {
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

            gqlQuery = `
                          mutation {
                            convertPaymentMethodClaim(input: {
                              claimId: "${res.body.data.createPaymentMethodClaim.paymentMethodClaim.id}",
                            }) {
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
                              paymentMethod {
                                id
                              }
                            }
                          }`;
            cy.postGQL(gqlQuery).then((res) => {
              cy.log(JSON.stringify(res));
              // should 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);
              // should have data
              assert.exists(res.body.data);
              // no error
              assert.notExists(res.body.error);

              cy.postGQL(gqlQuery).then((res) => {
                cy.log(JSON.stringify(res));
                // should 200 ok
                cy.expect(res.isOkStatusCode).to.be.equal(true);
                // should have data
                assert.exists(res.body.data);
                assert.exists(res.body.data.convertPaymentMethodClaim);
                assert.equal(
                  res.body.data.convertPaymentMethodClaim.code,
                  "ERROR"
                );
                assert.equal(
                  res.body.data.convertPaymentMethodClaim.error,
                  "Claim has expired"
                );
                // no error
                assert.notExists(res.body.error);
              });
            });
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
          let gqlQuery = `mutation {
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

            gqlQuery = `
              mutation {
                convertPaymentMethodClaim(input: {
                  claimId: "${res.body.data.createPaymentMethodClaim.paymentMethodClaim.id}",
                }) {
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
                  paymentMethod {
                    id
                  }
                }
              }`;

            cy.postGQL(gqlQuery).then((res) => {
              cy.log(JSON.stringify(res));
              // should 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);
              // should have data
              assert.exists(res.body.data);
              // no error
              assert.notExists(res.body.error);

              cy.postGQL(gqlQuery).then((res) => {
                cy.log(JSON.stringify(res));
                cy.expect(res.isOkStatusCode).to.be.equal(true);
                // should have data
                assert.exists(res.body.data);
                // no error
                assert.notExists(res.body.error);
              });
            });
          });
        });
      });
    });
  });
});
