/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
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
});