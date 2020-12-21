/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10

describe('Mutation: createRefund', () => {
    let id = '';
    const mutationName = 'createRefund';
    const queryName = "refunds";
    const dataPath = 'refund';
    const responseBody = `
                order {
                    id
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
        
    });

    beforeEach(() => {
        cy.goToPublicHome().then(() => {
            cy.get(".header-links").then(($el) => {
                if (!$el[0].innerText.includes('LOG OUT')) {
                    cy.storefrontLogin();
                }
            });
        });
    });

    afterEach(() => {
        if (id !== "") {
            const deletionName = "deleteRefund";
            const removalMutation = `mutation {
                ${deletionName}(input: { orderId: "${id}" }) {
                    code
                    message
                    error
                }
            }`;
            cy.postAndConfirmDelete(removalMutation, deletionName, originalBaseUrl).then(() => {
                id = "";
            });
        }
        cy.visit("/");
        cy.get(".cart-qty").invoke("text").then(($cart) => {
            if ($cart !== "(0)") {
                cy.clearCart();
            }
        });
    });

    after(() => {
        Cypress.config("baseUrl", originalBaseUrl);
    });

    it("Mutation will fail without input", () => {
        const mutation = `mutation {
            ${mutationName} {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will fail when input is an empty object", () => {
        const mutation = `mutation {
            ${mutationName}(input: {}) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will fail with invalid 'orderId' input", () => {
        const mutation = `mutation {
            ${mutationName}(input: { orderId: true }) {
                ${standardMutationBody}
            }
        }`
        cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
    });

    it("Mutation will fail with 'orderId' of an unpaid order", () => {
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

    it("Mutation that attempts to refund more than the order's total will fail", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: orderAmount * 2,
                currency: "USD"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${orderId}"
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation, true, originalBaseUrl);
        });
    });

    it("Mutation with valid 'orderId' input will create a full refund", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: orderAmount,
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                refundedAmount: refundAmount
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${orderId}"
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][dataPath].order.id;
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [false, refundAmount, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation with valid 'orderId' will create a partial refund", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: Cypress._.random(1, orderAmount / 2),
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                refundedAmount: refundAmount
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${orderId}"
                        isPartialRefund: true 
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][dataPath].order.id;
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [true, refundAmount, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    it("Mutation that creates a partial refund will update the order's payment status to 'PARTIALLY_REFUNDED'", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: Cypress._.random(1, orderAmount / 2),
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                paymentStatus: "PARTIALLY_REFUNDED"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${orderId}"
                        isPartialRefund: true 
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    code
                    message
                    error
                    refund {
                        order {
                            id
                            paymentStatus
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][dataPath].order.id;
                const propNames = ["order"];
                const propValues = [dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                order {
                                    id
                                    paymentStatus
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it("Mutation that creates a full refund will update the order's payment status to 'REFUNDED'", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: orderAmount,
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                paymentStatus: "REFUNDED"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        orderId: "${orderId}"
                        refundAmount: ${toFormattedString(refundAmount)} 
                    }
                ) {
                    code
                    message
                    error
                    refund {
                        order {
                            id
                            paymentStatus
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][dataPath].order.id;
                const propNames = ["order"];
                const propValues = [dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                order {
                                    id
                                    paymentStatus
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it("Mutation creates item that has all included input", () => {
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const isPartialRefund = Cypress._.random(0, 1) === 1;
            const refundAmount = {
                amount: isPartialRefund ? Cypress._.random(1, orderAmount / 2) : orderAmount, // Will probably need to math this
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                refundedAmount: refundAmount
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        orderId: "${orderId}"
                        isPartialRefund: ${isPartialRefund}
                        refundAmount: ${toFormattedString(refundAmount)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                id = res.body.data[mutationName][dataPath].order.id;
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [isPartialRefund, refundAmount, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
});