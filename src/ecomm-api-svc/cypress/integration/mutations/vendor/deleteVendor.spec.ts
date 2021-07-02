/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 6
describe('Mutation: deleteVendor', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[]; 
    const mutationName = 'deleteVendor';
    const createName = 'createVendor';
    const queryName = "vendors";
    const infoName = 'vendorInfo';

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

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems("products", "deleteProduct", "productInfo", `Cypress ${mutationName}`).then(() => {
            cy.deleteCypressItems(queryName, mutationName, infoName);
        });
    })

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, "vendor", input).then((returnedId: string) => {
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
            cy.safeDelete(queryName, mutationName, id, currentItemName, infoName).then(() => {
                updateIdAndName();
            });
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, codeMessageError);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, codeMessageError);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, codeMessageError);
        });

        it("Mutation will succeed with valid 'id' input from an existing item", () => {
            cy.mutationBasicDelete(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            cy.mutationAlreadyDeleted(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });
    });

    context("Testing deletion when connected to other items or features", () => {
        // TODO: Failing because vendor is being deleted. Find out if this test case is still accurate
        it("A vendor connected to a product cannot be deleted until the connected product is deleted", () => {
            const extraDeleteName = "deleteProduct";
            const extraMutationName = "createProduct";
            const extraItemPath = "product";
            const extraQueryName = "products";
            const productInfoName = "productInfo";
            const vendor = {id: id, vendorInfo: [{name: currentItemName, languageCode: "Standard"}]};
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        vendorId: "${id}"
                    }
                ) {
                    ${codeMessageError}
                    ${extraItemPath} {
                        id
                        vendor {
                            id
                            vendorInfo {
                                name
                                languageCode
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
                const propNames = ["vendor", productInfoName];
                const propValues = [vendor, info];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                vendor {
                                    id
                                    vendorInfo {
                                        name
                                        languageCode
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
                                ${codeMessageError}
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName).then((erRes) => {
                            const errorMessage = erRes.body.data[mutationName].errors[0].message;
                            expect(errorMessage).to.contain("Vendor is Associated with Products");
                            const deleteExtra = `mutation {
                                ${extraDeleteName}(input: { id: "${productId}" }) {
                                    ${codeMessageError}
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