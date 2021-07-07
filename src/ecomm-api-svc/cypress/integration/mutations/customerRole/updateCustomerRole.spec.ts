/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 9
describe('Mutation: updateCustomerRole', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateCustomerRole';
    const createName = "createCustomerRole";
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

	beforeEach(() => {
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{name: "${name}"}`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            itemCount++;
            id = returnedId;
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

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });


        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, standardMutationBody);
        });

        it("Mutation will fail if the only input provided is 'id'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: 7 }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed with valid 'id' and 'name' input", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name"];
                const propValues = [newName];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
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
                const propNames = ["customData", "name"];
                const propValues = [customData, newName];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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

        it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
            const name = `Cypress ${mutationName} customData extra`;
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const input = `{name: "${name}", customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: deleteMutName, itemName: name, queryName: queryName});
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            name: "${newName}"
                            customData: ${toFormattedString(newCustomData)}
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
                    const propNames = ["customData", "name"];
                    const propValues = [newCustomData, newName];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    customData
                                }
                            }
                        }`;
                        cy.postAndCheckCustom(query, queryName, id, newCustomData);
                    });
                });
            });
        });

        it("Mutation will correctly use all input", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const isTaxExempt = Cypress._.random(0, 1) === 1;
            const freeShipping = Cypress._.random(0, 1) === 1;
            const active = Cypress._.random(0, 1) === 1;
            const enablePasswordLifetime = Cypress._.random(0, 1) === 1;
            const overrideTaxDisplayType = Cypress._.random(0, 1) === 1;
            const defaultTaxDisplayType = Cypress._.random(0, 1) === 1 ? "EXCLUDING_TAX" : "INCLUDING_TAX";
            const isSystemRole = Cypress._.random(0, 1) === 1;
            const systemName = `Cypress ${mutationName} System Role Input`;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        isTaxExempt: ${isTaxExempt}
                        freeShipping: ${freeShipping}
                        active: ${active}
                        enablePasswordLifetime: ${enablePasswordLifetime}
                        name: "${newName}"
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
                        active
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
                const propNames = ["name", "isTaxExempt", "freeShipping", "active", "enablePasswordLifetime", "overrideTaxDisplayType", "defaultTaxDisplayType", "isSystemRole", "systemName"];
                const propValues = [newName, isTaxExempt, freeShipping, active, enablePasswordLifetime, overrideTaxDisplayType, defaultTaxDisplayType, isSystemRole, systemName];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                isTaxExempt
                                freeShipping
                                active
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