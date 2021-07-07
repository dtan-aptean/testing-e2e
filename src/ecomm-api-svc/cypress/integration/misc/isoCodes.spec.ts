/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../support/commands";
import { codeMessageError } from "../../support/mutationTests";

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

        it("Query that requests billingInfo.address.country field will receive 2-digit ISO codes", () => {
            const query = `{
                ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
                    totalCount
                    nodes {
                        id
                        paymentInfo {
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
                }
            }`;
            cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                const nodes = res.body.data[queryName].nodes;
                const validNodes = nodes.filter((node) => {
                    return node.paymentInfo.billingInfo !== null && node.paymentInfo.billingInfo.address !== null;
                });
                if (validNodes.length > 0) {
                    nodes.forEach((node, index) => {
                        const country = node.paymentInfo.billingInfo.address.country;
                        assert.isString(country, `Order ${index + 1}'s paymentInfo.billingInfo.address.country is a string`);
                        expect(country).to.have.length(2, `Order ${index + 1}'s paymentInfo.billingInfo.address.country is a 2-digit value`);
                        expect(countryCodes).to.include(country, `Order ${index + 1}'s paymentInfo.billingInfo.address.country is a valid country code`);
                    });
                } else {
                    Cypress.log({ message: "Test inconclusive. No orders with a non-null billingInfo.address" });
                }
            });
        });

        it("Query that requests pickupAddress.country field will receive 2-digit ISO codes", () => {
            const query = `{
                ${queryName}(orderBy: {direction: ASC, field: TIMESTAMP}) {
                    totalCount
                    nodes {
                        id
                        pickupInfo {
                            contact {
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
                }
            }`;
            cy.postAndValidate(query, queryName, originalBaseUrl).then((res) => {
                const nodes = res.body.data[queryName].nodes;
                const validNodes = nodes.filter((node) => {
                    return node.pickupInfo.contact !== null && node.pickupInfo.contact.address !== null;
                });
                if (validNodes.length > 0) {
                    validNodes.forEach((node, index) => {
                        const country = node.pickupInfo.contact.address.country;
                        assert.isString(country, `Order ${index + 1}'s pickupInfo.contact.address.country is a string`);
                        expect(country).to.have.length(2, `Order ${index + 1}'s pickupInfo.contact.address.country is a 2-digit value`);
                        expect(countryCodes).to.include(country, `Order ${index + 1}'s pickupInfo.contact.address.country is a valid country code`);
                    });
                } else {
                    Cypress.log({ message: "Test inconclusive. No orders with a non-null pickup address" });
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
            cy.deleteCypressItems(queryName, deleteMutName, infoName, undefined, originalBaseUrl);
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
                        trueTotalInput = totalCount > 0 ? "first: " + totalCount + ", " : "";
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
                        Cypress.log({ message: "Test inconclusive. No vendors with a non-null address" });
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

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    country: countryNames[countryIndex],
                    region: region,
                    postalCode: "30022"
                };
                const info = [{ name: `Cypress ${mutationName} country name`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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
                    const errorMessage = res.body.data[mutationName].errors[0].message;
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
                const info = [{ name: `Cypress ${mutationName} invalid country ISO`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    country: countryCodes[countryIndex],
                    region: region,
                    postalCode: "30022"
                };
                const info = [{ name: `Cypress ${mutationName} valid country ISO`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    country: countryNames[countryIndex],
                    region: region,
                    postalCode: "30022"
                };
                const info = [{ name: `Cypress ${mutationName} country name`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}"
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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
                    const errorMessage = res.body.data[mutationName].errors[0].message;
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
                const info = [{ name: `Cypress ${mutationName} invalid country ISO`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}"
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    country: countryCodes[countryIndex],
                    region: region,
                    postalCode: "30022"
                };
                const info = [{ name: `Cypress ${mutationName} valid country ISO`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}"
                            address: ${toFormattedString(address)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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

    context.skip("Addresses", () => {
        const queryName = "addresses";
        const itemPath = "addressInfo";
        const deleteMutName = "deleteAddress";
        const queryNameForCompany = "companies";
        const queryNameForCustomer = "customers"

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            cy.queryCompanyCustomerWithAddresses(queryNameForCompany,undefined,originalBaseUrl).then((ids:[]) =>{
                for(let i=0; i<ids.length;i++){
                    cy.deleteSpecialCypressItems(queryName, deleteMutName, ids[i], "companyId",undefined,originalBaseUrl );
                }
            });
            cy.queryCompanyCustomerWithAddresses(queryNameForCustomer,undefined,originalBaseUrl).then((ids:[]) =>{
                for(let i=0; i<ids.length;i++){
                    cy.deleteSpecialCypressItems(queryName, deleteMutName, ids[i], "customerId",undefined,originalBaseUrl );
                }
            });
        });

        Cypress.Commands.add("queryForValidNodes", (queryName: string, ids: [], specialInputName: string, altUrl: string) => {
            Cypress.log({
                name: "queryForValidNodes",
                message: `validate values field for ${queryName}`,
                consoleProps: () => {
                    return {
                        // "Response": res,
                        "Query name": queryName
                    };
                },
            });
            var nodes;
            var customerWithAddresses = 0;
            ids.forEach((id) => {
                const queryBody = `${specialInputName}:"${id}", orderBy: {direction: ASC, field: NAME}) {
                totalCount
                edges{
                    cursor
                    node{
                        id
                    }
                }
                nodes {
                    id
                    contactDetails{
                        address{
                            country
                            region
                        }
                    }
                }
            }`;
                const query = `{
                ${queryName} (${queryBody}
            }`;
                cy.postAndValidate(query, queryName, altUrl).then((res) => {
                    nodes = res.body.data[queryName].nodes;
                    if (nodes.length > 0) {
                        cy.log("customerWithAddresses in pagination file Increment" + customerWithAddresses)
                        customerWithAddresses += 1;
                        nodes.forEach((node, index) => {
                            const country = node.contactDetails.address.country;
                            if (country != "") {
                                assert.isString(country, `Customer ${index + 1}'s address.country is a string`);
                                expect(country).to.have.length(2, `Customer ${index + 1}'s address.country is a 2-digit value`);
                                expect(countryCodes).to.include(country, `Customer ${index + 1}'s address.country is a valid country code`);
                            }
                        });
                    }
                    return cy.wrap(customerWithAddresses)
                });
            });
        });

        context("Addresses Query: Testing response of country field for Company", () => {
            var ids = [];
            var lastCount = 100;
            var beforeCursor = "";
            const extraQueryName = "companies"

            it("Query that requests address.country field will receive 2-digit ISO codes", () => {
                function queryAddresses(beforeCursor) {
                    var nodes;
                    const extraQueryBody = ` last: ${lastCount}  before:"${beforeCursor}" orderBy: {direction: ASC, field: ${queryName === "paymentSettings" ? "COMPANY_NAME" : "NAME"}}) {
                        totalCount
                        edges{
                            cursor
                            node{
                                id
                            }
                        }
                        nodes {
                            id
                        }
                    }`;
                    const extraQuery = `{
                        ${extraQueryName} (${extraQueryBody}
                    }`;
                    cy.postAndValidate(extraQuery, extraQueryName, originalBaseUrl).then((res) => {
                        nodes = res.body.data[extraQueryName].nodes;
                        nodes.forEach((node) => {
                            ids.push(node.id)
                        })
                        beforeCursor = res.body.data[extraQueryName].edges[0].cursor;
                        cy.queryForValidNodes(queryName, ids, "companyId", originalBaseUrl).then((cwa) => {
                            if (cwa < 2) {
                                queryAddresses(beforeCursor);
                            }
                        })
                    });
                }
                queryAddresses(beforeCursor)
            });
        });

        context("Addresses Query: Testing response of country field for Customer", () => {
            var ids = [];
            var lastCount = 100;
            var beforeCursor = "";
            const extraQueryName = "customers"

            it("Query that requests address.country field will receive 2-digit ISO codes", () => {
                function queryAddresses(beforeCursor) {
                    var nodes;
                    const extraQueryBody = ` last: ${lastCount}  before:"${beforeCursor}" orderBy: {direction: ASC, field: ${queryName === "paymentSettings" ? "COMPANY_NAME" : "NAME"}}) {
                        totalCount
                        edges{
                            cursor
                            node{
                                id
                            }
                        }
                        nodes {
                            id
                        }
                    }`;
                    const extraQuery = `{
                        ${extraQueryName} (${extraQueryBody}
                    }`;
                    cy.postAndValidate(extraQuery, extraQueryName, originalBaseUrl).then((res) => {
                        nodes = res.body.data[extraQueryName].nodes;
                        nodes.forEach((node) => {
                            ids.push(node.id)
                        })
                        beforeCursor = res.body.data[extraQueryName].edges[0].cursor;
                        cy.queryForValidNodes(queryName, ids, "customerId", originalBaseUrl).then((cwa) => {
                            if (cwa < 2) {
                                queryAddresses(beforeCursor);
                            }
                        })
                    });
                }
                queryAddresses(beforeCursor)
            });
        });

        context("createAddress Mutation: Testing country codes on address with Company Id", () => {
            var id = "", companyId = "";
            const mutationName = "createAddress";
            const extraMutationName = "createCompany"
            const extraDeleteMutName = "deleteCompany"
            const extraItemPath = "company"
            const input = `{name:"Cypress Address ${extraMutationName} Test" integrationKey: "${Math.random().toString(36).slice(2)}"}`

            before(() => {
                deleteItemsAfter = Cypress.env("deleteItemsAfter");
                cy.createAndGetId(extraMutationName, extraItemPath, input, undefined, originalBaseUrl).then((id) => {
                    companyId = id;
                });
            });
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
            after(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (companyId !== "") {
                    cy.deleteItem(extraDeleteMutName, companyId, originalBaseUrl).then(() => {
                        id = "";
                    });
                }
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    city: "Alpharetta",
                    country: countryNames[countryIndex],
                    line1: "4325 Alexander Dr",
                    line2: "#100",
                    postalCode: "43210",
                    region: region
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            companyId:"${companyId}"
                            addressType: ${addressTypes[addressTypeIndex]}
                            contactDetails: {
                                address: ${toFormattedString(address)}
                            }
                                
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            contactDetails{
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
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
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            companyId:"${companyId}"
                            addressType: ${addressTypes[addressTypeIndex]}
                            contactDetails: {
                                address: ${toFormattedString(address)}
                            }
                                
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            contactDetails{
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Alpharetta",
                        country: countryCodes[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };

                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            companyId:"${companyId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["addressType", "contactDetails"];
                    const propValues = [addressTypes[addressTypeIndex], contactDetails];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${contactDetails.firstName}", orderBy: {direction: ASC, field: NAME} companyId: "${companyId}") {
                                nodes {    
                                    id
                                    addressType
                                    contactDetails{
                                        firstName
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
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        context("createAddress Mutation: Testing country codes on address with Customer Id", () => {
            var id = "", customerId = "";
            const mutationName = "createAddress";
            const extraMutationName = "createCustomer"
            const extraDeleteMutName = "deleteCustomer"
            const extraItemPath = "customer"
            const input = `{firstName: "Cypress ${extraMutationName} Test" lastName:"isoCodeTest" email: "Cypress AddressIsoCode${Math.random().toString(36).slice(2)}Test@email.com"}`

            before(() => {
                deleteItemsAfter = Cypress.env("deleteItemsAfter");
                cy.createAndGetId(extraMutationName, extraItemPath, input, undefined, originalBaseUrl).then((id) => {
                    customerId = id;
                });
            });
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

            after(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (customerId !== "") {
                    cy.deleteItem(extraDeleteMutName, customerId, originalBaseUrl).then(() => {
                        id = "";
                    });
                }
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const address = {
                    city: "Alpharetta",
                    country: countryNames[countryIndex],
                    line1: "4325 Alexander Dr",
                    line2: "#100",
                    postalCode: "43210",
                    region: region
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            customerId:"${customerId}"
                            addressType: ${addressTypes[addressTypeIndex]}
                            contactDetails: {
                                address: ${toFormattedString(address)}
                            }
                                
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            contactDetails{
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
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
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            customerId:"${customerId}"
                            addressType: ${addressTypes[addressTypeIndex]}
                            contactDetails: {
                                address: ${toFormattedString(address)}
                            }
                                
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            contactDetails{
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Alpharetta",
                        country: countryCodes[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };

                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            customerId:"${customerId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["addressType", "contactDetails"];
                    const propValues = [addressTypes[addressTypeIndex], contactDetails];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${contactDetails.firstName}", orderBy: {direction: ASC, field: NAME} customerId: "${customerId}") {
                                nodes {    
                                    id
                                    addressType
                                    contactDetails{
                                        firstName
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
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        context("updateAddress Mutation: Testing country codes on address for address with Company Id", () => {
            var id = "", companyId = "";
            var itemCount = 1;
            const mutationName = "updateAddress";
            const extraMutationName = "createCompany"
            const extraDeleteMutName = "deleteCompany"
            const extraItemPath = "company"
            const extraIteminput = `{name:"Cypress Address${extraMutationName} Test" integrationKey: "${Math.random().toString(36).slice(2)}"}`

            before(() => {
                deleteItemsAfter = Cypress.env("deleteItemsAfter");
                cy.createAndGetId(extraMutationName, extraItemPath, extraIteminput, undefined, originalBaseUrl).then((id) => {
                    companyId = id;
                });
            });

            beforeEach(() => {
                const contactDetails = {
                    firstName: `Cypress createAddress IsoCode Test`,
                    address: {
                        city: "Alpharetta",
                        country: "US",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: "Iowa"
                    }
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const input = `{ companyId:"${companyId}", addressType: ${addressTypes[addressTypeIndex]}, contactDetails: ${toFormattedString(contactDetails)}}`
                cy.createAndGetId("createAddress", itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
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

            after(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (companyId !== "") {
                    cy.deleteItem(extraDeleteMutName, companyId, originalBaseUrl).then(() => {
                        id = "";
                    });
                }
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Meridian",
                        country: countryNames[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };

                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            companyId:"${companyId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            it("Mutation will fail when using an invalid ISO code as the address' country field", () => {
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Alpharetta",
                        country: "AP",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: "Georgia"
                    }
                };

                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            companyId:"${companyId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Meridian",
                        country: countryCodes[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            companyId:"${companyId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const propNames = ["addressType", "contactDetails"];
                    const propValues = [addressTypes[addressTypeIndex], contactDetails];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${contactDetails.firstName}", orderBy: {direction: ASC, field: NAME} companyId: "${companyId}") {
                                nodes {    
                                    id
                                    addressType
                                    contactDetails{
                                        firstName
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
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        context("updateAddress Mutation: Testing country codes on address for address with Customer Id", () => {
            var id = "", customerId = "";
            var itemCount = 1;
            const mutationName = "updateAddress";
            const extraMutationName = "createCustomer"
            const extraDeleteMutName = "deleteCustomer"
            const extraItemPath = "customer"
            const extraIteminput = `{firstName:"Cypress ${extraMutationName} Test" lastName:"isoCodeTest" email: "Cypress AddressIsoCode${Math.random().toString(36).slice(2)}Test@email.com"}`

            before(() => {
                deleteItemsAfter = Cypress.env("deleteItemsAfter");
                cy.createAndGetId(extraMutationName, extraItemPath, extraIteminput, undefined, originalBaseUrl).then((id) => {
                    customerId = id;
                });
            });

            beforeEach(() => {
                const contactDetails = {
                    firstName: `Cypress createAdress IsoCode Test`,
                    address: {
                        city: "Alpharetta",
                        country: "US",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: "Iowa"
                    }
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const input = `{ customerId:"${customerId}", addressType: ${addressTypes[addressTypeIndex]}, contactDetails: ${toFormattedString(contactDetails)}}`
                cy.createAndGetId("createAddress", itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
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

            after(() => {
                if (!deleteItemsAfter) {
                    return;
                }
                if (customerId !== "") {
                    cy.deleteItem(extraDeleteMutName, customerId, originalBaseUrl).then(() => {
                        id = "";
                    });
                }
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will fail when using the full name of a country instead of the ISO code", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Meridian",
                        country: countryNames[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            customerId:"${customerId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            it("Mutation will fail when using an invalid ISO code as the address' country field", () => {
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Alpharetta",
                        country: "AP",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: "Georgia"
                    }
                };

                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            customerId:"${customerId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const errorMessage = res.body.data[mutationName].errors[0].message;
                    expect(errorMessage).to.contain("Country Or State Not Found");
                });
            });

            // TODO: failing saying that postal code was not included
            it("Mutation will succeed when using a valid ISO code as the address' country", () => {
                const countryIndex = Cypress._.random(0, countryCount - 1);
                const regionArray = countryRegions[countryIndex];
                const region = regionArray[Cypress._.random(0, regionArray.length - 1)];
                const contactDetails = {
                    firstName: "Cypress Address IsoCode",
                    address: {
                        city: "Meridian",
                        country: countryCodes[countryIndex],
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "43210",
                        region: region
                    }
                };
                const addressTypes = ["BILLING", "SHIPPING"]
                const addressTypeIndex = Cypress._.random(0, 1)
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}",
                            customerId:"${customerId}",
                            addressType: ${addressTypes[addressTypeIndex]},
                            contactDetails: ${toFormattedString(contactDetails)}        
                        }
                    ) {
                        code
                        message
                        errors {
                            code
                            message
                            domain
                            details {
                                code
                                message
                                target
                            }
                        }
                        ${itemPath} {
                            id
                            addressType
                            contactDetails{
                                firstName
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
                cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const propNames = ["addressType", "contactDetails"];
                    const propValues = [addressTypes[addressTypeIndex], contactDetails];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${contactDetails.firstName}", orderBy: {direction: ASC, field: NAME} customerId: "${customerId}") {
                                nodes {    
                                    id
                                    addressType
                                    contactDetails{
                                        firstName
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
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });
    });
});
