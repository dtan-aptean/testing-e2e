/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteProductSpecification', () => {
    let id = '';
    let currentItemName = '';
    const extraIds = [];    // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'deleteProductSpecification';
    const creationName = 'createProductSpecification';
    const queryName = "productSpecifications";
    const deletedMessage = "product specification";
    const standardMutationBody = `
        code
        message
        error
    `;

    beforeEach(() => {
        const name = `Cypress test: ${mutationName}'s deletee`;
        const mutationInput = 'options: [{name: "PA deletee option"}]';
        cy.searchOrCreate(name, queryName, creationName, mutationInput).then((returnedId: string) => {
            id = returnedId;
            currentItemName = name;
        });
    });

    afterEach(() => {
        // Delete any supplemental items we created
        if (extraIds.length > 0) {
            for (var i = 0; i < extraIds.length; i++) {
                cy.wait(2000);
                var extraRemoval = `mutation {
                    ${extraIds[i].deleteName}(input: { id: "${extraIds[i].itemId}" }) {
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(extraRemoval, extraIds[i].deleteName);
            }
            extraIds = [];
        }
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeleted(false, currentItemName, id, queryName).then((itemPresent: boolean) => {
                if (itemPresent) {
                    const mutation = `mutation {
                        ${mutationName}(input: {id: "${id}"}){
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName).then(() => {
                        id = '';
                        currentItemName = '';
                    });
                }
            });
        }
    });

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
        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                id = '';
                currentItemName = '';
            });
        });
    });

    it("Mutation will fail when given 'id' input from an deleted item", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
            cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                id = '';
                currentItemName = '';
                cy.postAndConfirmMutationError(mutation, mutationName);
            });
        });
    });

    it("Deleting an item connected to a product will disassociate the item from the product", () => {
        const optionsQuery = `{
            ${queryName}(searchString: "${currentItemName}", orderBy: {direction: ASC, field: NAME}) {
                nodes {
                    id
                    name
                    options {
                        id
                        name
                    }
                }
            }
        }`;
        cy.postGQL(optionsQuery).then((response) => {
            // should be 200 ok
            expect(response.isOkStatusCode).to.be.equal(true);
            // no errors
            assert.notExists(response.body.errors, `One or more errors ocuured while executing query: ${optionsQuery}`);
            // has data
            assert.exists(response.body.data);
            // validate data types
            assert.isArray(response.body.data[queryName].nodes);
            const target = response.body.data[queryName].nodes.filter((item) => {
                return item.id === id;
            });
            const optionsId = target[0].options[0].id;
            const options = [{options: target[0].options}];
            const extraMutationName = "createProduct";
            const extraDataPath = "product";
            const productInfoName = "productInfo";
            const info = [{name: `Cypress ${mutationName} product test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${extraMutationName}(
                    input: { 
                        ${productInfoName}: ${toFormattedString(info)}
                        specificationOptionIds: ["${optionsId}"]
                    }
                ) {
                    code
                    message
                    error
                    ${extraDataPath} {
                        id
                        ${productInfoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, extraMutationName, extraDataPath).then((res) => {
                const productId = res.body.data[extraMutationName][extraDataPath].id;
                extraIds.push({itemId: productId, deleteName: "deleteProduct"});
                const propNames = [productInfoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, extraMutationName, extraDataPath, propNames, propValues).then(() => {
                    const optionsField = `options {
                        id
                        name
                    }`;
                    cy.queryByProductId("productSpecifications", optionsField, productId, options).then(() => {
                        const mutation = `mutation {
                            ${mutationName}(input: { id: "${id}" }) {
                                ${standardMutationBody}
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, mutationName).then((res) => {
                            expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                            cy.queryForDeleted(true, currentItemName, id, queryName).then(() => {
                                id = '';
                                currentItemName = '';
                                cy.queryByProductId("productSpecifications", optionsField, productId, []);
                            });
                        });
                    });
                });
            });
        });
    });
});