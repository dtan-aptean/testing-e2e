/// <reference types="cypress" />
// TEST COUNT: 7
// request count: 8
describe('Muation: createCheckoutAttribute', () => {
    let id = '';
    const mutationName = 'createCheckoutAttribute';
    const dataPath = 'checkoutAttribute';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
            values {
                name
            }
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteCheckoutAttribute";
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

    it("Mutation will fail with valid 'Name' input but no 'Values' input", () => {
        const name = "Cypress API Checkout Attribute Invalid";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postGQL(mutation).then((res) => {
            // should have errors
            assert.exists(res.body.errors);
            expect(res.body.errors[0].message).to.include("INVALID_ARGUMENT");
            expect(res.body.errors[0].message).to.include("checkout value is required");

            // Body should also have errors
            assert.notExists(res.body.data[mutationName][dataPath]);
            expect(res.body.data[mutationName].code).to.be.eql("ERROR");
            expect(res.body.data[mutationName].message).to.be.eql("Error creating checkout attribute");
        });
    });

    it("Mutation with valid 'Name' and 'Values' input will create a new item", () => {
        const name = "Cypress API Checkout Attribute";
        const values = [{name: 'Cypress CA v1'}, {name: 'Cypress CA v2'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    values: [{name: "${values[0].name}"}, {name: "${values[1].name}"}]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, ["name", "values"], [name, values]);
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress CheckoutAttribute customData";
        const values = [{name: 'Cypress CA customData'}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    values: [{name: "${values[0].name}"}]
                    customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                }
            ) {
                code
                message
                error
                ${mutationName} {
                    id
                    name
                    values {
                        name
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["name", "values", "customData"];
            const testValues = [name, values, customData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues).then(() => {
                const queryName = "checkoutAttributes";
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
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress CheckoutAttribute Input";
        const defaultValue = "Cypress CheckoutAttribute";
        const displayName = "Cypres CAI";
        const isRequired = Cypress._.random(0, 1) === 1;
        const isTaxExempt = Cypress._.random(0, 1) === 1;
        const shippableProductRequired = Cypress._.random(0, 1) === 1;
        const values = [{
            displayOrder: Cypress._.random(1, 20),
            isPreselected: Cypress._.random(0, 1) === 1,
            name: 'Cypress CA Input',
            priceAdjustment: {
                amount: Cypress._.random(1, 5),
                currency: "USD"
            },
            weightAdjustment: Cypress._.random(1, 10)
        }];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    displayOrder: ${displayOrder}
                    name: "${name}"
                    defaultValue: "${defaultValue}"
                    displayName: "${displayName}"
                    isRequired: ${isRequired}
                    isTaxExempt: ${isTaxExempt}
                    shippableProductRequired: ${shippableProductRequired}
                    values: [{displayOrder: ${values[0].displayOrder}, isPreselected: ${values[0].isPreselected}, name: "${values[0].name}", priceAdjustment: {amount: ${values[0].priceAdjustment.amount}, currency: "${values[0].priceAdjustment.currency}"}, weightAdjustment: ${values[0].weightAdjustment}}]
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    displayOrder
                    name
                    defaultValue
                    displayName
                    isRequired
                    isTaxExempt
                    shippableProductRequired
                    values {
                        displayOrder
                        isPreselected
                        name
                        priceAdjustment {
                          amount
                          currency
                        }
                        weightAdjustment
                      }
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["displayOrder", "name", "defaultValue", "displayName", "isRequired", "isTaxExempt", "shippableProductRequired", "values"];
            const testValues = [displayOrder, name, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues);
        });
    });
});