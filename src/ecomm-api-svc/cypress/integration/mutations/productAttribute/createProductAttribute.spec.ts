/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 9
describe('Mutation: createProductAttribute', () => {
    var id = '';
    const mutationName = 'createProductAttribute';
    const queryName = "productAttributes";
	const deleteMutName = "deleteProductAttribute";
    const itemPath = 'productAttribute';
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
            values {
                name
            }
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

        it("Mutation will fail with no 'Name' input", () => {
            const values = [{name: 'Cypress PA v1'}, {name: 'Cypress PA v2'}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        values: ${toFormattedString(values)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { name: 7 }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'values' input", () => {
            const name = `Cypress ${mutationName} no values`;
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Values' input", () => {
            const name = "Cypress API Checkout Attribute Invalid values";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}", values: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation with valid 'Name' and 'Values' input will create a new item", () => {
            const name = "Cypress API Product Attribute";
            const values = [{name: `${mutationName} value 1`}, {name: `${mutationName} value 2`}];
            const mutation = `mutation {
                ${mutationName}(input: { name: "${name}", values: ${toFormattedString(values)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "values"];
                const propValues = [name, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                values {
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

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = "Cypress ProductAttributes customData";
            const values = [{name: `CustomData ${mutationName} value 1`}, {name: `CustomData ${mutationName} value 2`}];
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        values: ${toFormattedString(values)}
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
                        values {
                            name
                        }
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["customData", "name", "values"];
                const propValues = [customData, name, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const queryName = "productAttributes";
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
            const description = "Cypress testing 'create' mutation input";
            const name = "Cypress ProductAttribute Input";
            const values = [
                {
                    displayOrder: Cypress._.random(1, 20),
                    isPreSelected: Cypress._.random(0, 1) === 1, 
                    name: 'Cypress PA 1', 
                    priceAdjustment: {
                        amount: Cypress._.random(1, 5),
                        currency: "USD"
                    }, 
                    weightAdjustment: Cypress._.random(1, 10), 
                    cost: {
                        amount: Cypress._.random(1, 5),
                        currency: "USD"
                    }
                }, {
                    displayOrder: Cypress._.random(1, 20),
                    isPreSelected: Cypress._.random(0, 1) === 1, 
                    name: 'Cypress PA 2', 
                    priceAdjustment: {
                        amount: Cypress._.random(1, 5),
                        currency: "USD"
                    }, 
                    weightAdjustment: Cypress._.random(1, 10), 
                    cost: {
                        amount: Cypress._.random(1, 5),
                        currency: "USD"
                    }
                }
            ];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        description: "${description}"
                        name: "${name}"
                        values: ${toFormattedString(values)}
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
                        description
                        name
                        values {
                            displayOrder
                            isPreSelected
                            name
                            priceAdjustment {
                                amount
                                currency
                            }
                            weightAdjustment
                            cost {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "description", "values"];
                const propValues = [name, description, values];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                description
                                values {
                                    displayOrder
                                    isPreSelected
                                    name
                                    priceAdjustment {
                                        amount
                                        currency
                                    }
                                    weightAdjustment
                                    cost {
                                        amount
                                        currency
                                    }
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