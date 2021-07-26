/// <reference types="cypress" />
// @ts-check

describe("Query: payments", () => {
  it("should pass if the query has an order by argument and returns valid return types", () => {
    const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
        }
      }
      `;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);

      // validate all not-nullable fields
      assert.isNotNull(res.body.data.payments);
      assert.isNotNull(res.body.data.payments.totalCount);
      assert.isNotNull(res.body.data.payments.edges);

      if (res.body.data.payments.edges.length > 0) {
        for (let i = 0; i < res.body.data.payments.edges.length; i++) {
          const edge = res.body.data.payments.edges[i];

          assert.isNotNull(edge.node.id);
          assert.isNotNull(edge.node.amount);
          assert.isNotNull(edge.node.currency);
          assert.isNotNull(edge.node.refunds);
        }
      }
    });
  });

  it("should fail if the orderby argument is null", () => {
    const gqlQuery = `query payments {
        payments(orderBy: null) {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
        }
      }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the order by argument is not passed", () => {
    const gqlQuery = `query payments {
        payments {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
        }
      }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
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

  it("should pass if the query has at least one return type", () => {
    const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
          totalCount
        }
      }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);
    });
  });

  it("should pass if the query cursor is working as expected", () => {
    let startDateObject = new Date();
    startDateObject.setDate(startDateObject.getDate() - 180);
    const startDate = startDateObject.toISOString();

    const endDate = new Date().toISOString();

    cy.log(
      `Querying payments between startDate: ${startDate} and endDate: ${endDate}`
    );

    queryCursorRecursive({
      endCursor: "",
      tempResultCount: 0,
      maxDepth: 100,
      depth: 0,
      startDate: startDate,
      endDate,
    });
  });
});

export function queryCursorRecursive(options: {
  endCursor: string;
  tempResultCount: number;
  maxDepth: number;
  depth: number;
  startDate: string;
  endDate: string;
}) {
  const { endCursor, maxDepth, depth, startDate, endDate } = options;
  let { tempResultCount } = options;
  expect(depth).to.be.lessThan(maxDepth);

  let gqlQuery = `query {
    payments(orderBy: {direction:DESC, field:TIMESTAMP}, after: "${endCursor}", startDate: "${startDate}" endDate: "${endDate}"){
      totalCount
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
      edges {
        node {
          amount
          status
        }
      }
    }
  }`;
  cy.postGQL(gqlQuery).then((res) => {
    const { body } = res;
    const { data } = body;
    const { payments } = data;
    const { edges } = payments;
    const { totalCount, pageInfo } = payments;
    const { hasNextPage, endCursor } = pageInfo;

    assert.exists(data);
    assert.exists(payments);
    assert.exists(totalCount);
    assert.exists(hasNextPage);
    assert.exists(endCursor);

    tempResultCount += edges.length;
    if (hasNextPage) {
      queryCursorRecursive({
        endCursor: endCursor,
        tempResultCount: tempResultCount,
        maxDepth: maxDepth,
        depth: depth + 1,
        startDate,
        endDate,
      });
    } else {
      assert.equal(tempResultCount, totalCount);
    }
  });
}
