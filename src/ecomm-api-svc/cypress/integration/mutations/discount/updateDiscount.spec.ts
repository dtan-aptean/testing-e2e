/// <reference types="cypress" />
// TEST COUNT: 13
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
    // Function to turn an object or array into a string to use as input
    function toInputString(item) {
        function iterateThrough (propNames?: string[]) {
            var returnValue = '';
            for (var i = 0; i < (propNames ? propNames.length : item.length); i++) {
                if (i !== 0) {
                    returnValue = returnValue + ', ';
                }
                var value = propNames ? item[propNames[i]]: item[i];
                if (typeof value === 'string') {
                    value = `"${value}"`;
                } else if (typeof value === 'object') {
                    // Arrays return as an object, so this will get both
                    value = toInputString(value);
                }
                returnValue = returnValue + (propNames ? `${propNames[i]}: ${value}`: value);
            }
            return returnValue;
        };
        var itemAsString = '{ ';
        var props = undefined;
        if (item === null) {
            return "null";
        } else if (item === undefined) {
            return "undefined";
        } else if (Array.isArray(item)) {
            itemAsString = '[';
        } else if (typeof item === 'object') {
            props = Object.getOwnPropertyNames(item);
        }
        itemAsString = itemAsString + iterateThrough(props) + (props ? ' }' : ']');
        return itemAsString;
    };

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
            ${mutationName}(input: { id: "${id}", name: "${newName}", discountAmount: ${toInputString(newDiscountAmount)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "discountAmount"];
            const propValues = [newName, newDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
                    discountAmount: ${toInputString(newDiscountAmount)}
                    customData: ${toInputString(customData)}
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
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        const productOne = {productInfo: { name:`Cypress ${dataPath} product 1`, shortDescription: "desc", languageCode: "Standard"}, inventoryInformation : {minimumStockQuantity: 5}};
        cy.createAndGetId("createProduct", "product", toInputString(productOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteProduct"});
            productOne.id = returnedId;
            const products = [productOne];
            const productIds = [returnedId];
            const productTwo = {productInfo: { name: `Cypress ${dataPath} product 2`, shortDescription: "desc", languageCode: "Standard"}, inventoryInformation : {minimumStockQuantity: 5} };
            cy.createAndGetId("createProduct", "product", toInputString(productTwo)).then((secondId: string) => {
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
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount: ${toInputString(newDiscountAmount)}
                            productIds: ${toInputString(productIds)}
                            name: "${newName}"
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
                            name
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    const propNames = ["name", "discountAmount", "products"];
                    const propValues = [newName, newDiscountAmount, products];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        const categoryOne = { categoryInfo: { name:`Cypress ${dataPath} category 1`, languageCode: "Standard" } };
        cy.createAndGetId("createCategory", "category", toInputString(categoryOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCategory"});
            categoryOne.id = returnedId;
            const categories = [categoryOne];
            const categoryIds = [returnedId];
            const categoryTwo = {categoryInfo: {name: `Cypress ${dataPath} category 2`, languageCode: "Standard"} };
            cy.createAndGetId("createCategory", "category", toInputString(categoryTwo)).then((secondId: string) => {
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
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount: ${toInputString(newDiscountAmount)}
                            categoryIds: ${toInputString(categoryIds)}
                            name: "${newName}"
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
                            name
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    const propNames = ["categories", "name", "discountAmount"];
                    const propValues = [categories, newName, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        const manufacturerOne = {manufacturerInfo: { name: `Cypress ${dataPath} manufacturer 1`, languageCode: "Standard" } };
        cy.createAndGetId("createManufacturer", "manufacturer", toInputString(manufacturerOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer"});
            manufacturerOne.id = returnedId;
            const manufacturers = [manufacturerOne];
            const manufacturerIds = [returnedId];
            const manufacturerTwo = {manufacturerInfo: { name: `Cypress ${dataPath} manufacturer 2`, languageCode: "Standard" } };
            cy.createAndGetId("createManufacturer", "manufacturer", toInputString(manufacturerTwo)).then((secondId: string) => {
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
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountAmount:${toInputString(newDiscountAmount)}
                            manufacturerIds: ${toInputString(manufacturerIds)}
                            name: "${newName}"
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
                            name
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    const propNames = ["manufacturers", "name", "discountAmount"];
                    const propValues = [manufacturers, newName, newDiscountAmount];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation will correctly use all input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const isCumulative = Cypress._.random(0, 1) === 1;
        const requiresCouponCode = Cypress._.random(0, 1) === 1;
        const couponCode = requiresCouponCode ? Cypress._.random(0, 1e5) : null;
        const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
        const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
        const discountLimitationCount = Cypress._.random(1, 5);
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
                    isCumulative: ${isCumulative}
                    requiresCouponCode: ${requiresCouponCode}
                    couponCode: "${couponCode}"
                    usePercentageForDiscount: ${usePercentageForDiscount}
                    discountPercentage: ${discountPercentage}
                    discountLimitationCount: ${discountLimitationCount}
                    applyDiscountToSubCategories: ${applyDiscountToSubCategories}
                    name: "${newName}"
                    discountAmount: ${toInputString(newDiscountAmount)}
                    maximumDiscountAmount: ${toInputString(maximumDiscountAmount)}
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
            const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "discountLimitationCount", "applyDiscountToSubCategories", "name", "discountAmount", "maximumDiscountAmount"];
            const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, discountLimitationCount, applyDiscountToSubCategories, newName, newDiscountAmount, maximumDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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