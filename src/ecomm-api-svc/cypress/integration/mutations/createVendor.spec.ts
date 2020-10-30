/// <reference types="cypress" />
// TEST COUNT: 6
// request count: 7
describe('Muation: createVendor', () => {
    let id = '';
    const mutationName = 'createVendor';
    const dataPath = 'vendor';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            name
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

    it("Mutation will fail with invalid 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { name: 7 }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with valid 'Name' input will create a new item", () => {
        const name = "Cypress API Vendor";
        const mutation = `mutation {
            ${mutationName}(input: { name: "${name}" }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            cy.confirmMutationSuccess(res, mutationName, dataPath, ["name"], [name]);
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const name = "Cypress Vendor customData";
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    name: "${name}"
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
            id = res.body.data[mutationName][dataPath].id;
            const names = ["name", "customData"];
            const testValues = [name, customData];
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
        const metaTags = {
            keywords:  "Cypress",
            description: "Cypress Input metaTag",
            title: "Cypress Input test"
        };
        const name = "Cypress Vendor Input";
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
                    };
                    description: "${description}"
                    displayOrder: ${displayOrder}
                    email: "${email}"
                    metaTags: {
                        keywords:  "${metaTags.keywords}",
                        description: "${metaTags.description}",
                        title: "${metaTags.title}"
                    }
                    name: "${name}"
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
                    description
                    displayOrder
                    email
                    metaTags {
                        keywords
                        description
                        title
                    }
                    name
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["active", "address", "description", "displayOrder", "email", "metaTags", "name"];
            const values = [active, address, description, displayOrder, email, metaTags, name];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});