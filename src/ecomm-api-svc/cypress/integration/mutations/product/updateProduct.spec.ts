/// <reference types="cypress" />
// TEST COUNT: 5
// request count: 6
describe('Mutation: updateProduct', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'updateProduct';
    const dataPath = 'product';
    const infoName = "productInfo";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            ${infoName} {
                name
                shortDescription
                fullDescription
                languageCode
            }
        }
    `;
    const createName = 'createProduct';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        // TODO: ADD OTHER REQUIRED FIELDS
        const input = `{${infoName}: [{name: "${name}", shortDescription: "Cypress testing for ${mutationName}", fullDescription: "Lots of cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            if (extraIds.length > 0) {
                for (var i = 0; i < extraIds.length; i++) {
                    cy.wait(2000);
                    var extraRemoval = `mutation {
                        ${extraIds[i].deletionName}(input: { id: "${extraIds[i].id}" }) {
                            code
                            message
                            error
                        }
                    }`;
                    cy.postAndConfirmDelete(extraRemoval, extraIds[i].deletionName);
                }
            }
            // Delete the item we've been updating
            const deletionName = "deleteProduct";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName);
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

    it("Mutation will fail if the only input provided is 'id'", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'id' and 'name' input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const info = [{name: `${newName}`, languageCode: "Standard"}];
        
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", ${infoName}: [{name: "${info[0].name}", languageCode: "${info[0].languageCode}"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            cy.confirmMutationSuccess(res, mutationName, dataPath, [infoName], [info]).then(() => {
                const queryName = "products";
                const query = `{
                    ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postGQL(query).then((resp) => {
                    expect(resp.isOkStatusCode).to.be.equal(true);
                    assert.notExists(resp.body.errors);
                    assert.exists(resp.body.data);
                    assert.isArray(resp.body.data[queryName].nodes);

                    const targetNode = resp.body.data[queryName].nodes.filter((item) => {
                        return item.id === id;
                    });
                    const infoArray = targetNode[0][infoName];
                    const updatedItem = infoArray.filter((item) => {
                        return item.name === info[0].name && item.languageCode === info[0].languageCode;
                    });
                    expect(updatedItem.length).to.be.eql(1, "Exactly one item should have updated");
                });
            });
        });
    });
});