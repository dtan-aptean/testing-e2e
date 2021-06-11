/// <reference types="cypress" />
// TEST COUNT: 43
describe('Query: products', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "products";
    // Standard query body to use when we don't need special data but do need special input arguments
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    productInfo {
                        name
                    }
                }
            }
            nodes {
                id
                productInfo {
                    name
                }
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
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
            ${standardQueryBody}
        }
    }`;
    // Name of the info field
    const infoName = "productInfo";

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
        it('Query will fail if no return type is provided', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                    
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query with valid 'orderBy' input argument returns valid data types", () => {
            cy.postAndValidate(standardQuery, queryName);
        });

        it("Query will fail without 'orderBy' input argument", () => {
            const gqlQuery = `{
                ${queryName} {
                    ${standardQueryBody}
                }
            }`;
            cy.postGQL(gqlQuery).then(res => {
                cy.confirmOrderByError(res);
            });
        });

        it('Query fails if the orderBy argument is null', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: null) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query fails if 'orderBy' input argument only has field", () => {
            const fieldQuery = `{
                ${queryName}(orderBy: {field: NAME}) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(fieldQuery);
        });

        it("Query fails if 'orderBy' input argument only has direction", () => {
            const directionQuery = `{
                ${queryName}(orderBy: {direction: ASC}) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(directionQuery);
        });

        it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                    totalCount
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it("Query with orderBy direction: DESC, field: NAME will return items in a reverse order from direction: ASC", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
                const descQuery = `{
                    ${queryName}(${trueTotalInput}orderBy: {direction: DESC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(descQuery, queryName).then((descRes) => {
                    cy.verifyReverseOrder(queryName, ascRes, descRes);
                });
            });
        });
    });

    context("Testing 'startDate' and 'endDate' inputs", () => {
        const createdDateQueryBody = `edges {
            cursor
            node {
                id
            }
        }
        nodes {
            id
            ${infoName} {
                name
            }
            createdDate
        }
        pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
        }
        totalCount`;

        it("Query using valid 'startDate' input will return only items with a createdDate >= that startDate", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.returnRandomDate(query, queryName).then((randomDate: string) => {
                const startDateQuery = `{
                    ${queryName}(${trueTotalInput}startDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                        ${createdDateQueryBody}
                    }
                }`;
                cy.postAndValidate(startDateQuery, queryName).then((res) => {
                    cy.verifyDateInput(res, queryName, randomDate);
                });
            });
        });

        it("Query using valid 'endDate' input will return only items with a createdDate <= that endDate", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.returnRandomDate(query, queryName).then((randomDate: string) => {
                const startDateQuery = `{
                    ${queryName}(${trueTotalInput}endDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                        ${createdDateQueryBody}
                    }
                }`;
                cy.postAndValidate(startDateQuery, queryName).then((res) => {
                    cy.verifyDateInput(res, queryName, undefined, randomDate);
                });
            });
        });

        it("Query using valid 'startDate' and 'endDate' input will return only items that obey startDate <= createdDate <= endDate", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.returnRandomDate(query, queryName, true).then((startDate: string) => {
                cy.returnRandomDate(query, queryName, undefined, startDate).then((endDate: string) => {
                    const startEndQuery = `{
                        ${queryName}(${trueTotalInput}startDate: "${startDate}", endDate: "${endDate}", orderBy: {direction: ASC, field: NAME}) {
                            ${createdDateQueryBody}
                        }
                    }`;
                    cy.postAndValidate(startEndQuery, queryName).then((res) => {
                        cy.verifyDateInput(res, queryName, startDate, endDate);
                    });
                });
            });
        });

        it("Query using an invalid 'startDate' input will return an error", () => {
            const query = `{
                ${queryName}(startDate: false, orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndConfirmError(query);
        });

        it("Query using an invalid 'endDate' input will return an error", () => {
            const query = `{
                ${queryName}(endDate: false, orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndConfirmError(query);
        });

        it("Query using invalid 'startDate' and 'endDate' inputs will return an error", () => {
            const query = `{
                ${queryName}(startDate: [], endDate: false, orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndConfirmError(query);
        });

        it("Query using valid 'startDate' and invalid 'endDate' inputs will return an error", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.returnRandomDate(query, queryName).then((randomDate: string) => {
                const invalidQuery = `{
                    ${queryName}(startDate: "${randomDate}", endDate: false, orderBy: {direction: ASC, field: NAME}) {
                        ${createdDateQueryBody}
                    }
                }`;
                cy.postAndConfirmError(invalidQuery);
            });
        });

        it("Query using invalid 'startDate' and valid 'endDate' inputs will return an error", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.returnRandomDate(query, queryName).then((randomDate: string) => {
                const invalidQuery = `{
                    ${queryName}(startDate: false, endDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                        ${createdDateQueryBody}
                    }
                }`;
                cy.postAndConfirmError(invalidQuery);
            });
        });
    });

    context("Testing 'first' and 'last' inputs", () => {
        it("Query without 'first' or 'last' input arguments will return up to 25 items", () => {
            cy.postAndValidate(standardQuery, queryName).then((res) => {
                cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                    cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
                });
            });
        });

        it("Query with valid 'first' input argument will return only that amount of items", () => {
            cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(first: ${first}, orderBy: {direction: ASC, field: NAME}) {
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

        it("Query with valid 'last' input argument will return only that amount of items", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(last: ${last}, orderBy: {direction: ASC, field: NAME}) {
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
        
        it("Query with invalid 'first' input argument will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: "4", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(last: "5", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true);
        });
    });

    context("Testing 'searchString' input", () => {
        it("Query with a valid 'searchString' input argument will return the specific item", () => {
            cy.returnRandomInfoName(standardQuery, queryName, infoName).then((name: string) => {
                const searchQuery = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateInfoNameSearch(resp, queryName, infoName, name);
                });
            });
        });

        it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
            cy.returnRandomInfoName(standardQuery, queryName, infoName).then((name: string) => {
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
                    ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateInfoNameSearch(resp, queryName, infoName, searchText);
                });
            });
        });
        
        it("Query with an invalid 'searchString' input argument will fail", () => {
            const gqlQuery = `{
                ${queryName}(searchString: 7, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    context("Testing 'before' and 'after' inputs", () => {
        it("Query with a valid 'before' input argument will return all items before that value", () => {
            cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
                const beforeQuery = `{
                    ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const afterQuery = `{
                    ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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

        it("Query with invalid 'before' input argument will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: 123, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'after' input argument will fail", () => {
            const gqlQuery = `{
                ${queryName}(after: true, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
        
        it("Query with both 'before' and 'after' input arguments will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
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
                        ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
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
                            ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const last = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({message: `last: ${last}`});
                    const beforeQuery = `{
                        ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
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
                            ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
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

        it('Query with invalid "Before" input and valid "first" input will fail', () => {
            cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, first: ${first}, orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "Before" input and invalid "first" input will fail', () => {
            cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "first" input will fail', () => {
            cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, first: ${first}, orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "After" input and invalid "first" input will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "Before" input and valid "last" input will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, last: ${last}, orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "Before" input and invalid "last" input will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "last" input will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, last: ${last}, orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "After" input and invalid "last" input will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });
    });

    context('Testing "ID" input' , () => {

        it('Query with an array of one or more valid ids as "ids" input, returns relevant items ', () => {
           
            var ids="";

            cy.returnMultipleRandomIds(40,standardQuery,queryName).then((idValues:[]) =>{
                
              ids ="["
              for(var i=0;i<idValues.length;i++)
              {
                ids+='"'+idValues[i]+'"'+",";
              
              }
              ids+="]"
         
             const gqlQuery = `{
                ${queryName}( orderBy: {direction: ASC, field: NAME} ids:${ids}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                cy.validateMultipleIdSearch(resp, queryName,idValues);
            });
        });
    });
        //not placed inside the array
        it('Query with single id as "ids" input, returns relevant item ', () => {
            cy.returnRandomId(standardQuery,queryName).then((id: string) =>{
                const gqlQuery = `{
                    ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                    cy.validateIdSearch(resp, queryName, id);
                });
            });

        });

        it('Query with  empty array as "ids" input, returns response data', () => {
            const gqlQuery = `{
                ${queryName}(ids:[], orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it('Query with an array of one or more empty strings as "ids" input, returns error', () => {
            const gqlQuery = `{
                ${queryName}(ids:["",""], orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery,true).then((res) => {
               
                expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");

            })
        });
        
        it('Query with an array of one or more non-string values as "ids" input, returns error ', () => {
            const gqlQuery = `{
                ${queryName}(ids:[235], orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
               
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });

        });

        it('Query with non-array value as "ids" input, returns error ', () => {
            const gqlQuery = `{
                ${queryName}(ids:235, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
               
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });
        });

        it('Query with ids from a different item as "ids" input, returns error ', () => {

            const extraqueryName = "categories";
            // Standard query body to get id from diff item 
            const extrastandardQueryBody = `edges {
                        cursor
                        node {
                            id
                            categoryInfo {
                                name
                                languageCode
                            }
                        }
                    }
                    nodes {
                        id
                        categoryInfo {
                            name
                            languageCode
                        }
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                        hasPreviousPage
                        startCursor
                    }
                    totalCount`;
            // Standard query to use when we don't need any specialized data or input arguments
            const extrastandardQuery = `{
                ${extraqueryName}(orderBy: {direction: ASC, field: NAME}) {
                    ${extrastandardQueryBody}
                }
            }`;
        

            cy.returnRandomId(extrastandardQuery,extraqueryName).then((id: string) =>{
                const gqlQuery = `{
                    ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery,true).then((res) => {
                    expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
                });
            });

        });
    
    });

    context("Testing response values for customData and other fields", () => {
        it("Query with customData field will return valid value", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME}) {
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