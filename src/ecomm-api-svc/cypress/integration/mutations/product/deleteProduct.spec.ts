/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteProduct', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteProduct';
    const createName = 'createProduct';
    const queryName = "products";
    const infoName = 'productInfo';
    const standardMutationBody = `
        code
        message
        error
    `;

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        itemName: currentItemName, 
        infoName: infoName
    };
    
    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentItemName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{${infoName}: [{name: "${name}", languageCode: "Standard"}]}`;
        cy.createAndGetId(createName, "product", input).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentItemName, infoName).then(() => {
                updateIdAndName();
            });
        }
    });

    context("Testing basic required inputs", () => {
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
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                updateIdAndName();
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    context("Testing deletion when connected to other items or features", () => {
        it("Deleting an item connected to a discount will disassociate the item from the discount", () => {
            const extraMutationName = "createDiscount";
            const extraItemPath = "discount";
            const extraQueryName = "discounts";
            const products = [{
                id: id, 
                productInfo: [{
                    name: currentItemName, 
                    languageCode: "Standard"
                }]
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
                    ${extraItemPath} {
                        id
                        discountAmount {
                            amount
                            currency
                        }
                        products {
                            id
                            productInfo {
                                name
                                languageCode
                            }
                        }
                        discountType
                        name
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const discountId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: discountId, deleteName: "deleteDiscount", itemName: name, queryName: extraQueryName});
                const propNames = ["products", "name", "discountType"];
                const propValues = [products, name, discountType];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
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
                                        languageCode
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
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                            updateIdAndName();
                            const newPropValues = [[], name, discountType];
                            cy.confirmUsingQuery(query, extraQueryName, discountId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });
});