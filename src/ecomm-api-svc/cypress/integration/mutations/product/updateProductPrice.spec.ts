/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 13
describe('Mutation: updateProductPrice', () => {
    var id = '';
    var itemName = '';
    var originalPrice = 0;
    var itemCount = 1;
    const mutationName = "updateProductPrice";
    const createMutName = "createProduct";
	const deleteMutName = "deleteProduct";
    const queryName = "products";
    const itemPath = "productPriceInfo";
    const secondaryItemPath = "product";
    const infoName = "productInfo";
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            productId
            price {
                amount
                currency
            }
        }
    `;

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName, infoName);
    });

    beforeEach(() => {
        const name = `Cypress ${mutationName} #${itemCount}`;
        originalPrice = Cypress._.random(10000, 100000);
        const input = `{ ${infoName}: [{name: "${name}", languageCode: "Standard"}], priceInformation: { price: { amount: ${originalPrice}, currency: "USD" } } }`;
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
                ${mutationName}(input: { productId: true, price: { amount: ${originalPrice - 1000}, currency: "USD" } }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if the only input provided is 'price'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { price: { amount: ${originalPrice - 1000}, currency: "USD" } }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'price' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'price' input is an empty object", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: {} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'price' input does not have an 'amount' property", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: { currency: "USD" } }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "UpdatePriceInput.amount" of required type "Int!" was not provided.');
            });
        });

        it("Mutation will fail if 'price' input does not have an 'currency' property", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: { amount: ${originalPrice - 1000} } }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "UpdatePriceInput.currency" of required type "String!" was not provided.');
            });
        });

        it("Mutation will fail if 'price' input has an invalid 'amount'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: { amount: true, currency: "USD" } }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'price' input has an invalid 'currency'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { productId: "${id}", price: { amount: ${originalPrice - 1000}, currency: true } }) {
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
                        price: { 
                            amount: ${originalPrice - 1000}, 
                            currency: "USD"
                        }
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Invalid Aptean Id");
                });
            });
        });;

        it("Mutation will succeed with valid 'productId' and 'price' inputs", () => {
            const newPrice = { 
                amount: originalPrice - Cypress._.random(1000, 5000), 
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(input: { 
                    productId: "${id}", 
                    price: ${toFormattedString(newPrice)}
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.confirmMutationSuccess(res, mutationName, itemPath, ["price"], [newPrice]).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                priceInformation {
                                    price {
                                        amount
                                        currency
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, ["priceInformation"], [{price: newPrice}]);
                });
            });
        });
    });
});