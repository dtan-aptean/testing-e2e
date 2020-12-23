/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 13
describe('Mutation: createDiscount', () => {
    let id = '';
    let extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'createDiscount';
    const queryName = "discounts";
    const dataPath = 'discount';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
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
            const deletionName = "deleteDiscount";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, dataPath).then(() => {
                id = "";
            });
        }
    });
    
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
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "discountAmount"];
            const propValues = [name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress Discount customData";
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const customData = {data: `${dataPath} customData`, canDelete: true};
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
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["customData", "name", "discountAmount"];
            const propValues = [customData, name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
                ${dataPath} {
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
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
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
                ${dataPath} {
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
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation with 'productIds' input will successfully create a discount with attached products", () => {
        const productOne = {productInfo: [{ name:`Cypress ${mutationName} product 1`, shortDescription: "desc", languageCode: "Standard"}], inventoryInformation : {minimumStockQuantity: 5}};
        cy.createAndGetId("createProduct", "product", toFormattedString(productOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteProduct"});
            productOne.id = returnedId;
            const products = [productOne];
            const productIds = [returnedId];
            const productTwo = {productInfo: [{ name: `Cypress ${mutationName} product 2`, shortDescription: "desc", languageCode: "Standard"}], inventoryInformation : {minimumStockQuantity: 5} };
            cy.createAndGetId("createProduct", "product", toFormattedString(productTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteProduct"});
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
                        ${dataPath} {
                            id
                            discountAmount {
                                amount
                                currency
                            }
                            products {
                                productInfo {
                                    name
                                    shortDescription
                                    languageCode
                                }
                                id
                                inventoryInformation {
                                    minimumStockQuantity
                                }
                            }
                            discountType
                            name
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = ["name", "discountType", "discountAmount", "products"];
                    const propValues = [name, discountType, discountAmount, products];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
                                            shortDescription
                                            languageCode
                                        }
                                        id
                                        inventoryInformation {
                                            minimumStockQuantity
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

    it("Mutation with 'categoryIds' input will successfully create a discount with attached categories", () => {
        const categoryOne = { categoryInfo: [{ name:`Cypress ${mutationName} category 1`, languageCode: "Standard" }] };
        cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCategory"});
            categoryOne.id = returnedId;
            const categories = [categoryOne];
            const categoryIds = [returnedId];
            const categoryTwo = {categoryInfo: [{name: `Cypress ${mutationName} category 2`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteCategory"});
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
                        ${dataPath} {
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
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = ["categories", "name", "discountType", "discountAmount"];
                    const propValues = [categories, name, discountType, discountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
            extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer"});
            manufacturerOne.id = returnedId;
            const manufacturers = [manufacturerOne];
            const manufacturerIds = [returnedId];
            const manufacturerTwo = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 2`, languageCode: "Standard" }] };
            cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteManufacturer"});
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
                        ${dataPath} {
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
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = ["manufacturers", "name", "discountType", "discountAmount"];
                    const propValues = [manufacturers, name, discountType, discountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation creates item that has all included input", () => {
        const isCumulative = Cypress._.random(0, 1) === 1;
        const requiresCouponCode = Cypress._.random(0, 1) === 1;
        const couponCode = requiresCouponCode ? `A${Cypress._.random(0, 1e5)}` : null;
        const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
        const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
        const discountAmount = {
            amount: usePercentageForDiscount ? Cypress._.random(1, 20) : 0,
            currency: "USD"
        };
        const discountLimitationCount = Cypress._.random(1, 5);
        const applyDiscountToSubCategories = Cypress._.random(0, 1) === 1;
        const name = "Cypress Discount Input";
        const maximumDiscountAmount = {
            amount: Cypress._.random(100, 2000),
            currency: "USD"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    isCumulative: ${isCumulative}
                    requiresCouponCode: ${requiresCouponCode}
                    couponCode: "${couponCode}"
                    usePercentageForDiscount: ${usePercentageForDiscount}
                    discountPercentage: ${discountPercentage}
                    discountLimitationCount: ${discountLimitationCount}
                    applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                    name: "${name}"
                    discountAmount: ${toFormattedString(discountAmount)}
                    maximumDiscountAmount: ${toFormattedString(maximumDiscountAmount)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    isCumulative
                    requiresCouponCode
                    couponCode
                    usePercentageForDiscount
                    discountPercentage
                    discountLimitationCount
                    applyDiscountToSubCategories
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "discountLimitationCount", "applyDiscountToSubCategories", "name", "discountAmount", "maximumDiscountAmount"];
            const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, discountLimitationCount, applyDiscountToSubCategories, name, discountAmount, maximumDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
                            discountLimitationCount
                            applyDiscountToSubCategories
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