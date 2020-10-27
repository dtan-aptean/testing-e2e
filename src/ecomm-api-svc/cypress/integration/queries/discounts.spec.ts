/// <reference types="cypress" />
// TEST COUNT: 10
describe('Query: discounts', () => {
    const queryName = "discounts";
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
        discounts(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, queryName);
    });
    
    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            discounts {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmOrderByError(res);
        });
    });

    it("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            discounts(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            discounts(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            discounts(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            discounts(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            discounts(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.discounts.totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return all items", () => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            cy.confirmCount(res, queryName);
            cy.verifyPageInfo(res, queryName, false, false);
        });
    });

    it("If usePercentageForDiscount is true, then discountPercentage is required", () => {
        const gqlQuery = `{
            discounts(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                        name
                    }
                }
                nodes {
                    id
                    name
                    usePercentageForDiscount
                    discountPercentage
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
        cy.postAndValidate(gqlQuery, queryName).then((res) => {
            const nodes = res.body.data.discounts.nodes;
            // Can't run the test with an empty array. Make sure we have at least one
            expect(nodes.length).to.be.gte(1);
            // check the nodes for the rule
            for (var i = 0; i < nodes.length; i++) {
                assert.isBoolean(nodes[i].usePercentageForDiscount);
                assert.isNumber(nodes[i].discountPercentage);
                if (nodes[i].usePercentageForDiscount) {
                    expect(nodes[i].discountPercentage).to.be.greaterThan(0);
                } else {
                    expect(nodes[i].discountPercentage).to.be.eql(0);
                }
            }
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            discounts(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        cy.postAndValidate(gqlQuery, queryName).then((res) => {
            cy.checkCustomData(res, queryName);
        });
    });
});