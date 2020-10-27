/// <reference types="cypress" />
// TEST COUNT: 3
// request count: 3
describe('Muation: createProductSpecification', () => {
    let id = '';
    const standardMutationBody = `
        code
        message
        error
        productSpecification {
            id
            name
        }
    `;
    
    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            createProductSpecification {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            createProductSpecification(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            createProductSpecification(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });
});