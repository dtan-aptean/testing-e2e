/// <reference types="cypress" />
// TEST COUNT: 6
describe('Mutation: createCustomerRole', () => {
    var id = '';
    const mutationName = 'createCustomerRole';
    const deleteMutName = "deleteCustomerRole";
    const queryName = "customerRoles";
    const itemPath = 'customerRole';
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            name
        }
    `;

    var deleteItemsAfter = undefined as boolean | undefined;
	before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName);
	});

    afterEach(() => {
        if (!deleteItemsAfter) {
			return;
		}
        if (id !== "") {
            cy.deleteItem(deleteMutName, id).then(() => {
                id = "";
            });
        }
    });
    
    context("Testing basic required inputs", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name"];
                const propValues = [name];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = "Cypress CustomerRole customData";
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const names = ["customData", "name"];
                const testValues = [customData, name];
                cy.confirmMutationSuccess(res, mutationName, itemPath, names, testValues).then(() => {
                    const queryName = "customerRoles";
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                customData
                            }
                        }
                    }`;
                    cy.postAndCheckCustom(query, queryName, id, customData);
                });
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
                    ${itemPath} {
                        id
                        isTaxExempt
                        freeShipping
                        active
                        enablePasswordLifetime
                        name
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "isTaxExempt", "freeShipping", "active", "enablePasswordLifetime"];
                const propValues = [name, isTaxExempt, freeShipping, active, enablePasswordLifetime];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                isTaxExempt
                                freeShipping
                                active
                                enablePasswordLifetime
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});