/// <reference types="cypress" />
// TEST COUNT: 7
describe('Mutation: updateVendor', () => {
    let id = '';
    let updateCount = 0;
    const mutationName = 'updateVendor';
    const queryName = "vendors";
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
                description
                languageCode
            }
        }
    `;
    const createName = 'createVendor';
    // Function to turn an object or array into a string to use as input
    function toInputString(item) {
        function iterateThrough (propNames?: string[]) {
            var returnValue = '';
            for (var i = 0; i < (propNames ? propNames.length : item.length); i++) {
                if (i !== 0) {
                    returnValue = returnValue + ', ';
                }
                var value = propNames ? item[propNames[i]]: item[i];
                if (typeof value === 'string') {
                    value = `"${value}"`;
                } else if (typeof value === 'object') {
                    // Arrays return as an object, so this will get both
                    value = toInputString(value);
                }
                returnValue = returnValue + (propNames ? `${propNames[i]}: ${value}`: value);
            }
            return returnValue;
        };
        var itemAsString = '{ ';
        var props = undefined;
        if (item === null) {
            return "null";
        } else if (item === undefined) {
            return "undefined";
        } else if (Array.isArray(item)) {
            itemAsString = '[';
        } else if (typeof item === 'object') {
            props = Object.getOwnPropertyNames(item);
        }
        itemAsString = itemAsString + iterateThrough(props) + (props ? ' }' : ']');
        return itemAsString;
    };

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete the item we've been updating
            const deletionName = "deleteVendor";
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
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", ${infoName}: ${toInputString(info)}}) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = [infoName];
            const propValues = [info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    ${infoName}: ${toInputString(info)}
                    customData: ${toInputString(customData)}
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
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation will correctly use all input", () => {
        updateCount++;
        const info = [
            {name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"},
            {name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"}
        ];
        const active = Cypress._.random(0, 1) === 1;
        const address = {
            city: "Alpharetta",
            country: "United States",
            line1: "4325 Alexander Dr",
            line2: "#100",
            postalCode: "30022",
            region: "Georgia"
        };
        const displayOrder = Cypress._.random(1, 20);
        const seoData = [{
            searchEngineFriendlyPageName: "Cypress Input",
            metaKeywords:  "Cypress",
            metaDescription: "Cypress Input metaTag",
            metaTitle: "Cypress Input test",
            languageCode: "Standard"
        }];
        const email = "cypressVendorTest@testenvironment.com";
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    active: ${active}
                    address: ${toInputString(address)}
                    displayOrder: ${displayOrder}
                    email: "${email}"
                    ${infoName}: ${toInputString(info)}
                    seoData: ${toInputString(seoData)}
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
            const propNames = [infoName, "active", "address", "displayOrder", "email", "seoData"];
            const propValues = [info, active, address, displayOrder, email, seoData];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
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
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });
});