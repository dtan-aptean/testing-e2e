/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10
describe('Mutation: createCheckoutAttribute', () => {
    let id = '';
    const mutationName = 'createCheckoutAttribute';
    const queryName = "checkoutAttributes";
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
    let taxCategoryId = '';

    afterEach(() => {
        if (taxCategoryId !== "") {
            const taxDeletionName = "deleteTaxCategory";
            const taxRemovalMutation = `mutation {
                ${taxDeletionName}(input: { id: "${taxCategoryId}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(taxRemovalMutation, taxDeletionName, "taxCategory").then(() => {
                taxCategoryId = "";
            });
            cy.wait(1000);
        }
        if (id !== "") {
            const deletionName = "deleteCheckoutAttribute";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName).then(() => {
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
        const values = [{name: 'Cypress CA v1'}, {name: 'Cypress CA v2'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    values: ${toFormattedString(values)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
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

    it("Mutation will fail with invalid 'Values' input", () => {
        const name = "Cypress API Checkout Attribute Invalid values";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}", values: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with valid 'Name' and 'Values' input will create a new item", () => {
        const name = "Cypress API Checkout Attribute";
        const values = [{name: 'Cypress CA v1'}, {name: 'Cypress CA v2'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    values: ${toFormattedString(values)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "values"];
            const propValues = [name, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                        nodes {
                            id
                            name
                            values {
                                name
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
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
                    values: ${toFormattedString(values)}
                    customData: ${toFormattedString(customData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
            const propNames = ["customData", "name", "values"];
            const propValues = [customData, name, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const queryName = "checkoutAttributes";
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

    it("Mutation returns item connected with correct taxCategory when valid 'taxCategoryId' input is used", () => {
        const taxCategoryName = "Cypress Attribute Test TC";
        cy.searchOrCreate(taxCategoryName, "taxCategories", "createTaxCategory").then((returnedId: string) => {
            taxCategoryId = returnedId;
            const dummyTaxCategory = {id: taxCategoryId, name: taxCategoryName};
            const name = "Cypress CheckoutAttribute TC creation";
            const values = [{name: 'Cypress Obligatory CA'}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        values: ${toFormattedString(values)}
                        taxCategoryId: "${returnedId}"
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        name
                        values {
                            name
                        }
                        taxCategory {
                            id
                            name
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                id = res.body.data[mutationName][dataPath].id;
                const propNames = ["name", "taxCategory", "values"];
                const propValues = [name, dummyTaxCategory, values];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                values {
                                    name
                                }
                                taxCategory {
                                    id
                                    name
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    it("Mutation creates item that has all included input", () => {
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress CheckoutAttribute Input";
        const defaultValue = "Cypress CheckoutAttribute";
        const displayName = "Cypress CAI";
        const isRequired = Cypress._.random(0, 1) === 1;
        const isTaxExempt = Cypress._.random(0, 1) === 1;
        const shippableProductRequired = Cypress._.random(0, 1) === 1;
        const values = [
            {
                displayOrder: Cypress._.random(1, 20),
                isPreSelected: Cypress._.random(0, 1) === 1,
                name: 'Cypress CA Input',
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                },
                weightAdjustment: Cypress._.random(1, 10)
            }, {
                displayOrder: Cypress._.random(1, 20),
                isPreSelected: Cypress._.random(0, 1) === 1,
                name: 'Cypress CA Input 2',
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                },
                weightAdjustment: Cypress._.random(1, 10)
            }
        ];
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
                    values: ${toFormattedString(values)}
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
                        isPreSelected
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
            const propNames = ["displayOrder", "name", "defaultValue", "displayName", "isRequired", "isTaxExempt", "shippableProductRequired", "values"];
            const propValues = [displayOrder, name, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                        nodes {
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
                                isPreSelected
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
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });
});