/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteManufacturer', () => {
    var id = '';
    var currentItemName = '';
    const extraIds = [] as {itemId: string, deleteName: string}[];
    const mutationName = 'deleteManufacturer';
    const creationName = 'createManufacturer';
    const queryName = "manufacturers";
    const infoName = 'manufacturerInfo';
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
        cy.searchOrCreate(name, queryName, creationName, undefined, infoName).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                cy.deleteItem(extraIds[i].deleteName, extraIds[i].itemId);
            }
            extraIds = [];
        }
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
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
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
            const manufacturers = [{id: id, manufacturerInfo: [{name: currentItemName, languageCode: "Standard"}]}];
            const name = `Cypress ${mutationName} discount test`;
            const discountAmount = {
                amount: Cypress._.random(1, 100),
                currency: "USD"
            };
            const discountType = "ASSIGNED_TO_MANUFACTURERS";
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        discountAmount: ${toFormattedString(discountAmount)}
                        manufacturerIds: ["${id}"]
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
                        manufacturers {
                            id
                            manufacturerInfo {
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
                extraIds.push({itemId: discountId, deleteName: "deleteDiscount"});
                const propNames = ["manufacturers", "name", "discountType"];
                const propValues = [manufacturers, name, discountType];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountAmount {
                                    amount
                                    currency
                                }
                                manufacturers {
                                    id
                                    manufacturerInfo {
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

        it("Deleting an item connected to a product will disassociate the item from the product", () => {
            const extraMutationName = "createProduct";
            const extraItemPath = "product";
            const productInfoName = "productInfo";
            const manufacturers = [{id: id, manufacturerInfo: [{name: currentItemName, languageCode: "Standard"}]}];
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        manufacturerIds: ["${id}"]
                    }
                ) {
                    code
                    message
                    error
                    ${extraItemPath} {
                        id
                        ${productInfoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const productId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: productId, deleteName: "deleteProduct"});
                const propNames = [productInfoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const queryBody = `id
                        manufacturerInfo {
                            name
                            languageCode
                        }`;
                    cy.queryByProductId("manufacturers", queryBody, productId, manufacturers).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                            updateIdAndName();
                            cy.queryByProductId("manufacturers", queryBody, productId, []);
                        });
                    });
                });
            });
        });
    });
});