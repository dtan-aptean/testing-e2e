/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateVendor', () => {
    let id = '';
    const mutationName = 'updateVendor';
    const dataPath = 'vendor';
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