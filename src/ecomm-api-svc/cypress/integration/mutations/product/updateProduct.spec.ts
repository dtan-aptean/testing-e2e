/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 14
describe('Mutation: updateProduct', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'updateProduct';
    const queryName = "products";
    const dataPath = 'product';
    const infoName = "productInfo";
    const additionalFields = `inventoryInformation {
        minimumStockQuantity
    }`;
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
            ${additionalFields}
        }
    `;
    const createName = 'createProduct';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", shortDescription: "Cypress testing for ${mutationName}", fullDescription: "Lots of cypress testing for ${mutationName}", languageCode: "Standard"}], inventoryInformation: {minimumStockQuantity: 5} }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            if (extraIds.length > 0) {
                for (var i = 0; i < extraIds.length; i++) {
                    cy.wait(2000);
                    var extraRemoval = `mutation {
                        ${extraIds[i].deleteName}(input: { id: "${extraIds[i].itemId}" }) {
                            code
                            message
                            error
                        }
                    }`;
                    cy.postAndConfirmDelete(extraRemoval, extraIds[i].deleteName);
                }
            }
            // Delete the item we've been updating
            const deletionName = "deleteProduct";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName);
        }
    });

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
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail without 'shortDescription' or 'fullDescription' input", () => {
        const info = [{name: `Cypress ${mutationName} no descriptions`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    id: "${id}", 
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail without 'inventoryInformation' input", () => {
        const info = [{name: `Cypress ${mutationName} no inventoryInformation`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    id: "${id}", 
                    ${infoName}: ${toFormattedString(info)}
                }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will succeed with valid 'id', 'name', 'shortDescription', and 'inventoryInformation' input", () => {
        updateCount++;
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    id: "${id}", 
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
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
                            ${additionalFields}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });

    it("Mutation will succeed with valid 'id', 'name', 'fullDescription', and 'inventoryInformation' input", () => {
        updateCount++;
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, fullDescription: `This is test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    id: "${id}", 
                    ${infoName}: ${toFormattedString(info)}
                    inventoryInformation: ${toFormattedString(inventoryInfo)}
                }) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
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
                            ${additionalFields}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
            });
        });
    });

    it("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
        const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
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
                    ${additionalFields}
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
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

    it("Mutation with 'vendorId' input will successfully attach the vendor", () => {
        const vendor = {vendorInfo: [{name: `Cypress ${dataPath} vendor`, languageCode: "Standard"}]};
        cy.createAndGetId("createVendor", "vendor", toFormattedString(vendor)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteVendor"});
            vendor.id = returnedId;
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
            const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
                        vendorId: "${returnedId}"
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${additionalFields}
                        vendor {
                            id
                            vendorInfo {
                                name
                                languageCode
                            }
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
                const propNames = ["vendor", infoName, "inventoryInformation"];
                const propValues = [vendor, info, inventoryInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${additionalFields}
                                vendor {
                                    id
                                    vendorInfo {
                                        name
                                        languageCode
                                    }
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

    it("Mutation with 'taxCategoryId' input will successfully attach the tax category", () => {
        const taxCategory = {name: `Cypress ${dataPath} taxCategory 1`};
        cy.createAndGetId("createTaxCategory", "taxCategory", toFormattedString(taxCategory)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteTaxCategory"});
            taxCategory.id = returnedId;
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
            const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
            const dummyPriceInfo = {taxCategory: taxCategory};
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        taxCategoryId: "${returnedId}"
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${additionalFields}
                        priceInformation {
                            taxCategory {
                                id
                                name
                            }
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
                const propNames = [infoName, "inventoryInformation", "priceInformation"];
                const propValues = [info, inventoryInfo, dummyPriceInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${additionalFields}
                                priceInformation {
                                    taxCategory {
                                        id
                                        name
                                    }
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

    it("Mutation with 'categoryIds' input will successfully attach the categories", () => {
        const categoryOne = { categoryInfo: [{ name:`Cypress ${dataPath} category 1`, languageCode: "Standard" }] };
        cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCategory"});
            categoryOne.id = returnedId;
            const categories = [categoryOne];
            const categoryIds = [returnedId];
            const categoryTwo = {categoryInfo: [{name: `Cypress ${dataPath} category 2`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteCategory"});
                categoryTwo.id = secondId;
                categories.push(categoryTwo);
                categoryIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toFormattedString(info)}
                            inventoryInformation: ${toFormattedString(inventoryInfo)}
                            categoryIds: ${toFormattedString(categoryIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${additionalFields}
                            categories {
                                id
                                categoryInfo {
                                    name
                                    languageCode
                                }
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
                    const propNames = ["categories", infoName, "inventoryInformation"];
                    const propValues = [categories, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    categories {
                                        id
                                        categoryInfo {
                                            name
                                            languageCode
                                        }
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
    });

    it("Mutation with 'manufacturerIds' input will successfully attach the manufacturers", () => {
        const manufacturerOne = {manufacturerInfo: [{ name: `Cypress ${dataPath} manufacturer 1`, languageCode: "Standard" }] };
        cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer"});
            manufacturerOne.id = returnedId;
            const manufacturers = [manufacturerOne];
            const manufacturerIds = [returnedId];
            const manufacturerTwo = {manufacturerInfo: [{ name: `Cypress ${dataPath} manufacturer 2`, languageCode: "Standard" }] };
            cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteManufacturer"});
                manufacturerTwo.id = secondId;
                manufacturers.push(manufacturerTwo);
                manufacturerIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toFormattedString(info)}
                            inventoryInformation: ${toFormattedString(inventoryInfo)}
                            manufacturerIds: ${toFormattedString(manufacturerIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${additionalFields}
                            manufacturers {
                                id
                                manufacturerInfo {
                                    name
                                    languageCode
                                }
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
                    const propNames = ["manufacturers", infoName, "inventoryInformation"];
                    const propValues = [manufacturers, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    manufacturers {
                                        id
                                        manufacturerInfo {
                                            name
                                            languageCode
                                        }
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
    });

    it("Mutation with 'attributeIds' input will successfully attach the attributes", () => {
        const attributeOne = {name: `Cypress ${dataPath} attribute 1`, values: [{name: "attribute 1"}] };
        cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteProductAttribute"});
            attributeOne.id = returnedId;
            const attributes = [attributeOne];
            const attributeIds = [returnedId];
            const attributeTwo = {name: `Cypress ${dataPath} attribute 2`, values: [{name: "attribute 2"}] };
            cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteProductAttribute"});
                attributeTwo.id = secondId;
                attributes.push(attributeTwo);
                attributeIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toFormattedString(info)}
                            inventoryInformation: ${toFormattedString(inventoryInfo)}
                            attributeIds: ${toFormattedString(attributeIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${additionalFields}
                            attributes {
                                id
                                name
                                values {
                                    name
                                }
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
                    const propNames = ["attributes", infoName, "inventoryInformation"];
                    const propValues = [attributes, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    attributes {
                                        id
                                        name
                                        values {
                                            name
                                        }
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
    });

    it("Mutation with 'specificationOptionIds' input will successfully attach the specificationOptions", () => {
        const productSpecification = {name: `Cypress ${dataPath} specificationOption 1`, options: [{name: "specificationOption 1"}, {name: "specificationOption2"}] };
        const optionsField = `options {
            id
            name
        }`;
        cy.createAndGetId("createProductSpecification", "productSpecification", toFormattedString(productSpecification), optionsField).then((returnedItem) => {
            assert.exists(returnedItem.id);
            assert.exists(returnedItem.options);
            extraIds.push({itemId: returnedItem.id, deleteName: "deleteProductSpecification"});
            const specificationOptionIds = [returnedItem.options[0].id, returnedItem.options[1].id];
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
            const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        ${infoName}: ${toFormattedString(info)}
                        inventoryInformation: ${toFormattedString(inventoryInfo)}
                        specificationOptionIds: ${toFormattedString(specificationOptionIds)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${additionalFields}
                        specificationOptions {
                            id
                            name
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
                const propNames = ["specificationOptions", infoName, "inventoryInformation"];
                const propValues = [returnedItem.options, info, inventoryInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${additionalFields}
                                specificationOptions {
                                    id
                                    name
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

    it("Mutation will correctly use all input", () => {
        updateCount++;
        const info = [
            {name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount}`, fullDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"},
            {name: "Zypresse aktualisierenKategorie Aktualisieren2", shortDescription: `Prüfung #${updateCount}`, fullDescription: `Prüfung #${updateCount} for ${mutationName}`, languageCode: "de-DE"}
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
                    id: "${id}"
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