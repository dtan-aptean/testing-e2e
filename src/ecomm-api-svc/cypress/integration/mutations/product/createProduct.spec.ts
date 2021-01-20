/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 15
describe('Mutation: createProduct', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'createProduct';
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

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    afterEach(() => {
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
        if (id !== "") {
            cy.deleteItem("deleteProduct", id).then(() => {
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
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const info = [{name: "Cypress Product customData", languageCode: "Standard"}];
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
                    id = res.body.data[mutationName][itemPath].id;
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
        it("Mutation with 'vendorId' input will successfully create a product with an attached vendor", () => {
            const extraCreate = "createVendor";
            const extraPath = "vendor";
            const extraQuery = "vendors";
            const extraItemInput = { vendorInfo: [{name: `Cypress ${mutationName} vendor`, languageCode: "Standard"}] };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} vendorId test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            vendorId: "${itemIds[0]}"
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
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} taxCategoryId test`, languageCode: "Standard"}];
                const dummyPriceInfo = {taxCategory: items[0]};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {   
                            taxCategoryId: "${itemIds[0]}"
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
            const extraItemInput = { categoryInfo: [{ name:`Cypress ${mutationName} category`, languageCode: "Standard" }] };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);   
                const info = [{name: `Cypress ${mutationName} categoryIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            categoryIds: ${toFormattedString(itemIds)}
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
                const info = [{name: `Cypress ${mutationName} manufacturerIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            manufacturerIds: ${toFormattedString(itemIds)}
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
            const extraItemInput = { name: `Cypress ${mutationName} attribute`, values: [{name: "attribute"}]  };
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} attributeIds test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(info)}
                            attributeIds: ${toFormattedString(itemIds)}
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
            const retrieveOptions = (responseBodies: []) => {
                const options = [];
                responseBodies.forEach((response) => {
                    options.push(response.options);
                });
                return options;
            };
            const getOptIds = (options: []) => {
                const ids = [] as string[];
                options.forEach((opt) => {
                    ids.push(opt.id);
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
            const extraItemInput = { name: `Cypress ${mutationName} specificationOption`, options: [{name: "specificationOption 1"}, {name: "specificationOption 2"}] };
            cy.createAssociatedItems(1, extraCreate, extraPath, extraQuery, extraItemInput, optionsField).then((results) => {
                const { deletionIds, fullItems } = results;
                addExtraItemIds(deletionIds);
                const options = retrieveOptions(fullItems);
                const specificationOptionIds = getOptIds(options);
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
                        cy.queryByProductId(extraQuery, optionsField, id, options);
                    });
                });
            });
        });
    });
});