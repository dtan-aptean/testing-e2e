/// <reference types="cypress" />

import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 7
describe('Mutation: createCustomerRole', () => {
    var id = '';
    const mutationName = 'createCustomerRole';
    const deleteMutName = "deleteCustomerRole";
    const queryName = "customerRoles";
    const itemPath = 'customerRole';
    const standardMutationBody = `
    ${codeMessageError}
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
            cy.mutationInvalidName(mutationName, standardMutationBody);
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

        it("Mutation will fail when creating an item with the same name as an existing item", () => {
            const name = "Cypress Duplicate Name Test";
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
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues).then(() => {
                        const mutationTwo = `mutation {
                            ${mutationName}(input: { 
                                name: "${name}",
                                freeShipping: true,
                                systemName: "Cypress Duplicated Name"
                            }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmMutationError(mutationTwo, mutationName, itemPath).then((resp) => {
                            // Make sure that the message has "unique" in it
                            expect(resp.body.data[mutationName].errors[0].message.toLowerCase()).to.include("invalid aptean id");
                        });
                    });
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = "Cypress CustomerRole customData";
            const customData = { data: `${itemPath} customData`, canDelete: true };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                    }
                ) {
                    ${codeMessageError}
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
            const overrideTaxDisplayType = Cypress._.random(0, 1) === 1;
            const defaultTaxDisplayType = Cypress._.random(0, 1) === 1 ? "EXCLUDING_TAX" : "INCLUDING_TAX";
            const isSystemRole = Cypress._.random(0, 1) === 1;
            const systemName = "Cypress System Role Input"
            const name = "Cypress Role Input";
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        isTaxExempt: ${isTaxExempt}
                        freeShipping: ${freeShipping}
                        active: ${active}
                        enablePasswordLifetime: ${enablePasswordLifetime}
                        name: "${name}"
                        overrideTaxDisplayType: ${overrideTaxDisplayType}
                        defaultTaxDisplayType: ${defaultTaxDisplayType}
                        isSystemRole: ${isSystemRole}
                        systemName: "${systemName}"
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        isTaxExempt
                        freeShipping
                        hasFreeShipping
                        active
                        isActive
                        enablePasswordLifetime
                        name
                        isSystemRole
                        systemName
                        overrideTaxDisplayType
                        defaultTaxDisplayType
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "isTaxExempt", "freeShipping", "hasFreeShipping", "active", "isActive", "enablePasswordLifetime", "overrideTaxDisplayType", "defaultTaxDisplayType", "isSystemRole", "systemName"];
                const propValues = [name, isTaxExempt, freeShipping, freeShipping, active, active, enablePasswordLifetime, overrideTaxDisplayType, defaultTaxDisplayType, isSystemRole, systemName];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                isTaxExempt
                                freeShipping
                                hasFreeShipping
                                active
                                isActive
                                enablePasswordLifetime
                                name
                                isSystemRole
                                systemName
                                overrideTaxDisplayType
                                defaultTaxDisplayType
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});