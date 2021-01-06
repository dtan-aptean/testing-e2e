/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteManufacturer', () => {
    let id = '';
    let currentItemName = '';
    const extraIds = [];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteManufacturer';
    const creationName = 'createManufacturer';
    const queryName = "manufacturers";
    const infoName = 'manufacturerInfo';
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
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                var extraRemoval = `mutation {
                    ${extraIds[i].deleteName}(input: { id: "${extraIds[i].itemId}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(extraRemoval, extraIds[i].deleteName);
            }
            extraIds = [];
        }
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
            expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
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
            expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                id = '';
                currentItemName = '';
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    it("Deleting an item connected to a discount will disassociate the item from the discount", () => {
        const extraMutationName = "createDiscount";
        const extraDataPath = "discount";
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
                ${extraDataPath} {
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
        cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
            const discountId = res.body.data[extraMutationName][extraDataPath].id;
            extraIds.push({itemId: discountId, deleteName: "deleteDiscount"});
            const propNames = ["manufacturers", "name", "discountType"];
            const propValues = [manufacturers, name, discountType];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
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
                    cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                        expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                        cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                            id = '';
                            currentItemName = '';
                            const newPropValues = [[], name, discountType];
                            cy.confirmUsingQuery(query, extraQueryName, discountId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });

    it("Deleting an item connected to a product will disassociate the item from the product", () => {
        const extraMutationName = "createProduct";
        const extraDataPath = "product";
        const productInfoName = "productInfo";
        const manufacturers = [{id: id, manufacturerInfo: [{name: currentItemName, languageCode: "Standard"}]}];
        const info = [{name: `Cypress ${mutationName} product test`, shortDescription: `Test for ${mutationName}`, languageCode: "Standard"}];
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
                ${extraDataPath} {
                    id
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
            const propNames = [productInfoName];
            const propValues = [info];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
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
                    cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                        expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                        cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                            id = '';
                            currentItemName = '';
                            cy.queryByProductId("manufacturers", queryBody, productId, []);
                        });
                    });
                });
            });
        });
    });
});