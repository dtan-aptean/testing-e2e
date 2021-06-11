/// <reference types="cypress" />

import { createMutResMessage, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 15
describe('Mutation: createManufacturer', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'createManufacturer';
	const deleteMutName = "deleteManufacturer";
    const queryName = "manufacturers";
    const itemPath = 'manufacturer';
    const infoName = "manufacturerInfo";
    const standardMutationBody = `
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
            ${infoName} {
                name
                languageCode
            }
        }
    `;

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    var deleteItemsAfter = undefined as boolean | undefined;
	before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName, infoName);
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

            cy.deleteItem(deleteMutName, id).then(() => {
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
            const info = [{name: "Cypress API Manufacturer", languageCode: "Standard"}];
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
            const info = [{name: "Cypress Manufacturer customData", description: `${mutationName} cypress test`, languageCode: "Standard"}];
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
                const names = [infoName, "customData"];
                const testValues = [info, customData];
                cy.confirmMutationSuccess(res, mutationName, itemPath, names, testValues).then(() => {
                    const queryName = "manufacturers";
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
            const today = new Date();
            const createdDate = today.toISOString();
            const displayOrder = Cypress._.random(1, 20);
            const info = [{name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"}, {name: "Cypress Manufacturer Input", description: "Cypress testing 'create' mutation input", languageCode: "Standard"}];
            const seoData = [
                {
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
                }
            ];
            const published = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        displayOrder: ${displayOrder}
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
                        createdDate: "${createdDate}"
                        published: ${published}
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
                        displayOrder
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
                        createdDate
                        published
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "displayOrder", "seoData", "createdDate", "published"];
                const propValues = [info, displayOrder, seoData, createdDate, published];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[1].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                displayOrder
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
                                createdDate
                                published
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
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
            // TODO: replace with custom command later
            cy.postGQL(mutation).then((res) => {
                const failureMessage = createMutResMessage(false, mutationName);

                // should have data
                assert.exists(res.body.data, "Response data should exist");
                // Check data for errors
                // Validate Errors
                assert.exists(res.body.data[mutationName].errors, "Should have errors");
                // Validate data types and values
                // Validate code
                assert.isString(res.body.data[mutationName].code, `Expect ${mutationName}.code to be a string`);
                expect(res.body.data[mutationName].code).to.eql("ERROR", `Expect ${mutationName}.code to be ERROR`);
                // Validate message
                assert.isString(res.body.data[mutationName].message, `Expect ${mutationName}.message to be a string`);
                expect(res.body.data[mutationName].message).to.eql(failureMessage, `Expect ${mutationName}.message to be the correct failure message`);
                assert.notExists(res.body.data[mutationName][itemPath], `Expect mutation not to return a ${itemPath}`);
            });
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
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
            // TODO: replace with custom command later
            cy.postGQL(mutation).then((res) => {
                const failureMessage = createMutResMessage(false, mutationName);

                // should have data
                assert.exists(res.body.data, "Response data should exist");
                // Check data for errors
                // Validate Errors
                assert.exists(res.body.data[mutationName].errors, "Should have errors");
                // Validate data types and values
                // Validate code
                assert.isString(res.body.data[mutationName].code, `Expect ${mutationName}.code to be a string`);
                expect(res.body.data[mutationName].code).to.eql("ERROR", `Expect ${mutationName}.code to be ERROR`);
                // Validate message
                assert.isString(res.body.data[mutationName].message, `Expect ${mutationName}.message to be a string`);
                expect(res.body.data[mutationName].message).to.eql(failureMessage, `Expect ${mutationName}.message to be the correct failure message`);
                assert.notExists(res.body.data[mutationName][itemPath], `Expect mutation not to return a ${itemPath}`);

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
                            ${infoName}: ${toFormattedString(secondInfo)}
                            priceRange: ${toFormattedString(secondPriceRange)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                // TODO: replace with custom command later
                cy.postGQL(secondMutation).then((resp) => {
                    //const failureMessage = createMutResMessage(false, mutationName);

                    // should have data
                    assert.exists(resp.body.data, "Response data should exist");
                    // Check data for errors
                    // Validate Errors
                    assert.exists(resp.body.data[mutationName].errors, "Should have errors");
                    // Validate data types and values
                    // Validate code
                    assert.isString(resp.body.data[mutationName].code, `Expect ${mutationName}.code to be a string`);
                    expect(resp.body.data[mutationName].code).to.eql("ERROR", `Expect ${mutationName}.code to be ERROR`);
                    // Validate message
                    assert.isString(resp.body.data[mutationName].message, `Expect ${mutationName}.message to be a string`);
                    expect(resp.body.data[mutationName].message).to.eql(failureMessage, `Expect ${mutationName}.message to be the correct failure message`);
                    assert.notExists(resp.body.data[mutationName][itemPath], `Expect mutation not to return a ${itemPath}`);
                });
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
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                id = res.body.data[mutationName][itemPath].id;
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
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                id = res.body.data[mutationName][itemPath].id;
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

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
            const extraCreate = "createDiscount";
            const extraPath = "discount";
            const extraQuery = "discounts";
            const extraItemInput = {name: `Cypress ${mutationName} discount`, discountAmount: {amount: 15, currency: "USD"}, discountType: "ASSIGNED_TO_MANUFACTURERS"};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} discountIds test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            discountIds: ${toFormattedString(itemIds)}
                            ${infoName}: ${toFormattedString(info)}
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
                            discounts {
                                id
                                name
                                discountAmount {
                                    amount
                                    currency
                                }
                                discountType
                            }
                            ${infoName} {
                                name
                                description
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName, "discounts"];
                    const propValues = [info, items];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    discounts {
                                        id
                                        name
                                        discountAmount {
                                            amount
                                            currency
                                        }
                                        discountType
                                    }
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

        it("Mutation with 'roleBasedAccess' input will successfully create an item with attached roles.", () => {
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = {name: `Cypress ${mutationName} role`};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} rBA test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const roleBasedAccess = {enabled: true, roleIds: itemIds};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            roleBasedAccess: ${toFormattedString(roleBasedAccess)}
                            ${infoName}: ${toFormattedString(info)}
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
                            roleBasedAccess {
                                enabled
                                roles {
                                    id
                                    name
                                }
                            }
                            ${infoName} {
                                name
                                description
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const roleAccess = {enabled: roleBasedAccess.enabled, roles: items};
                    const propNames = [infoName, "roleBasedAccess"];
                    const propValues = [info, roleAccess];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    roleBasedAccess {
                                        enabled
                                        roles {
                                            id
                                            name
                                        }
                                    }
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
    });
});