/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 9
describe('Mutation: deleteCategory', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];
    const mutationName = 'deleteCategory';
    const createName = 'createCategory';
    const queryName = "categories";
    const infoName = 'categoryInfo';
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
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, "category", input).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
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
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
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

    context("Testing parent category deletion", () => {
        it("Mutation will fail if attempting to delete a parent category with children", () => {
            const additionalFields = `parent {
                id
            }`;
            const subCatOne = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 1`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(subCatOne), additionalFields).then((returnedBody) => {
                assert.exists(returnedBody.id);
                extraIds.push({itemId: returnedBody.id, deleteName: mutationName, itemName: subCatOne.categoryInfo[0].name, queryName: queryName});
                expect(returnedBody.parent.id).to.be.eql(id);
                const subCatTwo = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 2`, languageCode: "Standard"}] };
                cy.createAndGetId("createCategory", "category", toFormattedString(subCatTwo), additionalFields).then((returnedData) => {
                    assert.exists(returnedData.id);
                    extraIds.push({itemId: returnedData.id, deleteName: mutationName, itemName: subCatTwo.categoryInfo[0].name, queryName: queryName});
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
                extraIds.push({itemId: subCatOneId, deleteName: mutationName, itemName: subCatOne.categoryInfo[0].name, queryName: queryName});
                expect(returnedBody.parent.id).to.be.eql(id);
                const subCatTwo = {parentCategoryId: id, categoryInfo: [{name: `Cypress ${mutationName} subCat 4`, languageCode: "Standard"}] };
                cy.createAndGetId("createCategory", "category", toFormattedString(subCatTwo), additionalFields).then((returnedData) => {
                    assert.exists(returnedData.id);
                    const subCatTwoId = returnedData.id;
                    extraIds.push({itemId: subCatTwoId.id, deleteName: mutationName, itemName: subCatTwo.categoryInfo[0].name, queryName: queryName});
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
                        const queryInfoOne = {
                            queryName: queryName, 
                            itemId: subCatOneId, 
                            itemName: subCatOne.categoryInfo[0].name, 
                            infoName: infoName
                        };
                        cy.postAndConfirmDelete(firstMutation, mutationName, queryInfoOne).then(() => {
                            extraIds.shift();
                            // Now attempt to delete the parent again
                            cy.postAndConfirmMutationError(mutation, mutationName).then(() => {
                                // Delete second child
                                const secondMutation = `mutation {
                                    ${mutationName}(input: { id: "${subCatTwoId}" }) {
                                        ${standardMutationBody}
                                    }
                                }`;
                                const queryInfoTwo = {
                                    queryName: queryName, 
                                    itemId: subCatTwoId,
                                    itemName: subCatTwo.categoryInfo[0].name, 
                                    infoName: infoName
                                };
                                cy.postAndConfirmDelete(secondMutation, mutationName, queryInfoTwo).then(() => {
                                    extraIds.shift();
                                    // Now attempt to delete the parent again. Should pass this time
                                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                                        updateIdAndName();
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
                extraIds.push({itemId: discountId, deleteName: "deleteDiscount", itemName: name, queryName: extraQueryName});
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
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            updateIdAndName();
                            const newPropValues = [[], name, discountType];
                            cy.confirmUsingQuery(query, extraQueryName, discountId, propNames, newPropValues);
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
                extraIds.push({itemId: productId, deleteName: "deleteProduct", itemName: info[0].name, queryName: "products"});
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
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            updateIdAndName();
                            cy.queryByProductId("categories", queryBody, productId, []);
                        });
                    });
                });
            });
        });
    });
});