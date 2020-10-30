/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateProductSpecification', () => {
    let id = '';
    const mutationName = 'updateProductSpecification';
    const dataPath = 'productSpecification';
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