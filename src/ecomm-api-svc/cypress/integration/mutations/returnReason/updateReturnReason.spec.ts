/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateReturnReason', () => {
    let id = '';
    const mutationName = 'updateReturnReason';
    const dataPath = 'returnReason';
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