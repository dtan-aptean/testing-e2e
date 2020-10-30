/// <reference types="cypress" />
// TEST COUNT: 0
// request count: 0
describe('Mutation: updateCheckoutAttribute', () => {
    let id = '';
    const mutationName = 'updateCheckoutAttribute';
    const dataPath = 'checkoutAttribute';
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