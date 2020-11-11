/// <reference types="cypress" />
// TEST COUNT: 9
describe('Mutation: updateCheckoutAttribute', () => {
    let id = '';
    let updateCount = 0;
    let taxCategoryId = '';
    let values = '';
    const mutationName = 'updateCheckoutAttribute';
    const queryName = "checkoutAttributes";
    const dataPath = 'checkoutAttribute';
    const additionalFields = `values {
        id
        name
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
    const createName = 'createCheckoutAttribute';
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
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", values: [{name: "Cypress CA update test"}]}`;
        cy.createAndGetId(createName, dataPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.values);
            id = createdItem.id;
            values = createdItem.values;
        });
    });

    after(() => {
        if (taxCategoryId !== "") {
            const taxDeletionName = "deleteTaxCategory";
            const taxRemovalMutation = `mutation {
                ${taxDeletionName}(input: { id: "${taxCategoryId}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(taxRemovalMutation, taxDeletionName);
            cy.wait(1000);
        }
        if (id !== "") {
            // Delete the item we've been updating
            const deletionName = "deleteCheckoutAttribute";
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

    it("Mutation will fail without 'values' input", () => {
        const newName = `Cypress ${mutationName} no values`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'id', 'name', and 'values' input", () => {
        updateCount++;
        const valuesCopy = JSON.parse(JSON.stringify(values));
        valuesCopy[0].name = `"Cypress CA update test #${updateCount}"`;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}", values: ${toInputString(valuesCopy)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "values"];
            const propValues = [newName, valuesCopy];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation connects item with correct taxCategory when valid 'taxCategoryId' input is used", () => {
        const taxCategoryName = "Cypress updateAttribute TC";
        cy.searchOrCreate(taxCategoryName, "taxCategories", "createTaxCategory").then((returnedId: string) => {
            const taxCategoryId = returnedId;
            const dummyTaxCategory = {id: taxCategoryId, name: taxCategoryName};
            updateCount++;
            const valuesCopy = JSON.parse(JSON.stringify(values));
            valuesCopy[0].name = `"Cypress CA update test #${updateCount}"`;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        values: ${toInputString(valuesCopy)}
                        taxCategoryId: "${returnedId}"
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
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
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = ["name", "taxCategory", "values"];
                const propValues = [newName, dummyTaxCategory, valuesCopy];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const valuesCopy = JSON.parse(JSON.stringify(values));
        valuesCopy[0].name = `"Cypress CA update test #${updateCount}"`;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    name: "${newName}"
                    values: ${toInputString(valuesCopy)}
                    customData: ${toInputString(customData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                    values {
                        id
                        name
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["customData", "name", "values"];
            const propValues = [customData, newName, valuesCopy];
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
        valuesCopy[0].name = `"Cypress CA update test #${updateCount}"`;
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
                    values: ${toInputString(valuesCopy)}
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
        const valuesToMatch = [{displayOrder: 0, isPreSelected: false, name: values[0].name, priceAdjustment: {amount: 0, currency: "USD"}, weightAdjustment: 0}, newValue];
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "displayOrder", "defaultValue", "displayName", "isRequired", "isTaxExempt", "shippableProductRequired", "values"];
            const propValues = [newName, displayOrder, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, valuesToMatch];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
                const propTest = [newName, displayOrder, defaultValue, displayName, isRequired, isTaxExempt, shippableProductRequired, valuesCopy];
                cy.confirmUsingQuery(query, queryName, id, propNames, propTest);
            });
        });
    });
});