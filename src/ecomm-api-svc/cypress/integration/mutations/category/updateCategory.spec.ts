/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 15
describe('Mutation: updateCategory', () => {
    let id = '';
    let updateCount = 0;
    const extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'updateCategory';
    const queryName = "categories";
    const dataPath = 'category';
    const infoName = "categoryInfo";
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            id
            ${infoName} {
                name
                description
                languageCode
            }
        }
    `;
    const createName = 'createCategory';

    before(() => {
        // Create an item for the tests to update
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
        });
    });

    after(() => {
        if (id !== '') {
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
            const deletionName = "deleteCategory";
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

    it("Mutation will fail with no 'languageCode' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", ${infoName}: [{name: "Cypress no languageCode"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
    });

    it("Mutation will fail with no 'Name' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { id: "${id}", ${infoName}: [{languageCode: "Standard"}] }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmMutationError(mutation, mutationName, dataPath);
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = [infoName];
            const propValues = [info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation with all required input and 'customData' input updates item with customData", () => {
        updateCount++;
        const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, canDelete: true};
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
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = ["customData", infoName];
            const propValues = [customData, info];
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

    it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
        const info = [{name: `Cypress ${mutationName} customData extra`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
        const customData = {data: `${dataPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
        const input = `{${infoName}: ${toFormattedString(info)}, customData: ${toFormattedString(customData)}}`;
        cy.createAndGetId(createName, dataPath, input, "customData").then((createdItem) => {
            assert.exists(createdItem.id);
            assert.exists(createdItem.customData);
            extraIds.push({itemId: createdItem.id, deleteName: "deleteCategory"});
            const newInfo = [{name: `Cypress ${mutationName} CD extra updated`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
            const newCustomData = {data: `${dataPath} customData`, newDataField: { canDelete: true }};
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
                    ${dataPath} {
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
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = ["customData", infoName];
                const propValues = [newCustomData, newInfo];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${newInfo[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation with 'parentCategoryId' will succesfully attach the parent category", () => {
        const name = `Cypress subCategory 1`;
        const input = `{${infoName}: [{name: "${name}", languageCode: "Standard"}] }`;
        cy.createAndGetId(createName, dataPath, input).then((returnedId: string) => {
            var subCategoryId = returnedId;
            extraIds.push({itemId: subCategoryId, deleteName: "deleteCategory"});
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        id: "${subCategoryId}"
                        parentCategoryId: "${id}"
                        ${infoName}: [{
                            name: "${name}"
                            languageCode: "Standard"
                        }]
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        id
                        parent {
                            id
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const propNames = ["parent"];
                const propValues = [{id: `${id}`}];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                id
                                parent {
                                    id
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, subCategoryId, propNames, propValues);
                });
            });
        });
    });

    it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
        const discountOne = {name: `Cypress ${mutationName} discount 1`, discountType: "ASSIGNED_TO_CATEGORIES", discountAmount: {amount: 15, currency: "USD"}};
        cy.createAndGetId("createDiscount", "discount", toFormattedString(discountOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteDiscount"});
            discountOne.id = returnedId;
            const discounts = [discountOne];
            const discountIds = [returnedId];
            const discountTwo = {name: `Cypress ${mutationName} discount 2`, discountType: "ASSIGNED_TO_CATEGORIES", discountAmount: {amount: 30, currency: "USD"}};
            cy.createAndGetId("createDiscount", "discount", toFormattedString(discountTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteDiscount"});
                discountTwo.id = secondId;
                discounts.push(discountTwo);
                discountIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            discountIds: ${toFormattedString(discountIds)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
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
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    const propNames = [infoName, "discounts"];
                    const propValues = [info, discounts];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
    });

    it("Mutation with 'roleBasedAccess' input will successfully attach the roles", () => {
        const roleOne = {name: `Cypress ${mutationName} role 1`};
        cy.createAndGetId("createCustomerRole", "customerRole", toFormattedString(roleOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteCustomerRole"});
            roleOne.id = returnedId;
            const roles = [roleOne];
            const custRoleIds = [returnedId];
            const roleTwo = {name: `Cypress ${mutationName} role 2`};
            cy.createAndGetId("createCustomerRole", "customerRole", toFormattedString(roleTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteCustomerRole"});
                roleTwo.id = secondId;
                roles.push(roleTwo)
                custRoleIds.push(secondId);
                updateCount++;
                const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
                const roleBasedAccess = {enabled: true, roleIds: custRoleIds};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            id: "${id}"
                            roleBasedAccess: ${toFormattedString(roleBasedAccess)}
                            ${infoName}: ${toFormattedString(info)}
                        }
                    ) {
                        code
                        message
                        error
                        ${dataPath} {
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
                cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                    const roleAccess = {enabled: roleBasedAccess.enabled, roles: roles};
                    const propNames = [infoName, "roleBasedAccess"];
                    const propValues = [info, roleAccess];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
    
    it("Mutation will correctly use all input", () => {
        updateCount++;
        const info = [
            {name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"},
            {name: "Zypresse aktualisierenKategorie Aktualisieren2", description: "Translate desc to German", languageCode: "de-DE"}
        ];
        const displayOrder = Cypress._.random(0, 10);
        const seoData = [{
            searchEngineFriendlyPageName: "Cypress Update",
            metaKeywords:  "Cypress",
            metaDescription: "Cypress Update metaTag",
            metaTitle: "Cypress Update test",
            languageCode: "Standard"
        }];
        const priceRanges = "4-5";
        const published = Cypress._.random(0, 1) === 1;
        const showOnHomePage = Cypress._.random(0, 1) === 1;
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    id: "${id}"
                    displayOrder: ${displayOrder}
                    ${infoName}: ${toFormattedString(info)}
                    seoData: ${toFormattedString(seoData)}
                    priceRanges: "${priceRanges}"
                    published: ${published}
                    showOnHomePage: ${showOnHomePage}
                }
            ) {
                code
                message
                error
                ${dataPath} {
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
                    priceRanges
                    published
                    showOnHomePage
                }
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
            const propNames = [infoName, "displayOrder", "seoData", "priceRanges", "published", "showOnHomePage"];
            const propValues = [info, displayOrder, seoData, priceRanges, published, showOnHomePage];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
                            priceRanges
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