/// <reference types="cypress" />
// TEST COUNT: 5
describe('Mutation: deleteReturnReason', () => {
    var id = '';
    var currentItemName = '';
    const mutationName = 'deleteReturnReason';
    const creationName = 'createReturnReason';
    const queryName = "returnReasons";
    const deletedMessage = "returnReason";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    cy.deleteItem(mutationName, id).then(() => {
                        id = '';
                        currentItemName = '';
                    });
                }
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
            cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                    id = '';
                    currentItemName = '';
                });
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                    id = '';
                    currentItemName = '';
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });
    });
});