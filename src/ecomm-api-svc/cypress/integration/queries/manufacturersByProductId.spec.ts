/// <reference types="cypress" />

import { toFormattedString } from "../../support/commands";

// TEST COUNT: 5
describe('Query: manufacturersByProductId', () => {
    const queryName = "manufacturersByProductId";
    const queryPath = "manufacturers";
    const creationName = "createProduct";
    const createPath = "product";
    const itemCreationName = "createManufacturer";
    const itemCreatePath = "manufacturer";
    const createdItems = [] as string[];
    const createdProducts = [] as string[];
    const productInput = {
        productInfo: [{
            name: `Cypress ${queryName} product`,
            shortDescription: 'Cypress testing ByProductId queries',
            languageCode: "Standard",
        }],
        inventoryInformation: {
            minimumStockQuantity: Cypress._.random(1, 10),
        }
    };

    after(() => {
        if (createdItems.length > 0) {
            for (var i = 0; i < createdItems.length; i++) {
                cy.wait(2000);
                var removeItems = `mutation {
                    deleteManufacturer(input: { id: "${createdItems[i]}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(removeItems, "deleteManufacturer");
            }
        }
        if (createdProducts.length > 0) {
            for (var i = 0; i < createdProducts.length; i++) {
                cy.wait(2000);
                var removeProducts = `mutation {
                    deleteProduct(input: { id: "${createdProducts[i]}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(removeProducts, "deleteProduct");
            }
        }
    });

    it("Query with no input will fail", () => {
        const query = `query {
            ${queryName}()
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query with null productId input will fail", () => {
        const query = `query {
            ${queryName}(productId: null)
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query with invalid productId input will fail", () => {
        const query = `query {
            ${queryName}(productId: true)
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query using id of a product with no associated items will return an empty array", () => {
        cy.createAndGetId(creationName, createPath, toFormattedString(productInput)).then((returnedId: string) => {
            createdProducts.push(returnedId);
            const queryBody = `manufacturers {
                id
                manufacturerInfo {
                    name
                    languageCode
                }
            }`;
            cy.queryByProductId(queryName, queryBody, queryPath, returnedId, []);
        });
    });

    it("Query using the valid id of a product with associated items will return those items", () => {
        productInput.productInfo[0].name = productInput.productInfo[0].name + "2";
        const itemOne = {manufacturerInfo: [{name: `Cypress ${queryName} manufacturer 1`, languageCode: "Standard"}]};
        const items = [];
        const itemIds = [] as string[];
        cy.createAndGetId(itemCreationName, itemCreatePath, toFormattedString(itemOne)).then((returnedId: string) => {
            itemOne.id = returnedId;
            items.push(itemOne);
            itemIds.push(returnedId);
            createdItems.push(returnedId);
            const itemTwo = {manufacturerInfo: [{name: `Cypress ${queryName} manufacturer 2`, languageCode: "Standard"}]};
            cy.createAndGetId(itemCreationName, itemCreatePath, toFormattedString(itemTwo)).then((secondId: string) => {
                itemTwo.id = secondId;
                items.push(itemTwo);
                itemIds.push(secondId);
                createdItems.push(secondId);
                productInput.manufacturerIds = itemIds;
                cy.createAndGetId(creationName, createPath, toFormattedString(productInput)).then((finalId: string) => {
                    createdProducts.push(finalId);
                    const queryBody = `manufacturers {
                        id
                        manufacturerInfo {
                            name
                            languageCode
                        }
                    }`;
                    cy.queryByProductId(queryName, queryBody, queryPath, finalId, items);
                });
            });
        });
    });
});