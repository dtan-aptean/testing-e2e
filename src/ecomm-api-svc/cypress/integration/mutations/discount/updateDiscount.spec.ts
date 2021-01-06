/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 19
describe('Mutation: updateDiscount', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    let discountAmount = '';
    const mutationName = 'updateDiscount';
    const queryName = "discounts";
    const dataPath = 'discount';
    const additionalFields = `discountAmount {
        amount
        currency
    }`;
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
            ${additionalFields}
        }
    `;
    const createName = 'createDiscount';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", discountAmount: {amount: 15, currency: "USD"}}`;
        cy.createAndGetId(createName, dataPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.discountAmount);
            id = createdItem.id;
            discountAmount = createdItem.discountAmount;
        });
    });

    after(() => {
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
            }
            // Delete the item we've been updating
            const deletionName = "deleteDiscount";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName);
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

    it("Mutation will fail if the only input provided is 'id'", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with no 'Name' input", () => {
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    discountAmount: ${toFormattedString(discountAmount)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: 7, discountAmount: ${toFormattedString(discountAmount)} }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail without 'discountAmount' input", () => {
        const newName = `Cypress ${mutationName} no discountAmount`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'id', 'name', 'discountAmount' input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const newDiscountAmount = {
            amount: discountAmount.amount + Cypress._.random(1, 5),
            currency: "USD"
        };
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}", discountAmount: ${toFormattedString(newDiscountAmount)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "discountAmount"];
            const propValues = [newName, newDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

    it("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const newDiscountAmount = {
            amount: discountAmount.amount + Cypress._.random(1, 5),
            currency: "USD"
        };
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    name: "${newName}"
                    discountAmount: ${toFormattedString(newDiscountAmount)}
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
            const propNames = ["customData", "name", "discountAmount"];
            const propValues = [customData, newName, newDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

    it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
        const name = `Cypress ${mutationName} customData extra`;
        const customData = {data: `${dataPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
        const extraDiscountAmount = {
            amount: Cypress._.random(1, 5),
            currency: "USD"
        };
        const input = `{name: "${name}", discountAmount: ${toFormattedString(extraDiscountAmount)}, customData: ${toFormattedString(customData)}}`;
        cy.createAndGetId(createName, dataPath, input, "customData").then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.customData);
            extraIds.push({itemId: createdItem.id, deleteName: "deleteDiscount"});
            const newName = `Cypress ${mutationName} CD extra updated`;
            const newCustomData = {data: `${dataPath} customData`, newDataField: { canDelete: true }};
            const newDiscountAmount = {
                amount: extraDiscountAmount.amount + Cypress._.random(1, 5),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${createdItem.id}"
                        name: "${newName}"
                        discountAmount: ${toFormattedString(newDiscountAmount)}
                        customData: ${toFormattedString(newCustomData)}
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
                const propNames = ["customData", "name", "discountAmount"];
                const propValues = [newCustomData, newName, newDiscountAmount];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                customData
                            }
                        }
                    }`;
                    cy.postAndCheckCustom(query, queryName, id, newCustomData);
                });
            });
        });
    });

    it("Mutation with input 'usePercentageForDiscount'=true but no 'maximumDiscountAmount' input will fail", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    usePercentageForDiscount: true
                    discountPercentage: 20
                    discountAmount: {
                        amount: 0,
                        currency: "USD"
                    }
                    name: "Cypress updateDiscount Percent Test v1"
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
        cy.postAndConfirmError(mutation, mutationName, dataPath);
    });

    it("Mutation with input 'usePercentageForDiscount'=true but no 'discountPercentage' input will fail", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    usePercentageForDiscount: true
                    maximumDiscountAmount: {
                        amount: 2000,
                        currency: "USD"
                    }
                    discountAmount: {
                        amount: 0,
                        currency: "USD"
                    }
                    name: "Cypress updateDiscount Percent Test v2"
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

    it("Mutation with 'productIds' input will successfully attach the products", () => {
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
                updateCount++;
                const newName = `Cypress ${mutationName} Update ${updateCount}`;
                const newDiscountAmount = {
                    amount: discountAmount.amount + Cypress._.random(1, 5),
                    currency: "USD"
                };
                const discountType = "ASSIGNED_TO_PRODUCTS";
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount: ${toFormattedString(newDiscountAmount)}
                            productIds: ${toFormattedString(productIds)}
                            name: "${newName}"
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
                    const propNames = ["name", "discountType", "discountAmount", "products"];
                    const propValues = [newName, discountType, newDiscountAmount, products];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

    it("Mutation with 'categoryIds' input will successfully attach the categories", () => {
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
                updateCount++;
                const newName = `Cypress ${mutationName} Update ${updateCount}`;
                const newDiscountAmount = {
                    amount: discountAmount.amount + Cypress._.random(1, 5),
                    currency: "USD"
                };
                const discountType = "ASSIGNED_TO_CATEGORIES";
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount: ${toFormattedString(newDiscountAmount)}
                            categoryIds: ${toFormattedString(categoryIds)}
                            name: "${newName}"
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
                    const propNames = ["categories", "name", "discountType", "discountAmount"];
                    const propValues = [categories, newName, discountType, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

    it("Mutation with 'manufacturerIds' input will successfully attach the manufacturers", () => {
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
                updateCount++;
                const newName = `Cypress ${mutationName} Update ${updateCount}`;
                const newDiscountAmount = {
                    amount: discountAmount.amount + Cypress._.random(1, 5),
                    currency: "USD"
                };
                const discountType = "ASSIGNED_TO_MANUFACTURERS";
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount:${toFormattedString(newDiscountAmount)}
                            manufacturerIds: ${toFormattedString(manufacturerIds)}
                            name: "${newName}"
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
                    const propNames = ["manufacturers", "name", "discountType", "discountAmount"];
                    const propValues = [manufacturers, newName, discountType, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

    it("Mutation will create item with a discountLimitationCount of 0 if the discountLimitationType is not included", () => {
        updateCount++;
        const name = `Cypress no LimitationType #${updateCount}`;
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const discountLimitationCount = Cypress._.random(1, 5);
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    discountLimitationCount: ${discountLimitationCount}
                    name: "${name}"
                    discountAmount: ${toFormattedString(discountAmount)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
            const propValues = [0, "UNLIMITED", name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
        updateCount++;
        const name = `Cypress Nx #${updateCount}`;
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const discountLimitationCount = Cypress._.random(1, 5);
        const discountLimitationType = "N_TIMES_ONLY";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    discountLimitationCount: ${discountLimitationCount}
                    discountLimitationType: ${discountLimitationType}
                    name: "${name}"
                    discountAmount: ${toFormattedString(discountAmount)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
            const propValues = [discountLimitationCount, discountLimitationType, name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
        updateCount++;
        const name = `Cypress NxPC #${updateCount}`;
        const discountAmount = {
            amount: Cypress._.random(0, 10),
            currency: "USD"
        };
        const discountLimitationCount = Cypress._.random(1, 5);
        const discountLimitationType = "N_TIMES_PER_CUSTOMER";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    discountLimitationCount: ${discountLimitationCount}
                    discountLimitationType: ${discountLimitationType}
                    name: "${name}"
                    discountAmount: ${toFormattedString(discountAmount)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["discountLimitationCount", "discountLimitationType", "name", "discountAmount"];
            const propValues = [discountLimitationCount, discountLimitationType, name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation will correctly use all input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const isCumulative = Cypress._.random(0, 1) === 1;
        const requiresCouponCode = Cypress._.random(0, 1) === 1;
        const couponCode = requiresCouponCode ? `A${Cypress._.random(0, 1e5)}` : '';
        const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
        const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
        const applyDiscountToSubCategories = Cypress._.random(0, 1) === 1;
        const newDiscountAmount = {
            amount: discountAmount.amount + Cypress._.random(1, 5),
            currency: "USD"
        };
        const maximumDiscountAmount = {
            amount: Cypress._.random(100, 2000),
            currency: "USD"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    isCumulative: ${isCumulative}${couponCode.length > 0 ? '\n\t\t\t\t\tcouponCode: "' + couponCode + '"' : ""}
                    requiresCouponCode: ${requiresCouponCode}
                    usePercentageForDiscount: ${usePercentageForDiscount}
                    discountPercentage: ${discountPercentage}
                    applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                    name: "${newName}"
                    discountAmount: ${toFormattedString(newDiscountAmount)}
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
            const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "applyDiscountToSubCategories", "name", "discountAmount", "maximumDiscountAmount"];
            const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, applyDiscountToSubCategories, newName, newDiscountAmount, maximumDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                        nodes {
                            id
                            name
                            isCumulative
                            requiresCouponCode
                            couponCode
                            usePercentageForDiscount
                            discountPercentage
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