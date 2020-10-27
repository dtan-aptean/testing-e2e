/// <reference types="cypress" />
// TEST COUNT: 3
// request count: 3
describe('Muation: createManufacturer', () => {
    let id = '';
    const standardMutationBody = `
        code
        message
        error
        manufacturer {
            id
            name
        }
    `;
    
    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            createManufacturer {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            createManufacturer(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            createManufacturer(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });
});