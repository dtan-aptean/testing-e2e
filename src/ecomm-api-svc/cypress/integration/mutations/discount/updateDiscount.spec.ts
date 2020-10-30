/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateDiscount', () => {
    let id = '';
    const mutationName = 'updateDiscount';
    const dataPath = 'discount';
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