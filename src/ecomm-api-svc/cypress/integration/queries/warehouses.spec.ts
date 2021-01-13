/// <reference types="cypress" />
// TEST COUNT: 27
describe('Query: warehouses', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "warehouses";
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
        ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    var trueTotal = null;

    /* before(() => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            const { nodes, edges, totalCount } = res.body.data[queryName];
            expect(nodes.length).to.be.eql(edges.length);
            if (totalCount > nodes.length) {
                trueTotal = totalCount;
            }
        });
    }); */

    it.skip("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, queryName);
    });
    
    it.skip("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            ${queryName} {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmOrderByError(res);
        });
    });

    it.skip("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it.skip("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            ${queryName}(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it.skip("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            ${queryName}(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it.skip('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it.skip("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data[queryName].totalCount);
        });
    });

    it.skip("Query without 'first' or 'last' input arguments will return up to 25 items", () => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
            });
        });
    });

    it.skip("Query with valid 'first' input argument will return only that amount of items", () => {
        cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const first = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(first: ${first}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, true, false);
                cy.verifyFirstOrLast(resp, queryName, first, "first");
            });
        });
    });

    it.skip("Query with valid 'last' input argument will return only that amount of items", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const last = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(last: ${last}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, true, false);
                cy.verifyFirstOrLast(resp, queryName, last, "last");
            });
        });
    });

    it.skip("Query with invalid 'first' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(first: "4", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it.skip("Query with invalid 'last' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(last: "5", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it.skip("Query with both 'first' and 'last' input arguments will fail", () => {
        const gqlQuery = `{
            ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery, true);
    });

    it.skip("Query with a valid 'searchString' input argument will return the specific item", () => {
        cy.returnRandomName(standardQuery, queryName).then((name: string) => {
            const searchQuery = `{
                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, queryName).then((resp) => {
                cy.validateNameSearch(resp, queryName, name);
            });
        });
    });

    it.skip("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
        cy.returnRandomName(standardQuery, queryName).then((name: string) => {
            // Get the first word if the name has multiple words. Otherwise, get a random segment of the name
            var newWordIndex = name.search(" ");
            var searchText = "";
            if (newWordIndex !== -1 && newWordIndex !== 0) {
                searchText = name.substring(0, newWordIndex);
            } else {
                const segmentIndex = Cypress._.random(name.length / 2, name.length - 1);
                searchText = name.substring(0, segmentIndex);
            }
            const searchQuery = `{
                ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, queryName).then((resp) => {
                cy.validateNameSearch(resp, queryName, searchText);
            });
        });
    });

    it.skip("Query with an invalid 'searchString' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(searchString: 7, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it.skip("Query with a valid 'before' input argument will return all items before that value", () => {
        cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
            const beforeQuery = `{
                ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, false, true);
                cy.validateCursor(resp, queryName, "before");
            });
        });
    });
    
    it.skip("Query with a valid 'after' input argument will return all items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            const afterQuery = `{
                ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(afterQuery, queryName).then((resp) => {
                const hasNextPage = resp.body.data[queryName].totalCount > resp.body.data[queryName].nodes.length;
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, hasNextPage, true);
                cy.validateCursor(resp, queryName, "after");
            });
        });
    });

    it.skip("Query with invalid 'before' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(before: 123, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it.skip("Query with invalid 'after' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(after: true, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
    
    it.skip("Query with both 'before' and 'after' input arguments will fail", () => {
        const gqlQuery = `{
            ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            // should have errors
            assert.exists(res.body.errors);
  
            // no data
            assert.notExists(res.body.data);

            expect(res.body.errors[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
        });
    });

    it.skip("Query with both 'before' and 'first' input arguments will return a specific amount of items before that value", () => {
        cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const first = index > 1 ? Math.floor(index / 2) : 1;
                Cypress.log({message: `first: ${first}`});
                const beforeQuery = `{
                    ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, queryName);
                    cy.validateCursor(resp, queryName, "before", "first", first);
                });
            });
        });
    });

    it.skip("Query with both 'after' and 'first' input will arguments return a specific amount of items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const first = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `first: ${first}`});
                    const afterQuery = `{
                        ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, queryName).then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, queryName);
                        cy.validateCursor(resp, queryName, "after", "first", first);
                    });
                });
            });
        });
    });

    it.skip("Query with both 'before' and 'last' input arguments will return a specific amount of items before that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const last = index > 1 ? Math.floor(index / 2) : 1;
                Cypress.log({message: `last: ${last}`});
                const beforeQuery = `{
                    ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, queryName);
                    cy.validateCursor(resp, queryName, "before", "last", last);
                });
            });
        });
    });

    it.skip("Query with both 'after' and 'last' input will return a specific amount of items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const last = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `last: ${last}`});
                    const afterQuery = `{
                        ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, queryName).then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, queryName);
                        cy.validateCursor(resp, queryName, "after", "last", last);
                    });
                });
            });
        });
    });

    it.skip("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it.skip('Query with address field will return valid data and correct fields', () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    address {
                        city
                        country
                        line1
                        line2
                        postalCode
                        region
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
        cy.postAndValidate(gqlQuery, queryName).then((res) => {
            if (res.body.data[queryName].nodes.length > 0) {
                const nodesPath = res.body.data[queryName].nodes;
                nodesPath.forEach((item) => {
                    // has address field
                    expect(item).to.have.property('address');
                    if (item.address !== null) {
                        expect(item.address).to.have.property('city');
                        if (item.address.city !== null) {
                            expect(item.address.city).to.be.a('string');
                        }
                        expect(item.address).to.have.property('country');
                        if (item.address.country !== null) {
                            expect(item.address.country).to.be.a('string');
                        }
                        expect(item.address).to.have.property('line1');
                        if (item.address.line1 !== null) {
                            expect(item.address.line1).to.be.a('string');
                        }
                        expect(item.address).to.have.property('line2');
                        if (item.address.line2 !== null) {
                            expect(item.address.line2).to.be.a('string');
                        }
                        expect(item.address).to.have.property('postalCode');
                        if (item.address.postalCode !== null) {
                            expect(item.address.postalCode).to.be.a('string');
                        }
                        expect(item.address).to.have.property('region');
                        if (item.address.region !== null) {
                            expect(item.address.region).to.be.a('string');
                        }
                    }
                });
            }
        });
    });
});