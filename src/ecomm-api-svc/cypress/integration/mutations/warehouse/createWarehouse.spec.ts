/// <reference types="cypress" />

describe('Mutation: createWarehouse', () => {
    var id = '';
    const mutationName = 'createWarehouse';
    const deleteMutName = "deleteWarehouse";
    const queryName = "warehouses";
    const itemPath = 'warehouse';
    const standardMutationBody = `
        code
        message
        error
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
            const mutation = `mutation {
                ${mutationName}(input: { name: 7 }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without address object", () => {
            const nameInput = "Cypress API Warehouse Category";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with valid name, and empty address object", () => {
            const nameInput = "Cypress API Warehouse Category";
            const addressInput = {};
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" address: "${addressInput}"}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with valid name, and invalid address object missing region", () => {
            const nameInput = "Cypress API Warehouse Category";
            const country = "US";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" address: { country: "${country}"}}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with valid name, and invalid address object missing country", () => {
            const nameInput = "Cypress API Warehouse Category";
            const region = "Georgia";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" address: { region: "${region}"}}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with valid name, and invalid address object, invalid Country format", () => {
            const nameInput = "Cypress API Warehouse Category";
            const country = "United States of America";
            const region = "Georgia";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" address: { country: "${country}" region: "${region}"}}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with valid name, and invalid address object, invalid region format", () => {
            const nameInput = "Cypress API Warehouse Category";
            const country = "US";
            const region = "GA";
            const mutation = `mutation {
                ${mutationName}(input: { name: "${nameInput}" address: { country: "${country}" region: "${region}"}}) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation with valid name and address will create a new item", () => {
            const nameInput = "Cypress API Warehouse Category";
            const addressInput = {
                country: "US",
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${nameInput}" 
                        address: { 
                            country: "${addressInput.country}" 
                            region: "${addressInput.region}"
                        }
                    }
                ) {
                    ${standardMutationBody}
                }
            }`
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "address"];
                const propValues = [nameInput, addressInput];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    debugger;
                    const query = `{
                        ${queryName}(searchString: "${nameInput}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address: {
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
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const nameInput = "Cypress API Warehouse Category";
            const address = {
                country: "US",
                region: "Georgia",
                postalCode: "30004"
            }
            const customData = { data: `${itemPath} customData`, canDelete: true };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${nameInput}" 
                        address: { 
                            country: "${address.country}" 
                            region: "${address.region}"
                            postalCode: "${address.postalCode}
                        }
                        customData: {
                            data: "${customData.data}", 
                            canDelete: ${customData.canDelete}
                        }
                    }
                ) {
                    code
                    message
                    error
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
                const testValues = [customData, nameInput];
                cy.confirmMutationSuccess(res, mutationName, itemPath, names, testValues).then(() => {
                    const queryName = "warehouses";
                    const query = `{
                        ${queryName}(searchString: "${nameInput}", orderBy: {direction: ASC, field: NAME}) {
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
            const nameInput = "Cypress API Warehouse Category";
            const address = {
                country: "US",
                region: "Georgia"
            }
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${nameInput}" 
                        address: { 
                            country: "${address.country}" 
                            region: "${address.region}"
                        }
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        address
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "address"];
                const propValues = [nameInput, address];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${nameInput}", orderBy: {direction: ASC, field: NAME}) {
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

        it("Mutation creates item that has all included input and optional address properties", () => {
            const nameInput = "Cypress API Warehouse Category";
            const address = {
                country: "US",
                region: "Georgia",
                city: "Atlanta",
                postalCode: "30305",
                line1: "123 Cypress Test Street",
                line2: "Apartment ABC"
            }
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${nameInput}" 
                        address: { 
                            country: "${address.country}" 
                            region: "${address.region}"
                            city: "${address.city}"
                            postalCode: "${address.postalCode}"
                            line1: "${address.line1}"
                            line2: "${address.line2}"
                        }
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        name
                        address
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "address"];
                const propValues = [nameInput, address];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${nameInput}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    country
                                    region
                                    city
                                    postalCode
                                    line1
                                    line2
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