/// <reference types="cypress" />
// TEST COUNT: 12
// request count: 13
// TODO: More work needed for when createProducts is fully synced up and all required fields are known
describe('Mutation: createProduct', () => {
    let id = '';
    const mutationName = 'createProduct';
    const dataPath = 'product';
    const infoName = "productInfo";
    // TODO: Update with other required fields
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

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteProduct";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, dataPath).then(() => {
                id = "";
            });
        }
    });
    
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

    it("Mutation will fail with no 'languageCode' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: "Cypress no languageCode"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with no 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{languageCode: "Standard"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with no 'shortDescription' or 'fullDescription' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: "Cypress no descriptions", languageCode: "Standard"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with invalid 'languageCode' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: "Cypress invalid languageCode", languageCode: 6}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });
    
    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: 7, languageCode: "Standard"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'shortDescription'input", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: [{
                        name: "Cypress invalid shortDescription",
                        shortDescription: 5,
                        fullDescription: "Cypress testing invalid types",
                        languageCode: "Standard"
                    }]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'fullDescription' input", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    ${infoName}: [{
                        name: "Cypress invalid fullDescription",
                        shortDescription: "Cypress testing invalid types",
                        fullDescription: 5,
                        languageCode: "Standard"
                    }]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    // TODO: Tests for other missing or invalid required fields

    // TODO: Needs all the required fields
    it.skip("Mutation with valid 'Name', 'languageCode', and 'shortDescription' input will create a new item", () => {
        const name = "Cypress API Product SD";
        const info = [{
            name: name,
            shortDescription: "Testing creation",
            fullDescription: "Testing creating with shortDescription",
            languageCode: "Standard"
        }];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: [{
                        name: "${info[0].name}",
                        shortDescription: "${info[0].shortDescription}",
                        fullDescription: "${info[0].fullDescription}",
                        languageCode: "${info[0].languageCode}"
                    }]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, [infoName], [info]);
        });
    });

    // TODO: Same test as above, but with fullDescription

    // TODO: Needs all the required fields
    it.skip("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress Product customData";
        const info = [{name: name, languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: [{name: "${info[0].name}", languageCode: "${info[0].languageCode}"}]
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
                        languageCode
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = [infoName, "customData"];
            const testValues = [info, customData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, testValues).then(() => {
                const queryName = "products";
                const query = `{
                    ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    // TODO: Needs all the required fields
    it.skip("Mutation creates item that has all included input", () => {
        const name = "Cypress Product Input";
        const shortDescription = "Cypress testing 'create' mutation input";
        const fullDescription = "Cypress testing createProduct mutation input, to see if the input is added properly";
        const info = [{name: name, shortDescription: shortDescription, fullDescription: fullDescription, languageCode: "Standard"}];
        const seoData = [{
            searchEngineFriendlyPageName: "Cypress Input",
            metaKeywords:  "Cypress",
            metaDescription: "Cypress Input metaTag",
            metaTitle: "Cypress Input test",
            languageCode: "Standard"
        }];
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: [{
                        name: "${info[0].name}",
                        shortDescription: "${info[0].shortDescription}",
                        fullDescription: "${info[0].fullDescription}",
                        languageCode: "${info[0].languageCode}"
                    }]
                    seoData: [{
                        searchEngineFriendlyPageName: "${seoData[0].searchEngineFriendlyPageName}",
                        metaKeywords: "${seoData[0].metaKeywords}",
                        metaDescription: "${seoData[0].metaDescription}",
                        metaTitle: "${seoData[0].metaTitle}",
                        languageCode: "${seoData[0].languageCode}"
                    }]
                }
            ) {
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
                    seoData {
                        searchEngineFriendlyPageName
                        metaKeywords
                        metaDescription
                        metaTitle
                        languageCode
                    }
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = [infoName, "seoData"];
            const values = [info, seoData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});