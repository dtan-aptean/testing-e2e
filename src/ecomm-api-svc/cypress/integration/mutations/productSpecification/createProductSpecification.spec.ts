/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 9
describe('Mutation: createProductSpecification', () => {
    let id = '';
    const mutationName = 'createProductSpecification';
    const dataPath = 'productSpecification';
    const queryName = "productSpecifications";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
            options {
                displayOrder
                name
            }
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteProductSpecification";
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

    it("Mutation will fail with no 'Name' input", () => {
        const options = [{name: 'Cypress PS v1'}, {name: 'Cypress PS v2'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    options: ${toFormattedString(options)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
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

    it("Mutation will fail without 'options' input", () => {
        const name = `Cypress ${mutationName} no options`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with invalid 'options' input", () => {
        const name = "Cypress API Product Specification Invalid options";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}", options: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with valid 'Name' and 'Options' input will create a new item", () => {
        const name = "Cypress API Product Spec";
        const options = [{name: `Cypress ${mutationName} options`, displayOrder: Cypress._.random(0, 10)}];
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}", options: ${toFormattedString(options)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name",  "options"];
            const propValues = [name, options];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            name
                            options {
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

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress ProductSpecification customData";
        const options = [{name: `Cypress ${mutationName} customData options`, displayOrder: Cypress._.random(0, 10)}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
                    options: ${toFormattedString(options)}
                    customData: ${toFormattedString(customData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                    options {
                        displayOrder
                        name
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["customData", "name", "options"];
            const testValues = [customData, name, options];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues).then(() => {
                const queryName = "productSpecifications";
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
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress ProductSpecification Input";
        const options = [{displayOrder: Cypress._.random(1, 20), name: 'Cypress PS'}, {displayOrder: Cypress._.random(1, 20), name: 'Cypress PS'}];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    displayOrder: ${displayOrder}
                    name: "${name}"
                    options: ${toFormattedString(options)}
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
                        displayOrder
                        name
                    }
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["name", "displayOrder", "options"];
            const propValues = [name, displayOrder, options];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            name
                            displayOrder
                            options {
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