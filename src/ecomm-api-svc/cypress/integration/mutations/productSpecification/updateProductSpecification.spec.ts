/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

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

    it("Mutation will fail with no 'Name' input", () => {
        const options = [{name: 'Cypress PS v1'}, {name: 'Cypress PS v2'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    options: ${toFormattedString(options)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
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

    it("Mutation will fail with invalid 'options' input", () => {
        const name = "Cypress API Product Attribute Invalid options";
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${name}", options: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will succeed with valid 'id', 'name', and options input", () => {
        updateCount++;
        const optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy[0].name = `Cypress PS update test #${updateCount}`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 10);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}", options: ${toFormattedString(optionsCopy)} }) {
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
        optionsCopy[0].name = `Cypress CA update test #${updateCount}`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 10);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    name: "${newName}"
                    options: ${toFormattedString(optionsCopy)}
                    customData: ${toFormattedString(customData)}
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
            const propNames = ["customData", "name", "options"];
            const propValues = [customData, newName, optionsCopy];
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
        const newOption = {displayOrder: Cypress._.random(5, 9), name: "Cypress PS new option"};
        updateCount++;
        const optionsCopy = JSON.parse(JSON.stringify(options));
        optionsCopy[0].name = `Cypress CA update test #${updateCount}`;
        optionsCopy[0].displayOrder = Cypress._.random(0, 4);
        optionsCopy.push(newOption);
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const displayOrder = Cypress._.random(0, 10);
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    displayOrder: ${displayOrder}
                    name: "${newName}"
                    options: ${toFormattedString(optionsCopy)}
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