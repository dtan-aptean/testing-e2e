/// <reference types="cypress" />

import { toFormattedString } from "../../support/commands";

// TEST COUNT: 5
describe('Query: productSpecificationOptionsByProductId', () => {
    const queryName = "productSpecificationOptionsByProductId";
    const queryPath = "options";
    const creationName = "createProduct";
    const createPath = "product";
    const itemCreationName = "createProductSpecification";
    const itemCreatePath = "productSpecification";
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
                    deleteProductSpecification(input: { id: "${createdItems[i]}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(removeItems, "deleteProductSpecification");
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
            const queryBody = `options {
                id
                displayOrder
                name
            }`;
            cy.queryByProductId(queryName, queryBody, queryPath, returnedId, []);
        });
    });

    it("Query using the valid id of a product with associated items will return those items", () => {
        productInput.productInfo[0].name = productInput.productInfo[0].name + "2";
        const itemInputOne = {name: `Cypress ${queryName} productSpecification`, options: [{name: "Option 1", displayOrder: Cypress._.random(0, 5)}, {name: "Option 2", displayOrder: Cypress._.random(6, 11)}]};
        const itemIds = [] as string[];
        const extraInput = `options {
            id
            displayOrder
            name
        }`;
        cy.createAndGetId(itemCreationName, itemCreatePath, toFormattedString(itemInputOne), extraInput).then((returnedItem) => {
            const options = returnedItem.options;
            options.forEach((item) => {
                itemIds.push(item.id);
            });
            createdItems.push(returnedItem.id);
            productInput.specificationOptionIds = itemIds;
            cy.createAndGetId(creationName, createPath, toFormattedString(productInput)).then((finalId: string) => {
                createdProducts.push(finalId);
                cy.queryByProductId(queryName, extraInput, queryPath, finalId, options);
            });
        });
    });
});