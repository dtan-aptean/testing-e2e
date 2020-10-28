/// <reference types="cypress" />
// TEST COUNT: 5
// request count: 5
describe('Muation: createCheckoutAttribute', () => {
    let id = '';
    const mutationName = 'createCheckoutAttribute';
    const dataPath = 'checkoutAttribute';
    // TODO: Error saying value required. Update if Backend devs confirm that
    const standardMutationBody = `
        code
        message
        error
        checkoutAttribute {
            id
            name
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

    it("Mutation with valid 'Name' input will create a new item", () => {
        const name = "Cypress API Checkout Attribute";
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
    
    it("Mutation creates item that has all included input", () => {
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress CheckoutAttribute Input";
        const defaultValue = "Cypress CheckoutAttribute";
        const displayName = "Cypres CAI";
        const isRequired = Cypress._.random(0, 1) === 1;
        const isTaxExempt = Cypress._.random(0, 1) === 1;
        const shippableProductRequired = Cypress._.random(0, 1) === 1;
        const values = [{displayOrder: Cypress._.random(1, 20), isPreselected: Cypress._.random(0, 1) === 1, name: 'Cypress CA', priceAdjustment: {amount: Cypress._.random(1, 5), currency: "USD"}, weightAdjustment: Cypress._.random(1, 10)}];
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