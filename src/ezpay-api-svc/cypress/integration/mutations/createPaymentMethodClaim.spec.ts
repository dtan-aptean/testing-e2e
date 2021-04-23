/// <reference types="cypress" />

describe('Mutation: createPaymentMethodClaim', () => {
    it('should fail if no argument is provided', () => {
        const gqlQuery = `mutation {
        createPaymentMethodCaim {
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

    it('should successfully create a single use payment method claim', () => {
        cy.generateWePayToken().then(wepayToken => {
            cy.convertPayfacPaymentMethodToken(wepayToken).then(id => {
                cy.wait(5000).then(() => {
                    cy.getPaymentMethodById(id).then(paymentMethod => {
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
                        cy.postGQLWithoutTenantSecret(gqlQuery).then(res => {
                            cy.expect(res.isOkStatusCode).to.be.equal(true);
                            assert.exists(res.body.data);
                            assert.exists(res.body.data.createPaymentMethodClaim);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.expirationDate);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.id);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.owner);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.singleUse);
                        });
                    });
                });
            });
        });
    });

    it('should successfully create a payment method claim', () => {
        cy.generateWePayToken().then(wepayToken => {
            cy.convertPayfacPaymentMethodToken(wepayToken).then(id => {
                cy.wait(5000).then(() => {
                    cy.getPaymentMethodById(id).then(paymentMethod => {
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
                        cy.postGQLWithoutTenantSecret(gqlQuery).then(res => {
                            cy.expect(res.isOkStatusCode).to.be.equal(true);
                            assert.exists(res.body.data);
                            assert.exists(res.body.data.createPaymentMethodClaim);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.expirationDate);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.id);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.owner);
                            assert.exists(res.body.data.createPaymentMethodClaim.paymentMethodClaim.singleUse);
                        });
                    });
                });
            });
        });
    });
});