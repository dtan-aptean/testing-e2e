/// <reference types="cypress" />
// TEST COUNT: 6
// request count: 7
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
                ${mutationName} {
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
                    discountLimitationCount
                    applyDiscountToSubCategories
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

    // TODO: Need test for if(usePercentageDiscount) {discountPercentage > 0) else {discountPercentage == 0)
});