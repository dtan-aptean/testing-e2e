/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 19
describe('Mutation: updateDiscount', () => {
    var id = '';
    var updateCount = 0;
    var extraIds = [] as SupplementalItemRecord[];
    var discountAmount = {} as {amount: number, currency: string};
    const mutationName = 'updateDiscount';
    const queryName = "discounts";
    const itemPath = 'discount';
    const additionalFields = `discountAmount {
        amount
        currency
    }`;
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            name
            ${additionalFields}
        }
    `;
    const createName = 'createDiscount';

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", discountAmount: {amount: 15, currency: "USD"}}`;
        cy.createAndGetId(createName, itemPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.discountAmount);
            id = createdItem.id;
            discountAmount = createdItem.discountAmount;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds);
            // Delete the item we've been updating
            cy.deleteItem("deleteDiscount", id);
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

        it("Mutation will fail if the only input provided is 'id'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
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
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
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
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "discountAmount"];
                const propValues = [newName, newDiscountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const newDiscountAmount = {
                amount: discountAmount.amount + Cypress._.random(1, 5),
                currency: "USD"
            };
            const customData = {data: `${itemPath} customData`, canDelete: true};
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
                const propNames = ["customData", "name", "discountAmount"];
                const propValues = [customData, newName, newDiscountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const extraDiscountAmount = {
                amount: Cypress._.random(1, 5),
                currency: "USD"
            };
            const input = `{name: "${name}", discountAmount: ${toFormattedString(extraDiscountAmount)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: "deleteDiscount", itemName: name, queryName: queryName});
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
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
                    const propNames = ["customData", "name", "discountAmount"];
                    const propValues = [newCustomData, newName, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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

        it("Mutation will correctly use all input", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const isCumulative = Cypress._.random(0, 1) === 1;
            const requiresCouponCode = Cypress._.random(0, 1) === 1;
            const couponCode = requiresCouponCode ? `A${Cypress._.random(0, 1e5)}` : '';
            const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
            const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
            const newDiscountAmount = {
                amount: discountAmount.amount + Cypress._.random(1, 5),
                currency: "USD"
            };
            const maximumDiscountAmount = {
                amount: usePercentageForDiscount ? Cypress._.random(100, 2000): 0,
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
                        name: "${newName}"
                        discountAmount: ${toFormattedString(newDiscountAmount)}${usePercentageForDiscount ? `\n\t\t\t\t\tmaximumDiscountAmount: ${toFormattedString(maximumDiscountAmount)}`: ""}
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "name", "discountAmount", "maximumDiscountAmount"];
                const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, newName, newDiscountAmount, maximumDiscountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
            cy.postAndConfirmError(mutation, mutationName, itemPath);
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
        var parentId = "";
        var childId = "";

        afterEach(() => {
            const categoryDelete = "deleteCategory"
            if (childId !== "") {
                var deleteMut = `mutation {
                    ${categoryDelete}(input: { id: "${childId}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(deleteMut, categoryDelete).then(() => {
                    childId = "";
                });
            }
            if (parentId !== "") {
                var deleteMut = `mutation {
                    ${categoryDelete}(input: { id: "${parentId}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(deleteMut, categoryDelete).then(() => {
                    parentId = "";
                });
            }
        });

        it("Mutation will not accept 'applyDiscountToSubCategories' if the discountType isn't set to categories", () => {
            // TODO
        });

        it("Mutation will accept 'applyDiscountToSubCategories' if the discountType is ASSIGNED_TO_CATEGORIES", () => {
            // TODO
        });

        it("Mutation will create a discount that applies to subCategories", () => {
            // TODO
        });
    });

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'productIds' input will successfully attach the products", () => {
           const extraCreate = "createProduct";
            const extraPath = "product";
            const extraQuery = "products";
            const extraItemInput = {productInfo: [{ name:`Cypress ${mutationName} product`, languageCode: "Standard"}]};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            productIds: ${toFormattedString(itemIds)}
                            name: "${newName}"
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
                    const propNames = ["name", "discountType", "discountAmount", "products"];
                    const propValues = [newName, discountType, newDiscountAmount, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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

        it("Mutation with 'categoryIds' input will successfully attach the categories", () => {
            const extraCreate = "createCategory";
            const extraPath = "category";
            const extraQuery = "categories";
            const extraItemInput = { categoryInfo: [{ name:`Cypress ${mutationName} category`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            categoryIds: ${toFormattedString(itemIds)}
                            name: "${newName}"
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
                    const propNames = ["categories", "name", "discountType", "discountAmount"];
                    const propValues = [items, newName, discountType, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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

        it("Mutation with 'manufacturerIds' input will successfully attach the manufacturers", () => {
            const extraCreate = "createManufacturer";
            const extraPath = "manufacturer";
            const extraQuery = "manufacturers";
            const extraItemInput = { manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            manufacturerIds: ${toFormattedString(itemIds)}
                            name: "${newName}"
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
                    const propNames = ["manufacturers", "name", "discountType", "discountAmount"];
                    const propValues = [items, newName, discountType, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
});