/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 15
describe('Mutation: createProduct', () => {
    let id = '';
    let extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
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
                languageCode
            }
        }
    `;

    afterEach(() => {
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
                extraIds = [];
            }
            const deletionName = "deleteProduct";
            const removalMutation = `mutation {
                ${deletionName}(input: { id: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName).then(() => {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = [infoName];
            const propValues = [info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with all required input and 'customData' input creates item with customData", () => {
        const info = [{name: "Cypress Product customData", languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    ${infoName}: ${toFormattedString(info)}
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
                        languageCode
                    }
                    customData
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["customData", infoName];
            const propValues = [customData, info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with 'vendorId' input will successfully create a product with an attached vendor", () => {
        const vendor = {vendorInfo: [{name: `Cypress ${mutationName} vendor`, languageCode: "Standard"}]};
        cy.createAndGetId("createVendor", "vendor", toFormattedString(vendor)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteVendor"});
            vendor.id = returnedId;
            const info = [{name: `Cypress ${mutationName} vendorId test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        vendorId: "${returnedId}"
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
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
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                id = res.body.data[mutationName][dataPath].id;
                const propNames = ["vendor", infoName];
                const propValues = [vendor, info];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
        const taxCategory = {name: `Cypress ${mutationName} taxCategory 1`};
        cy.createAndGetId("createTaxCategory", "taxCategory", toFormattedString(taxCategory)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteTaxCategory"});
            taxCategory.id = returnedId;
            const info = [{name: `Cypress ${mutationName} taxCategoryId test`, languageCode: "Standard"}];
            const dummyPriceInfo = {taxCategory: taxCategory};
            const mutation = `mutation {
                ${mutationName}(
                    input: {   
                        taxCategoryId: "${returnedId}"
                        ${infoName}: ${toFormattedString(info)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
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
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                id = res.body.data[mutationName][dataPath].id;
                const propNames = [infoName, "priceInformation"];
                const propValues = [info, dummyPriceInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
        const categoryOne = { categoryInfo: [{ name:`Cypress ${mutationName} category 1`, languageCode: "Standard" }] };
        cy.createAndGetId("createCategory", "category", toFormattedString(categoryOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCategory"});
            categoryOne.id = returnedId;
            const categories = [categoryOne];
            const categoryIds = [returnedId];
            const categoryTwo = {categoryInfo: [{name: `Cypress ${mutationName} category 2`, languageCode: "Standard"}] };
            cy.createAndGetId("createCategory", "category", toFormattedString(categoryTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteCategory"});
                categoryTwo.id = secondId;
                categories.push(categoryTwo);
                categoryIds.push(secondId);   
                const info = [{name: `Cypress ${mutationName} categoryIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            categoryIds: ${toFormattedString(categoryIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with 'manufacturerIds' input will successfully create a product with attached manufacturers", () => {
        const manufacturerOne = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 1`, languageCode: "Standard" }] };
        cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer"});
            manufacturerOne.id = returnedId;
            const manufacturers = [manufacturerOne];
            const manufacturerIds = [returnedId];
            const manufacturerTwo = {manufacturerInfo: [{ name: `Cypress ${mutationName} manufacturer 2`, languageCode: "Standard" }] };
            cy.createAndGetId("createManufacturer", "manufacturer", toFormattedString(manufacturerTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteManufacturer"});
                manufacturerTwo.id = secondId;
                manufacturers.push(manufacturerTwo);
                manufacturerIds.push(secondId);  
                const info = [{name: `Cypress ${mutationName} manufacturerIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            manufacturerIds: ${toFormattedString(manufacturerIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with 'attributeIds' input will successfully create a product with attached attributes", () => {
        const attributeOne = {name: `Cypress ${mutationName} attribute 1`, values: [{name: "attribute 1"}] };
        cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteProductAttribute"});
            attributeOne.id = returnedId;
            const attributes = [attributeOne];
            const attributeIds = [returnedId];
            const attributeTwo = {name: `Cypress ${mutationName} attribute 2`, values: [{name: "attribute 2"}] };
            cy.createAndGetId("createProductAttribute", "productAttribute", toFormattedString(attributeTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteProductAttribute"});
                attributeTwo.id = secondId;
                attributes.push(attributeTwo);
                attributeIds.push(secondId); 
                const info = [{name: `Cypress ${mutationName} attributeIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            attributeIds: ${toFormattedString(attributeIds)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
                            id
                            ${infoName} {
                                name
                                languageCode
                            }
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = [infoName];
                    const propValues = [info];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation with 'specificationOptionIds' input will successfully create a product with attached specificationOptions", () => {
        const productSpecification = {name: `Cypress ${mutationName} specificationOption 1`, options: [{name: "specificationOption 1"}, {name: "specificationOption2"}] };
        const optionsField = `options {
            id
            name
        }`;
        cy.createAndGetId("createProductSpecification", "productSpecification", toFormattedString(productSpecification), optionsField).then((returnedItem) => {
            assert.exists(returnedItem.id);
            assert.exists(returnedItem.options);
            extraIds.push({itemId: returnedItem.id, deleteName: "deleteProductSpecification"});
            const specificationOptionIds = [returnedItem.options[0].id, returnedItem.options[1].id];
            const options = returnedItem.options;
            const info = [{name: `Cypress ${mutationName} specificationOptionsIds test`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        specificationOptionIds: ${toFormattedString(specificationOptionIds)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${infoName} {
                            name
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                id = res.body.data[mutationName][dataPath].id;
                const propNames = [infoName];
                const propValues = [info];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    cy.queryByProductId("productSpecifications", optionsField, id, options);
                });
            });
       });
    });

    it("Mutation creates item that has all included input", () => {
        const info = [
            {name: "Translate name to German", shortDescription: "Translate short desc to German", fullDescription: "Translate full desc to German", languageCode: "de-DE"},
            {name: "Cypress Product Input", shortDescription: "Cypress testing 'create' mutation input", fullDescription: "Cypress testing createProduct mutation input, to see if the input is added properly", languageCode: "Standard"}
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
            preOrderAvailabilityStartDateTime: preOrder ? today.toUTCString(): null
        }; 
        const published = Cypress._.random(0, 1) === 1;
        const seoData = [
            {
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
            }
        ];
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