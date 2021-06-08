/// <reference types="cypress" />
// TEST COUNT: 47
describe('Query: paymentSettings', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "paymentSettings";
    // Standard query body to use when we don't need special data but do need special input arguments
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    company {
                        id
                        name
                    }
                }
            }
            nodes {
                id
                company {
                    id
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
        ${queryName}(orderBy: {direction: ASC, field: COMPANY_NAME}) {
            ${standardQueryBody}
        }
    }`;
    // Name of the info field
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
            cy.queryNoReturnType(queryName);
        });

        it("Query with valid 'orderBy' input argument returns valid data types", () => {
            cy.postAndValidate(standardQuery, queryName);
        });

        it("Query will fail without 'orderBy' input argument", () => {
            cy.queryNoOrderBy(queryName, standardQueryBody)
        });

        it("Query fails if the 'orderBy' input argument is null", () => {
            cy.queryNullOrderBy(queryName);
        });

        it("Query fails if 'orderBy' input argument only has field", () => {
            cy.queryFieldOrderBy(queryName);
        });

        it("Query fails if 'orderBy' input argument only has direction", () => {
            cy.queryDirectionOrderBy(queryName);
        });

        it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
            cy.queryOneReturn(queryName);
        });

        it("Query with orderBy direction: DESC, field: COMPANY_NAME will return items in a reverse order from direction: ASC", () => {
            cy.queryReverseOrder(queryName, standardQueryBody, trueTotalInput)
        });
    });

    context("Testing 'first' and 'last' inputs", () => {
        it("Query without 'first' or 'last' input arguments will return up to 25 items", () => {
            cy.queryUpTo25(queryName, standardQuery);
        });
        
        it("Query with valid 'first' input argument will return only that amount of items", () => {
            cy.queryFirst(queryName, standardQuery, standardQueryBody);
        });

        it("Query with valid 'last' input argument will return only that amount of items", () => {
            cy.queryLast(queryName, standardQueryBody, trueTotalInput);
        });

        it("Query with invalid 'first' input argument will fail", () => {
            cy.queryInvalidFirst(queryName, standardQueryBody);
        });

        it("Query with invalid 'last' input argument will fail", () => {
            cy.queryInvalidLast(queryName, standardQueryBody);
        });

        it("Query with both 'first' and 'last' input arguments will fail", () => {
            cy.queryFirstLast(queryName, standardQueryBody);
        });
    });

    context("Testing 'searchString' input", () => {
        const getRandomCompanyName = () => {
            return cy.postAndValidate(standardQuery, queryName).then((res) => {
                var randomIndex = 0;
                var totalCount = res.body.data[queryName].totalCount > 25 ? 25 : res.body.data[queryName].totalCount;
                if (totalCount > 1) {
                    randomIndex = Cypress._.random(0, totalCount - 1);
                }
                var randomNode = res.body.data[queryName].nodes[randomIndex];
                const duplicateArray = res.body.data[queryName].nodes.filter((val) => {
                    return val.company.name === randomNode.company.name;
                });
                if (duplicateArray.length > 1) {
                    const uniqueArray = res.body.data[queryName].nodes.filter((val) => {
                        return val.company.name !== randomNode.company.name;
                    });
                    randomIndex = 0;
                    if (uniqueArray.length > 1) {
                        randomIndex = Cypress._.random(0, uniqueArray.length - 1);
                    }
                    randomNode = uniqueArray[randomIndex];
                }
                return cy.wrap(randomNode.company.name);
            });
        };

        const validateCompanyNameSearch = (res, name) => {
            const totalCount = res.body.data[queryName].totalCount;
            const nodes = res.body.data[queryName].nodes;
            const edges = res.body.data[queryName].edges;
            expect(totalCount).to.be.eql(nodes.length);
            expect(totalCount).to.be.eql(edges.length);
            for (var i = 0; i < nodes.length; i++) {
                expect(nodes[i].company.name.toLowerCase()).to.include(name.toLowerCase(), `Node[${i}]`);
                expect(edges[i].node.company.name.toLowerCase()).to.include(name.toLowerCase(), `Edge[${i}]`);
            }
        };

        it("Query with a valid 'searchString' input argument will return the specific item", () => {
            getRandomCompanyName().then((name: string) => {
                const searchQuery = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    validateCompanyNameSearch(resp, name);
                });
            });
        });

        it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
            getRandomCompanyName().then((name: string) => {
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
                    ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    validateCompanyNameSearch(resp, searchText);
                });
            });
        });

        it("Query with an invalid 'searchString' input argument will fail", () => {
            cy.queryInvalidSearch(queryName, standardQueryBody);
        });
    });

    context("Testing 'before' and 'after' inputs", () => {
        it("Query with a valid 'before' input argument will return all items before that value", () => {
            cy.queryBefore(queryName, standardQuery, standardQueryBody);
        });
        
        it("Query with a valid 'after' input argument will return all items after that value", () => {
            cy.queryAfter(queryName, standardQueryBody, trueTotalInput);
        });

        it("Query with invalid 'before' input argument will fail", () => {
            cy.queryInvalidBefore(queryName, standardQueryBody);
        });

        it("Query with invalid 'after' input argument will fail", () => {
            cy.queryInvalidAfter(queryName, standardQueryBody);
        });

        it("Query with both 'before' and 'after' input arguments will fail", () => {
            cy.queryBeforeAfter(queryName, standardQueryBody);
        });
    });

    context("Testing 'before'/'after' inputs with 'first'/'last' inputs", () => {
        it("Query with both 'before' and 'first' input arguments will return a specific amount of items before that value", () => {
            cy.queryBeforeFirst(queryName, standardQuery, standardQueryBody);
        });

        it("Query with both 'after' and 'first' input will arguments return a specific amount of items after that value", () => {
            cy.queryAfterFirst(queryName, standardQueryBody, trueTotalInput);
        });

        it("Query with both 'before' and 'last' input arguments will return a specific amount of items before that value", () => {
            cy.queryBeforeLast(queryName, standardQueryBody, trueTotalInput);
        });

        it("Query with both 'after' and 'last' input will return a specific amount of items after that value", () => {
            cy.queryAfterLast(queryName, standardQueryBody, trueTotalInput);
        });

        it('Query with invalid "Before" input and valid "first" input will fail', () => {
            cy.queryInvalidBeforeFirst(queryName, standardQuery, standardQueryBody);
        });

        it('Query with valid "Before" input and invalid "first" input will fail', () => {
            cy.queryBeforeInvalidFirst(queryName, standardQuery, standardQueryBody);
        });

        it('Query with invalid "After" input and valid "first" input will fail', () => {
            cy.queryInvalidAfterFirst(queryName, standardQuery, standardQueryBody);
        });

        it('Query with valid "After" input and invalid "first" input will fail', () => {
            cy.queryAfterInvalidFirst(queryName, standardQueryBody, trueTotalInput);
        });

        it('Query with invalid "Before" input and valid "last" input will fail', () => {
            cy.queryInvalidBeforeLast(queryName, standardQueryBody, trueTotalInput);
        });

        it('Query with valid "Before" input and invalid "last" input will fail', () => {
            cy.queryBeforeInvalidLast(queryName, standardQueryBody, trueTotalInput);
        });

        it('Query with invalid "After" input and valid "last" input will fail', () => {
            cy.queryInvalidAfterLast(queryName, standardQueryBody, trueTotalInput);
        });

        it('Query with valid "After" input and invalid "last" input will fail', () => {
            cy.queryAfterInvalidLast(queryName, standardQueryBody, trueTotalInput);
        });
    });

    context.only("Testing response values for customData and other fields", () => {
        it("Query with customData field will return valid value", () => {
            cy.queryForCustomData(queryName);
        });
    });
});