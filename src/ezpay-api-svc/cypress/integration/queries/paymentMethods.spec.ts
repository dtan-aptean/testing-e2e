/// <reference types="cypress" />

describe("Query: paymentMethods", () => {
  let resourceId = Cypress.env("x-aptean-tenant");

  it("passes if able to query payment methods off a tenantId", () => {
    const gqlQuery = `{
            paymentMethods(resourceId:"${resourceId}") {
                nodes {
                    id
                    type
                    status
                }
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
    queryCursorRecursive({
      endCursor: "",
      tempResultCount: 0,
      maxDepth: 100,
      depth: 0,
    });
  });
});

export function queryCursorRecursive(options: {
  endCursor: string;
  tempResultCount: number;
  maxDepth: number;
  depth: number;
}) {
  const { endCursor, maxDepth, depth } = options;
  let { tempResultCount } = options;
  expect(depth).to.be.lessThan(maxDepth);

  let gqlQuery = `query {
    paymentMethods(orderBy: {direction:DESC, field:TIMESTAMP}, first: 50, resourceId: "${Cypress.env(
      "x-aptean-tenant"
    )}", after: "${endCursor}"){
        totalCount
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            status
          }
        }
      }
    }`;
  cy.postGQL(gqlQuery).then((res) => {
    const { body } = res;
    const { data } = body;
    const { paymentMethods } = data;
    const { edges } = paymentMethods;
    const { totalCount, pageInfo } = paymentMethods;
    const { hasNextPage, endCursor } = pageInfo;

    console.log(endCursor);

    assert.exists(data);
    assert.exists(paymentMethods);
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
      });
    } else {
      console.log(tempResultCount);
      assert.equal(tempResultCount, totalCount);
    }
  });
}
