/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

describe('Mutation: updateWarehouse', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateWarehouse';
    const createName = 'createWarehouse';
    const deleteMutName = "deleteWarehouse";
    const queryName = "warehouses";
    const itemPath = 'warehouse';
    const additionalFields = `address {
        country
        region
    }`;
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            name
            ${additionalFields}
        }
    `;

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName);
    });

    beforeEach(() => {
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{name: "${name}", address: {country: "US", region: "Georgia"}}`;
        cy.createAndGetId(createName, itemPath, input, additionalFields).then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.discountAmount);
            id = createdItem.id;
            itemCount++;
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

        it("Mutation will fail if the only input provided is 'id'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const address = {
                country: "US",
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        address: ${toFormattedString(address)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const address = {
                country: "US",
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: 7, address: ${toFormattedString(address)} }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'address' input", () => {
            const newName = `Cypress ${mutationName} no address`;
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will succeed with valid 'id', 'name', 'address' input", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const newAddress = {
                country: "US",
                region: "New York"
            };
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "${newName}", address: ${toFormattedString(newAddress)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "amount"];
                const propValues = [newName, newAddress];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    country
                                    region
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
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
            updateCount++;
            const newName = `Cypress ${mutationName} Update ${updateCount}`;
            const newAddress = {
                country: "US",
                region: "New York"
            };
            const customData = { data: `${itemPath} customData`, canDelete: true };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}" 
                        name: "${newName}" 
                        address: ${toFormattedString(newAddress)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        address {
                            country
                            region
                        }
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["customData", "name", "address"];
                const propValues = [customData, newName, newAddress];
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
            const customData = { data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S'] };
            const newAddress = {
                country: "US",
                region: "New York"
            };
            const input = `{name: "${name}", address: ${toFormattedString(newAddress)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({ itemId: createdItem.id, deleteName: deleteMutName, itemName: name, queryName: queryName });
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newCustomData = { data: `${itemPath} customData`, newDataField: { canDelete: true } };
                const newerAddress = {
                    country: "US",
                    region: "Florida"
                };
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            name: "${newName}"
                            address: ${toFormattedString(newerAddress)}
                            customData: ${toFormattedString(newCustomData)}
                        }
                    ) {
                        code
                        message
                        error
                        ${itemPath} {
                            id
                            name
                            address {
                                country
                                region
                            }
                            customData
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["customData", "name", "address"];
                    const propValues = [newCustomData, newName, newerAddress];
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
            const newAddress = {
                country: "US",
                region: "Georgia",
                city: "Atlanta",
                line1: "123 spaghetti street",
                line2: "Apartment ABC",
                postalCode: "30305"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}" 
                        name: "${newName}" 
                        address: ${toFormattedString(newAddress)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        address {
                            country
                            region
                            city
                            line1
                            line2
                            postalCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["name", "address"];
                const propValues = [newName, newAddress];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    country
                                    region
                                    city
                                    line1
                                    line2
                                    postalCode
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