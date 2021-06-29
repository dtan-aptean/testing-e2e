/// <reference types="cypress" />

import { SupplementalItemRecord } from "../../support/commands";

// TEST COUNT: 40
describe('Query: productSpecifications', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "productSpecifications";
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
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
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

        it("Query with orderBy direction: DESC, field: NAME will return items in a reverse order from direction: ASC", () => {
            cy.queryReverseOrder(queryName, standardQueryBody, trueTotalInput);
        });
    });

    context("Testing 'productId' input", () => {
        // Items created for the productId test
        const createdItems = [] as SupplementalItemRecord[];
        const createdProducts =  [] as SupplementalItemRecord[];
        const deleteName = "deleteProductSpecification";
        const createMutName = "createProductSpecification";
        const createPath = "productSpecification";
        const extraInput = `options {
            id
            name
        }`;
        const productMutName = "createProduct";
        const productPath = "product";
        const productQuery = "products";
        const productDelete = "deleteProduct";
        
        const addCreated = (isProduct: boolean, extIds: SupplementalItemRecord[]) => {
            extIds.forEach((id) => {
                if (isProduct) {
                    createdProducts.push(id);
                } else {
                    createdItems.push(id);
                }
            });
        };

        const retrieveOptionsIds = (responseBodies: []) => {
            const ids = [] as string[];
            responseBodies.forEach((response) => {
                response.options.forEach((opt) => {
                    ids.push(opt.id);
                });
            });
            return ids;
        };

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            cy.deleteCypressItems(queryName, deleteName).then(() => {
                cy.deleteCypressItems(productQuery, productDelete, "productInfo", `Cypress ${queryName}`);
            });
        });

        // Ensure deletion of the items we created for the productId test
        after(() => {
            if (!deleteItemsAfter) {
                return;
            }
            cy.deleteSupplementalItems(createdProducts);
            cy.deleteSupplementalItems(createdItems);
        });

        it("Query with valid 'productId' input will return only the items connected with that productId", () => {
            const extraItemInput = {name: `Cypress productId ${queryName} test`, options: [{name: "Cypress pId option"}]};
            cy.createAssociatedItems(2, createMutName, createPath, queryName, extraItemInput, extraInput).then((results) => {
                const { deletionIds, items, itemIds, fullItems } = results;
                addCreated(false, deletionIds);
                const optionIds = retrieveOptionsIds(fullItems);
                const productInput = {
                    productInfo: [{
                        name: `Cypress ${queryName} ProductID`,
                        languageCode: "Standard",
                    }],
                    specificationOptionIds: optionIds
                };
                cy.createAssociatedItems(1, productMutName, productPath, productQuery, productInput).then((results) => {
                    const { deletionIds } = results;
                    addCreated(true, deletionIds);
                    const productId = results.itemIds[0];
                    const query = `{
                        ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
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
                                options {
                                    name
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
                    cy.postAndValidate(query, queryName).then((respo) => {
                        const { nodes, totalCount } = respo.body.data[queryName];
                        expect(totalCount).to.be.eql(2);
                        items.forEach((item) => {
                            expect(nodes).to.deep.include(item);
                        });
                        // Now delete the product
                        cy.deleteItem(productDelete, productId).then(() => {
                            itemIds.forEach((id) => {
                                cy.deleteItem(deleteName, id);
                                cy.wait(1000);
                            });
                        });
                    });
                });
            });
        });

        it("Query with invalid 'productId' input will return an error", () => {
            const query = `{
                ${queryName}(productId: true, orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(query).then((res) => {
                expect(res.body.errors[0].message).to.have.string('ID cannot represent a non-string and non-integer value: true');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with 'productId' input that has no associated items will return an empty array", () => {
            const productInput = {
                productInfo: [{
                    name: `Cypress ${queryName} productId`,
                    languageCode: "Standard",
                }]
            };
            cy.createAssociatedItems(1, productMutName, productPath, productQuery, productInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addCreated(true, deletionIds);
                const productId = itemIds[0];
                const query = `{
                    ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(query, queryName).then((res) => {
                    const { nodes, totalCount } = res.body.data[queryName];
                    expect(totalCount).to.be.eql(0);
                    expect(nodes.length).to.eql(0);
                    // Now delete the product
                    cy.deleteItem(productDelete, productId);
                });
            });
        });

        it("Query using the 'productId' of a deleted product will return an error", () => {
            const extraItemInput = {name: `Cypress productId ${queryName} delete`, options: [{name: "Cypress pId option"}]};
            cy.createAssociatedItems(2, createMutName, createPath, queryName, extraItemInput, extraInput).then((results) => {
                const { deletionIds, items, itemIds, fullItems } = results;
                addCreated(false, deletionIds);
                const optionIds = retrieveOptionsIds(fullItems);
                const productInput = {
                    productInfo: [{
                        name: `Cypress ${queryName} ProductID delete`,
                        languageCode: "Standard",
                    }],
                    specificationOptionIds: optionIds
                };
                cy.createAssociatedItems(1, productMutName, productPath, productQuery, productInput).then((results) => {
                    const { deletionIds } = results;
                    addCreated(true, deletionIds);
                    const productId = results.itemIds[0];
                    // Now delete the product
                    cy.deleteItem(productDelete, productId).then(() => {
                        const query = `{
                            ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
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
        it("Query with a valid 'searchString' input argument will return the specific item", () => {
            cy.queryValidSearchString(queryName, standardQuery, standardQueryBody);
        });

        it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
            cy.queryPartialSearchString(queryName, standardQuery, standardQueryBody);
        });

        it("Query with an invalid 'searchString' input argument will fail", () => {
            cy.queryInvalidSearchString(queryName, standardQueryBody);
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

    context("Testing response values for customData and other fields", () => {
        it("Query with customData field will return valid value", () => {
            cy.queryForCustomData(queryName);
        });

        it("Requesting the options field returns an array with valid values", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                    edges {
                        cursor
                        node {
                            id
                        }
                    }
                    nodes {
                        options {
                            displayOrder
                            name
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
                        // has options field
                        expect(item).to.have.property('options');
                        assert.exists(item.options);
                        // validate options as an array
                        assert.isArray(item.options);
                        expect(item.options.length).to.be.gte(1);
                        item.options.forEach((opt) => {
                            expect(opt).to.have.property('displayOrder');
                            if (opt.displayOrder !== null) {
                                expect(opt.displayOrder).to.be.a('number');
                            }
                            expect(opt).to.have.property('name');
                            if (opt.name !== null) {
                                expect(opt.name).to.be.a('string');
                            }
                        });
                    });    
                }
            });
        });
    });
});