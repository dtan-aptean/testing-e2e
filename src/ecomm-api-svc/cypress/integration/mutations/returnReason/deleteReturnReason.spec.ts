/// <reference types="cypress" />
// TEST COUNT: 5
describe('Mutation: deleteReturnReason', () => {
    var id = '';
    var currentItemName = '';
    const mutationName = 'deleteReturnReason';
    const creationName = 'createReturnReason';
    const queryName = "returnReasons";
    const standardMutationBody = `
        code
        message
        error
    `;

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        itemName: currentItemName
    };

    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentItemName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentItemName).then(() => {
                updateIdAndName();
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

        it("Mutation will succeed with valid 'id' input from an existing item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                updateIdAndName();
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });
});