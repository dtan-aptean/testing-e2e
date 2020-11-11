/// <reference types="cypress" />
// TEST COUNT: 7
describe('Mutation: createProductAttribute', () => {
    let id = '';
    const mutationName = 'createProductAttribute';
    const queryName = "productAttributes";
    const dataPath = 'productAttribute';
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

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteProductAttribute";
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

    it("Mutation will fail without 'values' input", () => {
        const name = `Cypress ${mutationName} no values`;
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation with valid 'Name' and 'Values' input will create a new item", () => {
        const name = "Cypress API Product Attribute";
        const values = [{name: `${mutationName} value 1`}, {name: `${mutationName} value 2`}];
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}", values: ${toInputString(values)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "values"];
            const propValues = [name, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        const name = "Cypress ProductAttributes customData";
        const values = [{name: `CustomData ${mutationName} value 1`}, {name: `CustomData ${mutationName} value 2`}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    values: ${toInputString(values)}
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
                        name
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "values", "customData"];
            const propValues = [name, values, customData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const queryName = "productAttributes";
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
        const description = "Cypress testing 'create' mutation input";
        const name = "Cypress ProductAttribute Input";
        const values = [
            {
                displayOrder: Cypress._.random(1, 20),
                isPreselected: Cypress._.random(0, 1) === 1, 
                name: 'Cypress PA 1', 
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                }, 
                weightAdjustment: Cypress._.random(1, 10), 
                cost: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                }
            }, {
                displayOrder: Cypress._.random(1, 20),
                isPreselected: Cypress._.random(0, 1) === 1, 
                name: 'Cypress PA 2', 
                priceAdjustment: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                }, 
                weightAdjustment: Cypress._.random(1, 10), 
                cost: {
                    amount: Cypress._.random(1, 5),
                    currency: "USD"
                }
            }
        ];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    description: "${description}"
                    name: "${name}"
                    values: ${toInputString(values)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    description
                    name
                    values {
                        displayOrder
                        isPreselected
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
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "description", "values"];
            const propValues = [name, description, values];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            name
                            description
                            values {
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