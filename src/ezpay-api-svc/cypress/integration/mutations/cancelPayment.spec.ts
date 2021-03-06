/// <reference types="cypress" />

import { CommandType } from "../../support/commands";

describe("Mutation: cancelPayment", () => {
  it("should pass if the mutation cancels a payment with all arguments", () => {
    cy.generatePaymentRequestAndPay(0, false).then((res) => {
      const paymentId = res.id;

      let gql = `query payments {
        payments(id: "${paymentId}") {
          totalCount
          nodes {
            pendingReasonCode
            id
            status
            pendingReason
          }
        }
      }`;
      cy.log("Wait for payment to be completed");
      cy.while(
        gql,
        CommandType.PostGQL,
        (res) =>
          res.body.data.payments.nodes[0].status === "PENDING" &&
          res.body.data.payments.nodes[0].pendingReasonCode ===
            "PENDING_CAPTURE",
        10000
      );

      const gqlQuery = `mutation {
          cancelPayment(
            input: {
              paymentId: "${paymentId}"
              reason: "Wrong"
            }
          ) {
            code
            message
            error
          }
        }
        `;

      cy.postGQL(gqlQuery).then((res) => {
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
        assert.isNotNull(res.body.data.cancelPayment);
        assert.isNotNull(res.body.data.cancelPayment.code);
        assert.isNull(res.body.data.cancelPayment.error);
        assert.equal(
          res.body.data.cancelPayment.code,
          "SUCCESS",
          "Code is not SUCCESS"
        );
      });
    });
  });

  it("should fail if the mutation cancels a not pending payment with all arguments", () => {
    cy.generatePaymentRequestAndPay(0, true).then((res) => {
      const paymentId = res.id;
      const gqlQuery = `mutation {
          cancelPayment(
            input: {
              paymentId: "${paymentId}"
              reason: "Wrong"
            }
          ) {
            code
            message
            error
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

        // has no data
        assert.notExists(res.body.data);
      });
    });
  });

  it("should fail if no return type is provided", () => {
    cy.generatePaymentRequestAndPay(0, false).then((res) => {
      const paymentId = res.id;
      const gqlQuery = `mutation {
            cancelPayment(
              input: {
                paymentId: "${paymentId}"
                reason: "Wrong"
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
  });

  it("should fail if argument null is provided", () => {
    const gqlQuery = `mutation {
        cancelPayment(
          input: null
        ) {
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

  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
        cancelPayment {
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
});
