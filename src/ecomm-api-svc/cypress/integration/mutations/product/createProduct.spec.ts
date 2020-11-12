/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 12
describe('Mutation: createProduct', () => {
    let id = '';
    const mutationName = 'createProduct';
    const queryName = "products";
    const dataPath = 'product';
    const infoName = "productInfo";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            ${infoName} {
                name
                shortDescription
                fullDescription
                languageCode
            }
            inventoryInformation {
                minimumStockQuantity
            }
        }
    `;

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteProduct";
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

    it("Mutation will fail with no 'shortDescription' or 'fullDescription' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: [{name: "Cypress no descriptions", languageCode: "Standard"}] }) {
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

    it("Mutation will fail with invalid 'shortDescription'input", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: [{
                        name: "Cypress invalid shortDescription",
                        shortDescription: 5,
                        fullDescription: "Cypress testing invalid types",
                        languageCode: "Standard"
                    }]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail with invalid 'fullDescription' input", () => {
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    ${infoName}: [{
                        name: "Cypress invalid fullDescription",
                        shortDescription: "Cypress testing invalid types",
                        fullDescription: 5,
                        languageCode: "Standard"
                    }]
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail without 'inventoryInformation' input", () => {
        const info = [{name: `Cypress ${mutationName} no inventoryInformation`, shortDescription: `Test for ${mutationName}`, languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    ${infoName}: ${toFormattedString(info)}
                }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'name', 'shortDescription', and 'inventoryInformation' input", () => {
        const info = [{
            name: "Cypress API Product SD",
            shortDescription: "Testing creation",
            languageCode: "Standard"
        }];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = [infoName, "inventoryInformation"];
            const propValues = [info, inventoryInfo];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            ${infoName} {
                                name
                                shortDescription
                                fullDescription
                                languageCode
                            }
                            inventoryInformation {
                                minimumStockQuantity
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });

    it("Mutation will succeed with valid 'name', 'fullDescription', and 'inventoryInformation' input", () => {
        const info = [{
            name: "Cypress API Product SD",
            fullDescription: "Testing creation with fullDescription",
            languageCode: "Standard"
        }];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = [infoName, "inventoryInformation"];
            const propValues = [info, inventoryInfo];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            ${infoName} {
                                name
                                shortDescription
                                fullDescription
                                languageCode
                            }
                            inventoryInformation {
                                minimumStockQuantity
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const info = [{name: "Cypress Product customData", shortDescription: `Test for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                    customData: ${toFormattedString(customData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    ${infoName} {
                        name
                        shortDescription
                        fullDescription
                        languageCode
                    }
                    inventoryInformation {
                        minimumStockQuantity
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["customData", infoName, "inventoryInformation"];
            const propValues = [customData, info, inventoryInfo];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    // TODO: vendorIds test

    // TODO: taxCategoryId test

    // TODO: categoryIds test

    // TODO: manufacturerIds test

    // TODO: attributeIds test

    // TODO: specificationOptionIds test

    it("Mutation creates item that has all included input", () => {
        const info = [
            {name: "Cypress Product Input", shortDescription: "Cypress testing 'create' mutation input", fullDescription: "Cypress testing createProduct mutation input, to see if the input is added properly", languageCode: "Standard"},
            {name: "Translate name to German", shortDescription: "Translate short desc to German", fullDescription: "Translate full desc to German", languageCode: "de-DE"}
        ];
        const today = new Date();
        const nextWeek = new Date(today.valueOf() + 604800000);
        const twoWeeks = new Date(today.valueOf() + 1209600000);
        const sku = "Cypress Sku";
        const manufacturerPartNumber = `C-${Cypress._.random(1, 10)}`;
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
            minimumCartQuantity: Cypress._.random(1, 100),
            maximumCartQuantity: Cypress._.random(100, 500),
            allowedQuantities: Cypress._.random(1, 500)
        };
        const preOrder = Cypress._.random(0, 1) === 1
        const priceInformation = {
            price: {
                amount: Cypress._.random(1, 100),
                currency: "USD"
            },
            isTaxExempt: Cypress._.random(0, 1) === 1,
            availableForPreOrder: preOrder,
            preOrderAvailabilityStartDateTimeUtc: preOrder ? today.toUTCString(): null
        }; 
        const published = Cypress._.random(0, 1) === 1;
        const seoData = [{
            searchEngineFriendlyPageName: "Cypress Update",
            metaKeywords:  "Cypress",
            metaDescription: "Cypress Update metaTag",
            metaTitle: "Cypress Update test",
            languageCode: "Standard"
        }];
        const inventoryInfo = {
            displayStockAvailability: Cypress._.random(0, 1) === 1,
            notifyAdminForQuantityBelow: Cypress._.random(1, 5),
            notReturnable: Cypress._.random(0, 1) === 1,
            availableStartDate: nextWeek.toUTCString(),
            availableEndDate: twoWeeks.toUTCString(),
            markAsNew: Cypress._.random(0, 1) === 1,
            availableForPreOrder: priceInformation.availableForPreOrder,
            preOrderAvailabilityStartDateTimeUtc: priceInformation.preOrderAvailabilityStartDateTimeUtc,
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
                    price: ${toFormattedString(priceInformation.price)}
                    isTaxExempt: ${priceInformation.isTaxExempt}
                    availableForPreOrder: ${priceInformation.availableForPreOrder}
                    published: ${published}
                    preOrderAvailabilityStartDateTimeUtc: ${priceInformation.preOrderAvailabilityStartDateTimeUtc ? `"${priceInformation.preOrderAvailabilityStartDateTimeUtc}"`: null}
                    seoData: ${toFormattedString(seoData)}
                }
            ) {
                code
                message
                error
                ${dataPath} {
                    id
                    sku
                    manufacturerInformation {
                        partNumber
                    }
                    shippingInformation {
                        weight
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
                        displayStockAvailability
                        notifyAdminForQuantityBelow
                        notReturnable
                        availableStartDate
                        availableEndDate
                        markAsNew
                        availableForPreorder
                        preorderAvailabilityStartDate
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
                        availableForPreorder
                        preorderAvailabilityStartDate
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["sku", infoName, "inventoryInformation", "manufacturerInformation.manufacturerPartNumber", "shippingInformation", "cartInformation", "priceInformation", "seoData", "published"];
            const propValues = [sku, info, inventoryInfo, manufacturerPartNumber, shippingInformation, cartInfo, priceInformation, seoData, published];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            sku
                            manufacturerInformation {
                                partNumber
                            }
                            shippingInformation {
                                weight
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
                                displayStockAvailability
                                notifyAdminForQuantityBelow
                                notReturnable
                                availableStartDate
                                availableEndDate
                                markAsNew
                                availableForPreorder
                                preorderAvailabilityStartDate
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
                                availableForPreorder
                                preorderAvailabilityStartDate
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