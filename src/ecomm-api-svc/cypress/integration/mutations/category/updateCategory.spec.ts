/// <reference types="cypress" />
// TEST COUNT: 8
// request count: 13
describe('Mutation: updateCategory', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'updateCategory';
    const queryName = "categories";
    const dataPath = 'category';
    const infoName = "categoryInfo";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            ${infoName} {
                name
                description
                languageCode
            }
        }
    `;
    const createName = 'createCategory';

    before(() => {
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if(id !== '') {
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
            }
            // Delete the item we've been updating
            const deletionName = "deleteCategory";
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
        const newDescription =  `${mutationName} cypress test #${updateCount}`;
        const info = [{name: `${newName}`, description: newDescription, languageCode: "Standard"}];
        cy.turnArrayIntoInput(info).then((infoString: string) => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: ${infoString}}) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = [infoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    description
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const newDescription =  `${mutationName} cypress test #${updateCount}`;
        const info = [{name: `${newName}`, description: newDescription, languageCode: "Standard"}];
        cy.turnArrayIntoInput(info).then((infoString: string) => {
            const customData = {data: `${dataPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        ${infoName}: ${infoString}
                        customData: {data: "${customData.data}", canDelete: ${customData.canDelete}}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${infoName} {
                            name
                            description
                            languageCode
                        }
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = [infoName, "customData"];
                const propValues = [info, customData];
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
    });

    it("Mutation with 'parentCategoryId' will succesfully attach the parent category", () => {
        const name = `Cypress subCategory 1`;
        const input = `{${infoName}: [{name: "${name}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            var subCategoryId = returnedId;
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${subCategoryId}"
                        parentCategoryId: "${id}"
                        ${infoName}: [{
                            name: "${name}"
                            languageCode: "Standard"
                        }]
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        parent {
                            id
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                extraIds.push({itemId: subCategoryId, deleteName: "deleteCategory"});
                const propNames = ["parent"];
                const propValues = [{id: `${id}`}];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                parent {
                                    id
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, subCategoryId, propNames, propValues);
                });
            });
        });
    });
    
    it("Mutation will correctly use all input", () => {
        updateCount++;
        const newName = `Cypress ${mutationName} Update ${updateCount}`;
        const newDescription =  `${mutationName} cypress test #${updateCount}`;
        const info = [
            {name: `${newName}`, description: newDescription, languageCode: "Standard"},
            {name: "Zypresse aktualisierenKategorie Aktualisieren2", description: "Translate desc to German", languageCode: "de-DE"}
        ];
        cy.turnArrayIntoInput(info).then((infoString: string) => {
            const displayOrder = Cypress._.random(0, 10);
            const seoData = [{
                searchEngineFriendlyPageName: "Cypress Update",
                metaKeywords:  "Cypress",
                metaDescription: "Cypress Update metaTag",
                metaTitle: "Cypress Update test",
                languageCode: "Standard"
            }];
            const priceRanges = "4-5";
            const published = Cypress._.random(0, 1) === 1;
            const showOnHomePage = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        displayOrder: ${displayOrder}
                        ${infoName}: ${infoString}
                        seoData: [{
                            searchEngineFriendlyPageName: "${seoData[0].searchEngineFriendlyPageName}",
                            metaKeywords: "${seoData[0].metaKeywords}",
                            metaDescription: "${seoData[0].metaDescription}",
                            metaTitle: "${seoData[0].metaTitle}",
                            languageCode: "${seoData[0].languageCode}"
                        }]
                        priceRanges: "${priceRanges}"
                        published: ${published}
                        showOnHomePage: ${showOnHomePage}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        displayOrder
                        ${infoName} {
                            name
                            description
                            languageCode
                        }
                        seoData {
                            searchEngineFriendlyPageName
                            metaKeywords
                            metaDescription
                            metaTitle
                            languageCode
                        }
                        priceRanges
                        published
                        showOnHomePage
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = [infoName, "displayOrder", "seoData", "priceRanges", "published", "showOnHomePage"];
                const propValues = [info, displayOrder, seoData, priceRanges, published, showOnHomePage];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                displayOrder
                                ${infoName} {
                                    name
                                    description
                                    languageCode
                                }
                                seoData {
                                    searchEngineFriendlyPageName
                                    metaKeywords
                                    metaDescription
                                    metaTitle
                                    languageCode
                                }
                                priceRanges
                                published
                                showOnHomePage
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});