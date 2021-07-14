/// <reference types="cypress" />

import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 5
describe('Mutation: deleteCompany', () => {
    var id = '';
    var currentItemName = '';
    const mutationName = 'deleteCompany';
    const createName = 'createCompany';
    const queryName = "companies";

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
        const name = `Cypress test: ${mutationName}'s deletee`;
        const key = generateRandomString("cypress");
        const input = `{name: "${name}", integrationKey: "${key}"}`;
        cy.createAndGetId(createName, "company", input).then((returnedId: string) => {
            updateIdAndName(returnedId, name);
        });
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.safeDelete(queryName, mutationName, id, currentItemName).then(() => {
                updateIdAndName();
            });
        }
    });

    function generateRandomString(value: string) {
        let key = Cypress._.random(0, 1000000);
        let integrationKey = value + key;
        return integrationKey;
    }

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, codeMessageError);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, codeMessageError);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, codeMessageError);
        });

        it("Mutation will succeed with valid 'id' input from an existing item", () => {
            cy.mutationBasicDelete(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });

        it("Mutation will fail when given 'id' input from an deleted item", () => {
            cy.mutationAlreadyDeleted(id, mutationName, codeMessageError, queryInformation).then(() => {
                updateIdAndName();
            });
        });
    });
});