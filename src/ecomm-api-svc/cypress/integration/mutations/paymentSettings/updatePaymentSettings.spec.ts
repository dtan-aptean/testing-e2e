/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 20
describe('Mutation: updatePaymentSettings', () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = "updatePaymentSettings";
    const deleteMutName = "deletePaymentSettings";
    const queryName = "paymentSettings";
    const itemPath = "paymentSettings";
    const companyMutName = "createCompany";
    const companyPath = "company";
    const companyQuery = "companies";
    const companyDelete = "deleteCompany";
    const standardMutationBody = `
        ${codeMessageError}
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
    const paymentFields = `paymentData {
        token
        cardType
        lastFour
    }`;

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    const createCompanyAndSettings = (companyName: string, companyKey: string, paymentInput?, paymentRes?: string) => {
        const extraItemInput = { name: `Cypress ${mutationName} ${companyName} test`, integrationKey: `Cypress-${mutationName}-${companyKey}-${Cypress._.random(10000, 100000)}` };
        return cy.createAssociatedItems(1, companyMutName, companyPath, companyQuery, extraItemInput).then((results) => {
            const { deletionIds, items, itemIds } = results;
            addExtraItemIds(deletionIds);
            const companyId = itemIds[0];
            const company = items[0];
            const paymentSettingsInput = paymentInput ? paymentInput : {};
            paymentSettingsInput.companyId = companyId;
            return cy.createAssociatedItems(1, "createPaymentSettings", itemPath, queryName, paymentSettingsInput, paymentRes).then((results) => {
                const { fullItems, items, itemIds } = results;
                id = itemIds[0];
                return cy.wrap({
                    companyId: companyId, 
                    company: company, 
                    paymentSetting: paymentInput ? fullItems[0] : items[0]
                });
            });
        });
    };

    const createPaymentDataInput = (amountToMake: number, allTokens?: boolean, allCards?: boolean) => {
        const paymentDatas = [] as {token?: string, cardType?: string, lastFour?: string}[];
        var lastType = "";
        if (!allTokens && !allCards) {
            lastType = Cypress._.random(0, 1) === 1 ? "token": "card"; 
        }
        for (var i = 0; i < amountToMake; i++) {
            var data = {};
            if (allTokens || lastType === "card") {
                data.token = `cypress-${mutationName.toLowerCase()}-token-${Cypress._.random(10000, 100000)}`;
                if (!allTokens) {
                    lastType = "token";
                }
            } else if (allCards || lastType === "token") {
                const cardTypes = ["Amex", "MC", "Visa", "Discover"];
                data.cardType = cardTypes[Cypress._.random(0, 3)];
                data.lastFour = `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`;
                if (!allCards) {
                    lastType = "card";
                }
            }
            paymentDatas.push(data);
        }
        return paymentDatas;
    };

    const createDummyPaymentData = (paymentInput: {token?: string, cardType?: string, lastFour?: string}[]) => {
        const output = [] as {token: string | null, cardType: string | null, lastFour: string | null}[];
        paymentInput.forEach((item) => {
            output.push({
                token: item.token ? item.token : null,
                cardType: item.cardType ? item.cardType : null,
                lastFour: item.lastFour ? item.lastFour : null
            });
        });
        return output;
    };

    const removePaymentData = (paymentData: {token?: string, cardType?: string, lastFour?: string}[], removeOne?: boolean) => {
        // Pick Items and remove them to an array: create assignment input and the dummyPaymentData.
        const paymentDataCopy = paymentData.slice(0);
        const paymentDataAssignments = [] as {paymentData: {token?: string, cardType?: string, lastFour?: string}, action: string}[];
        const numToRemove = removeOne ? 1 : Cypress._.random(1, paymentData.length - 1);
        for (var i = 0; i < numToRemove; i++) {
            var index = Cypress._.random(0, paymentDataCopy.length - 1);
            paymentDataAssignments.push({ paymentData: paymentDataCopy.splice(index, 1)[0], action: "REMOVE" });
        }
        return {assignments: paymentDataAssignments, dummyPaymentData: createDummyPaymentData(paymentDataCopy)};
    };

    const formatAssignment = (paymentData: {token?: string, cardType?: string, lastFour?: string}[], action: string) => {
        const paymentDataAssignments = [] as {paymentData: {token?: string, cardType?: string, lastFour?: string}, action: string}[];
        paymentData.forEach((data) => {
            paymentDataAssignments.push({ paymentData: data, action: action });
        });
        return paymentDataAssignments;
    };

    const addPaymentData = (paymentData: {token?: string, cardType?: string, lastFour?: string}[]) => {
        const createCount = Cypress._.random(1, Math.ceil(paymentData.length / 2));
        const newData = createPaymentDataInput(createCount);
        return { assignments: formatAssignment(newData, "ASSIGN"), dummyPaymentData: createDummyPaymentData(paymentData.concat(newData)) };
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
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            createCompanyAndSettings("Bad Id", "bad-id").then((creations) => {
                const { companyId } = creations;
                const mutation = `mutation {
                    ${mutationName}(input: { companyId: "${companyId}", id: true }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmError(mutation).then((res) => {
                    expect(res.body.errors[0].message).to.eql("ID cannot represent a non-string and non-integer value: true");
                });
            });
        });

        it("Mutation will fail if the only input provided is 'id'", () => {
            createCompanyAndSettings("Id Only", "lone-id").then((creations) => {
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmError(mutation).then((res) => {
                    expect(res.body.errors[0].message).to.eql('Field "UpdatePaymentSettingsInput.companyId" of required type "ID!" was not provided.');
                });
            });
        });

        it("Mutation will fail if the only input provided is 'companyId'", () => {
            createCompanyAndSettings("companyId Only", "lone-companyId").then((creations) => {
                const { companyId } = creations;
                const mutation = `mutation {
                    ${mutationName}(input: { companyId: "${companyId}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmError(mutation).then((res) => {
                    expect(res.body.errors[0].message).to.eql('Field \"UpdatePaymentSettingsInput.id\" of required type \"ID!\" was not provided.');
                });
            });
        });

        it("Mutation will fail with invalid 'companyId' input", () => {
            createCompanyAndSettings("Bad companyId", "bad-companyId").then((creations) => {
                const mutation = `mutation {
                    ${mutationName}(input: { id: "${id}", companyId: true }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmError(mutation).then((res) => {
                    expect(res.body.errors[0].message).to.eql("ID cannot represent a non-string and non-integer value: true");
                });
            });
        });

        it("Mutation will fail when given 'companyId' input from a deleted company", () => {
            createCompanyAndSettings("Deleted Company", "deleted-company").then((creations) => {
                const { companyId } = creations;
                cy.deleteItem(companyDelete, companyId).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { companyId: "${companyId}", id: "${id}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });

        it("Mutation will fail when given 'id' from a deleted item", () => {
            createCompanyAndSettings("Deleted Company", "deleted-company").then((creations) => {
                const { companyId } = creations;
                cy.deleteItem(deleteMutName, id).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { companyId: "${companyId}", id: "${id}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName);
                });
            });
        });

        it("Mutation will succeed with valid 'id' and 'companyId' input", () => {
            createCompanyAndSettings("Basic", "basic").then((creations) => {
                const { companyId, company } = creations;
                const mutation = `mutation {
                    ${mutationName}(input: { companyId: "${companyId}", id: "${id}" }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company"];
                    const propValues = [id, company];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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
    });

    context("Testing 'paymentDataAssignments'", () => {
        it("Mutation can successfully use 'token' in paymentDataAssigments input (ASSIGN)", () => {
            createCompanyAndSettings("Token Assign", "token-assign").then((creations) => {
                const { companyId, company } = creations;
                const paymentData = createPaymentDataInput(Cypress._.random(2, 4), true);
                const paymentDataAssigments = formatAssignment(paymentData, "ASSIGN");
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            paymentDataAssignments: ${toFormattedString(paymentDataAssigments)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company", "paymentData"];
                    const propValues = [id, company, createDummyPaymentData(paymentData)];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation can successfully use 'token' in paymentDataAssigments input (REMOVE)", () => {
            const paymentCount = Cypress._.random(2, 4)
            const paymentData = createPaymentDataInput(paymentCount, true);
            createCompanyAndSettings("Token REMOVE", "token-remove", {paymentData: paymentData}, paymentFields).then((creations) => {
                const { companyId, company } = creations;
                const { assignments, dummyPaymentData } = removePaymentData(paymentData);
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}",
                        companyId: "${companyId}", 
                        paymentDataAssignments: ${toFormattedString(assignments)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company", "paymentData"];
                    const propValues = [id, company, dummyPaymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation can successfully use 'cardType' and 'lastFour' in paymentData input (ASSIGN)", () => {
            createCompanyAndSettings("Card ASSIGN", "card-assign").then((creations) => {
                const { companyId, company } = creations;
                const paymentData = createPaymentDataInput(Cypress._.random(2, 4), undefined, true);
                const paymentDataAssigments = formatAssignment(paymentData, "ASSIGN");
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        companyId: "${companyId}",
                        id: "${id}",
                        paymentDataAssignments: ${toFormattedString(paymentDataAssigments)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company", "paymentData"];
                    const propValues = [id, company, createDummyPaymentData(paymentData)];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation can successfully use 'cardType' and 'lastFour' in paymentData input (REMOVE)", () => {
            const paymentCount = Cypress._.random(2, 4)
            const paymentData = createPaymentDataInput(paymentCount, undefined, true);
            createCompanyAndSettings("Card REMOVE", "card-remove", {paymentData: paymentData}, paymentFields).then((creations) => {
                const { companyId, company } = creations;
                const { assignments, dummyPaymentData } = removePaymentData(paymentData);
                const mutation = `mutation {
                    ${mutationName}(input: {
                        id: "${id}",
                        companyId: "${companyId}", 
                        paymentDataAssignments: ${toFormattedString(assignments)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company", "paymentData"];
                    const propValues = [id, company, dummyPaymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation will fail if using 'token', 'cardType', and 'lastFour' together in paymentData input (ASSIGN)", () => {
            createCompanyAndSettings("Bad PaymentData ASSIGN", "badPayment-assign").then((creations) => {
                const { companyId } = creations;
                const paymentDataAssigments = [
                    {
                        paymentData: { 
                            token: `cypress-token-${Cypress._.random(10000, 100000)}`,
                            cardType: "Visa",
                            lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                        },
                        action: "ASSIGN"
                    }
                ];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            paymentDataAssignments: ${toFormattedString(paymentDataAssigments)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Payment Data Should Have Either Token Or (CardType And LastFour)");
                });
            });
        });

        it("Mutation will fail if using 'token', 'cardType', and 'lastFour' together in paymentData input (REMOVE)", () => {
            const paymentCount = Cypress._.random(2, 4);
            const paymentData = createPaymentDataInput(paymentCount);
            createCompanyAndSettings("Bad PaymentData REMOVE", "badPayment-remove", {paymentData: paymentData}, paymentFields).then((creations) => {
                const { companyId } = creations;
                const paymentDataAssigments = [
                    {
                        paymentData: { 
                            token: `cypress-token-${Cypress._.random(10000, 100000)}`,
                            cardType: "Visa",
                            lastFour: `${Cypress._.random(0, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}${Cypress._.random(1, 9)}`
                        },
                        action: "REMOVE"
                    }
                ];
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            paymentDataAssignments: ${toFormattedString(paymentDataAssigments)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Payment Data Should Have Either Token Or (CardType And LastFour)");
                });
            });
        });

        it("Mutation will fail if attempting to remove more paymentData items than there are", () => {
            const paymentCount = Cypress._.random(3, 6)
            const orginalPaymentData = createPaymentDataInput(paymentCount);
            createCompanyAndSettings("Bad Removal", "bad-removal", {paymentData: orginalPaymentData}, paymentFields).then((creations) => {
                const { companyId } = creations;
                const { assignments } = addPaymentData(orginalPaymentData);
                assignments.forEach((item) => {
                    item.action = "REMOVE";
                });
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            paymentDataAssignments: ${toFormattedString(assignments)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].code).to.eql("Invalid Argument");
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Cannot Delete Token: Token Not Found");
                });
            });
        });

        it("Mutation will fail if attempting to remove paymentData from an empty array", () => {
            createCompanyAndSettings("Empty Removal", "empty-removal").then((creations) => {
                const { companyId } = creations;
                const paymentData = createPaymentDataInput(Cypress._.random(3, 6));
                const paymentDataAssigments = formatAssignment(paymentData, "REMOVE");
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            paymentDataAssignments: ${toFormattedString(paymentDataAssigments)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                    expect(res.body.data[mutationName].errors[0].code).to.eql("Invalid Argument");
                    expect(res.body.data[mutationName].errors[0].message).to.eql("Cannot Delete Token: Token Not Found");
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
            createCompanyAndSettings("CustomData", "custom-data").then((creations) => {
                const { companyId, company } = creations;
                const customData = {data: `${itemPath} customData`, canDelete: true};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            customData: ${toFormattedString(customData)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["customData", "id", "company"];
                    const propValues = [customData, id, company];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
            const paymentInput = { customData: {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']} };
            createCompanyAndSettings("Overwrite CustomData", "rewrite-custom-data", paymentInput, "customData").then((creations) => {
                const { companyId, company } = creations;
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: { 
                            companyId: "${companyId}", 
                            id: "${id}",
                            customData: ${toFormattedString(newCustomData)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["customData", "id", "company"];
                    const propValues = [newCustomData, id, company];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
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

        it("Mutation creates item that has all included input", () => {
            const paymentCount = Cypress._.random(3, 6)
            const orginalPaymentData = createPaymentDataInput(paymentCount);
            createCompanyAndSettings("Full", "full", {paymentData: orginalPaymentData}, paymentFields).then((creations) => {
                const { companyId, company } = creations;
                const hasTerms = Cypress._.random(0, 1) === 1;
                const immediateCapture = Cypress._.random(0, 1) === 1;
                const { assignments, dummyPaymentData } = Cypress._.random(0, 1) === 1 ? addPaymentData(orginalPaymentData) : removePaymentData(orginalPaymentData);
                const mutation = `mutation {
                    ${mutationName}(input: { 
                        id: "${id}",
                        companyId: "${companyId}", 
                        hasTerms: ${hasTerms},
                        immediateCapture: ${immediateCapture},
                        paymentDataAssignments: ${toFormattedString(assignments)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    const propNames = ["id", "company", "hasTerms", "immediateCapture", "paymentData"];
                    const propValues = [id, company, hasTerms, immediateCapture, dummyPaymentData];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(ids: "${id}",, orderBy: {direction: ASC, field: COMPANY_NAME}) {
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