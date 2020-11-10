/// <reference types="cypress" />
// TEST COUNT: 8
describe('Mutation: updateProductSpecification', () => {
    let id = '';
    let updateCount = 0;
    let options = '';
    const mutationName = 'updateProductSpecification';
    const queryName = "productSpecifications";
    const dataPath = 'productSpecification';
    const additionalFields = `options {
        id
        displayOrder
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
    const createName = 'createProductSpecification';
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
        const input = `{name: "${name}", options: [{displayOrder: ${Cypress._.random(0, 10)}, name: "Cypress PS update tests"}]}`;
        cy.createAndGetId(createName, dataPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.options);
            id = createdItem.id;
            options = createdItem.options;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete the item we've been updating
            const deletionName = "deleteProductSpecification";
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

    it("Mutation will fail without 'options' input", () => {
        const newName = `Cypress ${mutationName} no options`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'id', 'name', and options input", () => {
        updateCount++;
        const optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy[0].name = `"Cypress PS update test #${updateCount}"`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 10);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}", options: ${toInputString(optionsCopy)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name",  "options"];
            const propValues = [newName, optionsCopy];
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
        const optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy[0].name = `"Cypress CA update test #${updateCount}"`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 10);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    name: "${newName}"
                    options: ${toInputString(optionsCopy)}
                    customData: ${toInputString(customData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                    ${additionalFields}
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "options", "customData"];
            const propValues = [newName, optionsCopy, customData];
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
        const newOption = {displayOrder: Cypress._.random(0, 10), name: "Cypress PS new option"};
        updateCount++;
        const optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy[0].name = `"Cypress CA update test #${updateCount}"`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 10);
        optionsCopy.push(newOption);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const displayOrder = Cypress._.random(0, 10);
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    displayOrder: ${displayOrder}
                    name: "${newName}"
                    options: ${toInputString(optionsCopy)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    displayOrder
                    name
                    ${additionalFields}
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "displayOrder", "options"];
            const propValues = [newName, displayOrder, optionsCopy];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            name
                            displayOrder
                            ${additionalFields}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });
});