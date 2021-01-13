/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteTaxCategory', () => {
    let id = '';
    let currentItemName = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteTaxCategory';
    const creationName = 'createTaxCategory';
    const queryName = "taxCategories";
    const deletedMessage = "tax category";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
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
                        var extraRemoval = `mutation {
                            ${extraIds[i].deleteName}(input: { id: "${extraIds[i].itemId}" }) {
                                code
                                message
                                error
                            }
                        }`;
                        cy.postAndConfirmDelete(extraRemoval, extraIds[i].deleteName);
                    }
                });
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
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

    it("A taxCategory connected to a checkoutAttribute cannot be deleted until the connected checkoutAttribute is deleted", () => {
        const extraDeleteName = "deleteCheckoutAttribute";
        const extraMutationName = "createCheckoutAttribute";
        const extraDataPath = "checkoutAttribute";
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
                ${extraDataPath} {
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
        cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
            const attributeId = res.body.data[extraMutationName][extraDataPath].id;
            extraIds.push({itemId: attributeId, deleteName: extraDeleteName, itemName: name, queryName: extraQueryName});
            const propNames = ["name", "taxCategory", "values"];
            const propValues = [name, taxCategory, values];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
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
                        cy.postAndConfirmDelete(deleteExtra, extraDeleteName).then((exRes) => {
                            // connected item has been deleted, delete the taxCategory
                            cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                                    id = '';
                                    currentItemName = '';
                                });
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
        const extraDataPath = "product";
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
                ${extraDataPath} {
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
        cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
            const productId = res.body.data[extraMutationName][extraDataPath].id;
            extraIds.push({itemId: productId, deleteName: extraDeleteName, itemName: info[0].name, queryName: extraQueryName});
            const propNames = ["priceInformation", productInfoName];
            const propValues = [priceInformation, info];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
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
                        cy.postAndConfirmDelete(deleteExtra, extraDeleteName).then((exRes) => {
                            // connected item has been deleted, delete the taxCategory
                            cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                                    id = '';
                                    currentItemName = '';
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});