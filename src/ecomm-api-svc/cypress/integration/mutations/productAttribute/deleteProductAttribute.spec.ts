/// <reference types="cypress" />
// TEST COUNT: 3
describe('Mutation: deleteProductAttribute', () => {
    let id = '';
    let currentItemName = '';
    let creationCount = 0;
    const mutationName = 'deleteProductAttribute';
    const creationName = 'createProductAttribute';
    const queryName = "productAttributes";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee ${creationCount}`;
        const mutationInput = 'values: [{name: "PA deletee value"}]';
        cy.searchOrCreate(name, queryName, creationName, mutationInput).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
            creationCount++;
        });
    });

    afterEach(() => {
        if (id !== '') {
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
});