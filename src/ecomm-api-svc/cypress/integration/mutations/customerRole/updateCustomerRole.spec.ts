/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateCustomerRole', () => {
    let id = '';
    const mutationName = 'updateCustomerRole';
    const dataPath = 'customerRole';
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