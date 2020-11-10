/// <reference types="cypress" />
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
    // Function to turn an object or array into a string to use as input
    function toInputString(item) {
        function iterateThrough (propNames?: string[]) {
            var returnValue = '';
            for (var i = 0; i < (propNames ? propNames.length : item.length); i++) {
                if (i !== 0) {
                    returnValue = returnValue + ', ';
                }
                var value = propNames ? item[propNames[i]]: item[i];
                if (typeof value === 'string') {
                    value = `"${value}"`;
                } else if (typeof value === 'object') {
                    // Arrays return as an object, so this will get both
                    value = toInputString(value);
                }
                returnValue = returnValue + (propNames ? `${propNames[i]}: ${value}`: value);
            }
            return returnValue;
        };
        var itemAsString = '{ ';
        var props = undefined;
        if (item === null) {
            return "null";
        } else if (item === undefined) {
            return "undefined";
        } else if (Array.isArray(item)) {
            itemAsString = '[';
        } else if (typeof item === 'object') {
            props = Object.getOwnPropertyNames(item);
        }
        itemAsString = itemAsString + iterateThrough(props) + (props ? ' }' : ']');
        return itemAsString;
    };

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
                    ${infoName}: ${toInputString(info)}
                    inventoryInformation: ${toInputString(inventoryInfo)}
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
                    ${infoName}: ${toInputString(info)}
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
                    ${infoName}: ${toInputString(info)}
                    inventoryInformation: ${toInputString(inventoryInfo)}
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
                    ${infoName}: ${toInputString(info)}
                    inventoryInformation: ${toInputString(inventoryInfo)}
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
                    ${infoName}: ${toInputString(info)}
                    inventoryInformation: ${toInputString(inventoryInfo)}
                    customData: ${toInputString(customData)}
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
            const propNames = [infoName, "inventoryInformation", "customData"];
            const propValues = [info, inventoryInfo, customData];
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
        const vendorInfo = {name: `Cypress ${dataPath} vendor`, languageCode: "Standard"};
        const vendorInput = `{vendorInfo: ${toInputString(vendorInfo)} }`;
        cy.createAndGetId("createVendor", "vendor", vendorInput).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteVendor"});
            vendorInfo.id = returnedId;
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
            const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        ${infoName}: ${toInputString(info)}
                        inventoryInformation: ${toInputString(inventoryInfo)}
                        vendorId: ${returnedId}
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
                            name
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
                const propNames = ["vendor", infoName, "inventoryInformation"];
                const propValues = [vendorInfo, info, inventoryInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${additionalFields}
                                vendor {
                                    id
                                    name
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

    it("Mutation with 'taxCategoryId' input will successfully attach the tax category", () => {
        const taxCategoryName = `Cypress ${dataPath} taxCategory 1`;
        const taxCategoryInput = `{name: "${taxCategoryName}"}`;
        cy.createAndGetId("createTaxCategory", "taxCategory", taxCategoryInput).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteTaxCategory"});
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
            const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${id}"
                        taxCategoryId: ${returnedId}
                        ${infoName}: ${toInputString(info)}
                        inventoryInformation: ${toInputString(inventoryInfo)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        ${additionalFields}
                        priceInfomation {
                            taxCategory {
                                id
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
                const propNames = [infoName, "inventoryInformation", "priceInformation.taxCategory.id"];
                const propValues = [info, inventoryInfo, returnedId];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                ${additionalFields}
                                priceInfomation {
                                    taxCategory {
                                        id
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
        const categoryOneName = `Cypress ${dataPath} category 1`;
        const categoryOneInput = `{categoryInfo: {name: "${categoryOneName}", languageCode: "Standard"} }`;
        cy.createAndGetId("createCategory", "category", categoryOneInput).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCategory"});
            const categoryIds = [returnedId];
            const categoryTwoName = `Cypress ${dataPath} category 2`;
            const categoryTwoInput = `{categoryInfo: {name: "${categoryTwoName}", languageCode: "Standard"} }`;
            cy.createAndGetId("createCategory", "category", categoryTwoInput).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteCategory"});
                categoryIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toInputString(info)}
                            inventoryInformation: ${toInputString(inventoryInfo)}
                            categoryIds: ${toInputString(categoryIds)}
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
                    const propValues = [categoryIds, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    categories {
                                        id
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
        const manufacturerOneName = `Cypress ${dataPath} manufacturer 1`;
        const manufacturerOneInput = `{manufacturerInfo: {name: "${manufacturerOneName}", languageCode: "Standard"} }`;
        cy.createAndGetId("createManufacturer", "manufacturer", manufacturerOneInput).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteManufacturer"});
            const manufacturerIds = [returnedId];
            const manufacturerTwoName = `Cypress ${dataPath} manufacturer 2`;
            const manufacturerTwoInput = `{manufacturerInfo: {name: "${manufacturerTwoName}", languageCode: "Standard"} }`;
            cy.createAndGetId("createManufacturer", "manufacturer", manufacturerTwoInput).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteManufacturer"});
                manufacturerIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toInputString(info)}
                            inventoryInformation: ${toInputString(inventoryInfo)}
                            manufacturerIds: ${toInputString(manufacturerIds)}
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
                    const propValues = [manufacturerIds, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    manufacturers {
                                        id
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
        const attributeOneName = `Cypress ${dataPath} attribute 1`;
        const attributeOneInput = `{name: "${attributeOneName}", values: [{name: "attribute 1"}] }`;
        cy.createAndGetId("createProductAttribute", "productAttribute", attributeOneInput).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteProductAttribute"});
            const attributeIds = [returnedId];
            const attributeTwoName = `Cypress ${dataPath} attribute 2`;
            const attributeTwoInput = `{name: "${attributeTwoName}", values: [{name: "attribute 2"}] }`;
            cy.createAndGetId("createProductAttribute", "productAttribute", attributeTwoInput).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteProductAttribute"});
                attributeIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, shortDescription: `Test #${updateCount} for ${mutationName}`, languageCode: "Standard"}];
                const inventoryInfo = {minimumStockQuantity: Cypress._.random(1, 10)};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            ${infoName}: ${toInputString(info)}
                            inventoryInformation: ${toInputString(inventoryInfo)}
                            attributeIds: ${toInputString(attributeIds)}
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
                    const propValues = [attributeIds, info, inventoryInfo];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                nodes {
                                    id
                                    ${additionalFields}
                                    attributes {
                                        id
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
        cy.createAndGetId("createProductSpecification", "productSpecification", toInputString(productSpecification), optionsField).then((returnedItem) => {
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
                        ${infoName}: ${toInputString(info)}
                        inventoryInformation: ${toInputString(inventoryInfo)}
                        specificationOptionIds: ${toInputString(specificationOptionIds)}
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
        }
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    id: "${id}"
                    ${infoName}: ${toInputString(info)}
                    sku: "${sku}"
                    manufacturerPartNumber: "${manufacturerPartNumber}"
                    shippingInformation: ${toInputString(shippingInformation)}
                    inventoryInformation: ${toInputString(inventoryInfo)}
                    cartInformation : ${toInputString(cartInfo)}
                    price: ${toInputString(priceInformation.price)}
                    isTaxExempt: ${priceInformation.isTaxExempt}
                    availableForPreOrder: ${priceInformation.availableForPreOrder}
                    published: ${published}
                    preOrderAvailabilityStartDateTimeUtc: ${priceInformation.preOrderAvailabilityStartDateTimeUtc ? `"${priceInformation.preOrderAvailabilityStartDateTimeUtc}"`: null}
                    seoData: ${toInputString(seoData)}
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