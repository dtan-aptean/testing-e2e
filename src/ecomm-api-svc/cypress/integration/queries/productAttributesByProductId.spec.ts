/// <reference types="cypress" />

import { toFormattedString } from "../../support/commands";

// TEST COUNT: 0
describe('Query: productAttributesByProductId', () => {
    const queryName = "productAttributesByProductId";
    const creationName = "createProduct";
    const createPath = "product";
    const itemCreationName = "createProductAttribute";
    const itemCreatePath = "productAttribute";
    const createdItems = [] as string[];
    const createdProducts = [] as string[];
    const productInput = {
        productInfo: [{
            name: `Cypress ${queryName} product`,
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
                    deleteProductAttribute(input: { id: "${createdItems[i]}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(removeItems, "deleteProductAttribute");
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
            cy.queryByProductId(queryName, returnedId, []);
        });
    });

    it("Query using the valid id of a product with associated items will return those items' ids", () => {
        productInput.productInfo[0].name = productInput.productInfo[0].name + "2";
        const itemInputOne = {name: `Cypress ${queryName} productAttribute 1`, values: [{name: "Obligitory value"}]};
        const itemIds = [] as string[];
        cy.createAndGetId(itemCreationName, itemCreatePath, toFormattedString(itemInputOne)).then((returnedId: string) => {
            itemIds.push(returnedId);
            createdItems.push(returnedId);
            const itemInputTwo = {name: `Cypress ${queryName} productAttribute 2`, values: [{name: "Obligitory value"}]};
            cy.createAndGetId(itemCreationName, itemCreatePath, toFormattedString(itemInputTwo)).then((secondId: string) => {
                itemIds.push(secondId);
                createdItems.push(secondId);
                productInput.attributeIds = itemIds;
                cy.createAndGetId(creationName, createPath, toFormattedString(productInput)).then((finalId: string) => {
                    createdProducts.push(finalId);
                    cy.queryByProductId(queryName, finalId, itemIds);
                });
            });
        });
    });
});