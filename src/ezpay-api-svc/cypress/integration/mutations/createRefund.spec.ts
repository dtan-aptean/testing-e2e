/// <reference types="cypress" />

describe("Mutation: createRefund", () => {
  it("should fail when no idempotency-key header is sent with the request", () => {
    const gqlQuery = `mutation createRefund {
          createRefund(
            input: {
              paymentId: "4e769d71-bc7f-43e8-b9cc-f264fe5604ek"
              refundReason: "Product does not meet expectations"
            }
          ) {
            code
            message
            error
            refund {
              id
            }
          }
        }
        `;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has error
      assert.notExists(res.body.data);
    });
  });

  it("should pass when creating a full refund and test reject with same idempotency key", () => {
    let paymentId = "";
    let amount = 0;
    cy.generatePaymentRequestAndPay().then((res) => {
      paymentId = res.id;
      amount = res.amount;

      cy.wait(60000);
      const gqlQuery = `mutation createRefund {
          createRefund(
            input: {
              paymentId: "${paymentId}"
              refundReason: "Product does not meet expectations"
            }
          ) {
            code
            message
            error
            refund {
              id
            }
          }
        }
        `;
      cy.postGQLWithIdempotencyKey(gqlQuery, paymentId).then((res) => {
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have no errors
        assert.notExists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // has data
        assert.exists(res.body.data);
        assert.exists(res.body.data.createRefund.code);
        assert.isNull(res.body.data.createRefund.error);
        assert.exists(res.body.data.createRefund.refund);
        assert.exists(res.body.data.createRefund.refund.id);
      });

      cy.wait(5000);

      // Should fail when calling again with same Idempotency Key
      cy.postGQLWithIdempotencyKey(gqlQuery, paymentId).then((res) => {
        // should be bad request
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have errors
        assert.exists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // should have no data
        assert.notExists(res.body.data);
      });

      // Should fail when calling again with new Idempotency Key, is already refunded check
      cy.postGQLWithIdempotencyKey(gqlQuery, paymentId + "1").then((res) => {
        // should be bad request
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have error code
        assert.equal(res.body.data.createRefund.code, "ERROR");

        // should have no refund
        assert.isNull(res.body.data.createRefund.refund);
      });
    });
  });

  it("should pass when creating a partial refund", () => {
    cy.generatePaymentRequestAndPay().then((res) => {
      let paymentId = res.id;
      let originalAmount = 0;

      paymentId = res.id;
      originalAmount = res.amount;

      let partialAmount1 = originalAmount - 100;
      let partialAmount2 = originalAmount - partialAmount1;

      cy.wait(60000);

      let gqlQuery = `mutation createRefund {
        createRefund(
          input: {
            paymentId: "${paymentId}"
            refundReason: "Product does not meet expectations"
            amount: ${partialAmount1}
          }
        ) {
          code
          message
          error
          refund {
            id
          }
        }
      }
      `;

      // First partial refund
      cy.postGQLWithIdempotencyKey(gqlQuery, paymentId).then((res) => {
        // should be bad request
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have no errors
        assert.notExists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // has data
        assert.exists(res.body.data);
        assert.exists(res.body.data.createRefund.code);
        assert.isNull(res.body.data.createRefund.error);
        assert.exists(res.body.data.createRefund.refund);
        assert.exists(res.body.data.createRefund.refund.id);
      });

      gqlQuery = `mutation createRefund {
        createRefund(
          input: {
            paymentId: "${paymentId}"
            refundReason: "Product does not meet expectations"
            amount: ${partialAmount2}
          }
        ) {
          code
          message
          error
          refund {
            id
          }
        }
      }
      `;

      cy.wait(60000);

      // Second partial refund
      cy.postGQLWithIdempotencyKey(gqlQuery, paymentId + "1").then((res) => {
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have no errors
        assert.notExists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // has data
        assert.exists(res.body.data);
        assert.exists(res.body.data.createRefund.code);
        assert.isNull(res.body.data.createRefund.error);
        assert.exists(res.body.data.createRefund.refund);
        assert.exists(res.body.data.createRefund.refund.id);
      });
    });
  });

  it("should fail when requesting a refund exceeding the original amount", () => {
    const gqlQuery = `mutation createRefund {
        createRefund(
          input: {
            paymentId: "7cfd48c3-e514-42e5-a258-0df8921d2bf4"
            refundReason: "Product does not meet expectations"
            amount: 99999999
          }
        ) {
          code
          message
          error
          refund {
            id
          }
        }
      }
      `;

    cy.postGQLWithIdempotencyKey(gqlQuery, "idempotencyKeyr122").then((res) => {
      // should be bad request
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);
      assert.equal(res.body.data.createRefund.code, "ERROR");
    });
  });

  it("should fail if input argument is empty", () => {
    const gqlQuery = `mutation createRefund {
        createRefund(input: {}) {
          code
          message
          error
          refund {
            id
          }
        }
      }
      `;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // has data
      assert.notExists(res.body.data);

      // assertions
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation createRefund {
        createRefund(
          input: {
            paymentId: "7cfd48c3-e514-42e5-a258-0df8921d2bf4"
            refundReason: "Product does not meet expectations"
            amount: 30000
          }
        ) {
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

  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation createRefund {
        createRefund {
          code
          message
          error
          refund {
            id
          }
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
});
