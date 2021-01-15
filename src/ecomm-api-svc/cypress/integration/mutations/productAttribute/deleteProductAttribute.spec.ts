/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteProductAttribute', () => {
    var id = '';
    var currentItemName = '';
    const extraIds = [] as {itemId: string, deleteName: string}[];
    const mutationName = 'deleteProductAttribute';
    const creationName = 'createProductAttribute';
    const queryName = "productAttributes";
    const deletedMessage = "product attribute";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const mutationInput = 'values: [{name: "PA deletee value"}]';
        cy.searchOrCreate(name, queryName, creationName, mutationInput).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
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
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    cy.deleteItem(mutationName, id).then(() => {
                        id = '';
                        currentItemName = '';
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
            cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
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
                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                    id = '';
                    currentItemName = '';
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });
    });

    context("Testing deletion when connected to other items or features", () => {
        it("Deleting an item connected to a product will disassociate the item from the product", () => {
            const extraMutationName = "createProduct";
            const extraDataPath = "product";
            const productInfoName = "productInfo";
            const productAttributes = [{id: id, name: currentItemName, values: [{name: "PA deletee value"}]}];
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        attributeIds: ["${id}"]
                    }
                ) {
                    code
                    message
                    error
                    ${extraDataPath} {
                        id
                        ${productInfoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
                const productId = res.body.data[extraMutationName][extraDataPath].id;
                extraIds.push({itemId: productId, deleteName: "deleteProduct"});
                const propNames = [productInfoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                    const queryBody = `id
                        name
                        values {
                            name
                        }`;
                    cy.queryByProductId("productAttributes", queryBody, productId, productAttributes).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                            cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                                id = '';
                                currentItemName = '';
                                cy.queryByProductId("productAttributes", queryBody, productId, []);
                            });
                        });
                    });
                });
            });
        });
    });
});