/// <reference types="cypress" />
// TEST COUNT: 3
describe('Mutation: deleteDiscount', () => {
    let id = '';
    let currentItemName = '';
    let creationCount = 0;
    const mutationName = 'deleteDiscount';
    const creationName = 'createDiscount';
    const queryName = "discounts";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee ${creationCount}`;
        const input = 'discountAmount: {amount: 15, currency: "USD"}';
        cy.searchOrCreate(name, queryName, creationName, input).then((returnedId: string) => {
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