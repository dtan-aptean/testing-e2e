/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../../support/commands";

// TEST COUNT: 13
describe('Mutation: createCategory', () => {
    var id = '';
    const extraIds = [] as {itemId: string, deleteName: string}[];
    const mutationName = 'createCategory';
    const queryName = "categories";
    const itemPath = 'category';
    const infoName = "categoryInfo";
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
    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

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
                    cy.deleteItem(extraIds[i].deleteName, extraIds[i].itemId);
                }
                extraIds = [];
            }

            cy.deleteItem("deleteCategory", id).then(() => {
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
            const info = [{name: "Cypress Category customData", description: `Cypress ${mutationName} test`, languageCode: "Standard"}];
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
                            description
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
            const displayOrder = Cypress._.random(1, 20);
            const name = "Cypress Category Input";
            const description = "Cypress testing 'create' mutation input";
            const info = [{name: "Same name but in german", description: "Translate desc to German", languageCode: "de-DE"}, {name: name, description: description, languageCode: "Standard"}];
            const seoData = [
                {
                    searchEngineFriendlyPageName: "",
                    metaKeywords:  "",
                    metaDescription: "",
                    metaTitle: "",
                    languageCode: "de-DE"
                }, {
                    searchEngineFriendlyPageName: "Cypress Input",
                    metaKeywords:  "Cypress",
                    metaDescription: "Cypress Input metaTag",
                    metaTitle: "Cypress Input test",
                    languageCode: "Standard"
                }
            ];
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
                        priceRanges
                        published
                        showOnHomePage
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["displayOrder", infoName, "seoData", "priceRanges", "published", "showOnHomePage"];
                const propValues = [displayOrder, info, seoData, priceRanges, published, showOnHomePage];
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

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'parentCategoryId' will succesfully create a subcategory", () => {
            const parentCategory = {categoryInfo: [{name: `Cypress ParentCategory`, languageCode: "Standard"}] };
            cy.createAndGetId(mutationName, itemPath, toFormattedString(parentCategory)).then((returnedId: string) => {
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
                        ${itemPath} {
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
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const subCategoryId = res.body.data[mutationName][itemPath].id;
                    extraIds.push({itemId: subCategoryId, deleteName: "deleteCategory"});
                    const propNames = ["parent", infoName];
                    const propValues = [parentCategory, info];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
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
                        id = res.body.data[mutationName][itemPath].id;
                        const propNames = [infoName, "discounts"];
                        const propValues = [info, discounts];
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
                        id = res.body.data[mutationName][itemPath].id;
                        const roleAccess = {enabled: roleBasedAccess.enabled, roles: roles};
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
    });

    context("Testing in storefront", () => {
        // This cannot be run on its own without another test run before it.
        // The baseUrl changes too fast for us to save it as originalBaseUrl if it's run on its own. This prevents us from making API calls
        // This is only a problem if it's run on its own. If run after other tests (which is the normal use case), originalBaseUrl is saved with no issue.
        // If you want to run just this test, I recommend changing this test and the first test to use it.only() instead of it().
        it("Mutation using showInTopMenu creates an item that shows in the storefront top menu", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
            const name = `Cypress TopMenu Category ${Cypress._.random(0, 999)}`;
            const info = [{name: name, languageCode: "Standard"}];
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
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["showInTopMenu", "published", infoName];
                const propValues = [showInTopMenu, true, info];
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
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl).then(() => {
                        cy.findCategoryInMenu(name);
                    });
                });
            });
        });
    });
});