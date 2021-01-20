/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteTaxCategory', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteTaxCategory';
    const creationName = 'createTaxCategory';
    const queryName = "taxCategories";
    const standardMutationBody = `
        code
        message
        error
    `;

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

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                const infoName = extraIds[i].queryName === "products" ? "productInfo" : null;
                cy.queryForDeleted(false, extraIds[i].itemName, extraIds[i].itemId, extraIds[i].queryName, infoName).then((itemPresent: boolean) => {
                    if (itemPresent) {
                        cy.deleteItem(extraIds[i].deleteName, extraIds[i].itemId);
                    }
                });
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    cy.deleteItem(mutationName, id).then(() => {
                        updateIdAndName();
                    });
                }
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
        it("A taxCategory connected to a checkoutAttribute cannot be deleted until the connected checkoutAttribute is deleted", () => {
            const extraDeleteName = "deleteCheckoutAttribute";
            const extraMutationName = "createCheckoutAttribute";
            const extraItemPath = "checkoutAttribute";
            const extraQueryName = "checkoutAttributes";
            const taxCategory = {id: id, name: currentItemName};
            const name = `Cypress ${mutationName} checkoutAttribute test`;
            const values = [{name: 'Cypress Obligatory CA'}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: {
                        name: "${name}"
                        values: ${toFormattedString(values)}
                        taxCategoryId: "${id}"
                    }
                ) {
                    code
                    message
                    error
                    ${extraItemPath} {
                        id
                        name
                        values {
                            name
                        }
                        taxCategory {
                            id
                            name
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const attributeId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: attributeId, deleteName: extraDeleteName, itemName: name, queryName: extraQueryName});
                const propNames = ["name", "taxCategory", "values"];
                const propValues = [name, taxCategory, values];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                values {
                                    name
                                }
                                taxCategory {
                                    id
                                    name
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, extraQueryName, attributeId, propNames, propValues).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName).then((erRes) => {
                            const errorMessage = erRes.body.errors[0].message;
                            expect(errorMessage).to.contain("TaxCategory is Associated with Checkout Attributes");
                            const deleteExtra = `mutation {
                                ${extraDeleteName}(input: { id: "${attributeId}" }) {
                                    ${standardMutationBody}
                                }
                            }`;
                            const extraQueryInfo = {queryName: extraQueryName, itemId: attributeId, itemName: name}
                            cy.postAndConfirmDelete(deleteExtra, extraDeleteName, extraQueryInfo).then((exRes) => {
                                // connected item has been deleted, delete the taxCategory
                                cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                                    updateIdAndName();
                                });
                            });
                        });
                    });
                });
            });
        });

        it("A taxCategory connected to a product cannot be deleted until the connected product is deleted", () => {
            const extraDeleteName = "deleteProduct";
            const extraMutationName = "createProduct";
            const extraItemPath = "product";
            const extraQueryName = "products";
            const productInfoName = "productInfo";
            const taxCategory = {id: id, name: currentItemName};
            const priceInformation = {taxCategory: taxCategory};
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        taxCategoryId: "${id}"
                    }
                ) {
                    code
                    message
                    error
                    ${extraItemPath} {
                        id
                        priceInformation {
                            taxCategory {
                                id
                                name
                            }
                        }
                        ${productInfoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const productId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: productId, deleteName: extraDeleteName, itemName: info[0].name, queryName: extraQueryName});
                const propNames = ["priceInformation", productInfoName];
                const propValues = [priceInformation, info];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                priceInformation {
                                    taxCategory {
                                        id
                                        name
                                    }
                                }
                                ${productInfoName} {
                                    name
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, extraQueryName, productId, propNames, propValues).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName).then((erRes) => {
                            const errorMessage = erRes.body.errors[0].message;
                            expect(errorMessage).to.contain("TaxCategory is Associated with Products");
                            const deleteExtra = `mutation {
                                ${extraDeleteName}(input: { id: "${productId}" }) {
                                    ${standardMutationBody}
                                }
                            }`;
                            const extraQueryInfo = {queryName: extraQueryName, itemId: productId, itemName: info[0].name, infoName: productInfoName};
                            cy.postAndConfirmDelete(deleteExtra, extraDeleteName, extraQueryInfo).then((exRes) => {
                                // connected item has been deleted, delete the taxCategory
                                cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                                    updateIdAndName();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});