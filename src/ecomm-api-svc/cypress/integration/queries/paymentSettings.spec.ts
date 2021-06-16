/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../support/commands";

// TEST COUNT: 51
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
            cy.queryNoOrderBy(queryName, standardQueryBody);
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
            cy.queryReverseOrder(queryName, standardQueryBody, trueTotalInput);
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

    context("Testing 'ids' input", () => {
        it("Using 'ids' input will return only the items with ids that were used as input", () => {
            let count = 4;
            cy.queryAndValidateMultipleIds(count, queryName, standardQueryBody);
        });

        it("Using a single id as 'ids' input returns only the relevant item", () => {
            cy.queryAndValidateRandomId(queryName, standardQueryBody);
        });

        it("Using 'ids' input as an empty array returns standard response as though 'ids' input was not included", () => {
            cy.queryAndValidateEmptyArray(queryName, standardQueryBody);
        });

        it("Using an array of empty strings as 'ids' input will return an error", () => {
            const ids = ["", "", "", ""];
            cy.queryAndValidateEmptyStrings(ids, queryName, standardQueryBody);
        });

        it("Using an array of non-string values as 'ids' input returns an error", () => {
            const ids = [false, true, 235];
            cy.queryAndValidateNonStringValues(ids, queryName, standardQueryBody);
        });

        it("Using a non-array value as 'ids' input returns an error", () => {
            const ids = false;
            cy.queryAndValidateNonArrayValues(ids, queryName, standardQueryBody);
        });

        it("Using ids from a different item as 'ids' input returns an error", () => {
            const extraQueryName = "returnReasons";
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

    context("Testing 'companyIds' input", () => {
        // Items created for the companyIds test
        const createdItems = [] as SupplementalItemRecord[];
        const createdCompanies =  [] as SupplementalItemRecord[];
        const deleteName = "deletePaymentSettings";
        const createMutName = "createPaymentSettings";
        const createPath = "paymentSettings";
        const companyMutName = "createCompany";
        const companyPath = "company";
        const companyQuery = "companies";
        const companyDelete = "deleteCompany";
        const additionalRes = `company {
            id
            name
        }`;

        const addCreated = (isCompany: boolean, extIds: SupplementalItemRecord[]) => {
            extIds.forEach((id) => {
                if (isCompany) {
                    createdCompanies.push(id);
                } else {
                    createdItems.push(id);
                }
            });
        };

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            cy.deleteCypressItems(queryName, deleteName).then(() => {
                cy.deleteCypressItems(companyQuery, companyDelete, undefined, `Cypress ${queryName}`);
            });
        });

        // Ensure deletion of the items we created for the productId test
        after(() => {
            if (!deleteItemsAfter) {
                return;
            }
            cy.deleteSupplementalItems(createdItems);
            cy.deleteSupplementalItems(createdCompanies);
        });

        it("Using 'companyIds' input as an empty array returns standard response as though 'companyIds' input was not included", () => {
            const gqlQuery = `{
                ${queryName}(companyIds: [], orderBy: {direction: ASC, field: COMPANY_NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it("Using an array of empty strings as 'companyIds' input will return an error", () => {
            const gqlQuery = `{
                ${queryName}(companyIds: ["", "", "", ""], orderBy: {direction: ASC, field: COMPANY_NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].details[0].code).to.have.string("Invalid Argument");
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
            });
        });

        it("Using an array of non-string values as 'companyIds' input returns an error", () => {
            const companyIds = [false, true, 235];
            const gqlQuery = `{
                ${queryName}(companyIds: ${toFormattedString(companyIds)}, orderBy: {direction: ASC, field: COMPANY_NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ companyIds[0]);
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Using a non-array value as 'companyIds' input returns an error", () => {
            const gqlQuery = `{
                ${queryName}(companyIds: false, orderBy: {direction: ASC, field: COMPANY_NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value");
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Using ids from a non-company item as 'companyIds' input returns an error", () => {
            const extraQueryName = "returnReasons";
            const extraGqlQuery = `{
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
            cy.returnRandomId(extraGqlQuery, extraQueryName).then((curId: string) => {
                const gqlQuery = `{
                    ${queryName}(companyIds: ["${curId}"], orderBy: {direction: ASC, field: COMPANY_NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery, true).then((res) => {
                    expect(res.body.errors[0].message[0].details[0].code).to.have.string("Invalid Argument");
                    expect(res.body.errors[0].message[0].message).to.have.string("Invalid Aptean Id");
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
                });
            });
        });

        it("Query with valid 'companyIds' input will return only the items connected with that companyId", () => {
            const extraItemInput = { name: `Cypress ${queryName} companyIds test`, integrationKey: `CypressQuery${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addCreated(true, deletionIds);
                const companyId = itemIds[0];
                const paymentSettingsInput =  {
                    companyId: companyId
                };
                cy.createAssociatedItems(1, createMutName, createPath, queryName, paymentSettingsInput, additionalRes).then((results) => {
                    const { deletionIds, fullItems, itemIds } = results;
                    addCreated(false, deletionIds);
                    const query = `{
                        ${queryName}(companyIds: "${companyId}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(query, queryName).then((respo) => {
                        const { nodes, totalCount } = respo.body.data[queryName];
                        expect(totalCount).to.be.eql(1);
                        fullItems.forEach((item) => {
                            expect(nodes).to.deep.include(item);
                        });
                        // Now delete the company
                        cy.deleteItem(companyDelete, companyId).then(() => {
                            itemIds.forEach((id) => {
                                cy.deleteItem(deleteName, id);
                                cy.wait(1000);
                            });
                        });
                    });
                });
            });
        });

        it("Query with multiple valid 'companyIds' input will return all items associated with those companies", () => {
            const extraItemInput = { name: `Cypress ${queryName} multiple companyIds test`, integrationKey: `CypressMultiple` };
            cy.createAssociatedItems(2, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addCreated(true, deletionIds);
                const companyIdOne = itemIds[0];
                const companyIdTwo = itemIds[1];
                const inputOne =  {
                    companyId: companyIdOne
                };
                cy.createAssociatedItems(1, createMutName, createPath, queryName, inputOne, additionalRes).then((results) => {
                    const { deletionIds, fullItems, itemIds } = results;
                    addCreated(false, deletionIds);
                    const inputTwo = {
                        companyId: companyIdTwo
                    };
                    cy.createAssociatedItems(1, createMutName, createPath, queryName, inputTwo, additionalRes).then((secondResults) => {
                        const { deletionIds } = secondResults;
                        addCreated(false, deletionIds);
                        const expectedItems = fullItems.concat(secondResults.fullItems);
                        const allIds = itemIds.concat(secondResults.itemIds);
                        const query = `{
                            ${queryName}(companyIds: ["${companyIdOne}", "${companyIdTwo}"], orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                ${standardQueryBody}
                            }
                        }`;
                        cy.postAndValidate(query, queryName).then((respo) => {
                            const { nodes, totalCount } = respo.body.data[queryName];
                            expect(totalCount).to.be.eql(2);
                            expectedItems.forEach((item) => {
                                expect(nodes).to.deep.include(item);
                            });
                            // Now delete the comapany
                            cy.deleteItem(companyDelete, companyIdOne).then(() => {
                                cy.deleteItem(companyDelete, companyIdTwo).then(() => {
                                    allIds.forEach((id) => {
                                        cy.deleteItem(deleteName, id);
                                        cy.wait(1000);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });

        it("Query with 'companyId' input that has no associated items will return an empty array", () => {
            const companyInput = {name: `Cypress ${queryName} no association test`, integrationKey: `CypressUnaffiliated${Cypress._.random(10000, 100000)}`};
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, companyInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addCreated(true, deletionIds);
                const companyId = itemIds[0];
                const query = `{
                    ${queryName}(companyIds: "${companyId}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(query, queryName).then((res) => {
                    const { nodes, totalCount } = res.body.data[queryName];
                    expect(totalCount).to.be.eql(0);
                    expect(nodes.length).to.eql(0);
                    // Now delete the company
                    cy.deleteItem(companyDelete, companyId);
                });
            });
        });

        it("Query using the 'productId' of a deleted product will return an error", () => {
            const companyInput = {name: `Cypress ${queryName} deleted test`, integrationKey: `CypressDeleted${Cypress._.random(10000, 100000)}`};
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, companyInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addCreated(true, deletionIds);
                const companyId = itemIds[0];
                const paymentSettingsInput =  {
                    companyId: companyId
                };
                cy.createAssociatedItems(1, createMutName, createPath, queryName, paymentSettingsInput, additionalRes).then((results) => {
                    const { deletionIds, itemIds } = results;
                    addCreated(false, deletionIds);
                    // Now delete the product
                    cy.deleteItem(companyDelete, companyId).then(() => {
                        const query = `{
                            ${queryName}(companyIds: "${companyId}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                ${standardQueryBody}
                            }
                        }`;
                        cy.postAndConfirmError(query, true).then(() => {
                            itemIds.forEach((id) => {
                                cy.deleteItem(deleteName, id);
                                cy.wait(1000);
                            });
                        });
                    });
                });
            });
        });
    });

    context("Testing response values for customData and other fields", () => {
        it("Query with customData field will return valid value", () => {
            cy.queryForCustomData(queryName);
        });
    });
});