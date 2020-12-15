/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

describe('Mutation: createRefund', () => {
    let id = '';
    const mutationName = 'createRefund';
    const queryName = "refunds";
    const dataPath = 'refund';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            order {
                id
            }
        }
    `;
    var originalBaseUrl = "";   // The original baseUrl config. We will need it for making api calls
    
    before(() => {
        // We need to place an order in the storefront to get an orderId
        // In order to do so, we need to change the baseUrl to the storefront url
        // This only lasts for the single file
        var config = `${Cypress.config("baseUrl")}`;
        originalBaseUrl = config.slice(0);  // Save the original baseUrl so we can use it for api calls
        Cypress.config("baseUrl", "https://tst.apteanecommerce.com/");
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
            const deletionName = "deleteReturnReason";
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

    it("Mutation with valid 'orderId' input will create a new item", () => {
        cy.createOrder().then((orderInfo) => {
            const { orderId } = orderInfo;
            const dummyOrder = {id: orderId};
            const mutation = `mutation {
                ${mutationName}(input: { orderId: "${orderId}" }) {
                    ${standardMutationBody}
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
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it("Mutation can create a partial refund", () => {
        cy.createOrder().then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const refundAmount = {
                amount: Cypress._.random(1, orderAmount / 2), // Will probably need to math this
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                totalAmount: {
                    amount: orderAmount, // Will probably need to math this
                    currency: "USD"
                },
                refundedAmount: refundAmount
            };
            const responseBody = `
                order {
                    id
                    totalAmount {
                        amount
                        currency
                    }
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
            const mutation = `mutation {
                ${mutationName}(input: { orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(refundAmount)} }) {
                    code
                    message
                    error
                    ${dataPath} {
                        ${responseBody}
                    }
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

    it("Mutation creates item that has all included input", () => {
        cy.createOrder().then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            const isPartialRefund = Cypress._.random(0, 1);
            const refundAmount = {
                amount: isPartialRefund ? Cypress._.random(1, orderAmount / 2) : orderAmount, // Will probably need to math this
                currency: "USD"
            };
            const dummyOrder = {
                id: orderId,
                totalAmount: {
                    amount: orderAmount, // Will probably need to math this
                    currency: "USD"
                },
                refundedAmount: refundAmount
            };
            const responseBody = `
                order {
                    id
                    totalAmount {
                        amount
                        currency
                    }
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
            const mutation = `mutation {
                ${mutationName}(
                    input: { 
                        orderId: "${orderId}"
                        isPartialRefund: ${isPartialRefund}
                        refundAmount: ${toFormattedString(refundAmount)}
                    }
                ) {
                    code
                    message
                    error
                    ${dataPath} {
                        ${responseBody}
                    }
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