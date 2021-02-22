/// <reference types="cypress" />

import { confirmStorefrontEnvValues } from "../../support/commands";

var originalBaseUrl = Cypress.config("baseUrl");
confirmStorefrontEnvValues();

describe("Misc. Tests: isoCodes", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
    var countryCodes = [] as string[];

    before(() => {
        cy.getCountries().then((countryContents) => {
            const { codes } = countryContents;
            countryCodes = countryCodes.concat(codes);
        });
    });

    context("Orders Query: Testing response of country field", () => {
        // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
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

    context("Vendors Query: Testing response of country field", () => {
        // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
        const queryName = "vendors";
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
});