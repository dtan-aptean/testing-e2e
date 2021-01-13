/// <reference types="cypress" />

describe("Mutation: createPayment", () => {
  it("should pass if the mutation creates a payment", () => {
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
                currency: USD
                riskMetadata: {
                  address: { postalCode: "12222", country: "US" }
                  phone: { countryCode: "1", number: "222111445" }
                  lineItems: {
                    description: "TestLine"
                    price: ${paymentRequest.amount}
                    currency: USD
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

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
        createPayment(
          input: {
            paymentMethodId: "001",
            paymentRequestId: "001"
            amount: 199
            immediateCapture: true
            currency: USD
            riskMetadata: {
              address: { postalCode: "12222", country: "US" }
              phone: { countryCode: "1", number: "222111445" }
              lineItems: {
                description: "TestLine"
                price: 199
                currency: USD
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
            currency: USD
            riskMetadata: {
              address: { postalCode: "12222", country: "US" }
              phone: { countryCode: "1", number: "222111445" }
              lineItems: {
                description: "TestLine"
                price: ${paymentRequest.amount}
                currency: USD
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
            console.log(res);
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
