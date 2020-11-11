/// <reference types="cypress" />
// TEST COUNT: 9
describe('Mutation: createDiscount', () => {
    let id = '';
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

    afterEach(() => {
        if (id !== "") {
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

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail without 'discountAmount' input", () => {
        const name = `Cypress ${mutationName} no discountAmount`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${name}" }) {
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
            ${mutationName}(input: { name: "${name}", discountAmount: ${toInputString(discountAmount)}}) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "discountAmount"];
            const propValues = [name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
                    discountAmount: ${toInputString(discountAmount)}
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
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["customData", "name", "discountAmount"];
            const propValues = [customData, name, discountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const queryName = "discounts";
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    // TODO: productIds test

    // TODO: categoryIds test

    // TODO: manufacturerIds test

    it("Mutation creates item that has all included input", () => {
        const isCumulative = Cypress._.random(0, 1) === 1;
        const requiresCouponCode = Cypress._.random(0, 1) === 1;
        const couponCode = requiresCouponCode ? Cypress._.random(0, 1e5) : null;
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
                    discountAmount: ${toInputString(discountAmount)}
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
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "discountLimitationCount", "applyDiscountToSubCategories", "name", "discountAmount", "maximumDiscountAmount"];
            const propValues = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, discountLimitationCount, applyDiscountToSubCategories, name, newDiscountAmount, maximumDiscountAmount];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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