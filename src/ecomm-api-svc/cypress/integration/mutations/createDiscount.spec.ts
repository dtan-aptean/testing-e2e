/// <reference types="cypress" />
// TEST COUNT: 3
// request count: 3
describe('Muation: createDiscount', () => {
    let id = '';
    const standardMutationBody = `
        code
        message
        error
        discount {
            id
            name
        }
    `;
    
    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            createDiscount {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            createDiscount(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            createDiscount(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });
});