/// <reference types="cypress" />

describe("Mutation: createPayment", () => {
  it("should pass if the mutation creates a payment with all input arguments", () => {
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

            // should have errors
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

          // should have errors
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

            // should have errors
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

              // should have errors
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

              // should have errors
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

              // should have errors
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

            // should have errors
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

              // should have errors
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

            // should have errors
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

                // should have errors
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

              // should have errors
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

                  // should have errors
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
      }
    );
  });

  it("should fail if the mutation creates multiple payments more than requested amount against the payment request", () => {
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

            // should have errors
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
  });

  it("should fail if the mutation creates multiple payments more than requested amount against the discounted payment request", () => {
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

              // should have errors
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
  });
});
