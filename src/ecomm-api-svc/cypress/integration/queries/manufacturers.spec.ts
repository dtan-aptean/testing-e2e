/// <reference types="cypress" />
// TEST COUNT: 8
describe('Query: manufacturers', () => {
    it('A query with orderBy returns valid data types', () => {
        const gqlQuery = `{
            manufacturers(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
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
        cy.postGQL(gqlQuery).then(res => {
            cy.validateQueryRes(gqlQuery, res, "manufacturers");
        });
    });

    it("Query will fail without orderBy input", () => {
        const gqlQuery = `{
            manufacturers {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
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
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            manufacturers(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmError(res);
        });
    });

    it('Query fails if the orderBy argument is null', () => {
        const gqlQuery = `{
            manufacturers(orderBy: null) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has field', () => {
        const fieldQuery = `{
            manufacturers(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postGQL(fieldQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has direction', () => {
        const directionQuery = `{
            manufacturers(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postGQL(directionQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query will succeed with orderBy input and one return type', () => {
        const gqlQuery = `{
            manufacturers(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.manufacturers.totalCount);
        });
    });

    it("Query without first or last will return all items", () => {
        const gqlQuery = `{
            manufacturers(orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmCount(res, "manufacturers");
        });
    });
});