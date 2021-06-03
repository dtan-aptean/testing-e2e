/// <reference types="cypress" />

describe("Mutation: createPayment", () => {
  it("should pass if the mutation creates a payment with all input arguments: using paymentRequestId", () => {
    // create paymentRequest
    cy.generatePaymentRequest().then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          return cy
            .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
            .then((paymentMethodId) => {
              return paymentMethodId;
            });
        })
        .then((paymentMethodId) => {
          // payment
          const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${paymentRequest.amount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
                failOnReview: false
                customData: { id: 1234567890 }
                l2l3Data: {
                  customerReferenceNumber: "1234567890"
                  lineItems: [
                    {
                      description: "desc"
                      totalAmount: ${paymentRequest.amount}
                      currency: CAD
                      quantity: 1
                      unitOfMeasure: "unit"
                      unitPrice: ${paymentRequest.amount}
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "description"
                  taxAmount: 100
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;

          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            paymentRequest.paymentRequestId
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // should not have errors
            assert.notExists(
              res.body.errors,
              `One or more errors ocuured while executing query: ${gqlQuery}`
            );

            // has data
            assert.exists(res.body.data);

            // assertions
            assert.isNotNull(res.body.data.createPayment);
            assert.isNotNull(res.body.data.createPayment.code);
            assert.isNotNull(res.body.data.createPayment.payment.id);
            assert.isNull(res.body.data.createPayment.error);
            assert.equal(
              res.body.data.createPayment.code,
              "SUCCESS",
              "Code is not SUCCESS"
            );
          });
        });
    });
  });

  it("should pass if the mutation creates a payment with all input arguments: using paymentRequestAllocation", () => {
    // create paymentRequest
    cy.generatePaymentRequest().then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          return cy
            .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
            .then((paymentMethodId) => {
              return paymentMethodId;
            });
        })
        .then((paymentMethodId) => {
          // payment
          const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestAllocation: [
                  {
                    paymentRequestId: "${paymentRequest.paymentRequestId}"
                    amount: ${paymentRequest.amount}
                  }
                ]
                amount: ${paymentRequest.amount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
                failOnReview: false
                customData: { id: 1234567890 }
                l2l3Data: {
                  customerReferenceNumber: "1234567890"
                  lineItems: [
                    {
                      description: "desc"
                      totalAmount: ${paymentRequest.amount}
                      currency: CAD
                      quantity: 1
                      unitOfMeasure: "unit"
                      unitPrice: ${paymentRequest.amount}
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "description"
                  taxAmount: 100
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;

          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            paymentRequest.paymentRequestId
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // should not have errors
            assert.notExists(
              res.body.errors,
              `One or more errors ocuured while executing query: ${gqlQuery}`
            );

            // has data
            assert.exists(res.body.data);

            // assertions
            assert.isNotNull(res.body.data.createPayment);
            assert.isNotNull(res.body.data.createPayment.code);
            assert.isNotNull(res.body.data.createPayment.payment.id);
            assert.isNull(res.body.data.createPayment.error);
            assert.equal(
              res.body.data.createPayment.code,
              "SUCCESS",
              "Code is not SUCCESS"
            );
          });
        });
    });
  });

  it("should pass if the mutation creates a payment with only required input arguments", () => {
    const amount = Cypress._.random(1000, 1e4);

    cy.generateWepayTokenCreditCard()
      .then((payfacToken) => {
        return cy
          .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
          .then((paymentMethodId) => {
            return paymentMethodId;
          });
      })
      .then((paymentMethodId) => {
        // payment
        const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                amount: ${amount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;

        cy.postGQLWithIdempotencyKey(gqlQuery, paymentMethodId).then((res) => {
          // should be 200 ok
          cy.expect(res.isOkStatusCode).to.be.equal(true);

          // should not have errors
          assert.notExists(
            res.body.errors,
            `One or more errors ocuured while executing query: ${gqlQuery}`
          );

          // has data
          assert.exists(res.body.data);

          // assertions
          assert.isNotNull(res.body.data.createPayment);
          assert.isNotNull(res.body.data.createPayment.code);
          assert.isNotNull(res.body.data.createPayment.payment.id);
          assert.isNull(res.body.data.createPayment.error);
          assert.equal(
            res.body.data.createPayment.code,
            "SUCCESS",
            "Code is not SUCCESS"
          );
        });
      });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
        createPayment(
          input: {
            paymentMethodId: "001",
            paymentRequestId: "001"
            amount: 199
            immediateCapture: true
            currency: ${Cypress.env("currency")}
            riskMetadata: {
              address: { postalCode: "12222", country: "US" }
              phone: { countryCode: "1", number: "222111445" }
              lineItems: {
                description: "TestLine"
                price: 199
                currency: ${Cypress.env("currency")}
                quantity: 1
              }
            }
          }
        )
      }
      `;

    cy.postGQLWithIdempotencyKey(gqlQuery, Math.random()).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass fail on review tests", () => {
    cy.generatePaymentRequest(361).then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          return cy
            .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
            .then((paymentMethodId) => {
              return paymentMethodId;
            });
        })
        .then((paymentMethodId) => {
          // payment
          const gqlQuery = `mutation {
        createPayment(
          input: {
            paymentMethodId: "${paymentMethodId}",
            paymentRequestId: "${paymentRequest.paymentRequestId}"
            amount: ${paymentRequest.amount}
            immediateCapture: false
            failOnReview: true
            currency: ${Cypress.env("currency")}
            riskMetadata: {
              address: { postalCode: "12222", country: "US" }
              phone: { countryCode: "1", number: "222111445" }
              lineItems: {
                description: "TestLine"
                price: ${paymentRequest.amount}
                currency: ${Cypress.env("currency")}
                quantity: 1
              }
            }
          }
        ) {
          code
          message
          error
          payment {
            id
            status
          }
        }
      }
      `;

          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            paymentRequest.paymentRequestId
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // should not have errors
            assert.notExists(
              res.body.errors,
              `One or more errors ocuured while executing query: ${gqlQuery}`
            );

            // has data
            assert.exists(res.body.data);

            // assertions
            assert.isNotNull(res.body.data.createPayment);
            assert.isNotNull(res.body.data.createPayment.code);
            assert.isNotNull(res.body.data.createPayment.payment.id);
            assert.isNull(res.body.data.createPayment.error);
            assert.equal(
              res.body.data.createPayment.code,
              "ERROR",
              "Code is not ERROR"
            );

            assert.equal(
              res.body.data.createPayment.message,
              "Cancelled due to IN_REVIEW state for the created payment."
            );

            const id = res.body.data.createPayment.payment.id;
            const amount = paymentRequest.amount;
            return { id: id, amount: amount };
          });
        });
    });
  });
});

describe("Mutation: createPayment: discount flow", () => {
  const amount = Cypress._.random(1000, 1e4);
  const discount = Cypress._.random(100, 900);
  const payableAmount = amount - discount;

  it("should pass if the mutation creates a payment with the discounted amount", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            // payment
            const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${payableAmount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              paymentRequest.paymentRequestId
            ).then((res) => {
              // should be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // should not have errors
              assert.notExists(
                res.body.errors,
                `One or more errors ocuured while executing query: ${gqlQuery}`
              );

              // has data
              assert.exists(res.body.data);

              // assertions
              assert.isNotNull(res.body.data.createPayment);
              assert.isNotNull(res.body.data.createPayment.code);
              assert.isNotNull(res.body.data.createPayment.payment.id);
              assert.isNull(res.body.data.createPayment.error);
              assert.equal(
                res.body.data.createPayment.code,
                "SUCCESS",
                "Code is not SUCCESS"
              );
            });
          });
      }
    );
  });

  it("should fail if the mutation creates a payment with the requested amount though discount is applicable", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            // payment
            const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${amount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              paymentRequest.paymentRequestId
            ).then((res) => {
              // should not be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // should have errors
              assert.exists(res.body.errors);

              // no data
              assert.notExists(res.body.data);
            });
          });
      }
    );
  });

  it("should pass if the discount is not getting applied after the discount end date", () => {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 3);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, now).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            // payment
            const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${amount}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
            // wait for the discount to get expired
            cy.wait(3000);

            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              paymentRequest.paymentRequestId
            ).then((res) => {
              // should be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // should not have errors
              assert.notExists(
                res.body.errors,
                `One or more errors ocuured while executing query: ${gqlQuery}`
              );

              // has data
              assert.exists(res.body.data);

              // assertions
              assert.isNotNull(res.body.data.createPayment);
              assert.isNotNull(res.body.data.createPayment.code);
              assert.isNotNull(res.body.data.createPayment.payment.id);
              assert.isNull(res.body.data.createPayment.error);
              assert.equal(
                res.body.data.createPayment.code,
                "SUCCESS",
                "Code is not SUCCESS"
              );
            });
          });
      }
    );
  });

  it("should pass if the discount is not getting applied to pre-auth", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            // payment
            const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${amount}
                immediateCapture: false
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              paymentRequest.paymentRequestId
            ).then((res) => {
              // should be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // should not have errors
              assert.notExists(
                res.body.errors,
                `One or more errors ocuured while executing query: ${gqlQuery}`
              );

              // has data
              assert.exists(res.body.data);

              // assertions
              assert.isNotNull(res.body.data.createPayment);
              assert.isNotNull(res.body.data.createPayment.code);
              assert.isNotNull(res.body.data.createPayment.payment.id);
              assert.isNull(res.body.data.createPayment.error);
              assert.equal(
                res.body.data.createPayment.code,
                "SUCCESS",
                "Code is not SUCCESS"
              );
            });
          });
      }
    );
  });
});

describe("Mutation: createPayment: partial payment flow", () => {
  const amount = Cypress._.random(1000, 1e4);
  const discount = Cypress._.random(100, 900);
  const payableAmount = amount - discount;

  it("should pass if the mutation creates a partial payment against the payment request", () => {
    // create paymentRequest
    cy.generatePaymentRequest(amount).then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          return cy
            .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
            .then((paymentMethodId) => {
              return paymentMethodId;
            });
        })
        .then((paymentMethodId) => {
          const partialPay = amount - 500;
          // payment
          const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${partialPay}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            paymentRequest.paymentRequestId
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // get feature flags set for the current tenant
            cy.getFeatureFlags().then((features) => {
              const { paymentRequests } = features || {};
              const { partialPayment } = paymentRequests || {};

              // it should work only if the feature is enabled
              if (partialPayment) {
                // should not have errors
                assert.notExists(
                  res.body.errors,
                  `One or more errors ocuured while executing query: ${gqlQuery}`
                );

                // has data
                assert.exists(res.body.data);

                // assertions
                assert.isNotNull(res.body.data.createPayment);
                assert.isNotNull(res.body.data.createPayment.code);
                assert.isNotNull(res.body.data.createPayment.payment.id);
                assert.isNull(res.body.data.createPayment.error);
                assert.equal(
                  res.body.data.createPayment.code,
                  "SUCCESS",
                  "Code is not SUCCESS"
                );
              } else {
                // should have errors
                assert.exists(res.body.errors);

                // no data
                assert.notExists(res.body.data);
              }
            });
          });
        });
    });
  });

  it("should pass if the mutation creates a partial payment against the discounted payment request", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            const partialPay = payableAmount - 100;
            // payment
            const gqlQuery = `mutation {
            createPayment(
              input: {
                paymentMethodId: "${paymentMethodId}",
                paymentRequestId: "${paymentRequest.paymentRequestId}"
                amount: ${partialPay}
                immediateCapture: true
                currency: ${Cypress.env("currency")}
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: ${Cypress.env("currency")}
                    quantity: 1
                  }
                }
              }
            ) {
              code
              message
              error
              payment {
                id
                status
              }
            }
          }
          `;
            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              paymentRequest.paymentRequestId
            ).then((res) => {
              // should be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // get feature flags set for the current tenant
              cy.getFeatureFlags().then((features) => {
                const { paymentRequests } = features || {};
                const { partialPayment } = paymentRequests || {};

                // it should work only if the feature is enabled
                if (partialPayment) {
                  // should not have errors
                  assert.notExists(
                    res.body.errors,
                    `One or more errors ocuured while executing query: ${gqlQuery}`
                  );

                  // has data
                  assert.exists(res.body.data);

                  // assertions
                  assert.isNotNull(res.body.data.createPayment);
                  assert.isNotNull(res.body.data.createPayment.code);
                  assert.isNotNull(res.body.data.createPayment.payment.id);
                  assert.isNull(res.body.data.createPayment.error);
                  assert.equal(
                    res.body.data.createPayment.code,
                    "SUCCESS",
                    "Code is not SUCCESS"
                  );
                } else {
                  // should have errors
                  assert.exists(res.body.errors);

                  // no data
                  assert.notExists(res.body.data);
                }
              });
            });
          });
      }
    );
  });

  it("should pass if the mutation creates multiple payments against the payment request", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequest(amount).then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          return cy
            .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
            .then((paymentMethodId) => {
              return paymentMethodId;
            });
        })
        .then((paymentMethodId) => {
          const partialPay = amount - 100;
          // first payment
          const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: ${partialPay}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }`;
          // making first payment
          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            `${paymentRequest.paymentRequestId}_1`
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // get feature flags set for the current tenant
            cy.getFeatureFlags().then((features) => {
              const { paymentRequests } = features || {};
              const { partialPayment } = paymentRequests || {};

              // it should work only if the feature is enabled
              if (partialPayment) {
                // should not have errors
                assert.notExists(
                  res.body.errors,
                  `One or more errors ocuured while executing query: ${gqlQuery}`
                );

                // has data
                assert.exists(res.body.data);

                // assertions
                assert.isNotNull(res.body.data.createPayment);
                assert.isNotNull(res.body.data.createPayment.code);
                assert.isNotNull(res.body.data.createPayment.payment.id);
                assert.isNull(res.body.data.createPayment.error);
                assert.equal(
                  res.body.data.createPayment.code,
                  "SUCCESS",
                  "Code is not SUCCESS"
                );
              } else {
                // should have errors
                assert.exists(res.body.errors);

                // no data
                assert.notExists(res.body.data);
              }
            });
          });
        })
        .then(() => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              // second payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: 100
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;

              // making another payment
              cy.postGQLWithIdempotencyKey(
                gqlQuery,
                `${paymentRequest.paymentRequestId}_2`
              ).then((res) => {
                // should be 200 ok
                cy.expect(res.isOkStatusCode).to.be.equal(true);

                // get feature flags set for the current tenant
                cy.getFeatureFlags().then((features) => {
                  const { paymentRequests } = features || {};
                  const { partialPayment } = paymentRequests || {};

                  // it should work only if the feature is enabled
                  if (partialPayment) {
                    // should not have errors
                    assert.notExists(
                      res.body.errors,
                      `One or more errors ocuured while executing query: ${gqlQuery}`
                    );

                    // has data
                    assert.exists(res.body.data);

                    // assertions
                    assert.isNotNull(res.body.data.createPayment);
                    assert.isNotNull(res.body.data.createPayment.code);
                    assert.isNotNull(res.body.data.createPayment.payment.id);
                    assert.isNull(res.body.data.createPayment.error);
                    assert.equal(
                      res.body.data.createPayment.code,
                      "SUCCESS",
                      "Code is not SUCCESS"
                    );
                  } else {
                    // should have errors
                    assert.exists(res.body.errors);

                    // no data
                    assert.notExists(res.body.data);
                  }
                });
              });
            });
        });
    });
  });

  it("should pass if the mutation creates multiple payments against the discounted payment request", () => {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    // create paymentRequest
    cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
      (paymentRequest) => {
        cy.generateWepayTokenCreditCard()
          .then((payfacToken) => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          })
          .then((paymentMethodId) => {
            const partialPay = payableAmount - 100;
            // first payment
            const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: ${partialPay}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }`;
            // making first payment
            cy.postGQLWithIdempotencyKey(
              gqlQuery,
              `${paymentRequest.paymentRequestId}_1`
            ).then((res) => {
              // should be 200 ok
              cy.expect(res.isOkStatusCode).to.be.equal(true);

              // get feature flags set for the current tenant
              cy.getFeatureFlags().then((features) => {
                const { paymentRequests } = features || {};
                const { partialPayment } = paymentRequests || {};

                // it should work only if the feature is enabled
                if (partialPayment) {
                  // should not have errors
                  assert.notExists(
                    res.body.errors,
                    `One or more errors ocuured while executing query: ${gqlQuery}`
                  );

                  // has data
                  assert.exists(res.body.data);

                  // assertions
                  assert.isNotNull(res.body.data.createPayment);
                  assert.isNotNull(res.body.data.createPayment.code);
                  assert.isNotNull(res.body.data.createPayment.payment.id);
                  assert.isNull(res.body.data.createPayment.error);
                  assert.equal(
                    res.body.data.createPayment.code,
                    "SUCCESS",
                    "Code is not SUCCESS"
                  );
                } else {
                  // should have errors
                  assert.exists(res.body.errors);

                  // no data
                  assert.notExists(res.body.data);
                }
              });
            });
          })
          .then(() => {
            cy.generateWepayTokenCreditCard()
              .then((payfacToken) => {
                return cy
                  .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                  .then((paymentMethodId) => {
                    return paymentMethodId;
                  });
              })
              .then((paymentMethodId) => {
                // second payment
                const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: 100
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;

                // making another payment
                cy.postGQLWithIdempotencyKey(
                  gqlQuery,
                  `${paymentRequest.paymentRequestId}_2`
                ).then((res) => {
                  // should be 200 ok
                  cy.expect(res.isOkStatusCode).to.be.equal(true);

                  // get feature flags set for the current tenant
                  cy.getFeatureFlags().then((features) => {
                    const { paymentRequests } = features || {};
                    const { partialPayment } = paymentRequests || {};

                    // it should work only if the feature is enabled
                    if (partialPayment) {
                      // should not have errors
                      assert.notExists(
                        res.body.errors,
                        `One or more errors ocuured while executing query: ${gqlQuery}`
                      );

                      // has data
                      assert.exists(res.body.data);

                      // assertions
                      assert.isNotNull(res.body.data.createPayment);
                      assert.isNotNull(res.body.data.createPayment.code);
                      assert.isNotNull(res.body.data.createPayment.payment.id);
                      assert.isNull(res.body.data.createPayment.error);
                      assert.equal(
                        res.body.data.createPayment.code,
                        "SUCCESS",
                        "Code is not SUCCESS"
                      );
                    } else {
                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    }
                  });
                });
              });
          });
      }
    );
  });

  it("should fail if the mutation creates multiple payments more than requested amount against the payment request", () => {
    // get feature flags set for the current tenant
    cy.getFeatureFlags().then((features) => {
      const { paymentRequests } = features || {};
      const { partialPayment } = paymentRequests || {};

      // it should work only if the feature is enabled
      if (partialPayment) {
        const tomorrow = new Date();
        tomorrow.setDate(new Date().getDate() + 1);
        // create paymentRequest
        cy.generatePaymentRequest(amount).then((paymentRequest) => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              const partialPay = amount - 100;
              // first payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: ${partialPay}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }`;
              // making first payment
              cy.postGQLWithIdempotencyKey(
                gqlQuery,
                `${paymentRequest.paymentRequestId}_1`
              ).then((res) => {
                // should be 200 ok
                cy.expect(res.isOkStatusCode).to.be.equal(true);

                // should not have errors
                assert.notExists(
                  res.body.errors,
                  `One or more errors ocuured while executing query: ${gqlQuery}`
                );

                // has data
                assert.exists(res.body.data);

                // assertions
                assert.isNotNull(res.body.data.createPayment);
                assert.isNotNull(res.body.data.createPayment.code);
                assert.isNotNull(res.body.data.createPayment.payment.id);
                assert.isNull(res.body.data.createPayment.error);
                assert.equal(
                  res.body.data.createPayment.code,
                  "SUCCESS",
                  "Code is not SUCCESS"
                );
              });
            })
            .then(() => {
              cy.generateWepayTokenCreditCard()
                .then((payfacToken) => {
                  return cy
                    .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                    .then((paymentMethodId) => {
                      return paymentMethodId;
                    });
                })
                .then((paymentMethodId) => {
                  // second payment
                  const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: 200
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;

                  // making another payment
                  cy.postGQLWithIdempotencyKey(
                    gqlQuery,
                    `${paymentRequest.paymentRequestId}_2`
                  ).then((res) => {
                    // should not be 200 ok
                    cy.expect(res.isOkStatusCode).to.be.equal(true);

                    // should have errors
                    assert.exists(res.body.errors);

                    // no data
                    assert.notExists(res.body.data);
                  });
                });
            });
        });
      }
    });
  });

  it("should fail if the mutation creates multiple payments more than requested amount against the discounted payment request", () => {
    // get feature flags set for the current tenant
    cy.getFeatureFlags().then((features) => {
      const { paymentRequests } = features || {};
      const { partialPayment } = paymentRequests || {};

      // it should work only if the feature is enabled
      if (partialPayment) {
        const tomorrow = new Date();
        tomorrow.setDate(new Date().getDate() + 1);
        // create paymentRequest
        cy.generatePaymentRequestWithDiscount(amount, discount, tomorrow).then(
          (paymentRequest) => {
            cy.generateWepayTokenCreditCard()
              .then((payfacToken) => {
                return cy
                  .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                  .then((paymentMethodId) => {
                    return paymentMethodId;
                  });
              })
              .then((paymentMethodId) => {
                const partialPay = payableAmount - 100;
                // first payment
                const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestId: "${paymentRequest.paymentRequestId}"
                  amount: ${partialPay}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${paymentRequest.amount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }`;
                // making first payment
                cy.postGQLWithIdempotencyKey(
                  gqlQuery,
                  `${paymentRequest.paymentRequestId}_1`
                ).then((res) => {
                  // should be 200 ok
                  cy.expect(res.isOkStatusCode).to.be.equal(true);

                  // should not have errors
                  assert.notExists(
                    res.body.errors,
                    `One or more errors ocuured while executing query: ${gqlQuery}`
                  );

                  // has data
                  assert.exists(res.body.data);

                  // assertions
                  assert.isNotNull(res.body.data.createPayment);
                  assert.isNotNull(res.body.data.createPayment.code);
                  assert.isNotNull(res.body.data.createPayment.payment.id);
                  assert.isNull(res.body.data.createPayment.error);
                  assert.equal(
                    res.body.data.createPayment.code,
                    "SUCCESS",
                    "Code is not SUCCESS"
                  );
                });
              })
              .then(() => {
                cy.generateWepayTokenCreditCard()
                  .then((payfacToken) => {
                    return cy
                      .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                      .then((paymentMethodId) => {
                        return paymentMethodId;
                      });
                  })
                  .then((paymentMethodId) => {
                    // second payment
                    const gqlQuery = `mutation {
                  createPayment(
                    input: {
                      paymentMethodId: "${paymentMethodId}",
                      paymentRequestId: "${paymentRequest.paymentRequestId}"
                      amount: 200
                      immediateCapture: true
                      currency: ${Cypress.env("currency")}
                      riskMetadata: {
                        address: { postalCode: "12222", country: "US" }
                        phone: { countryCode: "1", number: "222111445" }
                        lineItems: {
                          description: "TestLine"
                          price: ${paymentRequest.amount}
                          currency: ${Cypress.env("currency")}
                          quantity: 1
                        }
                      }
                    }
                  ) {
                    code
                    message
                    error
                    payment {
                      id
                      status
                    }
                  }
                }
                `;

                    // making another payment
                    cy.postGQLWithIdempotencyKey(
                      gqlQuery,
                      `${paymentRequest.paymentRequestId}_2`
                    ).then((res) => {
                      // should not be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    });
                  });
              });
          }
        );
      }
    });
  });
});

describe("Mutation: createPayment: consolidated payment flow", () => {
  const paymentRequestAmount1 = Cypress._.random(1000, 1e4);
  const paymentRequestAmount2 = Cypress._.random(1000, 1e4);
  const payableAmount = paymentRequestAmount1 + paymentRequestAmount2;

  it("should pass if the mutation creates a consolidated payment against multiple payment requests", () => {
    // create paymentRequest
    cy.generatePaymentRequest(paymentRequestAmount1).then((paymentRequest1) => {
      cy.generatePaymentRequest(paymentRequestAmount2).then(
        (paymentRequest2) => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              // payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestAllocation: [
                    { paymentRequestId: "${
                      paymentRequest1.paymentRequestId
                    }", amount: ${paymentRequestAmount1} }
                    { paymentRequestId: "${
                      paymentRequest2.paymentRequestId
                    }", amount: ${paymentRequestAmount2} }
                  ]
                  amount: ${payableAmount}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${payableAmount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;
              cy.postGQLWithIdempotencyKey(gqlQuery, paymentMethodId).then(
                (res) => {
                  // get feature flags set for the current tenant
                  cy.getFeatureFlags().then((features) => {
                    const { paymentRequests } = features || {};
                    const { consolidatedPayments } = paymentRequests || {};

                    // it should work only if the feature is enabled
                    if (consolidatedPayments) {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should not have errors
                      assert.notExists(
                        res.body.errors,
                        `One or more errors ocuured while executing query: ${gqlQuery}`
                      );

                      // has data
                      assert.exists(res.body.data);

                      // assertions
                      assert.isNotNull(res.body.data.createPayment);
                      assert.isNotNull(res.body.data.createPayment.code);
                      assert.isNotNull(res.body.data.createPayment.payment.id);
                      assert.isNull(res.body.data.createPayment.error);
                      assert.equal(
                        res.body.data.createPayment.code,
                        "SUCCESS",
                        "Code is not SUCCESS"
                      );
                    } else {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    }
                  });
                }
              );
            });
        }
      );
    });
  });

  it("should fail if the mutation creates a consolidated payment against multiple payment requests with higher payment amount", () => {
    // create paymentRequest
    cy.generatePaymentRequest(paymentRequestAmount1).then((paymentRequest1) => {
      cy.generatePaymentRequest(paymentRequestAmount2).then(
        (paymentRequest2) => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              // payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestAllocation: [
                    { paymentRequestId: "${
                      paymentRequest1.paymentRequestId
                    }", amount: ${paymentRequestAmount1} }
                    { paymentRequestId: "${
                      paymentRequest2.paymentRequestId
                    }", amount: ${paymentRequestAmount2} }
                  ]
                  amount: ${payableAmount + 100}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${payableAmount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;
              cy.postGQLWithIdempotencyKey(gqlQuery, paymentMethodId).then(
                (res) => {
                  // get feature flags set for the current tenant
                  cy.getFeatureFlags().then((features) => {
                    const { paymentRequests } = features || {};
                    const { consolidatedPayments } = paymentRequests || {};

                    // it should work only if the feature is enabled
                    if (consolidatedPayments) {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    }
                  });
                }
              );
            });
        }
      );
    });
  });

  it("should fail if the mutation creates a consolidated payment against multiple payment requests with higher payment request amount", () => {
    // create paymentRequest
    cy.generatePaymentRequest(paymentRequestAmount1).then((paymentRequest1) => {
      cy.generatePaymentRequest(paymentRequestAmount2).then(
        (paymentRequest2) => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              // payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestAllocation: [
                    { paymentRequestId: "${
                      paymentRequest1.paymentRequestId
                    }", amount: ${paymentRequestAmount1 + 100} }
                    { paymentRequestId: "${
                      paymentRequest2.paymentRequestId
                    }", amount: ${paymentRequestAmount2} }
                  ]
                  amount: ${payableAmount + 100}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${payableAmount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;
              cy.postGQLWithIdempotencyKey(gqlQuery, paymentMethodId).then(
                (res) => {
                  // get feature flags set for the current tenant
                  cy.getFeatureFlags().then((features) => {
                    const { paymentRequests } = features || {};
                    const { consolidatedPayments } = paymentRequests || {};

                    // it should work only if the feature is enabled
                    if (consolidatedPayments) {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    }
                  });
                }
              );
            });
        }
      );
    });
  });

  it("should pass if the mutation creates a consolidated partial payment against multiple payment requests", () => {
    // create paymentRequest
    cy.generatePaymentRequest(paymentRequestAmount1).then((paymentRequest1) => {
      cy.generatePaymentRequest(paymentRequestAmount2).then(
        (paymentRequest2) => {
          cy.generateWepayTokenCreditCard()
            .then((payfacToken) => {
              return cy
                .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
                .then((paymentMethodId) => {
                  return paymentMethodId;
                });
            })
            .then((paymentMethodId) => {
              // payment
              const gqlQuery = `mutation {
              createPayment(
                input: {
                  paymentMethodId: "${paymentMethodId}",
                  paymentRequestAllocation: [
                    { paymentRequestId: "${
                      paymentRequest1.paymentRequestId
                    }", amount: ${paymentRequestAmount1 - 100} }
                    { paymentRequestId: "${
                      paymentRequest2.paymentRequestId
                    }", amount: ${paymentRequestAmount2 - 100} }
                  ]
                  amount: ${payableAmount - 200}
                  immediateCapture: true
                  currency: ${Cypress.env("currency")}
                  riskMetadata: {
                    address: { postalCode: "12222", country: "US" }
                    phone: { countryCode: "1", number: "222111445" }
                    lineItems: {
                      description: "TestLine"
                      price: ${payableAmount}
                      currency: ${Cypress.env("currency")}
                      quantity: 1
                    }
                  }
                }
              ) {
                code
                message
                error
                payment {
                  id
                  status
                }
              }
            }
            `;
              cy.postGQLWithIdempotencyKey(gqlQuery, paymentMethodId).then(
                (res) => {
                  // get feature flags set for the current tenant
                  cy.getFeatureFlags().then((features) => {
                    const { paymentRequests } = features || {};
                    const { consolidatedPayments, partialPayment } =
                      paymentRequests || {};

                    // it should work only if both features are enabled
                    if (consolidatedPayments && partialPayment) {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should not have errors
                      assert.notExists(
                        res.body.errors,
                        `One or more errors ocuured while executing query: ${gqlQuery}`
                      );

                      // has data
                      assert.exists(res.body.data);

                      // assertions
                      assert.isNotNull(res.body.data.createPayment);
                      assert.isNotNull(res.body.data.createPayment.code);
                      assert.isNotNull(res.body.data.createPayment.payment.id);
                      assert.isNull(res.body.data.createPayment.error);
                      assert.equal(
                        res.body.data.createPayment.code,
                        "SUCCESS",
                        "Code is not SUCCESS"
                      );
                    } else {
                      // should be 200 ok
                      cy.expect(res.isOkStatusCode).to.be.equal(true);

                      // should have errors
                      assert.exists(res.body.errors);

                      // no data
                      assert.notExists(res.body.data);
                    }
                  });
                }
              );
            });
        }
      );
    });
  });
});
