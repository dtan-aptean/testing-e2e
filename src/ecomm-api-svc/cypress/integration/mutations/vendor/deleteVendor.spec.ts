/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteVendor', () => {
    let id = '';
    let currentItemName = '';
    const extraIds = [];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteVendor';
    const creationName = 'createVendor';
    const queryName = "vendors";
    const infoName = 'vendorInfo';
    const deletedMessage = "vendor";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName, undefined, infoName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
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

    it("Deleting an item connected to a product will disassociate the item from the product", () => {
        const extraMutationName = "createProduct";
        const extraDataPath = "product";
        const extraQueryName = "products";
        const productInfoName = "productInfo";
        const vendor = {id: id, vendorInfo: [{name: currentItemName, languageCode: "Standard"}]};
        const info = [{name: `Cypress ${mutationName} product test`, shortDescription: `Test for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${extraMutationName}(
                input: { 
                    ${productInfoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                    vendorId: "${id}"
                }
            ) {
                code
                message
                error
                ${extraDataPath} {
                    id
                    inventoryInformation {
                        minimumStockQuantity
                    }
                    vendor {
                        id
                        vendorInfo {
                            name
                            languageCode
                        }
                    }
                    ${productInfoName} {
                        name
                        shortDescription
                        fullDescription
                        languageCode
                    }
                }
            }
        }`;
        cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
            const productId = res.body.data[extraMutationName][extraDataPath].id;
            extraIds.push({itemId: productId, deleteName: "deleteProduct"});
            const propNames = ["vendor", productInfoName, "inventoryInformation"];
            const propValues = [vendor, info, inventoryInfo];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                const query = `{
                    ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            inventoryInformation {
                                minimumStockQuantity
                            }
                            vendor {
                                id
                                vendorInfo {
                                    name
                                    languageCode
                                }
                            }
                            ${productInfoName} {
                                name
                                shortDescription
                                fullDescription
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
                    cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                        expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                        cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                            id = '';
                            currentItemName = '';
                            const newPropValues = [null, info, inventoryInfo];
                            cy.confirmUsingQuery(query, extraQueryName, productId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });
});