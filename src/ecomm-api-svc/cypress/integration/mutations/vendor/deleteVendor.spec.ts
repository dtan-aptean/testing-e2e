/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteVendor', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[]; 
    const mutationName = 'deleteVendor';
    const creationName = 'createVendor';
    const queryName = "vendors";
    const infoName = 'vendorInfo';
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
                const infoName = extraIds[i].queryName === "products" ? "productInfo" : null;
                cy.safeDelete(extraIds[i].queryName, extraIds[i].deleteName, extraIds[i].itemId, extraIds[i].itemName, infoName);
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
                    code
                    message
                    error
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
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName).then((erRes) => {
                            const errorMessage = erRes.body.errors[0].message;
                            expect(errorMessage).to.contain("Vendor is Associated with Products");
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