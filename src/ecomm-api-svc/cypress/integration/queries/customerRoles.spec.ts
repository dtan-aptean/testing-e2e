/// <reference types="cypress" />
// TEST COUNT: 9
describe('Query: customerRoles', () => {
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    name
                }
            }
            nodes {
                id
                name
            }
            pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
            totalCount`;
    const standardQuery = `{
        customerRoles(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, "customerRoles");
    });
    
    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            customerRoles {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmOrderByError(res);
        });
    });

    it("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            customerRoles(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            customerRoles(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            customerRoles(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            customerRoles(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            customerRoles(orderBy: {direction: ASC, field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);
    
            // no errors
            assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

            // has data
            assert.exists(res.body.data);
            // validate data types
            assert.isNotNaN(res.body.data.customerRoles.totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return all items", () => {
        cy.postAndValidate(standardQuery, "customerRoles").then((res) => {
            cy.confirmCount(res, "customerRoles");
            cy.verifyPageInfo(res, "customerRoles", false, false);
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            customerRoles(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    customData
                }
                pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                }
                totalCount
            }
        }`;
        cy.postAndValidate(gqlQuery, "customerRoles").then((res) => {
            cy.checkCustomData(res, "customerRoles");
        });
    });
});