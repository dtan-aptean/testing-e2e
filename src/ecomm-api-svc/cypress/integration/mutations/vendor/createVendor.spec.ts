/// <reference types="cypress" />
// TEST COUNT: 9
// request count: 10
describe('Mutation: createVendor', () => {
    let id = '';
    const mutationName = 'createVendor';
    const dataPath = 'vendor';
    const infoName = "vendorInfo";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            ${infoName} {
                name
                languageCode
            }
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteVendor";
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

    it("Mutation with valid 'Name' and 'languageCode' input will create a new item", () => {
        const name = "Cypress API Vendor";
        const info = [{name: name, languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: "${info[0].name}", languageCode: "${info[0].languageCode}"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, [infoName], [info]);
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress Vendor customData";
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
                const queryName = "vendors";
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

    it("Mutation creates item that has all included input", () => {
        const active = Cypress._.random(0, 1) === 1;
        const address = {
            city: "Alpharetta",
            country: "United States",
            line1: "4325 Alexander Dr",
            line2: "#100",
            postalCode: "30022",
            region: "Georgia"
        };
        const description = "Cypress testing 'create' mutation input";
        const displayOrder = Cypress._.random(1, 20);
        const email = "cypressVendorTest@testenvironment.com";
        const name = "Cypress Vendor Input";
        const info = [{name: name, description: description, languageCode: "Standard"}];
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
                    active: ${active}
                    address: {
                        city: "${address.city}",
                        country: "${address.country}",
                        line1: "${address.line1}",
                        line2: "${address.line2}",
                        postalCode: "${address.postalCode}",
                        region: "${address.region}"
                    }
                    displayOrder: ${displayOrder}
                    email: "${email}"
                    ${infoName}: [{
                        name: "${info[0].name}",
                        description: "${info[0].description}",
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
                    active
                    address {
                        city
                        country
                        line1
                        line2
                        postalCode
                        region
                    }
                    displayOrder
                    email
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
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["active", "address", "displayOrder", "email", infoName, "seoData"];
            const values = [active, address, displayOrder, email, info, seoData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});