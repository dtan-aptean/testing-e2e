/// <reference types="cypress" />

import { confirmStorefrontEnvValues } from "../../../support/commands";

// TEST COUNT: 6
var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls
confirmStorefrontEnvValues();

describe('Mutation: deleteRefund', { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
    var id = '';
    var orderInUse = '';
    var refund = 0;
    const mutationName = 'deleteRefund';
    const createName = 'createRefund';
    const queryName = "refunds";
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
    `;

    const queryInformation = {
        queryName: queryName, 
        itemId: id, 
        searchParameter: "ids"
    };

    const updateIds = (providedId?: string) => {
        id = providedId ? providedId : "";
        queryInformation.itemId = providedId ? providedId : "";
    };

    
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

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.wait(1000);
        cy.visit("/");  // Go to the storefront and login
        cy.setTheme();
        cy.storefrontLogin();
        cy.setupRequiredProducts();
        cy.goToPublicHome();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            assert.exists(orderId);
            assert.exists(orderAmount);
            orderInUse = orderId;
            refund = orderAmount;
        });
    });

    beforeEach(() => {
        cy.visit("/");
        cy.setTheme();
        cy.storefrontLogin();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
            const { orderId, orderAmount } = orderInfo;
            assert.exists(orderId);
            assert.exists(orderAmount);
            orderInUse = orderId;
            refund = orderAmount;;
        });
    });

    afterEach(() => {
		if (!deleteItemsAfter) {
			return;
		}
        if (id !== '') {
            // Querying for the deleted item keeps us from trying to delete an already deleted item, which would return an error and stop the entire test suite.
            cy.queryForDeletedById(false, id, "ids", queryName, originalBaseUrl).then((itemPresent: boolean) => {
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
                expect(res.body.data[mutationName].errors[0].message).to.include("Refund does not exist for this order");
            });
        });

        // TODO: Querying with deleted id returns error. Fix.
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

        // TODO: Querying with deleted id returns error. Fix.
        it.only("Mutation that successfully deletes a refund also updates various fields on the order", () => {
            refundOrder().then(() => {
                const dummyOrder = {
                    id: orderInUse,
                    paymentInfo: {
                        paymentStatus: "REFUNDED",
                    },
                    totals: {
                        refund: {
                            amount: refund,
                            currency: "USD"
                        }
                    }
                };
                const orderQuery = `{
                    orders(ids: "${orderInUse}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                        nodes {
                            id
                            paymentInfo {
                                paymentStatus
                            }
                            totals {
                                refund {
                                    amount
                                    currency
                                }
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
                            paymentInfo: {
                                paymentStatus: "PAID",
                            },
                            totals: {
                                refund: {
                                    amount: 0,
                                    currency: "USD"
                                }
                            }
                        };
                        cy.confirmUsingQuery(orderQuery, "orders", orderInUse, Object.getOwnPropertyNames(postDeleteOrder), Object.values(postDeleteOrder), originalBaseUrl);
                    });
                });
            });
        });
    });
});