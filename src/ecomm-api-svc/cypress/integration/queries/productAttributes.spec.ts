/// <reference types="cypress" />
// TEST COUNT: 9
describe('Query: productAttributes', () => {
    it('A query with orderBy returns valid data types', () => {
        const gqlQuery = `{
            productAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            cy.validateQueryRes(gqlQuery, res, "productAttributes");
        });
    });

    it("Query will fail without orderBy input", () => {
        const gqlQuery = `{
            productAttributes {
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

    it('Query fails if the orderBy argument is null', () => {
        const gqlQuery = `{
            productAttributes(orderBy: null) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has field', () => {
        const fieldQuery = `{
            productAttributes(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postGQL(fieldQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has direction', () => {
        const directionQuery = `{
            productAttributes(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postGQL(directionQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            productAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmError(res);
        });
    });

    it('Query will succeed with orderBy input and one return type', () => {
        const gqlQuery = `{
            productAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.productAttributes.totalCount);
        });
    });

    it("Query without first or last will return all items", () => {
        const gqlQuery = `{
            productAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmCount(res, "productAttributes");
        });
    });

    it("Requesting the values field returns an array with values", () => {
        const gqlQuery = `{
            productAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    values {
                        displayOrder
                        isPreselected
                        name
                        priceAdjustment
                        weightAdjustment
                        cost
                    }
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
            cy.validateQueryRes(gqlQuery, res, "productAttributes").then(() => {
                cy.validateValues(res, "productAttributes");
            });
        });
    });
});