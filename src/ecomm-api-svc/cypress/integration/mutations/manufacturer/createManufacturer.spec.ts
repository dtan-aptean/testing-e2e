/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 11
describe('Mutation: createManufacturer', () => {
    var id = '';
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];
    const mutationName = 'createManufacturer';
    const queryName = "manufacturers";
    const itemPath = 'manufacturer';
    const infoName = "manufacturerInfo";
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

    afterEach(() => {
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });

            cy.deleteItem("deleteManufacturer", id).then(() => {
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

        it("Mutation with valid 'Name' and 'languageCode' input will create a new item", () => {
            const info = [{name: "Cypress API Manufacturer", languageCode: "Standard"}];
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
            const info = [{name: "Cypress Manufacturer customData", description: `${mutationName} cypress test`, languageCode: "Standard"}];
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
                const names = [infoName, "customData"];
                const testValues = [info, customData];
                cy.confirmMutationSuccess(res, mutationName, itemPath, names, testValues).then(() => {
                    const queryName = "manufacturers";
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
            const info = [{name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"}, {name: "Cypress Manufacturer Input", description: "Cypress testing 'create' mutation input", languageCode: "Standard"}];
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
            const priceRanges = "4-5";
            const published = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        displayOrder: ${displayOrder}
                        ${infoName}: ${toFormattedString(info)}
                        seoData: ${toFormattedString(seoData)}
                        priceRanges: "${priceRanges}"
                        published: ${published}
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
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = [infoName, "displayOrder", "seoData", "priceRanges", "published"];
                const propValues = [info, displayOrder, seoData, priceRanges, published];
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
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });

    context("Testing connecting to other items and features", () => {
        it("Mutation with 'discountIds' input will successfully attach the discounts", () => {
            const discountOne = {name: `Cypress ${mutationName} discount 1`, discountType: "ASSIGNED_TO_MANUFACTURERS", discountAmount: {amount: 15, currency: "USD"}};
            cy.createAndGetId("createDiscount", "discount", toFormattedString(discountOne)).then((returnedId: string) => {
                extraIds.push({itemId: returnedId, deleteName: "deleteDiscount", itemName: discountOne.name, queryName: "discounts"});
                discountOne.id = returnedId;
                const discounts = [discountOne];
                const discountIds = [returnedId];
                const discountTwo = {name: `Cypress ${mutationName} discount 2`, discountType: "ASSIGNED_TO_MANUFACTURERS", discountAmount: {amount: 30, currency: "USD"}};
                cy.createAndGetId("createDiscount", "discount", toFormattedString(discountTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteDiscount", itemName: discountTwo.name, queryName: "discounts"});
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
                extraIds.push({itemId: returnedId, deleteName: "deleteCustomerRole", itemName: roleOne.name, queryName: "customerRoles"});
                roleOne.id = returnedId;
                const roles = [roleOne];
                const custRoleIds = [returnedId];
                const roleTwo = {name: `Cypress ${mutationName} role 2`};
                cy.createAndGetId("createCustomerRole", "customerRole", toFormattedString(roleTwo)).then((secondId: string) => {
                    extraIds.push({itemId: secondId, deleteName: "deleteCustomerRole", itemName: roleTwo.name, queryName: "customerRoles"});
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
});