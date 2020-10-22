/// <reference types="cypress" />
// TEST COUNT: 24
describe('Query: products', () => {
    // Standard query body to use when we don't need special data but do need special input arguments
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
    // Standard query to use when we don't need any specialized data or input arguments
    const standardQuery = `{
        products(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, "products");
    });

    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            products {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });

    it('Query fails if the orderBy argument is null', () => {
        const gqlQuery = `{
            products(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            products(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            products(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            products(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            products(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.products.totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return all items", () => {
        cy.postAndValidate(standardQuery, "products").then((res) => {
            cy.confirmCount(res, "products");
            cy.verifyPageInfo(res, "products", false, false);
        });
    });

    it("Query with valid 'first' input argument will return only that amount of items", () => {
        cy.returnCount(standardQuery, "products").then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const first = Math.floor(totalCount / 2);
            const gqlQuery = `{
                products(first: ${first}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, "products").then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, "products", true, false);
                cy.verifyFirstOrLast(resp, "products", first, "first");
            });
        });
    });

    it("Query with valid 'last' input argument will return only that amount of items", () => {
        cy.returnCount(standardQuery, "products").then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const last = Math.floor(totalCount / 2);
            const gqlQuery = `{
                products(last: ${last}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, "products").then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, "products", true, false);
                cy.verifyFirstOrLast(resp, "products", last, "last");
            });
        });
    });
    
    it("Query with invalid 'first' input argument will fail", () => {
        const gqlQuery = `{
            products(first: "4", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with invalid 'last' input argument will fail", () => {
        const gqlQuery = `{
            products(last: "5", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
    
    it("Query with both 'first' and 'last' input arguments will fail", () => {
        const gqlQuery = `{
            products(first: 7, last: 3, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query with a valid 'searchString' input argument will return the specific item", () => {
        cy.returnRandomName(standardQuery, "products").then((name: string) => {
            const searchQuery = `{
                products(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, "products").then((resp) => {
                cy.validateNameSearch(resp, "products", name, true);
            });
        });
    });

    it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
        cy.returnRandomName(standardQuery, "products").then((name: string) => {
            // Get the first word if the name has multiple words. Otherwise, get a random segment of the name
            var newWordIndex = name.search(" ");
            var searchText = "";
            if (newWordIndex !== -1) {
                searchText = name.substring(0, newWordIndex);
            } else {
                const segmentIndex = Cypress._.random(name.length / 2, name.length - 1);
                searchText = name.substring(0, segmentIndex);
            }
            const searchQuery = `{
                products(searchString: "${searchText}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, "products").then((resp) => {
                cy.validateNameSearch(resp, "products", searchText, false);
            });
        });
    });
    
    it("Query with an invalid 'searchString' input argument will fail", () => {
        const gqlQuery = `{
            products(searchString: 7, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with a valid 'before' input argument will return all items before that value", () => {
        cy.returnRandomCursor(standardQuery, "products", true).then((cursor: string) => {
            const beforeQuery = `{
                products(before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(beforeQuery, "products").then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, "products", false, true);
                cy.validateCursor(resp, "products", "before");
            });
        });
    });
    
    it("Query with a valid 'after' input argument will return all items after that value", () => {
        cy.returnRandomCursor(standardQuery, "products", false).then((cursor: string) => {
            const afterQuery = `{
                products(after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(afterQuery, "products").then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, "products", false, true);
                cy.validateCursor(resp, "products", "after");
            });
        });
    });

    it("Query with both 'before' and 'after' input arguments will fail", () => {
        const gqlQuery = `{
            products(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            // should have errors
            assert.exists(res.body.errors);
  
            // no data
            assert.notExists(res.body.data);

            expect(res.body.errors[0].message).to.include("Unsupported request");
        });
    });

    it("Query with both 'before' and 'first' input arguments will return a specific amount of items before that value", () => {
        cy.returnRandomCursor(standardQuery, "products", true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const first = Math.floor(index / 2);
                Cypress.log({message: `first: ${first}`});
                const beforeQuery = `{
                    products(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, "products").then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, "products", true, true);
                    cy.validateCursor(resp, "products", "before", "first", first);
                });
            });
        });
    });

    it("Query with both 'after' and 'first' input will arguments return a specific amount of items after that value", () => {
        cy.returnRandomCursor(standardQuery, "products", false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const first = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `first: ${first}`});
                    const afterQuery = `{
                        products(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, "products").then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, "products");
                        cy.validateCursor(resp, "products", "after", "first", first);
                    });
                });
            });
        });
    });

    it("Query with both 'before' and 'last' input arguments will return a specific amount of items before that value", () => {
        cy.returnRandomCursor(standardQuery, "products", true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const last = Math.floor(index / 2);
                Cypress.log({message: `last: ${last}`});
                const beforeQuery = `{
                    products(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, "products").then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, "products", true, true);
                    cy.validateCursor(resp, "products", "before", "last", last);
                });
            });
        });
    });

    it("Query with both 'after' and 'last' input will return a specific amount of items after that value", () => {
        cy.returnRandomCursor(standardQuery, "products", false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const last = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `last: ${last}`});
                    const afterQuery = `{
                        products(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, "products").then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, "products");
                        cy.validateCursor(resp, "products", "after", "last", last);
                    });
                });
            });
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            products(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        cy.postAndValidate(gqlQuery, "products").then((res) => {
            cy.checkCustomData(res, "products");
        });
    });
});