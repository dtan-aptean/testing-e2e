/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 12
describe('Mutation: createPaymentSettings', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = "createPaymentSettings";
    const deleteMutName = "deletePaymentSettings";
    const queryName = "paymentSettings";
    const itemPath = "paymentSettings";
    const companyMutName = "createCompany";
    const companyPath = "company";
    const companyQuery = "companies";
    const companyDelete = "deleteCompany";
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
            hasTerms
            immediateCapture
            customData
            paymentData {
                token
                cardType
                lastFour
            }
            company {
                id
                name
                integrationKey
            }
        }
    `;

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.deleteCypressItems(queryName, deleteMutName).then(() => {
            cy.deleteCypressItems(companyQuery, companyDelete, undefined, `Cypress ${mutationName}`);
        });
    });

    afterEach(() => {
        if (!deleteItemsAfter) {
            return;
        }
        if (id !== "") {
            cy.deleteItem(deleteMutName, id).then(() => {
                id = "";
            });
        }
        // Delete any supplemental items we created
        cy.deleteSupplementalItems(extraIds).then(() => {
            extraIds = [];
        });
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

        it("Mutation will fail with no 'companyId' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { hasTerms: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with invalid 'companyId' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { companyId: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if using a deleted company's id as 'companyId' input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} deleted test`, integrationKey: `Cypress-${mutationName}-deleted-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                cy.deleteItem(companyDelete, companyId).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { companyId: "${companyId}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                        expect(res.body.data[mutationName].errors[0].message).to.eql("Invalid Aptean Id");
                    });
                });
            });
        });

        it("Mutation will succeed with valid 'companyId' input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} test`, integrationKey: `Cypress-${mutationName}-creation-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: { companyId: "${companyId}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["company"];
                    const propValues = [items[0]];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${items[0].name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                    company {
                                        id
                                        name
                                        integrationKey
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation will fail if 'companyId' input is from a company that already has paymentSettings attached", () => {
            const extraItemInput = { name: `Cypress ${mutationName} pre-used test`, integrationKey: `Cypress-${mutationName}-preUsed-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const paymentSettingsInput =  {
                    companyId: companyId
                };
                cy.createAssociatedItems(1, mutationName, itemPath, queryName, paymentSettingsInput).then((results) => {
                    const { itemIds } = results;
                    id = itemIds[0];
                    const mutation = `mutation {
                        ${mutationName}(input: { companyId: "${companyId}", hasTerms: true }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                        expect(res.body.data[mutationName].errors[0].message).to.eql("Payment settings already exist for selected company");
                    });
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const extraItemInput = { name: `Cypress ${mutationName} customData test`, integrationKey: `Cypress-${mutationName}-customData-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}", 
                        customData: ${toFormattedString(customData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const propNames = ["customData", "company"];
                    const propValues = [customData, items[0]];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${items[0].name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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
        });

        it("Mutation can successfully use 'token' in paymentData input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} token test`, integrationKey: `Cypress-${mutationName}-token-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const paymentData = [{ token: `cypress-token-${Cypress._.random(10000, 100000)}`}];
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}", 
                        paymentData: ${toFormattedString(paymentData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const dummyPaymentData = [{ token: paymentData[0].token, cardType: null, lastFour: null}];
                    const propNames = ["company", "paymentData"];
                    const propValues = [items[0], dummyPaymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${items[0].name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                    paymentData {
                                        token
                                        cardType
                                        lastFour
                                    }
                                    company {
                                        id
                                        name
                                        integrationKey
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation can successfully use 'cardType' and 'lastFour' in paymentData input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} cardType/lastFour test`, integrationKey: `Cypress-${mutationName}-cardFour-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const paymentData = [
                    { 
                        cardType: "Visa",
                        lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                    }
                ];
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}", 
                        paymentData: ${toFormattedString(paymentData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    const dummyPaymentData = [{ token: null, cardType: paymentData[0].cardType, lastFour:  paymentData[0].lastFour}];
                    const propNames = ["company", "paymentData"];
                    const propValues = [items[0], dummyPaymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${items[0].name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                    paymentData {
                                        token
                                        cardType
                                        lastFour
                                    }
                                    company {
                                        id
                                        name
                                        integrationKey
                                    }
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation will fail if using 'token', 'cardType', and 'lastFour' together in paymentData input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} bad paymentData test`, integrationKey: `Cypress-${mutationName}-badPayment-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const paymentData = [
                    { 
                        token: `cypress-token-${Cypress._.random(10000, 100000)}`,
                        cardType: "Visa",
                        lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                    }
                ];
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}", 
                        paymentData: ${toFormattedString(paymentData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Payment Data Should Have Either Token Or (CardType And LastFour)");
                });
            });
        });

        it("Mutation creates item that has all included input", () => {
            const extraItemInput = { name: `Cypress ${mutationName} full test`, integrationKey: `Cypress-${mutationName}-full-${Cypress._.random(10000, 100000)}` };
            cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
                const { deletionIds, items, itemIds } = results;
                addExtraItemIds(deletionIds);
                const companyId = itemIds[0];
                const hasTerms = Cypress._.random(0, 1) === 1;
                const immediateCapture = Cypress._.random(0, 1) === 1;
                const useToken = Cypress._.random(0, 1) === 1;
                const paymentData = [
                    (useToken === true ? {
                        token: `cypress-token-${Cypress._.random(10000, 100000)}`,
                    } : {
                        cardType: "Visa",
                        lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                    }),
                    (useToken === true ? {
                        token: `cypress-token-${Cypress._.random(10000, 100000)}`,
                    } : {
                        cardType: "MC",
                        lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                    })
                ]
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}", 
                        hasTerms: ${hasTerms},
                        immediateCapture: ${immediateCapture},
                        paymentData: ${toFormattedString(paymentData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    id = res.body.data[mutationName][itemPath].id;
                    if (useToken) {
                        paymentData.forEach((item) => {
                            item.cardType = null;
                            item.lastFour = null;
                        });
                    } else {
                        paymentData.forEach((item) => {
                            item.token = null;
                        });
                    }
                    const propNames = ["company", "hasTerms", "immediateCapture", "paymentData"];
                    const propValues = [items[0], hasTerms, immediateCapture, paymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${items[0].name}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                    hasTerms
                                    immediateCapture
                                    paymentData {
                                        token
                                        cardType
                                        lastFour
                                    }
                                    company {
                                        id
                                        name
                                        integrationKey
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