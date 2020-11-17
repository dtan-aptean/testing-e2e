/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 9
describe('Mutation: deleteCategory', () => {
    let id = '';
    let currentItemName = '';
    const extraIds = [];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteCategory';
    const creationName = 'createCategory';
    const queryName = "categories";
    const infoName = 'categoryInfo';
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

    it("Mutation will fail if attempting to delete a parent category with children", () => {
        const additionalFields = `parent {
            id
        }`;
        const subCatOne = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 1`, languageCode: "Standard"}] };
        cy.createAndGetId("createCategory", "category", toFormattedString(subCatOne), additionalFields).then((returnedBody) => {
            assert.exists(returnedBody.id);
            extraIds.push({itemId: returnedBody.id, deleteName: "deleteCategory"});
            expect(returnedBody.parent.id).to.be.eql(id);
            const subCatTwo = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 2`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(subCatTwo), additionalFields).then((returnedData) => {
                assert.exists(returnedData.id);
                extraIds.push({itemId: returnedData.id, deleteName: "deleteCategory"});
                expect(returnedData.parent.id).to.be.eql(id);
                // Now attempt to delete the parent
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    it("Mutation will successfully delete parent category if all children are deleted first", () => {
        const additionalFields = `parent {
            id
        }`;
        const subCatOne = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 3`, languageCode: "Standard"}] };
        cy.createAndGetId("createCategory", "category", toFormattedString(subCatOne), additionalFields).then((returnedBody) => {
            assert.exists(returnedBody.id);
            const subCatOneId = returnedBody.id;
            extraIds.push({itemId: subCatOneId, deleteName: "deleteCategory"});
            expect(returnedBody.parent.id).to.be.eql(id);
            const subCatTwo = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 4`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(subCatTwo), additionalFields).then((returnedData) => {
                assert.exists(returnedData.id);
                const subCatTwoId = returnedData.id;
                extraIds.push({itemId: subCatTwoId.id, deleteName: "deleteCategory"});
                expect(returnedData.parent.id).to.be.eql(id);
                // Now attempt to delete the parent
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName).then(() => {
                    // Delete first child
                    const firstMutation = `mutation {
                        ${mutationName}(input: { id: "${subCatOneId}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(firstMutation, mutationName).then((res) => {
                        expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                        cy.queryForDeleted(true, subCatOne.categoryInfo[0].name, subCatOneId, queryName, infoName).then(() => {
                            extraIds.shift();
                            // Now attempt to delete the parent again
                            cy.postAndConfirmMutationError(mutation, mutationName).then(() => {
                                // Delete second child
                                const secondMutation = `mutation {
                                    ${mutationName}(input: { id: "${subCatTwoId}" }) {
                                        ${standardMutationBody}
                                    }
                                }`;
                                cy.postAndConfirmDelete(secondMutation, mutationName).then((res) => {
                                    expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                                    cy.queryForDeleted(true, subCatTwo.categoryInfo[0].name, subCatTwoId, queryName, infoName).then(() => {
                                        extraIds.shift();
                                        // Now attempt to delete the parent again. Should pass this time
                                        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                                            expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                                            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                                                id = '';
                                                currentItemName = '';
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                })
            });
        });
    });

    it("Deleting an item connected to a discount will disassociate the item from the discount", () => {
        const extraMutationName = "createDiscount";
        const extraDataPath = "discount";
        const extraQueryName = "discounts";
        const categories = [{id: id, categoryInfo: [{name: currentItemName, languageCode: "Standard"}]}];
        const name = `Cypress ${mutationName} discount test`;
        const discountAmount = {
            amount: Cypress._.random(1, 100),
            currency: "USD"
        };
        const discountType = "ASSIGNED_TO_CATEGORIES";
        const mutation = `mutation {
            ${extraMutationName}(
                input: { 
                    discountAmount: ${toFormattedString(discountAmount)}
                    categoryIds: ["${id}"]
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
                    categories {
                        id
                        categoryInfo {
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
            const propNames = ["categories", "name", "discountType"];
            const propValues = [categories, name, discountType];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                const query = `{
                    ${extraQueryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            discountAmount {
                                amount
                                currency
                            }
                            categories {
                                id
                                categoryInfo {
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
        const extraQueryName = "products";
        const productInfoName = "productInfo";
        const categories = [{id: id, categoryInfo: [{name: currentItemName, languageCode: "Standard"}]}];
        const info = [{name: `Cypress ${mutationName} product test`, shortDescription: `Test for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${extraMutationName}(
                input: { 
                    ${productInfoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                    categoryIds: ["${id}"]
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
                    categories {
                        id
                        categoryInfo {
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
            const propNames = ["categories", productInfoName, "inventoryInformation"];
            const propValues = [categories, info, inventoryInfo];
            cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                const query = `{
                    ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            inventoryInformation {
                                minimumStockQuantity
                            }
                            categories {
                                id
                                categoryInfo {
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
                            const newPropValues = [[], info, inventoryInfo];
                            cy.confirmUsingQuery(query, extraQueryName, productId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });
});