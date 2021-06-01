/// <reference types="cypress" />

import { confirmStorefrontEnvValues, createInfoDummy, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 17
describe('Mutation: createCategory', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = 'createCategory';
    const deleteMutName = "deleteCategory";
    const queryName = "categories";
    const itemPath = 'category';
    const infoName = "categoryInfo";
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
    var originalBaseUrl = Cypress.config("baseUrl");
    confirmStorefrontEnvValues();

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };
    var childCatName = "";
    var parentCatName = "";
    var childCatId = "";
    var parentCatId = "";

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName, infoName);
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        if (originalBaseUrl !== "" && Cypress.config("baseUrl") !== originalBaseUrl) {
            Cypress.log({message: "Switching the baseUrl back to the original"});
            Cypress.config("baseUrl", originalBaseUrl);
            cy.wait(1000);
        }
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });

        // Delete the child and parent category
        cy.deleteParentAndChildCat({name: childCatName, id: childCatId}, parentCatName, parentCatId).then(() => {
            childCatName = "";
            parentCatName = "";
            childCatId = "";
            parentCatId = "";
        });

        if (id !== "") {
            cy.deleteItem(deleteMutName, id).then(() => {
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
            const today = new Date();
            const createdDate = today.toISOString();
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
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        displayOrder: ${displayOrder}
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
                        published: ${published}
                        showOnHomePage: ${showOnHomePage}
                        createdDate: "${createdDate}"
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
                        createdDate
                        published
                        showOnHomePage
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["displayOrder", infoName, "createdDate", "seoData", "published", "showOnHomePage"];
                const propValues = [displayOrder, info, createdDate, seoData, published, showOnHomePage];
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
                                createdDate
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

    context("Testing PriceRange input", () => {
        it("Mutation will fail if priceRange.priceFrom.amount is > than priceRange.priceTo.amount", () => {
            const info = [{name: `Cypress Invalid PriceRange Amount ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceFrom: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail if the currency of priceRange.priceFrom and priceRange.priceTo are not the same", () => {
            const info = [{name: `Cypress PriceRange.PriceFrom Currency ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "EUR"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                const secondInfo = [{name: `Cypress PriceRange.PriceTo Currency ${mutationName}`, languageCode: "Standard"}];
                const secondPriceRange = {
                    priceFrom: {
                        amount: Cypress._.random(100, 9999),
                        currency: "USD"
                    },
                    priceTo: {
                        amount: Cypress._.random(10000, 20000),
                        currency: "EUR"
                    }
                };
                const secondMutation = `mutation {
                    ${mutationName}(
                        input: { 
                            ${infoName}: ${toFormattedString(secondInfo)}
                            priceRange: ${toFormattedString(secondPriceRange)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(secondMutation, mutationName, itemPath);
            });
        });

        it("Mutation will successfully save all priceRange properties even when priceRangeFiltering = false", () => {
            const info = [{name: `Cypress PriceRange false ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceRangeFiltering: false,
                manuallyPriceRange: false,
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "priceRange"];
                const propValues = [info, priceRange];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                priceRange {
                                    manuallyPriceRange
                                    priceRangeFiltering
                                    priceFrom {
                                        amount
                                        currency
                                    }
                                    priceTo {
                                        amount
                                        currency
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will successfully save the priceRange input", () => {
            const info = [{name: `Cypress PriceRange ${mutationName}`, languageCode: "Standard"}];
            const priceRange = {
                priceRangeFiltering: Cypress._.random(0, 1) === 1,
                manuallyPriceRange: Cypress._.random(0, 1) === 1,
                priceFrom: {
                    amount: Cypress._.random(100, 9999),
                    currency: "USD"
                },
                priceTo: {
                    amount: Cypress._.random(10000, 20000),
                    currency: "USD"
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        ${infoName}: ${toFormattedString(info)}
                        priceRange: ${toFormattedString(priceRange)}
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
                        priceRange {
                            manuallyPriceRange
                            priceRangeFiltering
                            priceFrom {
                                amount
                                currency
                            }
                            priceTo {
                                amount
                                currency
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "priceRange"];
                const propValues = [info, priceRange];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${info[0].name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                priceRange {
                                    manuallyPriceRange
                                    priceRangeFiltering
                                    priceFrom {
                                        amount
                                        currency
                                    }
                                    priceTo {
                                        amount
                                        currency
                                    }
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
        it("Mutation with 'parentCategoryId' will succesfully create a subcategory", () => {
            childCatName = "Cypress subCategory";
            parentCatName = "Cypress ParentCategory"
            cy.createParentAndChildCat(childCatName, parentCatName).then((results) => {
                const { parentId, childId, childRes } = results;
                childCatId = childId;
                parentCatId = parentId;
                const propNames = ["parent", infoName];
                const propValues = [createInfoDummy(parentCatName, infoName, parentId), createInfoDummy(childCatName)];
                cy.confirmMutationSuccess(childRes, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${childCatName}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                ${infoName} {
                                    name
                                    languageCode
                                }
                                parent {
                                    id
                                    ${infoName} {
                                        name
                                        languageCode
                                    }
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, childId, propNames, propValues);
                });
            });
        });
        
        it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
            const extraCreate = "createDiscount";
            const extraPath = "discount";
            const extraQuery = "discounts";
            const extraItemInput = {name: `Cypress ${mutationName} discount`, discountAmount: {amount: 15, currency: "USD"}, discountType: "ASSIGNED_TO_CATEGORIES"};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} discountIds test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            discountIds: ${toFormattedString(itemIds)}
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
                    const propValues = [info, items];
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

        it("Mutation with 'roleBasedAccess' input will successfully create an item with attached roles.", () => {
            const extraCreate = "createCustomerRole";
            const extraPath = "customerRole";
            const extraQuery = "customerRoles";
            const extraItemInput = {name: `Cypress ${mutationName} role`};
            cy.createAssociatedItems(2, extraCreate, extraPath, extraQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const info = [{name: `Cypress ${mutationName} rBA test`, description: `${mutationName} cypress test`, languageCode: "Standard"}];
                const roleBasedAccess = {enabled: true, roleIds: itemIds};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            roleBasedAccess: ${toFormattedString(roleBasedAccess)}
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
                    const roleAccess = {enabled: roleBasedAccess.enabled, roles: items};
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

    // TODO: Move this to a category file in the misc folder
    context.skip("Testing in storefront", () => {
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