/// <reference types="cypress" />

import { SupplementalItemRecord } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 7
describe('Mutation: deleteWarehouse', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteWarehouse';
    const createName = 'createWarehouse';
    const queryName = "warehouses";

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        itemName: currentItemName
    };

    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentItemName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, mutationName);
    });

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{name: "${name}", address: { city: "Alpharetta", country: "US", line1: "4325 Alexander Dr", line2: "#100", postalCode: "30022", region: "Georgia" }}`;
        cy.createAndGetId(createName, "warehouse", input).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentItemName).then(() => {
                updateIdAndName();
            });
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, codeMessageError);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, codeMessageError);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, codeMessageError);
        });

        it("Mutation will succeed with valid 'id' input from an existing item", () => {
            cy.mutationBasicDelete(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            cy.mutationAlreadyDeleted(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });
    });

    context("Testing deletion when connected to other items or features", () => {
        const extraCreate = "createProduct";
        const extraPath = "product";
        const extraQuery = "products";
        
        it("Deleting an item connected to a product will disassociate the item from the product", () => {
            const extraItemInput = {
                productInfo: [{name: `Cypress ${mutationName} product`, languageCode: "Standard"}],
                inventoryInformation: {
                    warehouseId: id
                }
            };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                extraIds.push(deletionIds[0]);
                const query = `{
                    ${extraQuery}(searchString: "${extraItemInput.productInfo[0].name}", orderBy: {direction: ASC, field: NAME}) {
                        nodes {
                            id
                            productInfo {
                                name
                                languageCode
                            }
                            inventoryInformation {
                                warehouseId
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, extraQuery, itemIds[0], ["inventoryInformation"], [extraItemInput.inventoryInformation]).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { id: "${id}" }) {
                            ${codeMessageError}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                        updateIdAndName();
                        const newPropValues = [{warehouseId: ""}];
                        cy.wait(5000);
                        cy.confirmUsingQuery(query, extraQuery, itemIds[0], ["inventoryInformation"], newPropValues);
                    });
                });
            });
        });

        it("Deleting an item connected to a product that has multiple warehouses will remove only the target item from the product", () => {
            const extraWarehouseInput = {
                name: `Cypress ${mutationName} extra warehouse`,
                address: {
                    city: "Alpharetta", 
                    country: "US", 
                    line1: "4325 Alexander Dr", 
                    line2: "#100", 
                    postalCode: "30022", 
                    region: "Georgia"
                }
            };
            cy.createAssociatedItems(2, createName, "warehouse", queryName, extraWarehouseInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                extraIds.push(deletionIds[0]);
                extraIds.push(deletionIds[1]);
                const allIds = [itemIds[0], itemIds[1], id];
                let shuffledIds = allIds.map((a) => ({sort: Math.random(), value: a})).sort((a, b) => a.sort - b.sort).map((a) => a.value);
                let expectedIndex = shuffledIds.indexOf(id);
                const inventories = [];
                shuffledIds.forEach((currId) => {
                    inventories.push({
                        stockQuantity: Cypress._.random(10000, 100000),
                        reservedQuantity: Cypress._.random(0, 2000),
                        warehouseId: currId
                    });
                });
                const extraItemInput = {
                    productInfo: [{name: `Cypress ${mutationName} multi product`, languageCode: "Standard"}],
                    inventoryInformation: {
                        manageInventoryMethod: "MANAGE_STOCK",
                        useMultipleWarehouses: true,
                        inventories: inventories,
                    }
                };
                cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                    const { deletionIds, items, itemIds } = results;
                    extraIds.push(deletionIds[0]);
                    const query = `{
                        ${extraQuery}(searchString: "${extraItemInput.productInfo[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                productInfo {
                                    name
                                    languageCode
                                }
                                inventoryInformation {
                                    manageInventoryMethod
                                    useMultipleWarehouses
                                    inventories {
                                        stockQuantity
                                        reservedQuantity
                                        warehouseId
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, extraQuery, itemIds[0], ["inventoryInformation"], [extraItemInput.inventoryInformation]).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${codeMessageError}
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            updateIdAndName();
                            extraItemInput.inventoryInformation.inventories.splice(expectedIndex, 1);
                            cy.wait(5000);
                            cy.confirmUsingQuery(query, extraQuery, itemIds[0], ["inventoryInformation"], [extraItemInput.inventoryInformation]);
                        });
                    });
                });
            });
        });
    });
});