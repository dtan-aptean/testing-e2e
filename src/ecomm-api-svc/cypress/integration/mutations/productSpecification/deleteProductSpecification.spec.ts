/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteProductSpecification', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteProductSpecification';
    const createName = 'createProductSpecification';
    const queryName = "productSpecifications";
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

	var deleteItemsAfter = undefined as boolean | undefined;
	before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, mutationName);
	});

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{name: "${name}", options: [{name: "PA deletee option"}]}`;
        cy.createAndGetId(createName, "productSpecification", input).then((returnedId: string) => {
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
        it("Deleting an item connected to a product will disassociate the item from the product", () => {
            const optionsQuery = `{
                ${queryName}(searchString: "${currentItemName}", orderBy: {direction: ASC, field: NAME}) {
                    nodes {
                        id
                        name
                        options {
                            id
                            name
                        }
                    }
                }
            }`;
            cy.postAndValidate(optionsQuery, queryName).then((response) => {
                const target = response.body.data[queryName].nodes.filter((item) => {
                    return item.id === id;
                });
                const optionsId = target[0].options[0].id;
                const options = [{options: target[0].options}];
                const extraMutationName = "createProduct";
                const extraItemPath = "product";
                const productInfoName = "productInfo";
                const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${extraMutationName}(
                        input: { 
                            ${productInfoName}: ${toFormattedString(info)}
                            specificationOptionIds: ["${optionsId}"]
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
                    extraIds.push({itemId: productId, deleteName: "deleteProduct", itemName: info[0].name, queryName: "products"});
                    const propNames = [productInfoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                        const optionsField = `options {
                            id
                            name
                        }`;
                        cy.queryByProductId("productSpecifications", optionsField, productId, options).then(() => {
                            const mutation = `mutation {
                                ${mutationName}(input: { id: "${id}" }) {
                                    ${standardMutationBody}
                                }
                            }`;
                            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                                updateIdAndName();
                                cy.queryByProductId("productSpecifications", optionsField, productId, []);
                            });
                        });
                    });
                });
            });
        });
    });
});