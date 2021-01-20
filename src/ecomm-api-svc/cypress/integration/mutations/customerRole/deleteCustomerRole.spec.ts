/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteCustomerRole', () => {
    var id = '';
    var currentItemName = '';
    const extraIds = [] as {itemId: string, deleteName: string}[];
    const mutationName = 'deleteCustomerRole';
    const creationName = 'createCustomerRole';
    const queryName = "customerRoles";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        cy.searchOrCreate(name, queryName, creationName).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                cy.deleteItem(extraIds[i].deleteName, extraIds[i].itemId);
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    cy.deleteItem(mutationName, id).then(() => {
                        id = '';
                        currentItemName = '';
                    });
                }
            });
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            const mutation = `mutation {
                ${mutationName} {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail when input is an empty object", () => {
            const mutation = `mutation {
                ${mutationName}(input: {}) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed with valid 'id' input from an existing item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            const queryInformation = {queryName: queryName, itemId: id, itemName: currentItemName};
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                id = '';
                currentItemName = '';
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            const queryInformation = {queryName: queryName, itemId: id, itemName: currentItemName};
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                id = '';
                currentItemName = '';
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    context("Testing deletion when connected to other items or features", () => {
        it("Deleting an item connected to a category will will disassociate the item from the category" , () => {
            const extraMutationName = "createCategory";
            const extraItemPath = "category";
            const extraQueryName = "categories";
            const infoName = "categoryInfo";
            const role = {id: id, name: currentItemName};
            const roleBasedAccess = {enabled: true, roles: [role]};
            const info = [{name: `Cypress ${mutationName} rBA test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
            const roleBasedAccessInput = {enabled: true, roleIds: [id]};
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        roleBasedAccess: ${toFormattedString(roleBasedAccessInput)}
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${extraItemPath} {
                        id
                        roleBasedAccess {
                            enabled
                            roles {
                                id
                                name
                            }
                        }
                        ${infoName} {
                            name
                            description
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const categoryId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: categoryId, deleteName: "deleteCategory"});
                const propNames = [infoName, "roleBasedAccess"];
                const propValues = [info, roleBasedAccess];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                roleBasedAccess {
                                    enabled
                                    roles {
                                        id
                                        name
                                    }
                                }
                                ${infoName} {
                                    name
                                    description
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, extraQueryName, categoryId, propNames, propValues).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        const queryInformation = {queryName: queryName, itemId: id, itemName: currentItemName};
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            id = '';
                            currentItemName = '';
                            const newRoleBasedAccess = {enabled: true, roles: []};
                            const newPropValues = [info, newRoleBasedAccess];
                            cy.confirmUsingQuery(query, extraQueryName, categoryId, propNames, newPropValues);
                        });
                    });
                });
            });
        });

        it("Deleting an item connected to a manufacturer will will disassociate the item from the manufacturer" , () => {
            const extraMutationName = "createManufacturer";
            const extraItemPath = "manufacturer";
            const extraQueryName = "manufacturers";
            const infoName = "manufacturerInfo";
            const role = {id: id, name: currentItemName};
            const roleBasedAccess = {enabled: true, roles: [role]};
            const info = [{name: `Cypress ${mutationName} rBA test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
            const roleBasedAccessInput = {enabled: true, roleIds: [id]};
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        roleBasedAccess: ${toFormattedString(roleBasedAccessInput)}
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${extraItemPath} {
                        id
                        roleBasedAccess {
                            enabled
                            roles {
                                id
                                name
                            }
                        }
                        ${infoName} {
                            name
                            description
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraItemPath).then((res) => {
                const manufacturerId = res.body.data[extraMutationName][extraItemPath].id;
                extraIds.push({itemId: manufacturerId, deleteName: "deleteManufacturer"});
                const propNames = [infoName, "roleBasedAccess"];
                const propValues = [info, roleBasedAccess];
                cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                roleBasedAccess {
                                    enabled
                                    roles {
                                        id
                                        name
                                    }
                                }
                                ${infoName} {
                                    name
                                    description
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, extraQueryName, manufacturerId, propNames, propValues).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        const queryInformation = {queryName: queryName, itemId: id, itemName: currentItemName};
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            id = '';
                            currentItemName = '';
                            const newRoleBasedAccess = {enabled: true, roles: []};
                            const newPropValues = [info, newRoleBasedAccess];
                            cy.confirmUsingQuery(query, extraQueryName, manufacturerId, propNames, newPropValues);
                        });
                    });
                });
            });
        });
    });
});