/// <reference types="cypress" />
// TEST COUNT: 8
describe('Mutation: updateProductAttribute', () => {
    let id = '';
    let updateCount = 0;
    let values = '';
    const mutationName = 'updateProductAttribute';
    const queryName = "productAttributes";
    const dataPath = 'productAttribute';
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
    const createName = 'createProductAttribute';
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
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", values: [{name: "Cypress PA update test"}]}`;
        cy.createAndGetId(createName, dataPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.values);
            id = createdItem.id;
            values = createdItem.values;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete the item we've been updating
            const deletionName = "deleteProductAttribute";
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
        valuesCopy[0].name = `"Cypress CA update test #${updateCount}"`;
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
                    values: ${toInputString(valuesCopy)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "description", "values"];
            const propValues = [newName, newDescription, valuesCopy];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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