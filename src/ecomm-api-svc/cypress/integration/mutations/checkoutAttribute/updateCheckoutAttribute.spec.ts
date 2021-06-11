/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 13
describe('Mutation: updateCheckoutAttribute', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var taxCategoryId = '';
    var values = '';
    const extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateCheckoutAttribute';
    const createName = 'createCheckoutAttribute';
    const deleteMutName = "deleteCheckoutAttribute";
    const queryName = "checkoutAttributes";
    const itemPath = 'checkoutAttribute';
    const additionalFields = `values {
        id
        name
    }`;
    const standardMutationBody = `
        code
        message
        errors {
            code
            message
            domain
            details {
                code
                message
                target
            }
        }
        ${itemPath} {
            id
            name
            ${additionalFields}
        }
    `;

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName);
    });

	beforeEach(() => {
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{name: "${name}", values: [{name: "Cypress CA update test"}]}`;
        cy.createAndGetId(createName, itemPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.values);
            id = createdItem.id;
            itemCount++;
            values = createdItem.values;
        });
	});

    afterEach(() => {
        if (!deleteItemsAfter) {
			return;
		}
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
            // Delete the item we've been updating
            cy.deleteItem(deleteMutName, id);
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
            const values = [{name: 'Cypress CA v1'}, {name: 'Cypress CA v2'}];
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
            cy.postAndConfirmError(mutation);
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
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "UpdateCheckoutAttributeInput.values" of required type "[UpdateCheckoutAttributeValueInput!]!" was not provided.');
            });
        });

        it("Mutation will fail with invalid 'Values' input", () => {
            const name = "Cypress API Checkout Attribute Invalid values";
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
                    errors {
                        code
                        message
                        domain
                        details {
                            code
                            message
                            target
                        }
                    }
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
            const input = `{name: "${name}", values: [{name: "Cypress CA customData test"}], customData: ${toFormattedString(customData)}}`;
            const extraInput = `customData
            ${additionalFields}`;
            cy.createAndGetId(createName, itemPath, input, extraInput).then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: deleteMutName, itemName: name, queryName: queryName});
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
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
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
                name: "Cypress CA new value",
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                },
                weightAdjustment: Cypress._.random(1, 10)
            };
            const valuesCopy = [JSON.parse(JSON.stringify(values[0])), newValue];
            updateCount++;
            valuesCopy[0].name = `Cypress CA update test #${updateCount}`;
            valuesCopy[0].displayOrder = Cypress._.random(0, 10);
            valuesCopy[0].isPreSelected = Cypress._.random(0, 1) === 1;
            valuesCopy[0].priceAdjustment = {amount: Cypress._.random(1, 5), currency: "USD"};
            valuesCopy[0].weightAdjustment = Cypress._.random(1, 10);
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const displayOrder = Cypress._.random(0, 10);
            const defaultValue = `Cypress ${mutationName}`;
            const displayName = "Updated Cypress";
            const isRequired = Cypress._.random(0, 1) === 1;
            const isTaxExempt = Cypress._.random(0, 1) === 1;
            const shippableProductRequired = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        displayOrder: ${displayOrder}
                        name: "${newName}"
                        defaultValue: "${defaultValue}"
                        displayName: "${displayName}"
                        isRequired: ${isRequired}
                        isTaxExempt: ${isTaxExempt}
                        shippableProductRequired: ${shippableProductRequired}
                        values: ${toFormattedString(valuesCopy)}
                    }
                ) {
                    code
                    message
                    errors {
                        code
                        message
                        domain
                        details {
                            code
                            message
                            target
                        }
                    }
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
                            id
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
                valuesCopy[1].id = res.body.data[mutationName][itemPath].values[1].id;
                const propNames = ["name", "displayOrder", "defaultValue", "displayName", "isRequired", "isTaxExempt", "shippableProductRequired", "values"];
                const propValues = [newName, displayOrder, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, valuesCopy];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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
                                    id
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
        it("Mutation connects item with correct taxCategory when valid 'taxCategoryId' input is used", () => {
            const extraCreate = "createTaxCategory";
            const extraPath = "taxCategory";
            const extraQuery = "taxCategories";
            const extraItemInput = { name: "Cypress updateAttribute TC" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                taxCategoryId = itemIds[0];
                const dummyTaxCategory = items[0];
                updateCount++;
                const valuesCopy = JSON.parse(JSON.stringify(values));
                valuesCopy[0].name = `Cypress CA update test #${updateCount}`;
                const newName = `Cypress ${mutationName} Update ${updateCount}`;
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}"
                            name: "${newName}"
                            values: ${toFormattedString(valuesCopy)}
                            taxCategoryId: "${taxCategoryId}"
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            name
                            ${additionalFields}
                            taxCategory {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["name", "taxCategory", "values"];
                    const propValues = [newName, dummyTaxCategory, valuesCopy];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    name
                                    ${additionalFields}
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