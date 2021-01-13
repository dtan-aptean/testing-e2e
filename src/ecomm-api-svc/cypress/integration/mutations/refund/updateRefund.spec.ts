/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../../support/commands";

// TEST COUNT: 10

describe('Mutation: updateRefund', () => {
    let id = '';
    let orderTotal = 0;
    const mutationName = 'updateRefund';
    const queryName = "refunds";
    const dataPath = 'refund';
    const responseBody = `
                order {
                    id
                    paymentStatus
                    refundedAmount {
                        amount
                        currency
                    }
                }
                isPartialRefund
                refundAmount {
                    amount
                    currency
                }`;
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            ${responseBody}
        }
    `;
    const createName = 'createRefund';
    var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls

    before(() => {
        confirmStorefrontEnvValues();
        Cypress.config("baseUrl", Cypress.env("storefrontUrl"));
        cy.wait(1000);
        cy.visit("/");  // Go to the storefront and login
        cy.storefrontLogin();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo) => {
            const { orderId, orderAmount } = orderInfo;
            const localRefundAmount = {
                amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                currency: "USD"
            };
            const input = `{orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(localRefundAmount)}}`;
            cy.createAndGetId(createName, dataPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                assert.exists(returnedId);
                id = returnedId;
                orderTotal = orderAmount;
            });
        });
    });

    after(() => {
        if (id !== "") {
            const deletionName = "deleteRefund";
            const removalMutation = `mutation {
                ${deletionName}(input: { orderId: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, originalBaseUrl);
        }
    });

    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            ${mutationName} {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            ${mutationName}(input: {}) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will fail with invalid 'orderId' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { orderId: true }) {
                ${standardMutationBody}
            }
        }`;
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will update item to a full refund with valid 'orderId' input", () => {
        const newRefund = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation will update item to a partial refund with valid 'orderId' and 'isPartialRefund' input", () => {
        const newRefund = {
            amount: 0,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "PARTIALLY_REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    isPartialRefund: true
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [true, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation that updates a refund to a full refund with a refundAmount will set the refundedAmount to that amount", () => {
        const newRefund = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    isPartialRefund: false
                    refundAmount: ${toFormattedString(newRefund)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation that updates a refund to a partial refund with a refundAmount will set the refundedAmount to that amount", () => {
        const newRefund = {
            amount: Math.floor(Cypress._.random(orderTotal / 5, orderTotal / 2)),
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "PARTIALLY_REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    isPartialRefund: true
                    refundAmount: ${toFormattedString(newRefund)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [true, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation that doesn't include 'isPartialRefund' but has a refundAmount less than the totalAmount will update to a full refund", () => {
        const inputRefundAmount = {
            amount: Math.floor(Cypress._.random(orderTotal / 10, orderTotal / 2)),
            currency: "USD"
        };
        const newRefund = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            refundedAmount: newRefund,
            paymentStatus: "REFUNDED"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    refundAmount: ${toFormattedString(inputRefundAmount)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation that attempts to refund more than the order's total will accept the amount provided", () => {
        const newRefund = {
            amount: orderTotal * 2,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    refundAmount: ${toFormattedString(newRefund)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });

    it("Mutation creates item that has all included input", () => {
        const isPartialRefund = Cypress._.random(0, 1) === 1;
        const newRefund = {
            amount: isPartialRefund ? Math.floor(Cypress._.random(1, orderTotal / 2)) : orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: isPartialRefund ? "PARTIALLY_REFUNDED" : "REFUNDED",
            refundedAmount: newRefund
        };
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    orderId: "${id}"
                    isPartialRefund: ${isPartialRefund}
                    refundAmount: ${toFormattedString(newRefund)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [isPartialRefund, newRefund, dummyOrder];
            cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                const query = `{
                    ${queryName}(searchString: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            ${responseBody}
                        }
                    }
                }`;
                cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
            });
        });
    });
});