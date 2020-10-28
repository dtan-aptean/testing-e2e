/// <reference types="cypress" />
// TEST COUNT: 5
// request count: 5
describe('Muation: createCustomerRole', () => {
    let id = '';
    const mutationName = 'createCustomerRole';
    const dataPath = 'customerRole';
    const standardMutationBody = `
        code
        message
        error
        customerRole {
            id
            name
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteCustomerRole";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, dataPath).then(() => {
                id = "";
            });
        }
    });
    
    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            ${mutationName} {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            ${mutationName}(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with valid 'Name' input will create a new item", () => {
        const name = "Cypress API Role";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, ["name"], [name]);
        });
    });

    it("Mutation creates item that has all included input", () => {
        const isTaxExempt = Cypress._.random(0, 1) === 1;
        const freeShipping = Cypress._.random(0, 1) === 1;
        const active = Cypress._.random(0, 1) === 1;
        const enablePasswordLifetime = Cypress._.random(0, 1) === 1;
        const name = "Cypress Role Input";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    isTaxExempt: ${isTaxExempt}
                    freeShipping: ${freeShipping}
                    active: ${active}
                    enablePasswordLifetime: ${enablePasswordLifetime}
                    name: "${name}"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    isTaxExempt
                    freeShipping
                    active
                    enablePasswordLifetime
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["isTaxExempt", "freeShipping", "active", "enablePasswordLifetime", "name"];
            const values = [isTaxExempt, freeShipping, active, enablePasswordLifetime, name];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});