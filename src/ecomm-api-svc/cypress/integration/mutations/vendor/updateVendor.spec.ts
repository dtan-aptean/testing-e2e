/// <reference types="cypress" />

import { confirmStorefrontEnvValues, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 15
describe('Mutation: updateVendor', () => {
    var id = '';
    var updateCount = 0;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateVendor';
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
                description
                languageCode
            }
        }
    `;
    const createName = 'createVendor';

    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (originalBaseUrl !== "" && Cypress.config("baseUrl") !== originalBaseUrl) {
            Cypress.log({message: "Switching the baseUrl back to the original"});
            Cypress.config("baseUrl", originalBaseUrl);
            cy.wait(1000);
        }
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds);
            // Delete the item we've been updating
            cy.deleteItem("deleteVendor", id);
        }
    });

    context("Testing basic required inputs", () => {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with no 'languageCode' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: [{name: "Cypress no languageCode"}] }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with no 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: [{languageCode: "Standard"}] }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with invalid 'languageCode' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: [{name: "Cypress invalid languageCode", languageCode: 6}] }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: [{name: 7, languageCode: "Standard"}] }) {
                    ${standardMutationBody}
                }
            }`
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed with valid 'id' and 'name' input", () => {
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: ${toFormattedString(info)}}) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = [infoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
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

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
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
                const propNames = ["customData", infoName];
                const propValues = [customData, info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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

        it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
            const info = [{name: `Cypress ${mutationName} customData extra`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const input = `{${infoName}: ${toFormattedString(info)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: "deleteVendor", itemName: info[0].name, queryName: queryName});
                const newInfo = [{name: `Cypress ${mutationName} CD extra updated`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            ${infoName}: ${toFormattedString(newInfo)}
                            customData: ${toFormattedString(newCustomData)}
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
                    const propNames = ["customData", infoName];
                    const propValues = [newCustomData, newInfo];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newInfo[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    customData
                                }
                            }
                        }`;
                        cy.postAndCheckCustom(query, queryName, id, newCustomData);
                    });
                });
            });
        });

        it("Mutation will correctly use all input", () => {
            updateCount++;
            const info = [
                {name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"},
                {name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}
            ];
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
            const email = "cypressVendorTest@testenvironment.com";
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
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
                        id: "${id}"
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
                        id: "${id}"
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
                        id: "${id}"
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