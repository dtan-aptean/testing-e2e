/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 21
describe('Mutation: createProduct', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    var deleteAfterProducts = [] as SupplementalItemRecord[];   // Items that can only be deleted after the attached product is deleted
    const mutationName = 'createProduct';
    const deleteMutName = "deleteProduct";
    const queryName = "products";
    const itemPath = 'product';
    const infoName = "productInfo";
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

    const addExtraItemIds = (extIds: SupplementalItemRecord[], afterProduct?: boolean) => {
        if (afterProduct) {
            extIds.forEach((id) => {
                deleteAfterProducts.push(id);
            });
        } else {
            extIds.forEach((id) => {
                extraIds.push(id);
            });
        }
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
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== "") {
            cy.deleteItem(deleteMutName, id).then(() => {
                id = "";
            });
        }
        // Delete items that must be deleted after their product
        cy.deleteSupplementalItems(deleteAfterProducts).then(() => {
            deleteAfterProducts = [];
        });
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
            cy.postAndConfirmError(mutation);
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

        it("Mutation will succeed with valid 'name' and 'languageCode' input", () => {
            const info = [{
                name: "Cypress API Product SD",
                languageCode: "Standard"
            }];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
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
        // Added these values under context so that any possible future tests can use them
        const backOrderModeValues = ["NO_BACK_ORDERS", "ALLOW_QTY_BELOW_0", "ALLOW_QTY_BELOW_0_AND_NOTIFY_CUSTOMER"];

        it.only("Mutation with all required input and 'customData' input creates item with customData", () => {
            const info = [{ name: "Cypress Product customData", languageCode: "Standard" }];
            const customData = { data: `${itemPath} customData`, canDelete: true };
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

        it("Mutation will fail if seoData input does not include 'languageCode'", () => {
            const info = [{ name: `Cypress ${mutationName} no seoLanguageCode`, languageCode: "Standard" }];
            const seoData = [{
                searchEngineFriendlyPageName: `Cypress no seoLanguageCode`,
                metaKeywords: "no SEO languageCode",
                metaDescription: "no SEO languageCode",
                metaTitle: "Cypress SEO none"
            }];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
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
                        seoData {
                            searchEngineFriendlyPageName
                            metaKeywords
                            metaDescription
                            metaTitle
                            languageCode
                        }
                        ${infoName} {
                            name
                            shortDescription
                            fullDescription
                            languageCode
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "SeoDataInput.languageCode" of required type "String!" was not provided.');
            });
        });

        it("Mutation will fail if seoData input uses an invalid 'languageCode'", () => {
            const info = [{ name: `Cypress ${mutationName} invalid seoLanguageCode`, languageCode: "Standard" }];
            const seoData = [{
                searchEngineFriendlyPageName: `Cypress invalid seoLanguageCode`,
                metaKeywords: "invalid SEO languageCode",
                metaDescription: "invalid SEO languageCode",
                metaTitle: "Cypress SEO invalid",
                languageCode: true
            }];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
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
                        seoData {
                            searchEngineFriendlyPageName
                            metaKeywords
                            metaDescription
                            metaTitle
                            languageCode
                        }
                        ${infoName} {
                            name
                            shortDescription
                            fullDescription
                            languageCode
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.include('String cannot represent a non string value:');
            });
        });

        it("Mutation will fail if seoData input uses an empty string as the 'languageCode'", () => {
            const info = [{ name: `Cypress ${mutationName} empty seoLanguageCode`, languageCode: "Standard" }];
            const seoData = [{
                searchEngineFriendlyPageName: `Cypress empty seoLanguageCode`,
                metaKeywords: "empty SEO languageCode",
                metaDescription: "empty SEO languageCode",
                metaTitle: "Cypress SEO empty",
                languageCode: ""
            }];
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
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
                        seoData {
                            searchEngineFriendlyPageName
                            metaKeywords
                            metaDescription
                            metaTitle
                            languageCode
                        }
                        ${infoName} {
                            name
                            shortDescription
                            fullDescription
                            languageCode
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                expect(res.body.data[mutationName].errors[0].message).to.include("Invalid Language Code");
            });
        });

        it("Mutation will not save the stockQuantity input if manageInventoryMethod = 'DONT_MANAGE_STOCK'", () => {
            const info = [{ name: `Cypress ${mutationName} dontManageStock`, languageCode: "Standard" }];
            const inventoryInfo = {
                manageInventoryMethod: "DONT_MANAGE_STOCK",
                stockQuantity: 250
            };
            const expectedInventoryInfo = {
                manageInventoryMethod: "DONT_MANAGE_STOCK",
                stockQuantity: 0
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
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
                        inventoryInformation {
                            manageInventoryMethod
                            stockQuantity
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["inventoryInformation", infoName];
                const propValues = [expectedInventoryInfo, info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                inventoryInformation {
                                    manageInventoryMethod
                                    stockQuantity
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will not save the stockQuantity input if manageInventoryMethod = 'MANAGE_STOCK_BY_ATTRIBUTES'", () => {
            const info = [{ name: `Cypress ${mutationName} manageStockByAttributes`, languageCode: "Standard" }];
            const inventoryInfo = {
                manageInventoryMethod: "MANAGE_STOCK_BY_ATTRIBUTES",
                stockQuantity: 500
            };
            const expectedInventoryInfo = {
                manageInventoryMethod: "MANAGE_STOCK_BY_ATTRIBUTES",
                stockQuantity: 0
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
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
                        inventoryInformation {
                            manageInventoryMethod
                            stockQuantity
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["inventoryInformation", infoName];
                const propValues = [expectedInventoryInfo, info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                inventoryInformation {
                                    manageInventoryMethod
                                    stockQuantity
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will successfully save the stockQuantity input if manageInventoryMethod = 'MANAGE_STOCK'", () => {
            const info = [{ name: `Cypress ${mutationName} manageStock`, languageCode: "Standard" }];
            const inventoryInfo = {
                manageInventoryMethod: "MANAGE_STOCK",
                stockQuantity: 750
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
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
                        inventoryInformation {
                            manageInventoryMethod
                            stockQuantity
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["inventoryInformation", infoName];
                const propValues = [inventoryInfo, info];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                inventoryInformation {
                                    manageInventoryMethod
                                    stockQuantity
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation creates item that has all included input", () => {
            const info = [
                { name: "Translate name to German", shortDescription: "Translate short desc to German", fullDescription: "Translate full desc to German", languageCode: "de-DE" },
                { name: "Cypress Product Input", shortDescription: "Cypress testing 'create' mutation input", fullDescription: "Cypress testing createProduct mutation input, to see if the input is added properly", languageCode: "Standard" }
            ];
            const today = new Date();
            const nextWeek = new Date(today.valueOf() + 604800000);
            const twoWeeks = new Date(today.valueOf() + 1209600000);
            const sku = "Cypress Sku";
            const manufacturerPartNumber = `C-${Cypress._.random(1, 10)}`;
            const manufacturerInfo = {
                partNumber: manufacturerPartNumber
            };
            const freeShipping = Cypress._.random(0, 1) === 1;
            const shippingInformation = {
                weight: Cypress._.random(1, 10),
                length: Cypress._.random(1, 10),
                width: Cypress._.random(1, 10),
                height: Cypress._.random(1, 10),
                isFreeShipping: freeShipping,
                shipSeparately: Cypress._.random(0, 1) === 1,
                additionalShippingCharge: freeShipping ? null : {
                    amount: Cypress._.random(1, 10),
                    currency: "USD"
                }
            };
            const cartInfo = {
                minimumQuantity: Cypress._.random(1, 100),
                maximumQuantity: Cypress._.random(100, 500),
                allowedQuantities: [Cypress._.random(1, 500), Cypress._.random(1, 500)]
            };
            const preOrder = Cypress._.random(0, 1) === 1
            const priceInformation = {
                price: {
                    amount: Cypress._.random(1, 100),
                    currency: "USD"
                },
                isTaxExempt: Cypress._.random(0, 1) === 1,
                availableForPreOrder: preOrder,
                preOrderAvailabilityStartDate: preOrder ? today.toISOString() : null
            };
            const published = Cypress._.random(0, 1) === 1;
            const seoData = [
                {
                    searchEngineFriendlyPageName: "",
                    metaKeywords: "",
                    metaDescription: "",
                    metaTitle: "",
                    languageCode: "de-DE"
                }, {
                    searchEngineFriendlyPageName: "Cypress Update",
                    metaKeywords: "Cypress",
                    metaDescription: "Cypress Update metaTag",
                    metaTitle: "Cypress Update test",
                    languageCode: "Standard"
                }
            ];
            const inventoryInfo = {
                displayStockAvailability: Cypress._.random(0, 1) === 1,
                notifyAdminForQuantityBelow: Cypress._.random(1, 5),
                notReturnable: Cypress._.random(0, 1) === 1,
                availableStartDate: nextWeek.toISOString(),
                availableEndDate: twoWeeks.toISOString(),
                markAsNew: Cypress._.random(0, 1) === 1,
                gtin: "abc123-cypress",
                backOrderMode: backOrderModeValues[Cypress._.random(0, backOrderModeValues.length - 1)],
                minimumStockQuantity: Cypress._.random(5, 20),
                allowBackInStockNotification: Cypress._.random(0, 1) === 1,
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            ${infoName}: ${toFormattedString(info)}
                            sku: "${sku}"
                            manufacturerPartNumber: "${manufacturerPartNumber}"
                            shippingInformation: ${toFormattedString(shippingInformation)}
                            inventoryInformation: ${toFormattedString(inventoryInfo)}
                            cartInformation : ${toFormattedString(cartInfo)}
                            published: ${published}
                            seoData: ${toFormattedString(seoData)}
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
                            sku
                            manufacturerPartNumber
                            shippingInformation {
                                weight
                                height
                                length
                                width
                                isFreeShipping
                                shipSeparately
                                additionalShippingCharge {
                                    amount
                                    currency
                                }
                            }
                            inventoryInformation {
                                gtin
                                backOrderMode
                                displayStockAvailability
                                notifyAdminForQuantityBelow
                                notReturnable
                                availableStartDate
                                availableEndDate
                                markAsNew
                                minimumStockQuantity
                                allowBackInStockNotification
                            }
                            cartInformation {
                                minimumQuantity
                                maximumQuantity
                                allowedQuantities
                            }
                            priceInformation {
                                price {
                                    amount
                                    currency
                                }
                                isTaxExempt
                                availableForPreOrder
                                preOrderAvailabilityStartDate
                            }
                            published
                            seoData {
                                searchEngineFriendlyPageName
                                metaKeywords
                                metaDescription
                                metaTitle
                                languageCode
                            }
                            ${infoName} {
                                name
                                shortDescription
                                fullDescription
                                languageCode
                            }
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["sku", infoName, "inventoryInformation", "manufacturerPartNumber", "shippingInformation", "cartInformation", "priceInformation", "seoData", "published"];
                const propValues = [sku, info, inventoryInfo, manufacturerPartNumber, shippingInformation, cartInfo, priceInformation, seoData, published];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                            ${queryName}(searchString: "${info[1].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    sku
                                    manufacturerInformation {
                                        partNumber
                                    }
                                    shippingInformation {
                                        weight
                                        height
                                        length
                                        width
                                        isFreeShipping
                                        shipSeparately
                                        additionalShippingCharge {
                                            amount
                                            currency
                                        }
                                    }
                                    inventoryInformation {
                                        gtin
                                        backOrderMode
                                        displayStockAvailability
                                        notifyAdminForQuantityBelow
                                        notReturnable
                                        availableStartDate
                                        availableEndDate
                                        markAsNew
                                        minimumStockQuantity
                                        allowBackInStockNotification
                                    }
                                    cartInformation {
                                        minimumQuantity
                                        maximumQuantity
                                        allowedQuantities
                                    }
                                    priceInformation {
                                        price {
                                            amount
                                            currency
                                        }
                                        isTaxExempt
                                        availableForPreOrder
                                        preOrderAvailabilityStartDate
                                    }
                                    published
                                    seoData {
                                        searchEngineFriendlyPageName
                                        metaKeywords
                                        metaDescription
                                        metaTitle
                                        languageCode
                                    }
                                    ${infoName} {
                                        name
                                        shortDescription
                                        fullDescription
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

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'vendorId' input will successfully create a product with an attached vendor", () => {
            const extraCreate = "createVendor";
            const extraPath = "vendor";
            const extraQuery = "vendors";
            const extraItemInput = { vendorInfo: [{ name: `Cypress ${mutationName} vendor`, languageCode: "Standard" }] };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds, true);
                const info = [{ name: `Cypress ${mutationName} vendorId test`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            vendorId: "${itemIds[0]}"
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
                            vendor {
                                id
                                vendorInfo {
                                    name
                                    languageCode
                                }
                            }
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["vendor", infoName];
                    const propValues = [items[0], info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    vendor {
                                        id
                                        vendorInfo {
                                            name
                                            languageCode
                                        }
                                    }
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

        it("Mutation with 'taxCategoryId' input will successfully create a product with an attached tax category", () => {
            const extraCreate = "createTaxCategory";
            const extraPath = "taxCategory";
            const extraQuery = "taxCategories";
            const extraItemInput = { name: `Cypress ${mutationName} taxCategory` };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds, true);
                const info = [{ name: `Cypress ${mutationName} taxCategoryId test`, languageCode: "Standard" }];
                const dummyPriceInfo = { taxCategory: items[0] };
                const inputPriceInfo = { taxCategoryId: itemIds[0] };
                const mutation = `mutation {
                    ${mutationName}(
                        input: {   
                            priceInformation: ${toFormattedString(inputPriceInfo)}
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
                            priceInformation {
                                taxCategory {
                                    id
                                    name
                                }
                            }
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName, "priceInformation"];
                    const propValues = [info, dummyPriceInfo];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                                nodes {
                                    id
                                    priceInformation {
                                        taxCategory {
                                            id
                                            name
                                        }
                                    }
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

        it("Mutation with 'categoryIds' input will successfully create a product with attached categories", () => {
            const extraCreate = "createCategory";
            const extraPath = "category";
            const extraQuery = "categories";
            const extraItemInput = { categoryInfo: [{ name: `Cypress ${mutationName} category`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{ name: `Cypress ${mutationName} categoryIds test`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            categoryIds: ${toFormattedString(itemIds)}
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
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const queryBody = `id
                            categoryInfo {
                                name
                                languageCode
                            }`;
                        cy.queryByProductId(extraQuery, queryBody, id, items);
                    });
                });
            });
        });

        it("Mutation with 'manufacturerIds' input will successfully create a product with attached manufacturers", () => {
            const extraCreate = "createManufacturer";
            const extraPath = "manufacturer";
            const extraQuery = "manufacturers";
            const extraItemInput = { manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{ name: `Cypress ${mutationName} manufacturerIds test`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            manufacturerIds: ${toFormattedString(itemIds)}
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
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const queryBody = `id
                            manufacturerInfo {
                                name
                                languageCode
                            }`;
                        cy.queryByProductId(extraQuery, queryBody, id, items);
                    });
                });
            });
        });

        it("Mutation with 'attributeIds' input will successfully create a product with attached attributes", () => {
            const extraCreate = "createProductAttribute";
            const extraPath = "productAttribute";
            const extraQuery = "productAttributes";
            const extraItemInput = { name: `Cypress ${mutationName} attribute`, values: [{ name: "attribute" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{ name: `Cypress ${mutationName} attributeIds test`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            attributeIds: ${toFormattedString(itemIds)}
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
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const queryBody = `id
                            name
                            values {
                                name
                            }`;
                        cy.queryByProductId(extraQuery, queryBody, id, items);
                    });
                });
            });
        });

        it("Mutation with 'specificationOptionIds' input will successfully create a product with attached specificationOptions", () => {
            const retrieveOptionsIds = (responseBodies: []) => {
                const ids = [] as string[];
                responseBodies.forEach((response) => {
                    response.options.forEach((opt) => {
                        ids.push(opt.id);
                    });
                });
                return ids;
            };
            const extraCreate = "createProductSpecification";
            const extraPath = "productSpecification";
            const extraQuery = "productSpecifications";
            const optionsField = `options {
                id
                name
            }`;
            const extraItemInput = { name: `Cypress ${mutationName} specificationOption`, options: [{ name: "specificationOption 1" }, { name: "specificationOption 2" }] };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput, optionsField).then((results) => {
                const { deletionIds, fullItems } = results;
                addExtraItemIds(deletionIds);
                const specificationOptionIds = retrieveOptionsIds(fullItems);
                const info = [{ name: `Cypress ${mutationName} specificationOptionsIds test`, languageCode: "Standard" }];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            specificationOptionIds: ${toFormattedString(specificationOptionIds)}
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
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const queryBody = `id
                            ${optionsField}`;
                        cy.queryByProductId(extraQuery, queryBody, id, fullItems);
                    });
                });
            });
        });
    });
});