/// <reference types="cypress" />
// TEST COUNT: 3
// request count: 3
describe('Mutation: updateProductAttribute', () => {
    let id = '';
    const mutationName = 'updateProductAttribute';
    const dataPath = 'productAttribute';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
        }
    `;
    const createName = 'createProductAttribute';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}"}`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            id = returnedId;
        });
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

    it("Mutation will fail with invalid 'id' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: 24 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });
});