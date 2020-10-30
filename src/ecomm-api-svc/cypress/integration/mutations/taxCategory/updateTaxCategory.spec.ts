/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateTaxCategory', () => {
    let id = '';
    const mutationName = 'updateTaxCategory';
    const dataPath = 'taxCategory';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
        }
    `;
});