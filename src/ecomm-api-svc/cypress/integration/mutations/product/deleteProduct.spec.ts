/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteProduct', () => {
    let id = '';
    let currentItemName = '';
    const extraIds = [];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteProduct';
    const creationName = 'createProduct';
    const queryName = "products";
    const infoName = 'productInfo';
    const deletedMessage = "product";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `${infoName}: [{name: "${name}", shortDescription: "Cypress testing ${mutationName}", languageCode: "Standard"}], inventoryInformation: {minimumStockQuantity: 5}`;
        cy.searchOrCreate(name, queryName, creationName, input, infoName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                var extraRemoval = `mutation {
                    ${extraIds[i].deleteName}(input: { id: "${extraIds[i].itemId}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(extraRemoval, extraIds[i].deleteName);
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName, infoName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    const mutation = `mutation {
                        ${mutationName}(input: {id: "${id}"}){
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName).then(() => {
                        id = '';
                        currentItemName = '';
                    });
                }
            });
        }
    });

    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            ${mutationName} {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            ${mutationName}(input: {}) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'id' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will succeed with valid 'id' input from an existing item", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                id = '';
                currentItemName = '';
            });
        });
    });

    it("Mutation will fail when given 'id' input from an deleted item", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                id = '';
                currentItemName = '';
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    it("Deleting an item connected to a discount will disassociate the item from the discount", () => {
        const extraMutationName = "createDiscount";
        const extraDataPath = "discount";
        const extraQueryName = "discounts";
        const products = [{
            id: id, 
            productInfo: [{
                name: currentItemName, 
                shortDescription: `Cypress testing ${mutationName}`, 
                languageCode: "Standard"
            }],
            inventoryInformation: {
                minimumStockQuantity: 5
            }
        }];
        const name = `Cypress ${mutationName} discount test`;
        const discountAmount = {
            amount: Cypress._.random(1, 100),
            currency: "USD"
        };
        const discountType = "ASSIGNED_TO_PRODUCTS";
        const mutation = `mutation {
            ${extraMutationName}(
                input: { 
                    discountAmount: ${toFormattedString(discountAmount)}
                    productIds: ["${id}"]
                    name: "${name}"
                    discountType: ${discountType}
                }
            ) {
                code
                message
                error
                ${extraDataPath} {
                    id
                    discountAmount {
                        amount
                        currency
                    }
                    products {
                        id
                        productInfo {
                            name
                            shortDescription
                            languageCode
                        }
                        inventoryInformation {
                            minimumStockQuantity
                        }
                    }
                    discountType
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
            const discountId = res.body.data[extraMutationName][extraDataPath].id;
            extraIds.push({itemId: discountId, deleteName: "deleteDiscount"});
            const propNames = ["products", "name", "discountType"];
            const propValues = [products, name, discountType];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                const query = `{
                    ${extraQueryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                        nodes {
                            id
                            discountAmount {
                                amount
                                currency
                            }
                            products {
                                id
                                productInfo {
                                    name
                                    shortDescription
                                    languageCode
                                }
                                inventoryInformation {
                                    minimumStockQuantity
                                }
                            }
                            discountType
                            name
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, extraQueryName, discountId, propNames, propValues).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { id: "${id}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                        expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                        cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                            id = '';
                            currentItemName = '';
                            const newPropValues = [[], name, discountType];
                            cy.confirmUsingQuery(query, extraQueryName, discountId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });
});