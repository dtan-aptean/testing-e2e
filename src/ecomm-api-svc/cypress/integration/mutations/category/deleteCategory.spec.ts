/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 9
describe('Mutation: deleteCategory', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteCategory';
    const createName = 'createCategory';
    const queryName = "categories";
    const infoName = 'categoryInfo';

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        itemName: currentItemName, 
        infoName: infoName
    };

    var childCategories = [{name: "", id: ""}] as {name: string, id: string}[];
    var parentCatName = "";
    var parentCatId = "";

    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentItemName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    const prepChildCategory = (newCat: {name: string, id: string}) => {
        if (childCategories.length === 1 && (childCategories[0].name === "" && childCategories[0].id === "")) {
            childCategories.pop();
        }
        childCategories.push(newCat);
    };

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, mutationName, infoName);
    });

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, "category", input).then((returnedId: string) => {
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
        cy.deleteParentAndChildCat(childCategories, parentCatName, parentCatId).then(() => {
            childCategories = [{name: "", id: ""}];
            parentCatName = "";
            parentCatId = "";
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

    context("Testing parent category deletion", () => {
        it("Mutation will fail if attempting to delete a parent category with children", () => {
            const catOneName = `Cypress ${mutationName} subCat 1`;
            prepChildCategory({name: catOneName, id: ""});
            cy.createParentAndChildCat(catOneName, undefined, id).then((results) => {
                const { parentId, childId } = results;
                expect(parentId).to.be.eql(id);
                parentCatName = currentItemName;
                parentCatId = id;
                childCategories[childCategories.length - 1].id = childId;
                const catTwoName = `Cypress ${mutationName} subCat 2`;
                prepChildCategory({name: catTwoName, id: ""});
                cy.createParentAndChildCat(catTwoName, undefined, id).then((secondResults) => {
                    const { parentId, childId } = secondResults;
                    expect(parentId).to.be.eql(id);
                    childCategories[childCategories.length - 1].id = childId;
                    // Now attempt to delete the parent
                    const mutation = `mutation {
                        ${mutationName}(input: { id: "${id}" }) {
                            ${codeMessageError}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });

        it("Mutation will successfully delete parent category if all children are deleted first", () => {
            const catOneName = `Cypress ${mutationName} subCat 3`;
            prepChildCategory({name: catOneName, id: ""});
            cy.createParentAndChildCat(catOneName, undefined, id).then((results) => {
                const { parentId, childId } = results;
                expect(parentId).to.be.eql(id);
                parentCatName = currentItemName;
                parentCatId = id;
                childCategories[childCategories.length - 1].id = childId;
                const catOneId = childId;
                const catTwoName = `Cypress ${mutationName} subCat 4`;
                prepChildCategory({name: catTwoName, id: ""});
                cy.createParentAndChildCat(catTwoName, undefined, id).then((secondResults) => {
                    const { parentId, childId } = secondResults;
                    expect(parentId).to.be.eql(id);
                    childCategories[childCategories.length - 1].id = childId;
                    const catTwoId = childId;
                    // Now attempt to delete the parent
                    const mutation = `mutation {
                        ${mutationName}(input: { id: "${id}" }) {
                            ${codeMessageError}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName).then(() => {
                        // Delete childCatTwo (Just because it's easier to pop the most recent child from the array)
                        const firstDeletion = `mutation {
                            ${mutationName}(input: { id: "${catTwoId}" }) {
                                ${codeMessageError}
                            }
                        }`;
                        const queryInfoOne = {
                            queryName: queryName, 
                            itemId: catTwoId,
                            itemName: catTwoName, 
                            infoName: infoName
                        };
                        cy.postAndConfirmDelete(firstDeletion, mutationName, queryInfoOne).then(() => {
                            childCategories.pop();
                            // Now attempt to delete the parent again
                            cy.postAndConfirmMutationError(mutation, mutationName).then(() => {
                                // Delete childCatOne
                                const secondMutation = `mutation {
                                    ${mutationName}(input: { id: "${catOneId}" }) {
                                        ${codeMessageError}
                                    }
                                }`;
                                const queryInfoTwo = {
                                    queryName: queryName, 
                                    itemId: catOneId,
                                    itemName: catOneName, 
                                    infoName: infoName
                                };
                                cy.postAndConfirmDelete(secondMutation, mutationName, queryInfoTwo).then(() => {
                                    childCategories.pop();
                                    // Now attempt to delete the parent again. Should pass this time
                                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                                        updateIdAndName();
                                        parentCatName = "";
                                        parentCatId = "";
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
                    ${codeMessageError}
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
                                ${codeMessageError}
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
                    ${codeMessageError}
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
                                ${codeMessageError}
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