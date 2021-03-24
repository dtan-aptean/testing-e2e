/// <reference types="cypress" />
// @ts-check

describe("Mutation: concede dispute", () => {
  it("should pass if the query returns valid return type", () => {
    let paymentId = "";
    cy.generatePaymentRequestAndPay(961).then((res) => {
      paymentId = res.id;
    });

    // Wait 13 minutes to process the dispute
    cy.wait(800000).then(() => {
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
      }`;

      cy.postGQLBearer(gqlQuery).then((res) => {
        const dispute = res.body.data.disputes.edges.find(
          (d) => d.node.owner.paymentId === paymentId
        );

        gqlQuery = `mutation {
            concedeDispute(input: {id: "${dispute.node.id}", explanation: "Customer is right"})
          }`;

        cy.postGQLBearer(gqlQuery).then((res) => {
          assert.exists(res.body.data);
          assert.notExists(res.body.errors);
          assert.equal(res.body.data.concedeDispute, "SUCCESS");

          // Try again, should fail
          cy.postGQLBearer(gqlQuery).then((res) => {
            console.log(res);
            assert.exists(res.body.errors);
            assert.notExists(res.body.data);
          });
        });
      });
    });
  });
});
