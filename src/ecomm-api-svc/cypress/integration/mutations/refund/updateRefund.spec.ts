/// <reference types="cypress" />
describe('Mutation: updateRefund', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'updateRefund';
    const queryName = "refunds";
    const dataPath = 'refund';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            order {
                id
            }
        }
    `;
    const createName = 'createRefund';
});