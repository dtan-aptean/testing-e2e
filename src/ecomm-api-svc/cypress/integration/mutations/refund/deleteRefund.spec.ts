/// <reference types="cypress" />
describe('Mutation: deleteRefund', () => {
    let id = '';
    const mutationName = 'deleteRefund';
    const creationName = 'createRefund';
    const queryName = "refunds";
    const deletedMessage = "refund";
    const standardMutationBody = `
        code
        message
        error
    `;
});