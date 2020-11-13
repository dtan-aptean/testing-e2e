/// <reference types="cypress" />
// TEST COUNT: 5
describe('Mutation: deleteManufacturer', () => {
    let id = '';
    let currentItemName = '';
    const mutationName = 'deleteManufacturer';
    const creationName = 'createManufacturer';
    const queryName = "manufacturers";
    const infoName = 'manufacturerInfo';
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName, undefined, infoName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName, infoName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    const mutation = `mutation {
                        ${mutationName}(input: {id: "${id}"}){
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName).then(() => {
                        id = '';
                        currentItemName = '';
                    });
                }
            });
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

    it("Mutation will succeed with valid 'id' input from an existing item", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
            expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
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
            expect(res.body.data[mutationName].message).to.be.eql(`${queryName} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName, infoName).then(() => {
                id = '';
                currentItemName = '';
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });
});