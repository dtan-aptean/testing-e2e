/// <reference types="cypress" />

import { confirmStorefrontEnvValues, createInfoDummy, createMutResMessage, SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 20
describe('Mutation: updateCategory', () => {
    var id = '';
    var updateCount = 0;    // TODO: Appraise whether this is really useful or not
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'updateCategory';
    const deleteMutName = "deleteCategory";
    const queryName = "categories";
    const itemPath = 'category';
    const infoName = "categoryInfo";
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
    const createName = 'createCategory';
    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

    var childCatName = "";
    var parentCatName = "";
    var childCatId = "";
    var parentCatId = "";

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

    beforeEach(() => {
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
            itemCount++;
            parentCatName = name; // Only going to use this in one test, but we still need it.
        });
    })

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        if (originalBaseUrl !== "" && Cypress.config("baseUrl") !== originalBaseUrl) {
            Cypress.log({message: "Switching the baseUrl back to the original"});
            Cypress.config("baseUrl", originalBaseUrl);
            cy.wait(1000);
        }
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });

        // Delete the child and parent category
        cy.deleteParentAndChildCat({name: childCatName, id: childCatId}, parentCatName, parentCatId);
        if (parentCatId) {
            id = "";    // Item would have already been deleted once it was deleted as a parent
        }

        if (id !== "") {
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

        it("Mutation will fail with deleted 'id' input", () => {
            const info = [{name: `Cypress ${mutationName} Deleted Id Test`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: ${toFormattedString(info)}}) {
                    ${standardMutationBody}
                }
            }`;
            cy.mutationDeletedId(id, mutationName, deleteMutName, mutation, itemPath )
            
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

        it("Mutation will succeed with valid 'id', 'name', and 'languageCode' input", () => {
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
            const today = new Date();
            const createdDate = today.toISOString();
            const info = [
                {name: "Zypresse aktualisierenKategorie Aktualisieren2", description: "Translate desc to German", languageCode: "de-DE"},
                {name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}
            ];
            const displayOrder = Cypress._.random(0, 10);
            const seoData = [{
                searchEngineFriendlyPageName: "",
                metaKeywords:  "",
                metaDescription: "",
                metaTitle: "",
                languageCode: "de-DE"
            }, {
                searchEngineFriendlyPageName: "Cypress Update",
                metaKeywords:  "Cypress",
                metaDescription: "Cypress Update metaTag",
                metaTitle: "Cypress Update test",
                languageCode: "Standard"
            }];
            const published = Cypress._.random(0, 1) === 1;
            const showOnHomePage = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        displayOrder: ${displayOrder}
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
                        createdDate: "${createdDate}"
                        published: ${published}
                        showOnHomePage: ${showOnHomePage}
                    }
                ) {
                    ${codeMessageError}
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
                        showOnHomePage
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = [infoName, "displayOrder", "seoData", "createdDate", "published", "showOnHomePage"];
                const propValues = [info, displayOrder, seoData, createdDate, published, showOnHomePage];
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
                                showOnHomePage
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
                            id: "${id}"
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

    context("Testing connecting to other items and features", () => {
        // Possible TODO: Honestly, maybe refactor this to create a parent and use the category created in beforeEach as the child category
        it("Mutation with 'parentCategoryId' will succesfully attach the parent category", () => {
            childCatName = `Cypress update subCategory`;
            const input = {categoryInfo: [{name: childCatName, languageCode: "Standard"}] };
            cy.createAndGetId(createName, itemPath, toFormattedString(input)).then((returnedId: string) => {
                childCatId = returnedId;
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${childCatId}"
                            parentCategoryId: "${id}"
                            ${infoName}: ${toFormattedString(input.categoryInfo)}
                        }
                    ) {
                        ${codeMessageError}
                        ${itemPath} {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                            parent {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const parent = createInfoDummy(parentCatName, infoName, id);
                    parentCatId = id;
                    const propNames = ["parent", infoName];
                    const propValues = [parent, input.categoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${childCatName}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    ${infoName} {
                                        name
                                        languageCode
                                    }
                                    parent {
                                        id
                                        ${infoName} {
                                            name
                                            languageCode
                                        }
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, childCatId, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
            const extraCreate = "createDiscount";
            const extraPath = "discount";
            const extraQuery = "discounts";
            const extraItemInput = {name: `Cypress ${mutationName} discount`, discountAmount: {amount: 15, currency: "USD"}, discountType: "ASSIGNED_TO_CATEGORIES"};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountIds: ${toFormattedString(itemIds)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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

        it("Mutation with 'roleBasedAccess' input will successfully attach the roles", () => {
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = {name: `Cypress ${mutationName} role`};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
                const roleBasedAccess = {enabled: true, roleIds: itemIds};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            roleBasedAccess: ${toFormattedString(roleBasedAccess)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        ${codeMessageError}
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
   
    // TODO: Move this to a category file in the misc folder
    context.skip("Testing in storefront", () => {
        // This cannot be run on its own without another test run before it.
        // The baseUrl changes too fast for us to save it as originalBaseUrl if it's run on its own. This prevents us from making API calls
        // This is only a problem if it's run on its own. If run after other tests (which is the normal use case), originalBaseUrl is saved with no issue.
        // If you want to run just this test, I recommend changing this test and the first test to use it.only() instead of it().
        it("Mutation using showInTopMenu creates an item that shows in the storefront top menu", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
            var name = "Cypress TopMenu Cat";
            const published = true;
            const displayOrder = 10;
            const pageSize = 10;
            const input = {categoryInfo: [{name: name, languageCode: "Standard"}], published: published, displayOrder: displayOrder, pageSize: pageSize}
            cy.createAndGetId(createName, itemPath, toFormattedString(input), undefined, originalBaseUrl).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: deleteMutName, itemName: name, queryName: queryName});
                name = `Cypress TopMenu Update ${Cypress._.random(0, 999)}`;
                const newInfo = [{name: name, languageCode: "Standard"}];
                const showInTopMenu = true;
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${returnedId}"
                            ${infoName}: ${toFormattedString(newInfo)}
                            published: ${published}
                            displayOrder: ${displayOrder}
                            pageSize: ${pageSize}
                            showInTopMenu: ${showInTopMenu}
                        }
                    ) {
                        ${codeMessageError}
                        ${itemPath} {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                            published
                            showInTopMenu
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                    const propNames = ["showInTopMenu", "published", infoName];
                    const propValues = [showInTopMenu, published, newInfo];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    ${infoName} {
                                        name
                                        languageCode
                                    }
                                    published
                                    showInTopMenu
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, returnedId, propNames, propValues, originalBaseUrl).then(() => {
                            cy.findCategoryInMenu(name);
                        });
                    });
                });
            });
        });
    });
});