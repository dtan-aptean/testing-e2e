/// <reference types="cypress" />

import { confirmStorefrontEnvValues, createInfoDummy, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 17
describe('Mutation: createCustomer', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'createCustomer';
    const deleteMutName = "deleteCustomer";
    const queryName = "customers";
    const itemPath = 'customer';
    const infoName = "customerInfo";
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
        }
    `;
    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };
    var childCatName = "";
    var parentCatName = "";
    var childCatId = "";
    var parentCatId = "";

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName, infoName);
    });

    afterEach(() => {
        debugger;
    });

    context("Testing basic required inputs", () => {
        it.only("Mutation will succeed with a minimum of 'email', 'firstName', and ;lastName' inputs", () => {
            const input = {
                email: 'testcustomer@test.com',
                firstName: 'Testy',
                lastName: 'McTesty',
            };

            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
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
                        email
                        firstName
                        lastName
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName];
                const propValues = input;
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${input.email}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
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

        it.only("Mutation will fail with a non-string 'Email' input", () => {
            const input = {
                email: 4,
                firstName: 'test',
                lastName: 'test',
            };

            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
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
                        email
                        firstName
                        lastName
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });
});