/// <reference types="cypress" />
// TEST COUNT: 10
describe('Query: checkoutAttributes', () => {
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
        checkoutAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, "checkoutAttributes");
    });

    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            checkoutAttributes {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });

    it("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            checkoutAttributes(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            checkoutAttributes(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            checkoutAttributes(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            checkoutAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            checkoutAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.checkoutAttributes.totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return all items", () => {
        cy.postAndValidate(standardQuery, "checkoutAttributes").then((res) => {
            cy.confirmCount(res, "checkoutAttributes");
            cy.verifyPageInfo(res, "checkoutAttributes", false, false);
        });
    });

    it("Requesting the values field returns an array with values", () => {
        const gqlQuery = `{
            checkoutAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        cy.postAndValidate(gqlQuery, "checkoutAttributes").then((res) => {
            cy.validateValues(res, "checkoutAttributes");
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            checkoutAttributes(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        cy.postAndValidate(gqlQuery, "checkoutAttributes").then((res) => {
            cy.checkCustomData(res, "checkoutAttributes");
        });
    });
});