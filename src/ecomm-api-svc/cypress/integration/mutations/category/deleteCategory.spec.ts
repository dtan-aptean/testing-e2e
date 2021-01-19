/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 9
describe('Mutation: deleteCategory', () => {
    var id = '';
    var currentItemName = '';
    const extraIds = [] as {itemId: string, deleteName: string}[];
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
                cy.deleteItem(extraIds[i].deleteName, extraIds[i].itemId);
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName, infoName).then((itemPresent: boolean) => {
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
            cy.postAndConfirmDelete(mutation, mutationName, false).then((res) => {
                expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
                cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                    id = '';
                    currentItemName = '';
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });
    });

    context("Testing parent category deletion", () => {
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
    });

    context("Testing deletion when connected to other items or features", () => {
        it("Deleting an item connected to a discount will disassociate the item from the discount", () => {
            const extraMutationName = "createDiscount";
            const extraItemPath = "discount";
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
                    ${extraItemPath} {
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
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const discountId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: discountId, deleteName: "deleteDiscount"});
                const propNames = ["categories", "name", "discountType"];
                const propValues = [categories, name, discountType];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
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
            const extraItemPath = "product";
            const productInfoName = "productInfo";
            const categories = [{id: id, categoryInfo: [{name: currentItemName, languageCode: "Standard"}]}];
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        categoryIds: ["${id}"]
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
                extraIds.push({itemId: productId, deleteName: "deleteProduct"});
                const propNames = [productInfoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const queryBody = `id
                        categoryInfo {
                            name
                            languageCode
                        }`;
                    cy.queryByProductId("categories", queryBody, productId, categories).then(() => {
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
                                cy.queryByProductId("categories", queryBody, productId, []);
                            });
                        });
                    });
                });
            });
        });
    });
});