/// <reference types="cypress" />
// TEST COUNT: 7
// request count: 10
describe('Mutation: updateProductSpecification', () => {
    let id = '';
    let updateCount = 0;
    let options = '';
    const mutationName = 'updateProductSpecification';
    const queryName = "productSpecifications";
    const dataPath = 'productSpecification';
    const additionalFields = `options {
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
    const createName = 'createProductSpecification';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}", options: [{name: "Cypress PS update tests"}]}`;
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

    it("Mutation will succeed with valid 'id' and 'name' input", () => {
        cy.turnArrayIntoInput(options).then((strungOptions: string) => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}", options: ${strungOptions} }) {
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
        const optionsCopy = JSON.parse(JSON.stringify(options));
        cy.turnArrayIntoInput(optionsCopy).then((strungOptions: string) => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const customData = {data: `${dataPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        options: ${strungOptions}
                        customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        name
                        options {
                            id
                            name
                        }
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
    });

    it("Mutation will correctly use all input", () => {
        const newOption = {displayOrder: Cypress._.random(0, 10), name: "Cypress PS new option"};
        const optionsCopy = [...options];
        optionsCopy.push(newOption);
        cy.turnArrayIntoInput(optionsCopy).then((strungOptions: string) => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const displayOrder = Cypress._.random(0, 10);
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        displayOrder: ${displayOrder}
                        name: "${newName}"
                        options: ${strungOptions}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        displayOrder
                        name
                        options {
                            id
                            displayOrder
                            name
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                options = optionsCopy;
                const propNames = ["name", "displayOrder", "options"];
                const propValues = [newName, displayOrder, optionsCopy];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                name
                                displayOrder
                                options {
                                    id
                                    displayOrder
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