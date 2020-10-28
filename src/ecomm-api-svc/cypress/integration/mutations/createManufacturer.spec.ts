/// <reference types="cypress" />
// TEST COUNT: 5
// request count: 5
describe('Muation: createManufacturer', () => {
    let id = '';
    const mutationName = 'createManufacturer';
    const dataPath = 'manufacturer';
    const standardMutationBody = `
        code
        message
        error
        manufacturer {
            id
            name
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteManufacturer";
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
        const name = "Cypress API Manufacturer";
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

    it("Mutation creates item that has all included input", () => {
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress Manufacturer Input";
        const description = "Cypress testing 'create' mutation input";
        const metaTags = {
            keywords:  "Cypress",
            description: "Cypress Input metaTag",
            title: "Cypress Input test"
        };
        const priceRanges = "4-5";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    displayOrder: ${displayOrder}
                    name: "${name}"
                    description: "${description}"
                    metaTags: ${metaTags}
                    priceRanges: "${priceRanges}"
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    displayOrder
                    name
                    description
                    metaTags {
                        keywords
                        description
                        title
                    }
                    priceRanges
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const names = ["displayOrder", "name", "description", "metaTags", "priceRanges"];
            const values = [displayOrder, name, description, metaTags, priceRanges];
            cy.confirmMutationSuccess(res, mutationName, dataPath, names, values);
        });
    });
});