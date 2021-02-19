/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../../support/commands";

// TEST COUNT: 12
describe('Mutation: createVendor', () => {
    var id = '';
    const mutationName = 'createVendor';
    const queryName = "vendors";
    const itemPath = 'vendor';
    const infoName = "vendorInfo";
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            ${infoName} {
                name
                languageCode
            }
        }
    `;
    
    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

    afterEach(() => {
        if (originalBaseUrl !== "" && Cypress.config("baseUrl") !== originalBaseUrl) {
            Cypress.log({message: "Switching the baseUrl back to the original"});
            Cypress.config("baseUrl", originalBaseUrl);
            cy.wait(1000);
        }
        if (id !== "") {
            cy.deleteItem("deleteVendor", id).then(() => {
                id = "";
            });
        }
    });
    
    context("Testing basic required inputs", () => {
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
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { ${infoName}: [{languageCode: "Standard"}] }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
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
                ${mutationName}(input: { ${infoName}: ${toFormattedString(info)} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
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
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const info = [{name: "Cypress Vendor customData", description: `${mutationName} cypress customData`, languageCode: "Standard"}];
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["customData", infoName];
                const propValues = [customData, info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const queryName = "vendors";
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
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
                country: "US",
                line1: "4325 Alexander Dr",
                line2: "#100",
                postalCode: "30022",
                region: "Georgia"
            };
            const displayOrder = Cypress._.random(1, 20);
            const email = "cypressVendorTest@testenvironment.com";
            const info = [
                {name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"}, 
                {name: "Cypress Vendor Input", description: "Cypress testing 'create' mutation input", languageCode: "Standard"}
            ];
            const seoData = [{
                searchEngineFriendlyPageName: "",
                metaKeywords:  "",
                metaDescription: "",
                metaTitle: "",
                languageCode: "de-DE"
            }, {
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
                        address: ${toFormattedString(address)}
                        displayOrder: ${displayOrder}
                        email: "${email}"
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "active", "address", "displayOrder", "email", "seoData"];
                const propValues = [info, active, address, displayOrder, email, seoData];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[1].name}", orderBy: {direction: ASC, field: NAME}) {
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

    context("Testing country codes on address", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
        var countryNames = [] as string[];
        var countryCodes = [] as string[];
        var countryRegions = [] as string[][];
        var countryCount = 0;
        before(() => {
            cy.getCountriesAndRegions().then((countryContents) => {
                const { countries, codes, regions } = countryContents;
                countryNames = countryNames.concat(countries);
                countryCodes = countryCodes.concat(codes);
                countryRegions = countryRegions.concat(regions);
                countryCount = countryNames.length;
            });
        });

        it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
            const countryIndex = Cypress._.random(0, countryCount - 1);
            const regionArray = countryRegions[countryIndex];
            const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
            const address = {
                country: countryNames[countryIndex],
                region: region
            };
            const info = [{name: `Cypress ${mutationName} country name`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        address: ${toFormattedString(address)}
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        address {
                            city
                            country
                            line1
                            line2
                            postalCode
                            region
                        }
                        ${infoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const errorMessage = res.body.errors[0].message;
                expect(errorMessage).to.contain("Country Or State Not Found");
            });
        });

        it("Mutation will fail when using an invalid ISO code as the address' country field", () => {
            const address = {
                city: "Alpharetta",
                country: "AP",
                line1: "4325 Alexander Dr",
                line2: "#100",
                postalCode: "30022",
                region: "Georgia"
            };
            const info = [{name: `Cypress ${mutationName} invalid country ISO`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        address: ${toFormattedString(address)}
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        address {
                            city
                            country
                            line1
                            line2
                            postalCode
                            region
                        }
                        ${infoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const errorMessage = res.body.errors[0].message;
                expect(errorMessage).to.contain("Country Or State Not Found");
            });
        });

        it("Mutation will succeed when using a valid ISO code as the address' country", () => {
            const countryIndex = Cypress._.random(0, countryCount - 1);
            const regionArray = countryRegions[countryIndex];
            const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
            const address = {
                country: countryCodes[countryIndex],
                region: region
            };
            const info = [{name: `Cypress ${mutationName} valid country ISO`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        address: ${toFormattedString(address)}
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        address {
                            city
                            country
                            line1
                            line2
                            postalCode
                            region
                        }
                        ${infoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "address"];
                const propValues = [info, address];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                address {
                                    city
                                    country
                                    line1
                                    line2
                                    postalCode
                                    region
                                }
                                ${infoName} {
                                    name
                                    languageCode
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });
});