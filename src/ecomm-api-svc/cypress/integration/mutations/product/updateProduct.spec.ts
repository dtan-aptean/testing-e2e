/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 18
describe('Mutation: updateProduct', () => {
    var id = '';
    var updateCount = 0;
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];
    const mutationName = 'updateProduct';
    const queryName = "products";
    const itemPath = 'product';
    const infoName = "productInfo";
    const standardMutationBody = `
        code
        message
        error
        ${itemPath} {
            id
            ${infoName} {
                name
                languageCode
            }
        }
    `;
    const createName = 'createProduct';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", languageCode: "Standard"}]}`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds);
            // Delete the item we've been updating
            cy.deleteItem("deleteProduct", id);
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
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
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

        it("Mutation will succeed with valid 'name' and 'languageCode' input", () => {
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}", 
                        ${infoName}: ${toFormattedString(info)}
                    }) {
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
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
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
            const info = [{name: `Cypress ${mutationName} customData extra`, languageCode: "Standard"}];
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const input = `{${infoName}: ${toFormattedString(info)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: "deleteProduct", itemName: info[0].name, queryName: queryName});
                const newInfo = [{name: `Cypress ${mutationName} CD extra updated`, languageCode: "Standard"}];
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
                {name: "Zypresse aktualisierenKategorie Aktualisieren2", shortDescription: `Prüfung #${updateCount}`, fullDescription: `Prüfung #${updateCount} for ${mutationName}`, languageCode: "de-DE"},
                {name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount}`, fullDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}
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
                allowedQuantities: [Cypress._.random(1, 500)]
            };
            const preOrder = Cypress._.random(0, 1) === 1
            const priceInformation = {
                price: {
                    amount: Cypress._.random(1, 100),
                    currency: "USD"
                },
                isTaxExempt: Cypress._.random(0, 1) === 1,
                availableForPreOrder: preOrder,
                preOrderAvailabilityStartDateTime: preOrder ? today.toUTCString(): null
            }; 
            const published = Cypress._.random(0, 1) === 1;
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
            const inventoryInfo = {
                displayStockAvailability: Cypress._.random(0, 1) === 1,
                notifyAdminForQuantityBelow: Cypress._.random(1, 5),
                notReturnable: Cypress._.random(0, 1) === 1,
                availableStartDate: nextWeek.toUTCString(),
                availableEndDate: twoWeeks.toUTCString(),
                markAsNew: Cypress._.random(0, 1) === 1,
                availableForPreOrder: priceInformation.availableForPreOrder,
                preOrderAvailabilityStartDateTime: priceInformation.preOrderAvailabilityStartDateTime,
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
                        preOrderAvailabilityStartDateTime: ${priceInformation.preOrderAvailabilityStartDateTime ? `"${priceInformation.preOrderAvailabilityStartDateTime}"`: null}
                        seoData: ${toFormattedString(seoData)}
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                const propNames = ["sku", infoName, "inventoryInformation", "manufacturerInformation.manufacturerPartNumber", "shippingInformation", "cartInformation", "priceInformation", "seoData", "published"];
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

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'vendorId' input will successfully attach the vendor", () => {
            const vendor = {vendorInfo: [{name: `Cypress ${mutationName} vendor`, languageCode: "Standard"}]};
            cy.createAndGetId("createVendor", "vendor", toFormattedString(vendor)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteVendor", itemName: vendor.vendorInfo[0].name, queryName: "vendors"});
                vendor.id = returnedId;
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toFormattedString(info)}
                            vendorId: "${returnedId}"
                        }
                    ) {
                        code
                        message
                        error
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
                    const propNames = ["vendor", infoName];
                    const propValues = [vendor, info];
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

        it("Mutation with 'taxCategoryId' input will successfully attach the tax category", () => {
            const taxCategory = {name: `Cypress ${mutationName} taxCategory 1`};
            cy.createAndGetId("createTaxCategory", "taxCategory", toFormattedString(taxCategory)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteTaxCategory", itemName: taxCategory.name, queryName: "taxCategories"});
                taxCategory.id = returnedId;
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                const dummyPriceInfo = {taxCategory: taxCategory};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            taxCategoryId: "${returnedId}"
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        code
                        message
                        error
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

        it("Mutation with 'categoryIds' input will successfully attach the categories", () => {
            const categoryOne = { categoryInfo: [{ name:`Cypress ${mutationName} category 1`, languageCode: "Standard" }] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteCategory", itemName: categoryOne.categoryInfo[0].name, queryName: "categories"});
                categoryOne.id = returnedId;
                const categories = [categoryOne];
                const categoryIds = [returnedId];
                const categoryTwo = {categoryInfo: [{name: `Cypress ${mutationName} category 2`, languageCode: "Standard"}] };
                cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteCategory", itemName: categoryTwo.categoryInfo[0].name, queryName: "categories"});
                    categoryTwo.id = secondId;
                    categories.push(categoryTwo);
                    categoryIds.push(secondId);
                    updateCount++;
                    const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                id: "${id}"
                                ${infoName}: ${toFormattedString(info)}
                                categoryIds: ${toFormattedString(categoryIds)}
                            }
                        ) {
                            code
                            message
                            error
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
                        const propNames = [infoName];
                        const propValues = [info];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const queryBody = `id
                                categoryInfo {
                                    name
                                    languageCode
                                }`;
                            cy.queryByProductId("categories", queryBody, id, categories);
                        });
                    });
                });
            });
        });

        it("Mutation with 'manufacturerIds' input will successfully attach the manufacturers", () => {
            const manufacturerOne = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 1`, languageCode: "Standard" }] };
            cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer", itemName: manufacturerOne.manufacturerInfo[0].name, queryName: "manufacturers"});
                manufacturerOne.id = returnedId;
                const manufacturers = [manufacturerOne];
                const manufacturerIds = [returnedId];
                const manufacturerTwo = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 2`, languageCode: "Standard" }] };
                cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteManufacturer", itemName: manufacturerTwo.manufacturerInfo[0].name, queryName: "manufacturers"});
                    manufacturerTwo.id = secondId;
                    manufacturers.push(manufacturerTwo);
                    manufacturerIds.push(secondId);
                    updateCount++;
                    const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                id: "${id}"
                                ${infoName}: ${toFormattedString(info)}
                                manufacturerIds: ${toFormattedString(manufacturerIds)}
                            }
                        ) {
                            code
                            message
                            error
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
                        const propNames = [infoName];
                        const propValues = [info];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const queryBody = `id
                                manufacturerInfo {
                                    name
                                    languageCode
                                }`;
                            cy.queryByProductId("manufacturers", queryBody, id, manufacturers);
                        });
                    });
                });
            });
        });

        it("Mutation with 'attributeIds' input will successfully attach the attributes", () => {
            const attributeOne = {name: `Cypress ${mutationName} attribute 1`, values: [{name: "attribute 1"}] };
            cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteProductAttribute", itemName: attributeOne.name, queryName: "productAttributes"});
                attributeOne.id = returnedId;
                const attributes = [attributeOne];
                const attributeIds = [returnedId];
                const attributeTwo = {name: `Cypress ${mutationName} attribute 2`, values: [{name: "attribute 2"}] };
                cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteProductAttribute", itemName: attributeTwo.name, queryName: "productAttributes"});
                    attributeTwo.id = secondId;
                    attributes.push(attributeTwo);
                    attributeIds.push(secondId);
                    updateCount++;
                    const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                    const mutation = `mutation {
                        ${mutationName}(
                            input: { 
                                id: "${id}"
                                ${infoName}: ${toFormattedString(info)}
                                attributeIds: ${toFormattedString(attributeIds)}
                            }
                        ) {
                            code
                            message
                            error
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
                        const propNames = [infoName];
                        const propValues = [info];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const queryBody = `id
                                name
                                values {
                                    name
                                }`;
                            cy.queryByProductId("productAttributes", queryBody, id, attributes);
                        });
                    });
                });
            });
        });

        it("Mutation with 'specificationOptionIds' input will successfully attach the specificationOptions", () => {
            const productSpecification = {name: `Cypress ${mutationName} specificationOption 1`, options: [{name: "specificationOption 1"}, {name: "specificationOption2"}] };
            const optionsField = `options {
                id
                name
            }`;
            cy.createAndGetId("createProductSpecification", "productSpecification", toFormattedString(productSpecification), optionsField).then((returnedItem) => {
                assert.exists(returnedItem.id);
                assert.exists(returnedItem.options);
                extraIds.push({itemId: returnedItem.id, deleteName: "deleteProductSpecification", itemName: productSpecification.name, queryName: "productSpecifications"});
                const specificationOptionIds = [returnedItem.options[0].id, returnedItem.options[1].id];
                const options = returnedItem.options;
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toFormattedString(info)}
                            specificationOptionIds: ${toFormattedString(specificationOptionIds)}
                        }
                    ) {
                        code
                        message
                        error
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
                    const propNames = [infoName];
                        const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        cy.queryByProductId("productSpecifications", optionsField, id, options);
                    });
                });
        });
        });
    });
});