/// <reference types="cypress" />

import { confirmStorefrontEnvValues } from "../../../support/commands";

// TEST COUNT: 6
describe('Mutation: deleteRefund', () => {
    let id = '';
    let orderInUse = '';
    let refund = 0;
    const mutationName = 'deleteRefund';
    const creationName = 'createRefund';
    const queryName = "refunds";
    const deletedMessage = "refund";
    const standardMutationBody = `
        code
        message
        error
    `;

    var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls
    
    const refundOrder = () => {
        const mutation = `mutation {
                ${creationName}(input: {orderId: "${orderInUse}", refundAmount: {amount: ${refund}, currency: "USD"}}) {
                    ${standardMutationBody}
                    refund {
                        order {
                            id
                        }
                    }
                }
            }`;
        return cy.postMutAndValidate(mutation, creationName, "refund", originalBaseUrl).then(() => {
            id = orderInUse;
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
                    cy.postAndConfirmDelete(mutation, mutationName, originalBaseUrl).then(() => {
                        id = '';
                    });
                }
            });
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
            expect(res.body.errors[0].message).to.include("Refund Not Exist For this Order");
        });
    });

    it("Mutation will succeed with given the 'orderId' of an existing item", () => {
        refundOrder().then(() => {
            const mutation = `mutation {
                ${mutationName}(input: { orderId: "${id}"}){
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmDelete(mutation, mutationName, originalBaseUrl).then((res) => {
                expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                cy.queryForDeletedById(true, id, "searchString", queryName, originalBaseUrl).then(() => {
                    id = '';
                });
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
                cy.postAndConfirmDelete(mutation, mutationName, originalBaseUrl).then((res) => {
                    expect(res.body.data[mutationName].message).to.be.eql(`${deletedMessage} deleted`);
                    cy.queryForDeletedById(true, id, "searchString", queryName, originalBaseUrl).then(() => {
                        id = '';
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