/// <reference types="cypress" />
// TEST COUNT: 42
describe('Query: companies', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "companies";
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
        ${queryName}(orderBy: { direction: ASC, field: NAME }) {
            ${standardQueryBody}
        }
    }`;
    var trueTotalInput = "";

    before(() => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            const { nodes, edges, totalCount } = res.body.data[queryName];
            expect(nodes.length).to.be.eql(edges.length);
            if (totalCount > nodes.length) {
                trueTotalInput = totalCount > 0 ? "first: " + totalCount + ", ": "";
            }
        });
    });

    context("Testing 'orderBy' input", () => {
        it("Query will fail if no return type is provided", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: { direction: ASC, field: NAME }){
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query with valid 'orderBy' input returns valid data types", () => {
            cy.postAndValidate(standardQuery, queryName);
        });

        it("Query will fail without 'orderBy' input", () => {
            const gqlQuery = `{
                ${queryName} {
                    ${standardQueryBody}
                }
            }`;
            cy.postGQL(gqlQuery).then((res) => {
                cy.confirmOrderByError(res);
            });
        });

        it("Query will fail if 'orderBy' input argument is NULL", () => {
            const gqlQuery = `{
                ${queryName} (orderBy: null) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query will fail if 'orderBy' input argument only has field", () => {
            const fieldQuery = `{
                ${queryName} (orderBy: { field: NAME }) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(fieldQuery);
        });

        it("Query will fail if 'orderBy' input argument only has direction", () => {
            const directionQuery = `{
                ${queryName} (orderBy: { field: NAME }) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(directionQuery);
        });

        it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
            const gqlQuery = `{
                ${queryName} (orderBy: { field: NAME, direction: ASC }) {
                    totalCount
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it("Query with orderBy direction: DESC, field: NAME will return items in a reverse order from direction: ASC", () => {
            const trueTotalQuery = `{
                ${queryName} (${trueTotalInput}orderBy: { field: NAME, direction: ASC }) {
                    ${standardQueryBody}
                }
            }`
            cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
                const descQuery = `{
                    ${queryName} (${trueTotalInput}orderBy: { field: NAME, direction: DESC }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(descQuery, queryName).then((descRes) => {
                    cy.verifyReverseOrder(queryName, ascRes, descRes);
                });
            });
        });
    });

    context("Testing 'first' and 'last' inputs", () => {
        it("Query without 'first' or 'last' input arguments will return upto 25 items", () => {
            cy.postAndValidate(standardQuery, queryName).then((res) => {
                cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                    cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
                });
            });
        });

        it("Query with valid 'first' argument will return only that amount of items", () => {
            cy.returnCount(standardQuery, queryName).then((totalCount) => {
                // If there's only one item, we can't do any pagination                
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount/2);
                const gqlQuery = `{
                    ${queryName}(first: ${first}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(gqlQuery, queryName).then((res) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(res, queryName, true, false);
                    cy.verifyFirstOrLast(res, queryName, first, "first");
                });
            });
        });

        it("Query with valid 'last' argument will return only that amount of items", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount/2);
                const gqlQuery = `{
                    ${queryName}(last: ${last}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(gqlQuery, queryName).then((res) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(res, queryName, true, false);
                    cy.verifyFirstOrLast(res, queryName, last, "last");
                });
            });
        });

        it("Query with invalid 'first' input argument will fail", () => {
            let count = 4;
            const gqlQuery = `{
                ${queryName}(first: "${count}", orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ count +'"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
            
        it("Query with invalid 'last' input argument will fail", () => {
            let count = 4;
            const gqlQuery = `{
                ${queryName}(last: "${count}", orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ count +'"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with both 'first' and 'last' input arguments will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: 2, last: 7, orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].details[0].message).to.have.string("Both Last and First cannot be provided in the same request");
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
            });
        });
    });

    context("Testing 'searchString' input", () => {
        it("Query with valid 'searchString' input argument will return the specific item", () => {
            cy.returnRandomName(standardQuery, queryName).then((name: string) => {
                const searchQuery = `{
                    ${queryName}(searchString: "${name}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, name);
                });
            });
        });

        it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
            cy.returnRandomName(standardQuery, queryName).then((name: string) => {
                // Get the first word if the name has multiple words. Otherwise, get a random segment of the name
                let newWordIndex = name.search(" ");
                var searchText = "";
                if (newWordIndex !== -1 && newWordIndex !== 0) {
                    searchText = name.substring(0, newWordIndex);
                }
                else {
                    const segmentIndex = Cypress._.random(name.length / 2, name.length - 1);
                    searchText = name.substring(0, segmentIndex);
                }
                const searchQuery = `{
                    ${queryName}(searchString: "${searchText}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, searchText);
                });
            });
        });

        it("Query with invalid 'searchString' argument will fail", () => {
            let val = 2;
            const gqlQuery = `{
                ${queryName}(searchString: ${val}, orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: '+ val);
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    context("Testing 'before' and 'after' inputs", () => {
        it("Query with a valid 'before' input argument will return all items before that value", () => {
            cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
                const beforeQuery = `{
                    ${queryName}(before: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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

        it("Query with a valid 'after' input argument will return all items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const afterQuery = `{
                    ${queryName}(after: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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

        it("Query with invalid 'before' argument will fail", () => {
            let val = 3;
            const beforeQuery = `{
                ${queryName}(before: ${val}, orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(beforeQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'after' argument will fail", () => {
            let val = 2;
            const beforeQuery = `{
                ${queryName}(after: ${val}, orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(beforeQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with both 'before' and 'after' valid input arguments will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: "MTowfjI6fjM6OT", after: "MTowfjI6fjM6NDU", orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
                expect(res.body.errors[0].message[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
            });
        });
    });

    context("Testing 'before'/'after' inputs with 'first'/'last' inputs", () => {
        it("Query with both 'before' and 'first' input arguments will return a specific amount of items before that value", () => {
            cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const first = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({message: `first: ${first}`});
                    const beforeQuery = `{
                        ${queryName}(first: ${first}, before: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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
    
        it("Query with both 'after' and 'first' input will arguments return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
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
                            ${queryName}(first: ${first}, after: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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
    
        it("Query with both 'before' and 'last' input arguments will return a specific amount of items before that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const last = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({message: `last: ${last}`});
                    const beforeQuery = `{
                        ${queryName}(last: ${last}, before: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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
    
        it("Query with both 'after' and 'last' input will return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
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
                            ${queryName}(last: ${last}, after: "${cursor}", orderBy: { direction: ASC, field: NAME }) {
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

        it("Query with invalid 'before' input and valid 'first' input will fail", () => {
            cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
                   // If there's only one item, we can't do any pagination            
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount/2);
                let val = 2;
                const gqlQuery = `{
                    ${queryName}(before: ${val}, first: ${first}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });               
            });
        });

        it("Query with valid 'before' and invalid 'first' input will fail", () => {
            cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
                let val = 4;
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", first: "${val}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ val +'"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it("Query with invalid 'after' input and valid 'first' input will fail", () => {
            cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount/2);
                let val = 7;
                const gqlQuery = `{
                    ${queryName}(after: ${val}, first: ${first}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });               
            });
        });

        it("Query with valid 'after' and invalid 'first' input will fail", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                let val = 7;
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", first: "${val}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ val + '"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it("Query with invalid 'before' input and valid 'last' input will fail", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount/2);
                let val = 5;
                const gqlQuery = `{
                    ${queryName}(before: ${val}, last: ${last}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });               
            });
        });

        it("Query with valid 'before' and invalid 'last' input arguments will fail", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                let val = 2;
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", last: "${val}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ val +'"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it("Query with invalid 'after' input and valid 'last' input will fail", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount/2);
                let val = 8;
                const gqlQuery = `{
                    ${queryName}(after: ${val}, last: ${last}, orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ val);
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });               
            });
        });

        it("Query with valid 'after' and invalid 'last' input arguments will fail", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: { direction: ASC, field: NAME }) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                let val = 3;
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", last: "${val}", orderBy: { direction: ASC, field: NAME }) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "'+ val +'"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });
    });

    context("Testing 'ids' input", () => {
        it("Using 'ids' input will return only the items with ids that were used as input", () => {
            let count = 2;
            cy.queryAndValidateMultipleIds(count, queryName, standardQueryBody);
        });
    
        it("Using a single id as 'ids' input returns only the relevant item", () => {
            cy.queryAndValidateRandomId(queryName, standardQueryBody);
        });
    
        it("Using 'ids' input as an empty array returns standard response as though 'ids' input was not included", () => {
            cy.queryAndValidateEmptyArray(queryName, standardQueryBody);
        });
    
        it("Using an array of empty strings as 'ids' input will return an error", () => {
            const ids = ["", "", ""];
            cy.queryAndValidateEmptyStrings(ids, queryName, standardQueryBody);
        });
    
        it("Using an array of non-string values as 'ids' input returns an error", () => {
            const ids = [34, true, 85];
            cy.queryAndValidateNonStringValues(ids, queryName, standardQueryBody);
        });
    
        it("Using a non-array value as 'ids' input returns an error", () => {
            const ids = true;
            cy.queryAndValidateNonArrayValues(ids, queryName, standardQueryBody);
        });
    
        it("Using ids from a different item as 'ids' input returns an error", () => {
            const extraQueryName = "customerRoles";
            const extraQuery = `{
                ${extraQueryName}(orderBy: {direction: ASC, field: NAME}) {
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
            cy.queryAndValidateDifferentItemIds(extraQueryName, extraQuery, queryName, standardQueryBody);
        });
    });

    context("Testing reponse values for customData and other fields", () => {
        it("Query with customData field will return valid value", () => {
            const gqlQuery  = `{
                ${queryName}(orderBy: { direction: ASC, field: NAME }) {
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
});