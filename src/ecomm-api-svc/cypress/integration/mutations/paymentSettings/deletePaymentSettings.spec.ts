/// <reference types="cypress" />

import { SupplementalItemRecord } from "../../../support/commands";

// TEST COUNT: 5
describe('Mutation: deletePaymentSettings', () => {
    var id = '';
    var currentCompanyName = "";
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = "deletePaymentSettings";
    const createName = "createPaymentSettings";
    const queryName = "paymentSettings";
    const companyMutName = "createCompany";
    const companyDelete = "deleteCompany";
    const companyQuery = "companies";
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
        itemName: currentCompanyName
    };

    const updateIdAndName = (providedId?: string, providedName?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
        currentCompanyName = providedName ? providedName : "";
        queryInformation.itemName = providedName ? providedName : "";
    };

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, mutationName).then(() => {
            cy.deleteCypressItems(companyQuery, companyDelete, undefined, `Cypress ${mutationName}`);
        });
    });

    afterEach(() => {
		if (!deleteItemsAfter) {
			return;
		}
        
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentCompanyName).then(() => {
                id = "";
                currentCompanyName = "";
            });
        }
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        
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
            const extraItemInput = { name: `Cypress ${mutationName} valid deletion test`, integrationKey: `Cypress-${mutationName}-deleted-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, "company", companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const input = `{companyId: "${companyId}"}`;
                cy.createAndGetId(createName, "paymentSettings", input).then((returnedId: string) => {
                    updateIdAndName(returnedId, extraItemInput.name);
                    const mutation = `mutation {
                        ${mutationName}(input: { id: "${id}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation).then((res) => {
                        const idQuery = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                }
                            }
                        }`
                        cy.postAndConfirmError(idQuery, true).then(() => {
                            const query = `{
                                ${queryName}(companyIds: "${companyId}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                    nodes {
                                        id
                                        company {
                                            id
                                            name
                                        }
                                    }
                                }
                            }`;
                            cy.postAndValidate(query, queryName).then((res) => {
                                const nodes = res.body.data[queryName].nodes;
                                expect(nodes.length).to.eql(0, "No items were returned by the query");
                                updateIdAndName();
                            });
                        });
                    });
                });
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            const extraItemInput = { name: `Cypress ${mutationName} preDeleted test`, integrationKey: `Cypress-${mutationName}-predeleted-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, "company", companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const input = `{companyId: "${companyId}"}`;
                cy.createAndGetId(createName, "paymentSettings", input).then((returnedId: string) => {
                    updateIdAndName(returnedId, extraItemInput.name);
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
            });
        });
    });
});
