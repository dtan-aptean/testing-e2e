/// <reference types="cypress" />
// TEST COUNT: 10
// request count: 11
describe('Muation: createDiscount', () => {
    let id = '';
    const mutationName = 'createDiscount';
    const dataPath = 'discount';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
        }
    `;

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

    it("Mutation with valid 'Name' input will create a new item", () => {
        const name = "Cypress API Discount";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, ["name"], [name]);
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress Discount customData";
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["name", "customData"];
            const testValues = [name, customData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues).then(() => {
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

    it("Mutation with input usePercentageForDiscount=false and discountPercentage>0 will fail", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    usePercentageForDiscount: false
                    discountPercentage: 20
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
                    name
                }
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with input usePercentageForDiscount = false and discountPercentage = 0 will succeed", () => {
        const usePercentageForDiscount = false;
        const discountPercentage = 0;
        const name = "Cypress Discount Percent Test v2";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    usePercentageForDiscount: ${usePercentageForDiscount}
                    discountPercentage: ${discountPercentage}
                    name: "${name}"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    usePercentageForDiscount
                    discountPercentage
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["usePercentageForDiscount", "discountPercentage", "name"];
            const testValues = [usePercentageForDiscount, discountPercentage, name];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues);
        });
    });

    it("Mutation with input usePercentageForDiscount=false and discountPercentage>0 will fail", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    usePercentageForDiscount: true
                    discountPercentage: 0
                    name: "Cypress Discount Percent Test v3"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    usePercentageForDiscount
                    discountPercentage
                    name
                }
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with input usePercentageForDiscount = false and discountPercentage = 0 will succeed", () => {
        const usePercentageForDiscount = true;
        const discountPercentage = 15;
        const name = "Cypress Discount Percent Test v4";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    usePercentageForDiscount: ${usePercentageForDiscount}
                    discountPercentage: ${discountPercentage}
                    name: "${name}"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    usePercentageForDiscount
                    discountPercentage
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["usePercentageForDiscount", "discountPercentage", "name"];
            const testValues = [usePercentageForDiscount, discountPercentage, name];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues);
        });
    });

    it("Mutation creates item that has all included input", () => {
        const isCumulative = Cypress._.random(0, 1) === 1;
        const requiresCouponCode = Cypress._.random(0, 1) === 1;
        const couponCode = requiresCouponCode ? Cypress._.random(0, 1e5) : null;
        const usePercentageForDiscount = Cypress._.random(0, 1) === 1;
        const discountPercentage = usePercentageForDiscount ? Cypress._.random(1, 20) : 0;
        const discountLimitationCount = Cypress._.random(1, 5);
        const applyDiscountToSubCategories = Cypress._.random(0, 1) === 1;
        const name = "Cypress Discount Input";
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
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["isCumulative", "requiresCouponCode", "couponCode", "usePercentageForDiscount", "discountPercentage", "discountLimitationCount", "applyDiscountToSubCategories", "name"];
            const values = [isCumulative, requiresCouponCode, couponCode, usePercentageForDiscount, discountPercentage, discountLimitationCount, applyDiscountToSubCategories, name];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});