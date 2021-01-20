/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 16
describe('Mutation: createDiscount', () => {
    var id = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];
    const mutationName = 'createDiscount';
    const queryName = "discounts";
    const itemPath = 'discount';
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            name
            discountAmount {
                amount
                currency
            }
        }
    `;

    afterEach(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
            cy.deleteItem("deleteDiscount", id).then(() => {
                id = "";
            });
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            const mutation = `mutation {
                ${mutationName} {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail when input is an empty object", () => {
            const mutation = `mutation {
                ${mutationName}(input: {}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(input: { name: 7, discountAmount: ${toFormattedString(discountAmount)} }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'discountAmount' input", () => {
            const name = `Cypress ${mutationName} no discountAmount`;
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation with valid 'Name' and 'discountAmount' input will create a new item", () => {
            const name = "Cypress API Discount";
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}", discountAmount: ${toFormattedString(discountAmount)}}) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount"];
                const propValues = [name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = "Cypress Discount customData";
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        discountAmount {
                            amount
                            currency
                        }
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["customData", "name", "discountAmount"];
                const propValues = [customData, name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const queryName = "discounts";
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                customData
                            }
                        }
                    }`;
                    cy.postAndCheckCustom(query, queryName, id, customData);
                });
            });
        });

        it("Mutation creates item that has all included input", () => {
            const isCumulative = Cypress._.random(0, 1) === 1;
            const requiresCouponCode = Cypress._.random(0, 1) === 1;
            const couponCode = requiresCouponCode ? `A${Cypress._.random(0, 1e5)}` : '';
            const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
            const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
            const discountAmount = {
                amount: usePercentageForDiscount ? Cypress._.random(1, 20) : 0,
                currency: "USD"
            };
            const name = "Cypress Discount Input";
            const maximumDiscountAmount = {
                amount: usePercentageForDiscount ? Cypress._.random(100, 2000): 0,
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        isCumulative: ${isCumulative}
                        requiresCouponCode: ${requiresCouponCode}${couponCode.length > 0 ? '\n\t\t\t\t\tcouponCode: "' + couponCode + '"' : ""}
                        usePercentageForDiscount: ${usePercentageForDiscount}
                        discountPercentage: ${discountPercentage}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}${usePercentageForDiscount ? `\n\t\t\t\t\tmaximumDiscountAmount: ${toFormattedString(maximumDiscountAmount)}`: ""}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        isCumulative
                        requiresCouponCode
                        couponCode
                        usePercentageForDiscount
                        discountPercentage
                        name
                        discountAmount {
                            amount
                            currency
                        }
                        maximumDiscountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "name", "discountAmount", "maximumDiscountAmount"];
                const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, name, discountAmount, maximumDiscountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                isCumulative
                                requiresCouponCode
                                couponCode
                                usePercentageForDiscount
                                discountPercentage
                                discountAmount {
                                    amount
                                    currency
                                }
                                maximumDiscountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context("Testing 'usePercentageForDiscount'", () => {
        it("Mutation with input 'usePercentageForDiscount'=true but no 'maximumDiscountAmount' input will fail", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        usePercentageForDiscount: true
                        discountPercentage: 20
                        discountAmount: {
                            amount: 0,
                            currency: "USD"
                        }
                        name: "Cypress Discount Percent Test v1"
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        usePercentageForDiscount
                        discountPercentage
                        maximumDiscountAmount {
                            amount
                            currency
                        }
                        discountAmount {
                            amount
                            currency
                        }
                        name
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation with input 'usePercentageForDiscount'=true but no 'discountPercentage' input will fail", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        usePercentageForDiscount: true
                        maximumDiscountAmount: {
                            amount: 2000,
                            currency: "USD"
                        }
                        discountAmount: {
                            amount: 0,
                            currency: "USD"
                        }
                        name: "Cypress Discount Percent Test v2"
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        usePercentageForDiscount
                        discountPercentage
                        maximumDiscountAmount {
                            amount
                            currency
                        }
                        discountAmount {
                            amount
                            currency
                        }
                        name
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });
    });

    context("Testing 'discountLimitationCount'", () => {
        it("Mutation will create item with a discountLimitationCount of 0 if the discountLimitationType is not included", () => {
            const name = "Cypress no LimitationType";
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const discountLimitationCount = Cypress._.random(1, 5);
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        discountLimitationCount: ${discountLimitationCount}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        discountLimitationCount
                        discountLimitationType
                        name
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
                const propValues = [0, "UNLIMITED", name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountLimitationCount
                                discountLimitationType
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will create item with correct discountLimitationCount if the provided input include discountLimitationType as N_TIMES_ONLY", () => {
            const name = "Cypress N Times only";
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const discountLimitationCount = Cypress._.random(1, 5);
            const discountLimitationType = "N_TIMES_ONLY";
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        discountLimitationCount: ${discountLimitationCount}
                        discountLimitationType: ${discountLimitationType}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        discountLimitationCount
                        discountLimitationType
                        name
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
                const propValues = [discountLimitationCount, discountLimitationType, name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountLimitationCount
                                discountLimitationType
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will create item with correct discountLimitationCount if the provided input include discountLimitationType as N_TIMES_PER_CUSTOMER", () => {
            const name = "Cypress N Times PC";
            const discountAmount = {
                amount: Cypress._.random(0, 10),
                currency: "USD"
            };
            const discountLimitationCount = Cypress._.random(1, 5);
            const discountLimitationType = "N_TIMES_PER_CUSTOMER";
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        discountLimitationCount: ${discountLimitationCount}
                        discountLimitationType: ${discountLimitationType}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        discountLimitationCount
                        discountLimitationType
                        name
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
                const propValues = [discountLimitationCount, discountLimitationType, name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountLimitationCount
                                discountLimitationType
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context(("Testing 'applyDiscountToSubCategories'"), () => {
        const childCatName = `Cypress ${mutationName} childCat`;
        var parentId = "";
        var childId = "";

        after(() => {
            const categoryDelete = "deleteCategory";
            // If we know child was confirmed created, delete it.
            // Otherwise, look for it and if we find one with the parent cat attached to it, delete it
            if (childId !== "") {
                cy.deleteItem(categoryDelete, childId).then(() => {
                    childId = "";
                });
            } else if (childId === "" && parentId !== "") {
                const query = `{
                    categories(searchString: "${childCatName}", orderBy: {direction: ASC, field: NAME}) {
                        totalCount
                        nodes {
                            id
                            categoryInfo {
                              name
                              languageCode
                            }
                            parent {
                                id
                            }
                        }
                    }
                }`;
                cy.postAndValidate(query, "categories").then((res) => {
                    const cats = res.body.data.categories;
                    if (cats.totalCount > 0) {
                        const children = cats.nodes.filter((node) => {
                            return node.parent && node.parent.id === parentId;
                        });
                        if (children.length === 1) {
                            cy.deleteItem(categoryDelete, childId);
                        }
                    }
                })
            }
            // Delete the parent
            if (parentId !== "") {
                cy.deleteItem(categoryDelete, parentId).then(() => {
                    parentId = "";
                });
            }
        });

        it("Mutation will not accept 'applyDiscountToSubCategories' if the discountType isn't set to categories", () => {
            const name = `Cypress ${mutationName} wrong type`;
            const discountAmount = {
                amount: Cypress._.random(1, 200),
                currency: "USD"
            };
            const discountType = "ASSIGNED_TO_ORDER_SUBTOTAL";
            const applyDiscountToSubCategories = true;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                        discountType: ${discountType}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        discountType
                        applyDiscountToSubCategories
                        name
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["applyDiscountToSubCategories", "discountType", "name", "discountAmount"];
                const propValues = [false, discountType, name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountType
                                applyDiscountToSubCategories
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will accept 'applyDiscountToSubCategories' if the discountType is ASSIGNED_TO_CATEGORIES", () => {
            const name =`Cypress ${mutationName} cat type`;
            const discountAmount = {
                amount: Cypress._.random(1, 200),
                currency: "USD"
            };
            const discountType = "ASSIGNED_TO_CATEGORIES";
            const applyDiscountToSubCategories = true;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                        discountType: ${discountType}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        discountType
                        applyDiscountToSubCategories
                        name
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["applyDiscountToSubCategories", "discountType", "name", "discountAmount"];
                const propValues = [discountType, name, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                discountType
                                applyDiscountToSubCategories
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, ["applyDiscountToSubCategories", "discountType", "name", "discountAmount"], [applyDiscountToSubCategories, discountType, name, discountAmount]);
                });
            });
        });

        it("Mutation will create a discount that applies to subCategories", () => {
            const categoryOne = { categoryInfo: [{ name: `Cypress ${mutationName} parentCat`, languageCode: "Standard" }] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
                parentId = returnedId;
                categoryOne.id = returnedId;
                categoryOne.parent = null;
                const categories = [categoryOne];
                const categoryIds = [returnedId];
                const categoryTwo = {categoryInfo: [{name: childCatName, languageCode: "Standard"}], parentCategoryId: parentId };
                cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                    childId = secondId
                    categoryTwo.id = secondId;
                    categoryTwo.parent = categoryOne;
                    categories.push(categoryTwo);
                    const categoryBody = `id
                    categoryInfo {
                      name
                      languageCode
                    }`;
                    const name = `Cypress ${mutationName} subCategories test`;
                    const discountAmount = {
                        amount: Cypress._.random(1, 200),
                        currency: "USD"
                    };
                    const discountType = "ASSIGNED_TO_CATEGORIES";
                    const applyDiscountToSubCategories = true;
                    const mutation = `mutation {
                        ${mutationName}(
                            input: {
                                categoryIds: ${toFormattedString(categoryIds)}
                                applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                                discountType: ${discountType}
                                name: "${name}"
                                discountAmount: ${toFormattedString(discountAmount)}
                            }
                        ) {
                            code
                            message
                            error
                            ${itemPath} {
                                id
                                discountType
                                applyDiscountToSubCategories
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                                categories {
                                    ${categoryBody}
                                    parent {
                                    ${categoryBody}
                                    }
                                }
                            }
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = ["applyDiscountToSubCategories", "categories", "name", "discountType", "discountAmount"];
                        const propValues = [applyDiscountToSubCategories, categories, name, discountType, discountAmount];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                                    nodes {
                                        id
                                        discountType
                                        applyDiscountToSubCategories
                                        name
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
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        });
                    });
                });
            });
        });
    });

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'productIds' input will successfully create a discount with attached products", () => {
            const productOne = {productInfo: [{ name:`Cypress ${mutationName} product 1`, languageCode: "Standard"}]};
            cy.createAndGetId("createProduct", "product", toFormattedString(productOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteProduct", itemName: productOne.productInfo[0].name, queryName: "products"});
                productOne.id = returnedId;
                const products = [productOne];
                const productIds = [returnedId];
                const productTwo = {productInfo: [{ name: `Cypress ${mutationName} product 2`, languageCode: "Standard"}]};
                cy.createAndGetId("createProduct", "product", toFormattedString(productTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteProduct", itemName: productTwo.productInfo[0].name, queryName: "products"});
                    productTwo.id = secondId;
                    products.push(productTwo);
                    productIds.push(secondId);
                    const name = `Cypress ${mutationName} productIds test`;
                    const discountAmount = {
                        amount: Cypress._.random(1, 100),
                        currency: "USD"
                    };
                    const discountType = "ASSIGNED_TO_PRODUCTS";
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                discountAmount: ${toFormattedString(discountAmount)}
                                productIds: ${toFormattedString(productIds)}
                                name: "${name}"
                                discountType: ${discountType}
                            }
                        ) {
                            code
                            message
                            error
                            ${itemPath} {
                                id
                                discountAmount {
                                    amount
                                    currency
                                }
                                products {
                                    productInfo {
                                        name
                                        languageCode
                                    }
                                    id
                                }
                                discountType
                                name
                            }
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = ["name", "discountType", "discountAmount", "products"];
                        const propValues = [name, discountType, discountAmount, products];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                                    nodes {
                                        id
                                        discountAmount {
                                            amount
                                            currency
                                        }
                                        products {
                                            productInfo {
                                                name
                                                languageCode
                                            }
                                            id
                                        }
                                        discountType
                                        name
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        });
                    });
                });
            });
        });

        it("Mutation with 'categoryIds' input will successfully create a discount with attached categories", () => {
            const categoryOne = { categoryInfo: [{ name:`Cypress ${mutationName} category 1`, languageCode: "Standard" }] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteCategory", itemName: categoryOne.categoryInfo[0].name, queryName: "categories"});
                categoryOne.id = returnedId;
                const categories = [categoryOne];
                const categoryIds = [returnedId];
                const categoryTwo = {categoryInfo: [{name: `Cypress ${mutationName} category 2`, languageCode: "Standard"}] };
                cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteCategory", itemName: categoryTwo.categoryInfo[0].name, queryName: "categories"});
                    categoryTwo.id = secondId;
                    categories.push(categoryTwo);
                    categoryIds.push(secondId);
                    const name = `Cypress ${mutationName} categoryIds test`;
                    const discountAmount = {
                        amount: Cypress._.random(1, 100),
                        currency: "USD"
                    };
                    const discountType = "ASSIGNED_TO_CATEGORIES";
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                discountAmount: ${toFormattedString(discountAmount)}
                                categoryIds: ${toFormattedString(categoryIds)}
                                name: "${name}"
                                discountType: ${discountType}
                            }
                        ) {
                            code
                            message
                            error
                            ${itemPath} {
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
                    cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = ["categories", "name", "discountType", "discountAmount"];
                        const propValues = [categories, name, discountType, discountAmount];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
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
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        });
                    });
                });
            });
        });

        it("Mutation with 'manufacturerIds' input will successfully create a discount with attached manufacturers", () => {
            const manufacturerOne = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 1`, languageCode: "Standard" }] };
            cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer", itemName: manufacturerOne.manufacturerInfo[0].name, queryName: "manufacturers"});
                manufacturerOne.id = returnedId;
                const manufacturers = [manufacturerOne];
                const manufacturerIds = [returnedId];
                const manufacturerTwo = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 2`, languageCode: "Standard" }] };
                cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteManufacturer", itemName: manufacturerTwo.manufacturerInfo[0].name, queryName: "manufacturers"});
                    manufacturerTwo.id = secondId;
                    manufacturers.push(manufacturerTwo);
                    manufacturerIds.push(secondId); 
                    const name = `Cypress ${mutationName} manufacturerIds test`;
                    const discountAmount = {
                        amount: Cypress._.random(1, 100),
                        currency: "USD"
                    };
                    const discountType = "ASSIGNED_TO_MANUFACTURERS";
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                discountAmount:${toFormattedString(discountAmount)}
                                manufacturerIds: ${toFormattedString(manufacturerIds)}
                                name: "${name}"
                                discountType: ${discountType}
                            }
                        ) {
                            code
                            message
                            error
                            ${itemPath} {
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
                    cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = ["manufacturers", "name", "discountType", "discountAmount"];
                        const propValues = [manufacturers, name, discountType, discountAmount];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
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
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        });
                    });
                });
            });
        });
    });
});