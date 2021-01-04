/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 12

describe('Mutation: createRefund', () => {
    let id = '';
    let refundCreated = false;
    let orderTotal = 0;
    const mutationName = 'createRefund';
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
    var originalBaseUrl = "";   // The original baseUrl config. We will need it for making api calls
    
    before(() => {
        // We need to place an order in the storefront to get an orderId
        // In order to do so, we need to change the baseUrl to the storefront url
        // This only lasts for the single file
        var config = `${Cypress.config("baseUrl")}`;
        originalBaseUrl = config.slice(0);  // Save the original baseUrl so we can use it for api calls
        var storefrontUrl = "https://tst.apteanecommerce.com/";
        if (originalBaseUrl.includes('dev')) {
            storefrontUrl = "https://dev.apteanecommerce.com/";
        }
        Cypress.config("baseUrl", storefrontUrl);
        cy.visit("/");  // Go to the storefront and login
        cy.storefrontLogin();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            assert.exists(orderId);
            assert.exists(orderAmount);
            id = orderId;
            orderTotal = orderAmount;
        });
    });

    afterEach(() => {
        if (id !== "" && refundCreated) {
            const deletionName = "deleteRefund";
            const removalMutation = `mutation {
                ${deletionName}(input: { orderId: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, originalBaseUrl).then(() => {
                refundCreated = false;
            })
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

    it("Mutation will fail with 'orderId' of an unpaid order", () => {
        cy.goToPublicHome().then(() => {
            cy.get(".header-links").then(($el) => {
                if (!$el[0].innerText.includes('LOG OUT')) {
                    cy.storefrontLogin();
                }
                cy.createOrderRetrieveId(originalBaseUrl, true).then((orderInfo) => {
                    const { orderId, orderAmount } = orderInfo;
                    const refundAmount = {
                        amount: orderAmount,
                        currency: "USD"
                    };
                    const mutation = `mutation {
                        ${mutationName}(
                            input: {
                                orderId: "${orderId}",
                                refundAmount: ${toFormattedString(refundAmount)} 
                            }
                        ) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        expect(res.body.errors[0].message).to.include("Cannot Refund Unpaid Orders");
                    });
                });
            });
        });
    });

    it("Mutation will fail with 'orderId' input from an order with an existing refund", () => {
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
            refundCreated = true;
            expect(res.body.data[mutationName].code).to.eq("SUCCESS");
            const refundAmount = {
                amount: Math.floor(Cypress._.random(1, orderTotal / 2)),
                currency: "USD"
            };
            const secondMutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${id}"
                        isPartialRefund: true 
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(secondMutation, undefined, originalBaseUrl);
        });
    });

    it("Mutation with valid 'orderId' input will create a full refund", () => {
        const refundAmount = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "REFUNDED",
            refundedAmount: refundAmount
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
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, refundAmount, dummyOrder];
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

    it("Mutation with valid 'orderId' and 'isPartialRefund' will create a partial refund", () => {
        const refundAmount = {
            amount: 0,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "PARTIALLY_REFUNDED",
            refundedAmount: refundAmount
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
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [true, refundAmount, dummyOrder];
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

    it("Mutation that creates a partial refund with a refundAmount will set the refundedAmount to that amount", () => {
        const refundAmount = {
            amount: Math.floor(Cypress._.random(1, orderTotal / 2)),
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            refundedAmount: refundAmount,
            paymentStatus: "PARTIALLY_REFUNDED"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    isPartialRefund: true 
                    refundAmount: ${toFormattedString(refundAmount)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [true, refundAmount, dummyOrder];
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

    it("Mutation that creates a full refund with refundAmount will set the refundedAmount to that amount", () => {
        const refundAmount = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            refundedAmount: refundAmount,
            paymentStatus: "REFUNDED"
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    refundAmount: ${toFormattedString(refundAmount)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, refundAmount, dummyOrder];
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

    it("Mutation that doesn't include 'isPartialRefund' but has a refundAmount less than the totalAmount will create a full refund", () => {
        const inputRefundAmount = {
            amount: Math.floor(Cypress._.random(orderTotal / 10, orderTotal / 2)),
            currency: "USD"
        };
        const refundAmount = {
            amount: orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            refundedAmount: refundAmount,
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
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, refundAmount, dummyOrder];
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
        const refundAmount = {
            amount: orderTotal * 2,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: "REFUNDED",
            refundedAmount: refundAmount
        };
        const mutation = `mutation {
            ${mutationName}(
                input: {
                    orderId: "${id}"
                    refundAmount: ${toFormattedString(refundAmount)} 
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [false, refundAmount, dummyOrder];
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
        const refundAmount = {
            amount: isPartialRefund ? Math.floor(Cypress._.random(1, orderTotal / 2)) : orderTotal,
            currency: "USD"
        };
        const dummyOrder = {
            id: id,
            paymentStatus: isPartialRefund ? "PARTIALLY_REFUNDED" : "REFUNDED",
            refundedAmount: refundAmount
        };
        const mutation = `mutation {
            ${mutationName}(
                input: { 
                    orderId: "${id}"
                    isPartialRefund: ${isPartialRefund}
                    refundAmount: ${toFormattedString(refundAmount)}
                }
            ) {
                ${standardMutationBody}
            }
        }`;
        cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
            refundCreated = true;
            const propNames = ["isPartialRefund", "refundAmount", "order"];
            const propValues = [isPartialRefund, refundAmount, dummyOrder];
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