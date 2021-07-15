/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 12
describe('Mutation: updateProductSpecification', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var options = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateProductSpecification';
    const createName = 'createProductSpecification';
	const deleteMutName = "deleteProductSpecification";
    const queryName = "productSpecifications";
    const itemPath = 'productSpecification';
    const additionalFields = `options {
        id
        displayOrder
        name
    }`;
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            id
            name
            ${additionalFields}
        }
    `;

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName);
    });

	beforeEach(() => {
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{name: "${name}", options: [{displayOrder: ${Cypress._.random(0, 10)}, name: "Cypress PS update tests"}]}`;
        cy.createAndGetId(createName, itemPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.options);
            id = createdItem.id;
            itemCount++;
            options = createdItem.options;
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

        it.only("Mutation will fail with deleted 'id' input", () => {
            const options = [{name: 'Cypress PS v1'}, {name: 'Cypress PS v2'}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "Cypress ${mutationName} deleted Id Test"
                        options: ${toFormattedString(options)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.mutationDeletedId(id, mutationName, deleteMutName, mutation, itemPath )
            
        });

        it("Mutation will fail if the only input provided is 'id'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const options = [{name: 'Cypress PS v1'}, {name: 'Cypress PS v2'}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        options: ${toFormattedString(options)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: 7 }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'options' input", () => {
            const newName = `Cypress ${mutationName} no options`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'options' input", () => {
            const name = "Cypress API Product Attribute Invalid options";
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${name}", options: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed with valid 'id', 'name', and options input", () => {
            updateCount++;
            const optionsCopy = JSON.parse(JSON.stringify(options));
            optionsCopy[0].name = `Cypress PS update test #${updateCount}`;
            optionsCopy[0].displayOrder = Cypress._.random(0, 10);
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}", options: ${toFormattedString(optionsCopy)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name",  "options"];
                const propValues = [newName, optionsCopy];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                ${additionalFields}
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
            const optionsCopy = JSON.parse(JSON.stringify(options));
            optionsCopy[0].name = `Cypress CA update test #${updateCount}`;
            optionsCopy[0].displayOrder = Cypress._.random(0, 10);
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${newName}"
                        options: ${toFormattedString(optionsCopy)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        name
                        ${additionalFields}
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["customData", "name", "options"];
                const propValues = [customData, newName, optionsCopy];
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
            const input = `{name: "${name}", customData: ${toFormattedString(customData)}, options: [{displayOrder: ${Cypress._.random(0, 10)}, name: "Cypress PS customData test"}]}`;
            const extraInput = `customData
            ${additionalFields}`;
            cy.createAndGetId(createName, itemPath, input, extraInput).then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: deleteMutName, itemName: name, queryName: queryName});
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newOptions = createdItem.options;
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            name: "${newName}"
                            options: ${toFormattedString(newOptions)}
                            customData: ${toFormattedString(newCustomData)}
                        }
                    ) {
                        ${codeMessageError}
                        ${itemPath} {
                            id
                            name
                            ${additionalFields}
                            customData
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["customData", "name", "options"];
                    const propValues = [newCustomData, newName, newOptions];
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
            const newOption = {displayOrder: Cypress._.random(5, 9), name: "Cypress PS new option"};
            updateCount++;
            const optionsCopy = JSON.parse(JSON.stringify(options));
            optionsCopy[0].name = `Cypress CA update test #${updateCount}`;
            optionsCopy[0].displayOrder = Cypress._.random(0, 4);
            optionsCopy.push(newOption);
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const displayOrder = Cypress._.random(0, 10);
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        displayOrder: ${displayOrder}
                        name: "${newName}"
                        options: ${toFormattedString(optionsCopy)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        displayOrder
                        name
                        ${additionalFields}
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "displayOrder", "options"];
                const propValues = [newName, displayOrder, optionsCopy];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                displayOrder
                                ${additionalFields}
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});