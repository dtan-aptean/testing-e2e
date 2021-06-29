/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 23
describe('Mutation: updateCompany', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var currentItemName = '';
    const extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateCompany';
    const createName = 'createCompany';
    const deleteMutName = "deleteCompany";
    const queryName = "companies";
    const itemPath = 'company';
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
        ${itemPath} {
            id
            name
        }
    `;
    var customerRoleIds = "";
    var customerIds = "";

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
        cy.deleteCypressItems(queryName, deleteMutName);
    });

	beforeEach(() => {
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const key = generateRandomString("cypress");
        const input = `{name: "${name}", integrationKey: "${key}"}`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            id = returnedId;
            itemCount++;
            updateIdAndName(returnedId, name);
        });
	});

    afterEach(() => {
		if (!deleteItemsAfter) {
			return;
		}
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
            // Delete the item we've been updating
            cy.deleteItem(deleteMutName, id);
        }
    });

    function generateRandomString (value: string) {
        let key = Cypress._.random(0, 1000000);
        let integrationKey = value + key;
        return integrationKey;
    }

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

        it("Mutation will fail when input 'id' is invalid", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will act as a query statement if the only input provided is 'id'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                } 
            }`;
            cy.postAndValidate(mutation, mutationName).then((res) => {
                expect(res.body.data[mutationName].message).to.have.string("company updated");
                expect(res.body.data[mutationName][itemPath].id.toLowerCase()).to.be.eql(id.toLowerCase());
            });
        });

        it("Mutation with valid 'Id' and invalid 'Name' input will fail", () => {
            let val = true;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: ${val} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: '+ val);
            });
        });

        it("Mutation will succeed with valid 'Id' and 'Name' input", () => {
            const companyName = "Cypress API Update Company";
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${companyName}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name"];
                const propValues = [companyName];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
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

    context("Testing with deleted Id", () => {
        it("Mutation will fail when deleted 'Id' is provided as an input", () => {
            const companyName = "Cypress API Invalid Company";
            const delMutation = `mutation {
                ${deleteMutName}(input: { id: "${id}" }) {
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
                }
            }`;
            cy.postAndConfirmDelete(delMutation, deleteMutName, queryInformation).then(() => {
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}", name: "${companyName}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                    expect(resp.body.data[mutationName].errors[0].message).to.have.string("Invalid Aptean Id");
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required inputs and 'customData' input updates an item with customData", () => {
            const name = "Cypress Company customData";
            const key = generateRandomString("cypress");
            const customData = { data: `${itemPath} customData`, canDelete: true };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}", name: "${name}"
                        customData: ${toFormattedString(customData)} 
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
                    ${itemPath} {
                        id
                        name
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "customData"];
                const propValues = [name, customData];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then((resp) => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: { direction: ASC, field: NAME }) {
                            nodes {
                                id
                                name
                                integrationKey
                                customData
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation updates an item that has all included inputs", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = "Cypress Update Company All inputs";
            const extraCreateCustomerRole = "createCustomerRole";
            const extraPathCustomerRole = "customerRole";
            const extraQueryCustomerRole = "customerRoles";
            const customerEmail = generateRandomString("cypress");
            const extraCreateCustomer = "createCustomer";
            const extraPathCustomer = "customer";
            const extraQueryCustomer = "customers";
            const extraItemInputCustomerRole = { name: customerRoleName };
            const extraItemInputCustomer = { firstName: "Cypress", lastName: "Tester", email: customerEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreateCustomerRole, extraPathCustomerRole, extraQueryCustomerRole, extraItemInputCustomerRole).then((resultsCusRole) => {
                const { items, itemIds } = resultsCusRole;
                customerRoleIds = itemIds[0];
                const dummyCustomerRole = items;
                cy.createAssociatedItems(1, extraCreateCustomer, extraPathCustomer, extraQueryCustomer, extraItemInputCustomer).then((resultsCust) => {
                    const { items, itemIds } = resultsCust;
                    customerIds = itemIds[0];
                    const dummyCustomer = items;
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            id: "${id}", name: "${companyName}"
                            customerRoleIds: [{
                                id: "${customerRoleIds}"
                                action: ASSIGN
                            }]
                            customerIds: [{
                                id: "${customerIds}"
                                action: ASSIGN
                            }]
                        }) {
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
                            ${itemPath} {
                                id
                                name
                                integrationKey
                                customerRoles {
                                    id
                                    name
                                }
                                customers {
                                    id
                                    firstName
                                    lastName
                                    email
                                }
                            }
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = ["name", "customerRoles", "customers"];
                        const propValues = [companyName, dummyCustomerRole, dummyCustomer];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                    nodes {
                                        id
                                        name
                                        integrationKey
                                        customerRoles {
                                            id
                                            name
                                        }
                                        customers {
                                            id
                                            firstName
                                            lastName
                                            email
                                        }
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        });
                    });
                });
            });
        });
    });

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'customerRoleIds' with action ASSIGN will successfully update and attach 'customerRoleIds' with Company", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerRoleIds: [{
                            id: "${itemIds[0]}"
                            action: ASSIGN
                        }]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["name", "customerRoles"];
                    const propValues = [companyName, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation with 'customerRoleIds' with action REMOVE will successfully update and remove 'customerRoleIds' with Company", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(3, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customerRoles"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerRoleIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                    { id: "${itemIds[1]}"
                                    action: REMOVE }
                                    { id: "${itemIds[2]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                            id = res.body.data[mutationName][itemPath].id;
                            const custRolesAfterRemoval = [];
                            const propNames = ["name", "customerRoles"];
                            const propValues = [companyName, custRolesAfterRemoval];
                            cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                                const query = `{
                                    ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                        nodes {
                                            id
                                            name
                                            integrationKey
                                            customerRoles {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }`;
                                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                            });
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerRoleIds' with action ASSIGN will fail in two different requests", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.log(extraItemInput);
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerRoleIds: [{
                            id: "${itemIds[0]}"
                            action: ASSIGN
                        }]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["name", "customerRoles"];
                    const propValues = [companyName, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                            expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Cannot Add The Same Customer Role Twice");
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerRoleIds' with action REMOVE will fail in two different requests", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customerRoles"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerRoleIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                            id = res.body.data[mutationName][itemPath].id;
                            const custRolesAfterRemoval = [];
                            const propNames = ["name", "customerRoles"];
                            const propValues = [companyName, custRolesAfterRemoval];
                            cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                                const query = `{
                                    ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                        nodes {
                                            id
                                            name
                                            integrationKey
                                            customerRoles {
                                                id
                                                name
                                            }
                                        }
                                    }
                                }`;
                                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                                    expect(resp.body.data[mutationName].errors[0].message).to.have.string("Invalid customerRole ids");
                                });
                            });
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerRoleIds' with action ASSIGN will fail in a single request", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerRoleIds: [
                            { id: "${itemIds[0]}"
                            action: ASSIGN }
                            { id: "${itemIds[0]}"
                            action: ASSIGN }
                        ]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                    expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Duplicate Customer Role Ids");
                });
            });
        });

        it("Mutation with duplicate 'customerRoleIds' with action REMOVE will fail in a single request", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customerRoles"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerRoleIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE },
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customerRoles {
                                        id
                                        name
                                    }
                                }
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                            expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Duplicate Customer Role Ids");
                        });
                    });
                });
            });
        });

        it("Mutation with 'customerIds' with action ASSIGN will successfully update and attach 'customerIds' with Company", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerIds: [{
                            id: "${itemIds[0]}"
                            action: ASSIGN
                        }]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["name", "customers"];
                    const propValues = [companyName, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation with 'customerIds' with action REMOVE will successfully update and remove 'customerIds' with Company", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(3, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customers"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                    { id: "${itemIds[1]}"
                                    action: REMOVE }
                                    { id: "${itemIds[2]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                            id = res.body.data[mutationName][itemPath].id;
                            const custAfterRemoval = [];
                            const propNames = ["name", "customers"];
                            const propValues = [companyName, custAfterRemoval];
                            cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                                const query = `{
                                    ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                        nodes {
                                            id
                                            name
                                            integrationKey
                                            customers {
                                                id
                                                firstName
                                                lastName
                                                email
                                            }
                                        }
                                    }
                                }`;
                                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                            });
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerIds' with action ASSIGN will fail in two different requests", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerIds: [{
                            id: "${itemIds[0]}"
                            action: ASSIGN
                        }]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["name", "customers"];
                    const propValues = [companyName, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                            expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Customer Is Already Associated With Some Company");
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerIds' with action REMOVE will fail in two different requests", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customers"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                            id = res.body.data[mutationName][itemPath].id;
                            const custAfterRemoval = [];
                            const propNames = ["name", "customers"];
                            const propValues = [companyName, custAfterRemoval];
                            cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                                const query = `{
                                    ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                        nodes {
                                            id
                                            name
                                            integrationKey
                                            customers {
                                                id
                                                firstName
                                                lastName
                                                email
                                            }
                                        }
                                    }
                                }`;
                                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                                    expect(resp.body.data[mutationName].errors[0].message).to.have.string("Invalid Aptean Id");
                                });
                            });
                        });
                    });
                });
            });
        });

        it("Mutation with duplicate 'customerIds' with action ASSIGN will fail in a single request", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerIds: [
                            { id: "${itemIds[0]}"
                            action: ASSIGN }
                            { id: "${itemIds[0]}"
                            action: ASSIGN }
                        ]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                    expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Duplicate Customer Ids");
                });
            });
        });

        it("Mutation with duplicate 'customerIds' with action REMOVE will fail in a single request", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds;
                const createMutation = `mutation {
                    ${createName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerIds: ${toFormattedString(itemIds)}
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(createMutation, createName, itemPath).then((res) => {
                    id = res.body.data[createName][itemPath].id;
                    const propNames = ["name", "integrationKey", "customers"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, createName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                nodes {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                        const mutation = `mutation {
                            ${mutationName}(input: {
                                id: "${id}", name: "${companyName}"
                                customerIds: [
                                    { id: "${itemIds[0]}"
                                    action: REMOVE },
                                    { id: "${itemIds[0]}"
                                    action: REMOVE }
                                ]
                            }) {
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
                                ${itemPath} {
                                    id
                                    name
                                    integrationKey
                                    customers {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                            expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("Duplicate Customer Ids");
                        });
                    });
                });
            });
        });

        it("Mutation will fail when same 'customerRoleId' is passed for ASSIGN and REMOVE action", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerRoleIds: [
                            {id: "${itemIds[0]}"
                            action: ASSIGN}
                            {id: "${itemIds[0]}"
                            action: REMOVE}
                        ]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customerRoles {
                                id
                                name
                            }
                        }
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                    expect(resp.body.data[mutationName].errors[0].message).to.have.string("Duplicate Customer Role Ids");
                });
            });
        });

        it("Mutation will fail when same 'customerId' is passed for ASSIGN and REMOVE action", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { items, itemIds } = results;
                customerIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}", name: "${companyName}"
                        customerIds: [
                            {id: "${itemIds[0]}"
                            action: ASSIGN}
                            {id: "${itemIds[0]}"
                            action: REMOVE}
                        ]
                    }) {
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
                        ${itemPath} {
                            id
                            name
                            integrationKey
                            customers {
                                id
                                firstName
                                lastName
                                email
                            }
                        }
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((resp) => {
                    expect(resp.body.data[mutationName].errors[0].message).to.have.string("Duplicate Customer Ids");
                });
            });
        });
    });
});