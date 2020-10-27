/// <reference types="cypress" />
// TEST COUNT: 3
// request count: 3
describe('Muation: createTaxCategory', () => {
    let id = '';
    const standardMutationBody = `
        code
        message
        error
        taxCategory {
            id
            name
        }
    `;
    
    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            createTaxCategory {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            createTaxCategory(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            createTaxCategory(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });
});