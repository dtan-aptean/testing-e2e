/// <reference types="cypress" />
// TEST COUNT: 9
// request count: 10
describe('Mutation: createVendor', () => {
    let id = '';
    const mutationName = 'createVendor';
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
                languageCode
            }
        }
    `;
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
        const info = [{name: "Cypress API Vendor", languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: ${toInputString(info)} }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = [infoName];
            const propValues = [info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const info = [{name: "Cypress Vendor customData", description: `${mutationName} cypress customData`, languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
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
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["customData", infoName];
            const propValues = [customData, info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const queryName = "vendors";
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
        const displayOrder = Cypress._.random(1, 20);
        const email = "cypressVendorTest@testenvironment.com";
        const info = [{name: "Cypress Vendor Input", description: "Cypress testing 'create' mutation input", languageCode: "Standard"}, {name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"}];
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
            id = res.body.data[mutationName][dataPath].id;
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