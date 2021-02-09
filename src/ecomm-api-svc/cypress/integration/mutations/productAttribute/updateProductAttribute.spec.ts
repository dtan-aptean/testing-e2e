/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 12
describe('Mutation: updateProductAttribute', () => {
    var id = '';
    var updateCount = 0;
    var values = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateProductAttribute';
    const queryName = "productAttributes";
    const itemPath = 'productAttribute';
    const additionalFields = `values {
        id
        name
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
    const createName = 'createProductAttribute';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", values: [{name: "Cypress PA update test"}]}`;
        cy.createAndGetId(createName, itemPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.values);
            id = createdItem.id;
            values = createdItem.values;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds);
            // Delete the item we've been updating
            cy.deleteItem("deleteProductAttribute", id);
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const values = [{name: 'Cypress PA v1'}, {name: 'Cypress PA v2'}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        values: ${toFormattedString(values)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: 7 }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'values' input", () => {
            const newName = `Cypress ${mutationName} no values`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Values' input", () => {
            const name = "Cypress API Product Attribute Invalid values";
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${name}", values: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed with valid 'id', 'name', and 'values' input", () => {
            updateCount++;
            const valuesCopy = JSON.parse(JSON.stringify(values));
            valuesCopy[0].name = `Cypress CA update test #${updateCount}`;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}", values: ${toFormattedString(valuesCopy)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "values"];
                const propValues = [newName, valuesCopy];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                ${additionalFields}
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
            const valuesCopy = JSON.parse(JSON.stringify(values));
            valuesCopy[0].name = `Cypress CA update test #${updateCount}`;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        values: ${toFormattedString(valuesCopy)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        ${additionalFields}
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["customData", "name", "values"];
                const propValues = [customData, newName, valuesCopy];
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
            const input = `{name: "${name}", values: [{name: "Cypress PA customData test"}], customData: ${toFormattedString(customData)}}`;
            const extraInput = `customData
            ${additionalFields}`;
            cy.createAndGetId(createName, itemPath, input, extraInput).then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: "deleteProductAttribute", itemName: name, queryName: queryName});
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newValues = createdItem.values;
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            name: "${newName}"
                            values: ${toFormattedString(newValues)}
                            customData: ${toFormattedString(newCustomData)}
                        }
                    ) {
                        code
                        message
                        error
                        ${itemPath} {
                            id
                            name
                            ${additionalFields}
                            customData
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["customData", "name", "values"];
                    const propValues = [newCustomData, newName, newValues];
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
            const newValue = {
                displayOrder: Cypress._.random(0, 10),
                isPreSelected: Cypress._.random(0, 1) === 1,
                name: "Cypress PA new value",
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                },
                weightAdjustment: Cypress._.random(1, 10),
                cost: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                }
            };
            const valuesCopy = [JSON.parse(JSON.stringify(values[0])), newValue];
            updateCount++;
            valuesCopy[0].name = `Cypress CA update test #${updateCount}`;
            valuesCopy[0].displayOrder = Cypress._.random(0, 10);
            valuesCopy[0].isPreSelected = Cypress._.random(0, 1) === 1;
            valuesCopy[0].priceAdjustment = {amount: Cypress._.random(1, 5), currency: "USD"};
            valuesCopy[0].weightAdjustment = Cypress._.random(1, 10);
            valuesCopy[0].cost = {amount: Cypress._.random(1, 5), currency: "USD"};
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const newDescription = `Cypress ${mutationName} description`;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        description: "${newDescription}"
                        values: ${toFormattedString(valuesCopy)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        description
                        values {
                            id
                            displayOrder
                            isPreSelected
                            name
                            priceAdjustment {
                                amount
                                currency
                            }
                            weightAdjustment
                            cost {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "description", "values"];
                const propValues = [newName, newDescription, valuesCopy];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                description
                                values {
                                    id
                                    displayOrder
                                    isPreSelected
                                    name
                                    priceAdjustment {
                                        amount
                                        currency
                                    }
                                    weightAdjustment
                                    cost {
                                        amount
                                        currency
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