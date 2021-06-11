/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 7
describe('Mutation: deleteDiscount', () => {
    var id = '';
    var currentItemName = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'deleteDiscount';
    const createName = 'createDiscount';
    const queryName = "discounts";
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
        const name = `Cypress test: ${mutationName}'s deletee`;
        const input = `{name: "${name}", discountAmount: {amount: 15, currency: "USD"}}`;
        cy.createAndGetId(createName, "discount", input).then((returnedId: string) => {
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
    });

    context("Testing deletion when connected to other items or features", () => {
        it("Deleting an item connected to a category will will disassociate the item from the category" , () => {
            const discountType = "ASSIGNED_TO_CATEGORIES";
            const discount = {id: id, name: currentItemName, discountType: discountType, discountAmount: {amount: 15, currency: "USD"}}
            const updateMutation = `mutation {
                updateDiscount(
                    input: {
                        id: "${id}"
                        name: "${currentItemName}"
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discount.discountAmount)}
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
                    discount {
                        id
                        name
                        discountType
                    }
                }
            }`;
            cy.postMutAndValidate(updateMutation, "updateDiscount", "discount").then((response) => {
                cy.confirmMutationSuccess(response, "updateDiscount", "discount", ["discountType"], [discountType]).then(() => {
                    const extraMutationName = "createCategory";
                    const extraItemPath = "category";
                    const extraQueryName = "categories";
                    const infoName = "categoryInfo";
                    const discounts = [discount];
                    const info = [{name: `Cypress ${mutationName} category test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                    const mutation = `mutation {
                        ${extraMutationName}(
                            input: { 
                                discountIds: ["${id}"]
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
                                discounts {
                                    id
                                    name
                                    discountAmount {
                                        amount
                                        currency
                                    }
                                    discountType
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
                        const propNames = [infoName, "discounts"];
                        const propValues = [info, discounts];
                        cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                    nodes {
                                        id
                                        discounts {
                                            id
                                            name
                                            discountAmount {
                                                amount
                                                currency
                                            }
                                            discountType
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
                                    const newPropValues = [info, []];
                                    cy.confirmUsingQuery(query, extraQueryName, categoryId, propNames, newPropValues);
                                });
                            });
                        });
                    });
                });
            });
        });

        it("Deleting an item connected to a manufacturer will will disassociate the item from the manufacturer" , () => {
            const discountType = "ASSIGNED_TO_MANUFACTURERS";
            const discount = {id: id, name: currentItemName, discountType: discountType, discountAmount: {amount: 15, currency: "USD"}}
            const updateMutation = `mutation {
                updateDiscount(
                    input: {
                        id: "${id}"
                        name: "${currentItemName}"
                        discountType: ${discountType}
                        discountAmount: ${toFormattedString(discount.discountAmount)}
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
                    discount {
                        id
                        name
                        discountType
                    }
                }
            }`;
            cy.postMutAndValidate(updateMutation, "updateDiscount", "discount").then((response) => {
                cy.confirmMutationSuccess(response, "updateDiscount", "discount", ["discountType"], [discountType]).then(() => {
                    const extraMutationName = "createManufacturer";
                    const extraItemPath = "manufacturer";
                    const extraQueryName = "manufacturers";
                    const infoName = "manufacturerInfo";
                    const discounts = [discount];
                    const info = [{name: `Cypress ${mutationName} manufacturer test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                    const mutation = `mutation {
                        ${extraMutationName}(
                            input: { 
                                discountIds: ["${id}"]
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
                                discounts {
                                    id
                                    name
                                    discountAmount {
                                        amount
                                        currency
                                    }
                                    discountType
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
                        const propNames = [infoName, "discounts"];
                        const propValues = [info, discounts];
                        cy.confirmMutationSuccess(res, extraMutationName, extraItemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${extraQueryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                    nodes {
                                        id
                                        discounts {
                                            id
                                            name
                                            discountAmount {
                                                amount
                                                currency
                                            }
                                            discountType
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
                                    const newPropValues = [info, []];
                                    cy.confirmUsingQuery(query, extraQueryName, manufacturerId, propNames, newPropValues);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});