export const codeMessageError = `code
message
errors {
    code
    message
    domain
    details {
        code
        message
        target
    }
}
error`;

Cypress.Commands.add("mutationNoInput", (mutationName: string, standardMutationBody: string) => {
    const mutation = `mutation {
        ${mutationName} {
            ${standardMutationBody}
        }
    }`;
    cy.postAndConfirmError(mutation);
});

Cypress.Commands.add("mutationEmptyObject", (mutationName: string, standardMutationBody: string) => {
    const mutation = `mutation {
        ${mutationName}(input: {}) {
            ${standardMutationBody}
        }
    }`;
    cy.postAndConfirmError(mutation);
});

Cypress.Commands.add("mutationInvalidId", (mutationName: string, standardMutationBody: string) => {
    const mutation = `mutation {
        ${mutationName}(input: { id: true }) {
            ${standardMutationBody}
        }
    }`;
    cy.postAndConfirmError(mutation);
});

Cypress.Commands.add("mutationOnlyId", (id: string, mutationName: string, standardMutationBody: string) => {
    const mutation = `mutation {
        ${mutationName}(input: { id: "${id}" }) {
            ${standardMutationBody}
        }
    }`;
    cy.postAndConfirmError(mutation);
});

Cypress.Commands.add("mutationInvalidName", (mutationName: string, standardMutationBody: string, id?: string) => {
    let idInput = id ? `id: "${id}", ` : "";
    const mutation = `mutation {
        ${mutationName}(input: { ${idInput}name: 7 }) {
            ${standardMutationBody}
        }
    }`;
    cy.postAndConfirmError(mutation);
});

Cypress.Commands.add("mutationBasicDelete", (id: string, mutationName: string, standardMutationBody: string, queryInformation) => {
    const mutation = `mutation {
        ${mutationName}(input: { id: "${id}" }) {
            ${standardMutationBody}
        }
    }`;
    return cy.postAndConfirmDelete(mutation, mutationName, queryInformation);
});

Cypress.Commands.add("mutationAlreadyDeleted", (id: string, mutationName: string, standardMutationBody: string, queryInformation) => {
    const mutation = `mutation {
        ${mutationName}(input: { id: "${id}" }) {
            ${standardMutationBody}
        }
    }`;
    return cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
        return cy.postAndConfirmMutationError(mutation, mutationName);
    });
});