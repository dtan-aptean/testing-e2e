/// <reference types="cypress" />

import { codeMessageError } from "../../../support/mutationTests";

const getNewQuantity = (quantity: number) => {
    if (quantity > 50) {
        return quantity - Cypress._.random(1, 50);
    } else {
        return quantity + Cypress._.random(1, 50);
    }
};

// TEST COUNT: 8
describe('Mutation: updateInventory', () => {
    var id = '';
    var itemName = '';
    var originalQuantity = 0;
    var itemCount = 1;
    const mutationName = "updateInventory";
    const createMutName = "createProduct";
	const deleteMutName = "deleteProduct";
    const queryName = "products";
    const itemPath = "productInventoryInfo";
    const secondaryItemPath = "product";
    const infoName = "productInfo";
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            productId
            productQuantity
        }
    `;

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName, infoName);
    });

    beforeEach(() => {
        const name = `Cypress ${mutationName} #${itemCount}`;
        originalQuantity = Cypress._.random(1, 100);
        const input = `{ ${infoName}: [{name: "${name}", languageCode: "Standard"}], inventoryInformation: { stockQuantity:  ${originalQuantity} } }`;
        cy.createAndGetId(createMutName, secondaryItemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
            itemName = name;
            itemCount++;
        });
	});

    afterEach(() => {
		if (!deleteItemsAfter) {
			return;
		}
        if (id !== "") {
            // Delete the item we've been updating
            cy.safeDelete(queryName, deleteMutName, id, itemName, infoName);
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });


        it("Mutation will fail if the only input provided is 'productId'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'productId' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: true,  productQuantity: ${getNewQuantity(originalQuantity)}}) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if the only input provided is 'productQuantity'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productQuantity: ${getNewQuantity(originalQuantity)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'productQuantity' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", productQuantity: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if using a deleted product's id as 'productId' input", () => {
            const mutation = `mutation {
                ${deleteMutName}(input: { id: "${id}" }) {
                    ${codeMessageError}
                }
            }`;
            cy.postAndConfirmDelete(mutation, deleteMutName, { queryName: queryName, itemId: id, itemName: itemName, infoName: infoName, asTest: true }).then(() => {
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        productId: "${id}", 
                        productQuantity: ${getNewQuantity(originalQuantity)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Invalid Aptean Id");
                });
            });
        });

        it("Mutation will succeed with valid 'productId' and 'productQuantity' inputs", () => {
            const newQuantity = getNewQuantity(originalQuantity);
            const mutation = `mutation {
                ${mutationName}(input: { 
                    productId: "${id}", 
                    productQuantity: ${newQuantity}
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.confirmMutationSuccess(res, mutationName, itemPath, ["productQuantity"], [newQuantity]).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                inventoryInformation {
                                    stockQuantity
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, ["inventoryInformation"], [{stockQuantity: newQuantity}]);
                });
            });
        });
    });
});