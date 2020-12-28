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
                    disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
                      edges {
                        node {
                          id
                          owner {
                            paymentId
    
                          }
                          status
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
          console.log(res);
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

  // it('should fail if no return type is provided', () => {
  //   const gqlQuery = `query {
  //     disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
  //     }
  //   }
  //   `;

  //   cy.postGQLBearer(gqlQuery).then(res => {
  //     // should not be 200 ok
  //     cy.expect(res.isOkStatusCode).to.be.equal(false);

  //     // should have errors
  //     assert.exists(res.body.errors);

  //     // no data
  //     assert.notExists(res.body.data);
  //   });
  // });

  // it('should fail if no orderBy type is provided', () => {
  //     const gqlQuery = `query {
  //       disputes() {
  //         totalCount
  //       }
  //     }
  //     `;

  //     cy.postGQLBearer(gqlQuery).then(res => {
  //       // should not be 200 ok
  //       cy.expect(res.isOkStatusCode).to.be.equal(false);

  //       // should have errors
  //       assert.exists(res.body.errors);

  //       // no data
  //       assert.notExists(res.body.data);
  //     });
  //   });

  // it('should pass if the query has at least one return type', () => {
  //   const gqlQuery = `query {
  //     disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
  //       totalCount
  //     }
  //   }
  //   `;

  //   cy.postGQLBearer(gqlQuery).then(res => {
  //     // should be 200 ok
  //     cy.expect(res.isOkStatusCode).to.be.equal(true);

  //     // no errors
  //     assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

  //     // has data
  //     assert.exists(res.body.data);
  //   });
  // });
});
