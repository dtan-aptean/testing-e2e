/// <reference types="cypress" />

import { SupplementalItemRecord } from "../../support/commands";

// TEST COUNT: 47
describe('Query: categories', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "categories";
    // Standard query body to use when we don't need special data but do need special input arguments
    const standardQueryBody = `edges {
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
                customData
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
    const standardQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
            ${standardQueryBody}
        }
    }`;
    // Name of the info field
    const infoName = "customData";
    var trueTotalInput = "";

    before(() => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            const { nodes, edges, totalCount } = res.body.data[queryName];
            expect(nodes.length).to.be.eql(edges.length);
            if (totalCount > nodes.length) {
                trueTotalInput = totalCount > 0 ? "first: " + totalCount + ", " : "";
            }
        });
    });

    context("Testing 'searchString' input", () => {
        it.only("Query with a valid 'searchString' input argument will return the specific item", () => {
            debugger;
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
                    Cypress.log({ message: `first: ${first}` });
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
                        const first = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `first: ${first}` });
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
                    Cypress.log({ message: `last: ${last}` });
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
                        const last = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `last: ${last}` });
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