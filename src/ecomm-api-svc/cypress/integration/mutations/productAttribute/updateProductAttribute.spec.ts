/// <reference types="cypress" />
// TEST COUNT: 6
// request count: 8
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

    it("Mutation will succeed with valid 'id' and 'name' input", () => {
        cy.turnArrayIntoInput(values).then((strungValues: string) => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}", values: ${strungValues} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = ["name"];
                const propValues = [newName];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                name
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const valuesCopy = JSON.parse(JSON.stringify(values));
        cy.turnArrayIntoInput(valuesCopy).then((strungValues: string) => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const customData = {data: `${dataPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        values: ${strungValues}
                        customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
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
                const propNames = ["name", "values", "customData"];
                const propValues = [newName, valuesCopy, customData];
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
    });
});