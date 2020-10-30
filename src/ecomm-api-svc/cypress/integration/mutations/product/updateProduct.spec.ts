/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateProduct', () => {
    let id = '';
    const mutationName = 'updateProduct';
    const dataPath = 'product';
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