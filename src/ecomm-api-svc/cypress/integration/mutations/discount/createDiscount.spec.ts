/// <reference types="cypress" />

import { createInfoDummy, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 28
describe('Mutation: createDiscount', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
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

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    afterEach(() => {
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== "") {
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

        it("Mutation with requiresCouponCode = true will successfully save the couponCode", () => {
            const name = `Cypress ${mutationName} CouponCode`;
            const requiresCouponCode = true;
            const couponCode = `cCodeReq${Cypress._.random(0, 1e5)}`;
            const discountAmount = {
                amount: Cypress._.random(200, 2000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        requiresCouponCode: ${requiresCouponCode}
                        couponCode: "${couponCode}"
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        requiresCouponCode
                        couponCode
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "requiresCouponCode", "couponCode", "discountAmount"];
                const propValues = [name, requiresCouponCode, couponCode, discountAmount];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                requiresCouponCode
                                couponCode
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

        it("Mutation creates item that has all included input", () => {
            const isCumulative = Cypress._.random(0, 1) === 1;
            const requiresCouponCode = Cypress._.random(0, 1) === 1;
            const couponCode = requiresCouponCode ? `A${Cypress._.random(0, 1e5)}` : '';
            const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
            const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
            const discountAmount = {
                amount: usePercentageForDiscount ? 0 : Cypress._.random(1, 20),
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
        it("Mutation with input 'usePercentageForDiscount' = true but no 'maximumDiscountAmount' input will fail", () => {
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

        it("Mutation with input 'usePercentageForDiscount' = true but no 'discountPercentage' input will fail", () => {
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

        it("Mutation with input 'usePercentageForDiscount' = true will save the correct values", () => {
            const usePercentageForDiscount = true;
            const discountPercentage = Cypress._.random(100, 800);
            const discountAmount = {
                amount: 0,
                currency: "USD"
            };
            const inputDiscountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const maximumDiscountAmount = {
                amount: Cypress._.random(100, 2000),
                currency: "USD"
            };
            const name = `Cypress ${mutationName} Discount Percent`;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        usePercentageForDiscount: ${usePercentageForDiscount}
                        discountPercentage: ${discountPercentage}
                        name: "${name}"
                        discountAmount: ${toFormattedString(inputDiscountAmount)}
                        maximumDiscountAmount: ${toFormattedString(maximumDiscountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["usePercentageForDiscount", "discountPercentage", "maximumDiscountAmount", "discountAmount", "name"];
                const propValues = [usePercentageForDiscount, discountPercentage, maximumDiscountAmount, discountAmount, name];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
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

        it("Mutation with input 'usePercentageForDiscount'= false will save the correct values", () => {
            const usePercentageForDiscount = false;
            const discountPercentage = 0;
            const inputDiscountPercentage = Cypress._.random(100, 800);
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const inputMaximumDiscountAmount = {
                amount: Cypress._.random(100, 2000),
                currency: "USD"
            };
            const maximumDiscountAmount = {
                amount: 0,
                currency: "USD"
            };
            const name = `Cypress ${mutationName} Discount non-Percent`;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        usePercentageForDiscount: ${usePercentageForDiscount}
                        discountPercentage: ${inputDiscountPercentage}
                        name: "${name}"
                        discountAmount: ${toFormattedString(discountAmount)}
                        maximumDiscountAmount: ${toFormattedString(inputMaximumDiscountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["usePercentageForDiscount", "discountAmount", "discountPercentage", "maximumDiscountAmount", "name"];
                const propValues = [usePercentageForDiscount, discountAmount, discountPercentage, maximumDiscountAmount, name];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
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

    context("Testing 'applyDiscountToSubCategories'", () => {
        var parentCatName = "";
        var childCatName = "";
        var parentCatId = "";
        var childCatId = "";

        after(() => {
            cy.deleteParentAndChildCat({name: childCatName, id: childCatId}, parentCatName, parentCatId);
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
                const propValues = [applyDiscountToSubCategories, discountType, name, discountAmount];
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

        it("Mutation will create a discount that applies to subCategories", () => {
            childCatName = `Cypress ${mutationName} childCat`;
            parentCatName = `Cypress ${mutationName} parentCat`;
            cy.createParentAndChildCat(childCatName, parentCatName).then((results) => {
                const { parentId, childId } = results;
                parentCatId = parentId;
                childCatId = childId;
                const categories = [createInfoDummy(parentCatName, "categoryInfo", parentCatId), createInfoDummy(childCatName, "categoryInfo", childCatId)];
                const categoryIds = [parentCatId];
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
                                id
                                categoryInfo {
                                    name
                                    languageCode
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

    context("Testing 'maximumDiscountQuantity'", () => {
        it("Mutation will not save maximumDiscountQuantity when using a discountType input of 'ASSIGNED_TO_ORDER_TOTAL'", () => {
            const name = `Cypress ${mutationName} mDQ OrderTotal`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_ORDER_TOTAL";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, 0];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

        it("Mutation will not save maximumDiscountQuantity when using a discountType input of 'ASSIGNED_TO_SHIPPING'", () => {
            const name = `Cypress ${mutationName} mDQ Shipping`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_SHIPPING";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, 0];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

        it("Mutation will not save maximumDiscountQuantity when using a discountType input of 'ASSIGNED_TO_ORDER_SUBTOTAL'", () => {
            const name = `Cypress ${mutationName} mDQ OrderSubtotal`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_ORDER_SUBTOTAL";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, 0];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

        it("Mutation will successfully save the maximumDiscountQuantity with a discountType input of 'ASSIGNED_TO_CATEGORIES'", () => {
            const name = `Cypress ${mutationName} mDQ Categories`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_CATEGORIES";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, maximumDiscountQuantity];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

        it("Mutation will successfully save the maximumDiscountQuantity with a discountType input of 'ASSIGNED_TO_PRODUCTS'", () => {
            const name = `Cypress ${mutationName} mDQ Products`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_PRODUCTS";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, maximumDiscountQuantity];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

        it("Mutation will successfully save the maximumDiscountQuantity with a discountType input of 'ASSIGNED_TO_MANUFACTURERS'", () => {
            const name = `Cypress ${mutationName} mDQ Manufacturers`;
            const maximumDiscountQuantity = Cypress._.random(10, 50);
            const discountType = "ASSIGNED_TO_MANUFACTURERS";
            const discountAmount = {
                amount: Cypress._.random(1000, 10000),
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        maximumDiscountQuantity: ${maximumDiscountQuantity}
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discountAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        maximumDiscountQuantity
                        discountType
                        discountAmount {
                            amount
                            currency
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "discountAmount", "discountType", "maximumDiscountQuantity"];
                const propValues = [name, discountAmount, discountType, maximumDiscountQuantity];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                maximumDiscountQuantity
                                discountType
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

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'productIds' input will successfully create a discount with attached products", () => {
            const extraCreate = "createProduct";
            const extraPath = "product";
            const extraQuery = "products";
            const extraItemInput = {productInfo: [{ name:`Cypress ${mutationName} product`, languageCode: "Standard"}]};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            productIds: ${toFormattedString(itemIds)}
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
                    const propValues = [name, discountType, discountAmount, items];
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

        it("Mutation with 'categoryIds' input will successfully create a discount with attached categories", () => {
            const extraCreate = "createCategory";
            const extraPath = "category";
            const extraQuery = "categories";
            const extraItemInput = { categoryInfo: [{ name:`Cypress ${mutationName} category`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            categoryIds: ${toFormattedString(itemIds)}
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
                    const propValues = [items, name, discountType, discountAmount];
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

        it("Mutation with 'manufacturerIds' input will successfully create a discount with attached manufacturers", () => {
            const extraCreate = "createManufacturer";
            const extraPath = "manufacturer";
            const extraQuery = "manufacturers";
            const extraItemInput = { manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
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
                            manufacturerIds: ${toFormattedString(itemIds)}
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
                    const propValues = [items, name, discountType, discountAmount];
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