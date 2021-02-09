/// <reference types="cypress" />

import { confirmStorefrontEnvValues } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteRefund', () => {
    var id = '';
    var orderInUse = '';
    var refund = 0;
    const mutationName = 'deleteRefund';
    const createName = 'createRefund';
    const queryName = "refunds";
    const standardMutationBody = `
        code
        message
        error
    `;

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        searchParameter: "searchString"
    };

    const updateIds = (providedId?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
    };

    var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls
    
    const refundOrder = () => {
        const mutation = `mutation {
                ${createName}(input: {orderId: "${orderInUse}", refundAmount: {amount: ${refund}, currency: "USD"}}) {
                    ${standardMutationBody}
                    refund {
                        order {
                            id
                        }
                    }
                }
            }`;
        return cy.postMutAndValidate(mutation, createName, "refund", originalBaseUrl).then(() => {
            updateIds(orderInUse);
        });
    };

    before(() => {
        confirmStorefrontEnvValues();
        Cypress.config("baseUrl", Cypress.env("storefrontUrl"));
        cy.wait(1000);
        cy.visit("/");  // Go to the storefront and login
        cy.storefrontLogin();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            assert.exists(orderId);
            assert.exists(orderAmount);
            orderInUse = orderId;
            refund = orderAmount;
        });
    });

    afterEach(() => {
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeletedById(false, id, "searchString", queryName, originalBaseUrl).then((itemPresent: boolean) => {
                if (itemPresent) {
                    const mutation = `mutation {
                        ${mutationName}(input: {orderId: "${id}"}){
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation, originalBaseUrl).then(() => {
                        updateIds();
                    });
                }
            });
        }
    });

    context("Testing basic required inputs", () => {
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

        it("Mutation will fail with invalid 'id' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { orderId: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
        });

        it("Mutation will fail when given an 'orderId' that doesn't have a refund", () => {
            const mutation = `mutation {
                ${mutationName}(input: { orderId: "${orderInUse}"}){
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, undefined, originalBaseUrl).then((res) => {
                expect(res.body.errors[0].message).to.include("Refund does not exist for this order");
            });
        });

        it("Mutation will succeed with given the 'orderId' of an existing item", () => {
            refundOrder().then(() => {
                const mutation = `mutation {
                    ${mutationName}(input: { orderId: "${id}"}){
                        ${standardMutationBody}
                    }
                }`;
                cy.postAndConfirmDelete(mutation, mutationName, queryInformation, originalBaseUrl).then((res) => {
                    updateIds();
                });
            });
        });

        it("Mutation that successfully deletes a refund also updates various fields on the order", () => {
            refundOrder().then(() => {
                const dummyOrder = {
                    id: orderInUse,
                    paymentStatus: "REFUNDED",
                    refundedAmount: {
                        amount: refund,
                        currency: "USD"
                    }
                };
                const orderQuery = `{
                    orders(id: "${orderInUse}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            paymentStatus
                            refundedAmount {
                                amount
                                currency
                            }
                        }
                    }
                }`;
                cy.confirmUsingQuery(orderQuery, "orders", orderInUse, Object.getOwnPropertyNames(dummyOrder), Object.values(dummyOrder), originalBaseUrl).then(() => {
                    const mutation = `mutation {
                        ${mutationName}(input: { orderId: "${id}"}){
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, mutationName, queryInformation, originalBaseUrl).then((res) => {
                        updateIds();
                        const postDeleteOrder = {
                            id: orderInUse,
                            paymentStatus: "PAID",
                            refundedAmount: {
                                amount: 0,
                                currency: "USD"
                            }
                        };
                        cy.confirmUsingQuery(orderQuery, "orders", orderInUse, Object.getOwnPropertyNames(postDeleteOrder), Object.values(postDeleteOrder), originalBaseUrl);
                    });
                });
            });
        });
    });
});