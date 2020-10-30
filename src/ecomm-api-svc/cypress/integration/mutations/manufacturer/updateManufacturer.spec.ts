/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateManufacturer', () => {
    let id = '';
    const mutationName = 'updateManufacturer';
    const dataPath = 'manufacturer';
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