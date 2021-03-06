/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 10
describe('Mutation: createCheckoutAttribute', () => {
    var id = '';
    const mutationName = 'createCheckoutAttribute';
    const deleteMutName = "deleteCheckoutAttribute";
    const queryName = "checkoutAttributes";
    const itemPath = 'checkoutAttribute';
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            id
            name
            values {
                name
            }
        }
    `;
    var taxCategoryId = "";


    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName);
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        if (id !== "") {
            cy.deleteItem(deleteMutName, id).then(() => {
                id = "";
            });
            cy.wait(1000);
        }
        if (taxCategoryId !== "") {
            cy.deleteItem("deleteTaxCategory", taxCategoryId).then(() => {
                taxCategoryId = "";
            });   
        }
    });
    
    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
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
            cy.mutationInvalidName(mutationName, standardMutationBody);
        });

        it("Mutation will fail with valid 'Name' input but no 'Values' input", () => {
            const name = "Cypress API Checkout Attribute Invalid";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "CreateCheckoutAttributeInput.values" of required type "[CreateCheckoutAttributeValueInput!]!" was not provided.');
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "values"];
                const propValues = [name, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = "Cypress CheckoutAttribute customData";
            const values = [{name: 'Cypress CA customData'}];
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        values: ${toFormattedString(values)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        name
                        values {
                            name
                        }
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["customData", "name", "values"];
                const propValues = [customData, name, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
                    ${codeMessageError}
                    ${itemPath} {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["displayOrder", "name", "defaultValue", "displayName", "isRequired", "isTaxExempt", "shippableProductRequired", "values"];
                const propValues = [displayOrder, name, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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

    context("Testing connecting to other items and features", () => {
        it("Mutation returns item connected with correct taxCategory when valid 'taxCategoryId' input is used", () => {
            const extraCreate = "createTaxCategory";
            const extraPath = "taxCategory";
            const extraQuery = "taxCategories";
            const extraItemInput = { name: "Cypress Attribute Test TC" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                taxCategoryId = itemIds[0];
                const dummyTaxCategory = items[0];
                const name = "Cypress CheckoutAttribute TC creation";
                const values = [{name: 'Cypress Obligatory CA'}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            name: "${name}"
                            values: ${toFormattedString(values)}
                            taxCategoryId: "${itemIds[0]}"
                        }
                    ) {
                        ${codeMessageError}
                        ${itemPath} {
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
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["name", "taxCategory", "values"];
                    const propValues = [name, dummyTaxCategory, values];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
    });
});