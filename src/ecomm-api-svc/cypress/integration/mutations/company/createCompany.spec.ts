/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

//TEST COUNT: 16
describe('Mutation: createCompany', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'createCompany';
    const deleteMutName = 'deleteCompany';
    const queryName = 'companies';
    const itemPath = 'company';
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            id
            name
            integrationKey
        }
    `;
    var customerRoleIds = "";
    var customerIds = "";

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
            cy.wait(1000);
        }
    });

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    function generateRandomString (value: string) {
        let key = Cypress._.random(0, 1000000);
        let integrationKey = value + key;
        return integrationKey;
    }

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { integrationKey: "ABC" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with no 'Integration Key' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { name: "Cypress create company" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' and valid 'Integration Key' input", () => {
            const mutation  = `mutation {
                ${mutationName}(input: { name: 2, integrationKey: "cypress" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with valid 'Name' and invalid 'Integration Key' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { name: "Cypress create company", integrationKey: 7 }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' and invalid 'Integration Key' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { name: true, integrationKey: 3 }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation with valid 'Name' and 'Integration Key' input will create a new item", () => {
            const name  = "Cypress API Company"
            const key = generateRandomString("cypress");
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}", integrationKey: "${key}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "integrationKey"];
                const propValues = [name, key];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: { direction: ASC, field: NAME }) {
                            nodes {
                                id
                                name
                                integrationKey
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context("Testing duplicate 'integration Key' input", () => {
        it("Mutation returns an error when 'Integration Key' is duplicated", () => {
            const name = "Cypress API Company key";
            const key = generateRandomString("cypress");
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}", integrationKey: "${key}" }) {
                    ${standardMutationBody}
                }
            }`
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "integrationKey"];
                const propValues = [name, key];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: { direction: ASC, field: NAME }) {
                            nodes {
                                id
                                name
                                integrationKey
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    const extraMutation = `mutation {
                        ${mutationName}(input: { name: "Cypress Create Company", integrationKey: "${key}" }) {
                            ${standardMutationBody}
                        }
                    }`
                    cy.postAndConfirmMutationError(extraMutation, mutationName, itemPath).then((resp) => {
                        expect(resp.body.data[mutationName].errors[0].message).to.be.eql("Invalid Integration Key");
                        expect(resp.body.data[mutationName].errors[0].details[0].message).to.have.string("IntegrationKey Already Exists "+ key);
                    });
                });
            });
        });
    });

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'customerIds' input will successfully create an item with an attached 'customerId'", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                customerIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerIds: "${itemIds[0]}"
                    }) {
                        ${codeMessageError}
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
                    const propNames = ["name", "integrationKey", "customers"];
                    const propValues = [companyName, companyKey, items];
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

        it("Mutation with 'customerIds' input will successfully create an item with some attached 'customerIds'", () => {
            const randomEmail = generateRandomString("cypress");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomer";
            const extraPath = "customer";
            const extraQuery = "customers";
            const extraItemInput = { firstName: "Cypress", lastName: "Tester", email: randomEmail+".tester@email.com" };
            cy.createAssociatedItems(3, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                customerIds = itemIds;
                const mutation = `mutation {
                    ${mutationName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerIds: ${toFormattedString(itemIds)}
                    }) {
                        ${codeMessageError}
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
                    const propNames = ["name", "integrationKey", "customers"];
                    const propValues = [companyName, companyKey, items];
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

        it("Mutation with 'customerRoleIds' input will successfully create an item with an attached 'customerRoleId'", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.log(extraItemInput);
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: "${itemIds[0]}"
                    }) {
                        code
                        message
                        errors{
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
                    const propNames = ["name", "integrationKey", "customerRoles"];
                    const propValues = [companyName, companyKey, items];
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

        it("Mutation will fail when duplicate 'customerRoleIds' are passed as input", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                customerRoleIds = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: ["${itemIds[0]}", "${itemIds[0]}"]
                    }) {
                        code
                        message
                        errors{
                            code
                            message
                            domain
                            details{
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.be.eql("Duplicate Customer Role Ids");
                });
            });
        });

        it("Mutation with 'customerRoleIds' input will successfully create an item with some attached 'customerRoleIds'", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = { name: customerRoleName };
            cy.createAssociatedItems(3, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                customerRoleIds = itemIds;
                const mutation = `mutation {
                    ${mutationName}(input: {
                        name: "${companyName}", integrationKey: "${companyKey}"
                        customerRoleIds: ${toFormattedString(itemIds)}
                    }) {
                        ${codeMessageError}
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
                    const propNames = ["name", "integrationKey", "customerRoles"];
                    const propValues = [companyName, companyKey, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: {direction: ASC, field: NAME}) {
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

    context("Testing customData input and optional input", () => {
        it("Mutation with all required inputs and 'customData' input creates an item with customData", () => {
            const name = "Cypress Company customData";
            const key = generateRandomString("cypress");
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}", integrationKey: "${key}"
                        customData: ${toFormattedString(customData)} 
                    }
                ) {
                    code
                    message
                    errors{
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
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "integrationKey", "customData"];
                const propValues = [name, key, customData];
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

        it("Mutation creates an item that has all included inputs", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = "Cypress Create Company All inputs";
            const companyKey = generateRandomString("cypress");
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
                const { deletionIds, items, itemIds } = resultsCusRole;
                addExtraItemIds(deletionIds);
                customerRoleIds = itemIds[0];
                const dummyCustomerRole = items;
                cy.createAssociatedItems(1, extraCreateCustomer, extraPathCustomer, extraQueryCustomer, extraItemInputCustomer).then((resultsCust) => {
                    const { deletionIds, items, itemIds } = resultsCust;
                    addExtraItemIds(deletionIds);
                    customerIds = itemIds[0];
                    const dummyCustomer = items;
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            name: "${companyName}", integrationKey: "${companyKey}"
                            customerRoleIds: "${customerRoleIds}"
                            customerIds: "${customerIds}"
                        }) {
                            ${codeMessageError}
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
                        const propNames = ["name", "integrationKey", "customerRoles", "customers"];
                        const propValues = [companyName, companyKey, dummyCustomerRole, dummyCustomer];
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
});
