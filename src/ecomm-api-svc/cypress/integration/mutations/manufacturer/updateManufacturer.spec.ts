/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 14
describe('Mutation: updateManufacturer', () => {
    var id = '';
    var updateCount = 0;
    var extraIds = [] as {itemId: string, deleteName: string, itemName: string, queryName: string}[];
    const mutationName = 'updateManufacturer';
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
                description
                languageCode
            }
        }
    `;
    const createName = 'createManufacturer';

    before(() => {
        const name = `Cypress ${mutationName} Test`;
        const input = `{${infoName}: [{name: "${name}", description: "Cypress testing for ${mutationName}", languageCode: "Standard"}] }`;
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
            cy.deleteItem("deleteManufacturer", id);
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
            cy.postAndConfirmError(mutation);
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

        it("Mutation will succeed with valid 'id', 'name', and 'languageCode' input", () => {
            updateCount++;
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, languageCode: "Standard"}];
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", ${infoName}: ${toFormattedString(info)}}) {
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
            const info = [{name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}];
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
                            description
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
            const info = [{name: `Cypress ${mutationName} customData extra`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const input = `{${infoName}: ${toFormattedString(info)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: "deleteManufacturer", itemName: info[0].name, queryName: queryName});
                const newInfo = [{name: `Cypress ${mutationName} CD extra updated`, description: `${mutationName} CD cypress test`, languageCode: "Standard"}];
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
                                description
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
                {name: "Zypresse translate to German", description: "Translate desc to German", languageCode: "de-DE"},
                {name: `Cypress ${mutationName} Update ${updateCount}`, description: `${mutationName} cypress test #${updateCount}`, languageCode: "Standard"}
            ];
            const displayOrder = Cypress._.random(1, 20);
            const seoData = [{
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
            }];
            const priceRanges = "4-5";
            const published = Cypress._.random(0, 1) === 1;
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
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

    context("Testing deletion when connected to other items or features", () => {
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

        it("Mutation with 'roleBasedAccess' input will successfully attach the roles", () => {
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