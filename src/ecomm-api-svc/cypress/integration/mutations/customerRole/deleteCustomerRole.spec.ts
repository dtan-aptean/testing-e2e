/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 8
describe('Mutation: deleteCustomerRole', () => {
    var id = '';
    var currentItemName = '';
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteCustomerRole';
    const createName = 'createCustomerRole';
    const queryName = "customerRoles";
    const standardMutationBody = `
        code
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
    `;

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        itemName: currentItemName
    };

    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentItemName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    var deleteItemsAfter = undefined as boolean | undefined;
	before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, mutationName);
	});

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee #${itemCount}`;
        const input = `{name: "${name}"}`;
        cy.createAndGetId(createName, "customerRole", input).then((returnedId: string) => {
            itemCount++;
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
			return;
		}
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentItemName).then(() => {
                updateIdAndName();
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
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                updateIdAndName();
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });

        it("Mutation will allow a new item to be created using the old item's name", () => {
            const createMut = `mutation {
                ${createName}(input: { name: "${currentItemName}" }) {
                    code
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
                    customerRole {
                        id
                        name
                    }
                }
            }`;
            cy.postAndConfirmMutationError(createMut, createName, "customerRole").then((resp) => {
                // Make sure that the message has "unique" in it
                expect(resp.body.data[createName].errors[0].message.toLowerCase()).to.include("unique");
                expect(resp.body.data[createName].errors[0].message).to.eql("Customer Role Name is Required and should be unique.");
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then(() => {
                    cy.postMutAndValidate(createMut, createName, "customerRole").then((res) => {
                        var newId = res.body.data[createName].customerRole.id;
                        updateIdAndName(newId, currentItemName);
                        const propNames = ["name"];
                        const propValues = [currentItemName];
                        cy.confirmMutationSuccess(res, createName, "customerRole", propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${currentItemName}", orderBy: {direction: ASC, field: NAME}) {
                                    nodes {
                                        id
                                        name
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, newId, propNames, propValues);
                        });
                    });
                });
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
                extraIds.push({itemId: categoryId, deleteName: "deleteCategory", itemName: info[0].name, queryName: extraQueryName});
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
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            updateIdAndName();
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
                extraIds.push({itemId: manufacturerId, deleteName: "deleteManufacturer", itemName: info[0].name, queryName: extraQueryName});
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
                        cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                            updateIdAndName();
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