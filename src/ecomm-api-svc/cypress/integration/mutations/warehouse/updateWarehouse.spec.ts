/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 8
describe('Mutation: updateWarehouse', () => {
    let id = '';
    let updateCount = 0;
    const mutationName = 'updateWarehouse';
    const queryName = "warehouses";
    const dataPath = 'warehouse';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
        }
    `;
    const createName = 'createWarehouse';

    /* before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{name: "${name}"}`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete the item we've been updating
            const deletionName = "deleteWarehouse";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName);
        }
    }); */

    it.skip("Mutation will fail without input", () => {
        const mutation = `mutation {
            ${mutationName} {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it.skip("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            ${mutationName}(input: {}) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it.skip("Mutation will fail with invalid 'id' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it.skip("Mutation will fail if the only input provided is 'id'", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it.skip("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it.skip("Mutation will succeed with valid 'id' and 'name' input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", name: "${newName}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name"];
            const propValues = [newName];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it.skip("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    name: "${newName}"
                    customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["customData", "name"];
            const propValues = [customData, newName];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it.skip("Mutation will correctly use all input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const address = {
            city: "Alpharetta",
            country: "United States",
            line1: "4325 Alexander Dr",
            line2: "#100",
            postalCode: "30022",
            region: "Georgia"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    address: ${toFormattedString(address)}
                    name: "${newName}"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    address {
                        city
                        country
                        line1
                        line2
                        postalCode
                        region
                    }
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["name", "address"];
            const propValues = [newName, address];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            name
                            address {
                                city
                                country
                                line1
                                line2
                                postalCode
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