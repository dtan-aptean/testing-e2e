/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateCategory', () => {
    let id = '';
    const mutationName = 'updateCategory';
    const dataPath = 'category';
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