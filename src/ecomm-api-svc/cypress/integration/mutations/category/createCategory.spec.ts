/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 13
describe('Mutation: createCategory', () => {
    let id = '';
    let extraIds = []; // Should push objects formatted as {itemId: "example", deleteName: "example"}
    const mutationName = 'createCategory';
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
                languageCode
            }
        }
    `;
    var originalBaseUrl = Cypress.config("baseUrl");
    var storefrontUrl = Cypress.config("baseUrl").includes('dev') ? "https://dev.apteanecommerce.com/" : "https://tst.apteanecommerce.com/";

    afterEach(() => {
        if (originalBaseUrl !== "" && Cypress.config("baseUrl") !== originalBaseUrl) {
            Cypress.log({message: "Switching the baseUrl back to the original"});
            Cypress.config("baseUrl", originalBaseUrl);
            cy.wait(1000);
        }
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

            const deletionName = "deleteCategory";
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
        }`
        cy.postAndConfirmError(mutation);
    });

    it("Mutation with valid 'Name' and 'languageCode' input will create a new item", () => {
        const info = [{name: "Cypress API Category", languageCode: "Standard"}];
        const mutation = `mutation {
            ${mutationName}(input: { ${infoName}: ${toFormattedString(info)} }) {
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
        const info = [{name: "Cypress Category customData", description: `Cypress ${mutationName} test`, languageCode: "Standard"}];
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
                        description
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

    it("Mutation with 'parentCategoryId' will succesfully create a subcategory", () => {
        const parentCategory = {categoryInfo: [{name: `Cypress ParentCategory`, languageCode: "Standard"}] };
        cy.createAndGetId(mutationName, dataPath, toFormattedString(parentCategory)).then((returnedId: string) => {
            id = returnedId;
            parentCategory.id = returnedId;
            const info = [{name: "Cypress subCategory", languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        parentCategoryId: "${id}"
                        ${infoName}: ${toFormattedString(info)}
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
                        parent {
                            ${infoName} {
                                name
                                languageCode
                            }
                            id
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
                const subCategoryId = res.body.data[mutationName][dataPath].id;
                extraIds.push({itemId: subCategoryId, deleteName: "deleteCategory"});
                const propNames = ["parent", infoName];
                const propValues = [parentCategory, info];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                parent {
                                    ${infoName} {
                                        name
                                        languageCode
                                    }
                                    id
                                }
                                id
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, subCategoryId, propNames, propValues);
                });
            });
        });
    });
    
    it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
        const discountOne = {name: `Cypress ${mutationName} discount 1`, discountAmount: {amount: 15, currency: "USD"}, discountType: "ASSIGNED_TO_CATEGORIES"};
        cy.createAndGetId("createDiscount", "discount", toFormattedString(discountOne)).then((returnedId: string) => {
            extraIds.push({itemId: returnedId, deleteName: "deleteDiscount"});
            discountOne.id = returnedId;
            const discounts = [discountOne];
            const discountIds = [returnedId];
            const discountTwo = {name: `Cypress ${mutationName} discount 2`, discountAmount: {amount: 30, currency: "USD"}, discountType: "ASSIGNED_TO_CATEGORIES"};
            cy.createAndGetId("createDiscount", "discount", toFormattedString(discountTwo)).then((secondId: string) => {
                extraIds.push({itemId: secondId, deleteName: "deleteDiscount"});
                discountTwo.id = secondId;
                discounts.push(discountTwo);
                discountIds.push(secondId);
                const info = [{name: `Cypress ${mutationName} discountIds test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
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
                    id = res.body.data[mutationName][dataPath].id;
                    const propNames = [infoName, "discounts"];
                    const propValues = [info, discounts];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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
    });

    it("Mutation with 'roleBasedAccess' input will successfully create an item with attached roles.", () => {
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
                const info = [{name: `Cypress ${mutationName} rBA test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const roleBasedAccess = {enabled: true, roleIds: custRoleIds};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
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
                    id = res.body.data[mutationName][dataPath].id;
                    const roleAccess = {enabled: roleBasedAccess.enabled, roles: roles};
                    const propNames = [infoName, "roleBasedAccess"];
                    const propValues = [info, roleAccess];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
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

    it("Mutation creates item that has all included input", () => {
        const displayOrder = Cypress._.random(1, 20);
        const name = "Cypress Category Input";
        const description = "Cypress testing 'create' mutation input";
        const info = [{name: name, description: description, languageCode: "Standard"}, {name: "Same name but in german", description: "Translate desc to German", languageCode: "de-DE"}];
        const seoData = [{
            searchEngineFriendlyPageName: "Cypress Input",
            metaKeywords:  "Cypress",
            metaDescription: "Cypress Input metaTag",
            metaTitle: "Cypress Input test",
            languageCode: "Standard"
        }];
        const published = Cypress._.random(0, 1) === 1;
        const showOnHomePage = Cypress._.random(0, 1) === 1;
        const priceRanges = "4-5";
        const mutation = `mutation {
            ${mutationName}(
                input: {
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
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["displayOrder", infoName, "seoData", "priceRanges", "published", "showOnHomePage"];
            const propValues = [displayOrder, info, seoData, priceRanges, published, showOnHomePage];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
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

    // This cannot be run on its own without another test run before it.
    // The baseUrl changes too fast for us to save it as originalBaseUrl if it's run on its own. This prevents us from making API calls
    // This is only a problem if it's run on its own. If run after other tests (which is the normal use case), originalBaseUrl is saved with no issue.
    // If you want to run just this test, I recommend changing this test and the first test to use it.only() instead of it().
    it("Mutation using showInTopMenu creates an item that shows in the storefront top menu", { baseUrl: `${storefrontUrl}` }, () => {
        const info = [{name: "Cypress TopMenu Category", languageCode: "Standard"}];
        const showInTopMenu = true;
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    ${infoName}: ${toFormattedString(info)}
                    published: true
                    displayOrder: 10
                    pageSize: 10
                    showInTopMenu: ${showInTopMenu}
                }
            ) {
                code
                error
                message
                ${dataPath} {
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
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            id = res.body.data[mutationName][dataPath].id;
            const propNames = ["showInTopMenu", "published", infoName];
            const propValues = [showInTopMenu, true, info];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
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
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl).then(() => {
                    cy.visit("/");
                    cy.wait(2000);
                    const getVisibleMenu = () => {
                        if (Cypress.$(".menu-toggle:visible").length === 0) {
                            return cy.get(".top-menu.notmobile").then(cy.wrap);
                        } else {
                            cy.get(".menu-toggle").click();
                            return cy.get(".top-menu.mobile").then(cy.wrap);
                        }
                    };
                    getVisibleMenu().get('li').should('include.text', info[0].name);
                });
            });
        });
    });
});