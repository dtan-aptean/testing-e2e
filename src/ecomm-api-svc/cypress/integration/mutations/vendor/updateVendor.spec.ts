/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 16
describe('Mutation: updateVendor', () => {
    var id = '';
    var updateCount = 0;	// TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateVendor';
    const createName = 'createVendor';
	const deleteMutName = "deleteVendor";
    const queryName = "vendors";
    const itemPath = 'vendor';
    const infoName = "vendorInfo";
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            id
            ${infoName} {
                name
                description
                languageCode
            }
        }
    `;

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName, infoName);
    });

	beforeEach(() => {
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
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
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
            // Delete the item we've been updating
            cy.deleteItem(deleteMutName, id);
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, standardMutationBody);
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
                    ${codeMessageError}
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
                extraIds.push({itemId: createdItem.id, deleteName: deleteMutName, itemName: info[0].name, queryName: queryName});
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
                        ${codeMessageError}
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
                    ${codeMessageError}
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

    context("Testing PriceRange input", () => {
        it("Mutation will fail if priceRange.priceFrom.amount is > than priceRange.priceTo.amount", () => {
            const info = [{name: `Cypress Invalid PriceRange Amount ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceFrom: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        ${infoName} {
                            name
                            languageCode
                        }
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail if the currency of priceRange.priceFrom and priceRange.priceTo are not the same", () => {
            const info = [{name: `Cypress PriceRange.PriceFrom Currency ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "EUR"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        ${infoName} {
                            name
                            languageCode
                        }
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                const secondInfo = [{name: `Cypress PriceRange.PriceTo Currency ${mutationName}`, languageCode: "Standard"}];
                const secondPriceRange = {
                    priceFrom: {
                        amount: Cypress._.random(100, 9999),
                        currency: "USD"
                    },
                    priceTo: {
                        amount: Cypress._.random(10000, 20000),
                        currency: "EUR"
                    }
                };
                const secondMutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${id}"
                            ${infoName}: ${toFormattedString(secondInfo)}
                            priceRange: ${toFormattedString(secondPriceRange)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(secondMutation, mutationName, itemPath);
            });
        });

        it("Mutation will successfully save all priceRange properties even when priceRangeFiltering = false", () => {
            const info = [{name: `Cypress PriceRange false ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceRangeFiltering: false,
                manuallyPriceRange: false,
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        ${infoName} {
                            name
                            languageCode
                        }
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = [infoName, "priceRange"];
                const propValues = [info, priceRange];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                priceRange {
                                    manuallyPriceRange
                                    priceRangeFiltering
                                    priceFrom {
                                        amount
                                        currency
                                    }
                                    priceTo {
                                        amount
                                        currency
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will successfully save the priceRange input", () => {
            const info = [{name: `Cypress PriceRange ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceRangeFiltering: Cypress._.random(0, 1) === 1,
                manuallyPriceRange: Cypress._.random(0, 1) === 1,
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
                    }
                ) {
                    ${codeMessageError}
                    ${itemPath} {
                        id
                        ${infoName} {
                            name
                            languageCode
                        }
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = [infoName, "priceRange"];
                const propValues = [info, priceRange];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                priceRange {
                                    manuallyPriceRange
                                    priceRangeFiltering
                                    priceFrom {
                                        amount
                                        currency
                                    }
                                    priceTo {
                                        amount
                                        currency
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});