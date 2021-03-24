/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../support/commands";

var originalBaseUrl = Cypress.config("baseUrl");
confirmStorefrontEnvValues();

// TEST COUNT: 9
describe("Misc. Tests: isoCodes", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
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

    context("Orders Query: Testing response of country field", () => {
        const queryName = "orders";
        var trueTotalInput = "";
        before(() => {
            const query = `{
                ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
                    totalCount
                    nodes {
                        id
                    }
                }
            }`;
            cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                const { nodes, totalCount } = res.body.data[queryName];
                if (totalCount > nodes.length) {
                    trueTotalInput = totalCount > 0 ? "first: " + totalCount + ", ": "";
                }
            });
        });

        it("Query that requests billingInfo.address.country field will receive 2-digit ISO codes", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: TIMESTAMP}) {
                    totalCount
                    nodes {
                        id
                        billingInfo {
                            address {
                                city
                                country
                                line1
                                line2
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                const nodes = res.body.data[queryName].nodes;
                const validNodes = nodes.filter((node) => {
                    return node.billingInfo !== null && node.billingInfo.address !== null;
                });
                if (validNodes.length > 0) {
                    nodes.forEach((node, index) => {
                        const country = node.billingInfo.address.country;
                        assert.isString(country, `Order ${index + 1}'s billingInfo.address.country is a string`);
                        expect(country).to.have.length(2, `Order ${index + 1}'s billingInfo.address.country is a 2-digit value`);
                        expect(countryCodes).to.include(country, `Order ${index + 1}'s billingInfo.address.country is a valid country code`);
                    });
                } else {
                    Cypress.log({message: "Test inconclusive. No orders with a non-null billingInfo.address"});
                }
            });
        });

        it("Query that requests pickupAddress.country field will receive 2-digit ISO codes", () => {
            const query = `{
                ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: TIMESTAMP}) {
                    totalCount
                    nodes {
                        id
                        pickupAddress {
                            city
                            country
                            line1
                            line2
                            postalCode
                            region
                        }
                    }
                }
            }`;
            cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                const nodes = res.body.data[queryName].nodes;
                const validNodes = nodes.filter((node) => {
                    return node.pickupAddress !== null;
                });
                if (validNodes.length > 0) {
                    validNodes.forEach((node, index) => {
                        const country = node.pickupAddress.country;
                        assert.isString(country, `Order ${index + 1}'s pickupAddress.country is a string`);
                        expect(country).to.have.length(2, `Order ${index + 1}'s pickupAddress.country is a 2-digit value`);
                        expect(countryCodes).to.include(country, `Order ${index + 1}'s pickupAddress.country is a valid country code`);
                    });
                } else {
                    Cypress.log({message: "Test inconclusive. No orders with a non-null pickup address"});
                }
            });
        });
    });

    context("Vendors", () => {
        const queryName = "vendors";
        const itemPath = "vendor";
        const infoName = "vendorInfo";
        const deleteMutName = "deleteVendor";

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            // TODO: adapt deleteCypressItems to take an alternate URL
            cy.deleteCypressItems(queryName, deleteMutName, infoName);
        });

        context("Vendors Query: Testing response of country field", () => {
            var trueTotalInput = "";
            before(() => {
                const query = `{
                    ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                        totalCount
                        nodes {
                            id
                        }
                    }
                }`;
                cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                    const { nodes, totalCount } = res.body.data[queryName];
                    if (totalCount > nodes.length) {
                        trueTotalInput = totalCount > 0 ? "first: " + totalCount + ", ": "";
                    }
                });
            });

            it("Query that requests address.country field will receive 2-digit ISO codes", () => {
                const query = `{
                    ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: NAME}) {
                        totalCount
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
                        }
                    }
                }`;
                cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                    const nodes = res.body.data[queryName].nodes;
                    const validNodes = nodes.filter((node) => {
                        return node.address !== null;
                    });
                    if (validNodes.length > 0) {
                        validNodes.forEach((node, index) => {
                            const country = node.address.country;
                            assert.isString(country, `Vendor ${index + 1}'s address.country is a string`);
                            expect(country).to.have.length(2, `Vendor ${index + 1}'s address.country is a 2-digit value`);
                            expect(countryCodes).to.include(country, `Vendor ${index + 1}'s address.country is a valid country code`);
                        });
                    } else {
                        Cypress.log({message: "Test inconclusive. No vendors with a non-null address"});
                    }
                });
            });
        });

        context("createVendor Mutation: Testing country codes on address", () => {
            var id = "";
            const mutationName = "createVendor";

            afterEach(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (id !== "") {
                    cy.deleteItem(deleteMutName, id, originalBaseUrl).then(() => {
                        id = "";
                    });
                }
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

        context("updateVendor Mutation: Testing country codes on address", () => {
            var id = "";
            var itemCount = 1;
            const mutationName = "updateVendor";

            beforeEach(() => {
                const name = `Cypress ${mutationName} Test #${itemCount}`;
                const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
                cy.createAndGetId("createVendor", itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    itemCount++;
                });
            });

            afterEach(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (id !== "") {
                    // Delete the item we've been updating
                    cy.deleteItem(deleteMutName, id, originalBaseUrl);
                }
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
});