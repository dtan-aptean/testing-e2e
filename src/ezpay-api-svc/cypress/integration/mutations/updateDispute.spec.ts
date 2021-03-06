/// <reference types="cypress" />

import { CommandType } from "../../support/commands";

// @ts-check

describe("Mutation: updateDispute", () => {
  it("should pass if the query returns valid return type", () => {
    let paymentId = "";
    cy.generatePaymentRequestAndPay(961).then((res) => {
      paymentId = res.id;
    });

    // TODO: revisit when disputeAmount is working on Payment. Then use cy.while to wait for the payment to be disputed.
    let gql = `query {
      disputes(orderBy: { direction: DESC, field: TIMESTAMP }) {
        edges {
          node {
            id
            createdAt
            status
            owner {
              paymentId
            }
          }
        }
      }
    }`;
    cy.while(
      gql,
      CommandType.PostGQLBearer,
      (res) =>
        res.body.data.disputes.edges.find(
          (e) => e.node.owner.paymentId === paymentId
        ),
      10000,
      900000 // 15 minute timeout. Should come within 5 minutes from wepay back to us.
    );

    let gqlQuery = `query {
          disputes(orderBy: { direction: ASC, field: TIMESTAMP }, status: AWAITING_MERCHANT_RESPONSE) {
            edges {
              node {
                id
                owner {
                  paymentId
                }
              }
            }
          }
        }
        `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      const dispute = res.body.data.disputes.edges.find(
        (d) => d.node.owner.paymentId === paymentId
      );
      gqlQuery = `mutation {
            updateDispute(input: { id: "${dispute.node.id}", explanation: "Customer is right", documents: "" })
          }
          `;

      cy.postGQLBearer(gqlQuery).then((res) => {
        assert.exists(res.body.data);
        assert.notExists(res.body.errors);
        assert.equal(res.body.data.updateDispute, "SUCCESS");

        // Try again, should fail
        cy.postGQLBearer(gqlQuery).then((res) => {
          assert.exists(res.body.errors);
          assert.notExists(res.body.data);
        });
      });
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
      updateDispute(input: {id: "id", explanation: "Customer is right"}){}
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

  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
      updateDispute {
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

  it("should fail if input argument is empty", () => {
    const gqlQuery = `mutation {
      updateDispute(input:{}) {
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
