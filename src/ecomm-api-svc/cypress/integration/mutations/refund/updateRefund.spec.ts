/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 10
var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls
confirmStorefrontEnvValues();

describe('Mutation: updateRefund', { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
    var id = '';
    var orderTotal = 0;
    const mutationName = 'updateRefund';
    const createName = 'createRefund';
    const queryName = "refunds";
    const itemPath = 'refund';
    const responseBody = `
                order {
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
                isPartialRefund
                refundAmount {
                    amount
                    currency
                }`;
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            ${responseBody}
        }
    `;

	var deleteItemsAfter = undefined as boolean | undefined;
    before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
        cy.wait(1000);
        cy.visit("/");  // Go to the storefront and login
        cy.setTheme();
        cy.storefrontLogin();
        cy.setupRequiredProducts();
        cy.goToPublicHome();
        cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo) => {
            const { orderId, orderAmount } = orderInfo;
            const localRefundAmount = {
                amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                currency: "USD"
            };
            const input = `{orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(localRefundAmount)}}`;
            cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                assert.exists(returnedId);
                id = returnedId;
                orderTotal = orderAmount;
            });
        });
    });

    after(() => {
        cy.visit("/");  // Go to the storefront and login
        cy.setTheme();
        cy.storefrontLogin();
        if (!Cypress.env("storedTheme")) {
            cy.setTheme(Cypress.env("storedTheme"));
        }
		if (!deleteItemsAfter) {
			return;
		}
        cy.cleanupEnvironment();
        if (id !== "") {
            const deletionName = "deleteRefund";
            const removalMutation = `mutation {
                ${deletionName}(input: { orderId: "${id}" }) {
                    ${codeMessageError}
                }
            }`;
            const queryInformation = {queryName: queryName, itemId: id, searchParameter: "ids"};
            cy.postAndConfirmDelete(removalMutation, deletionName, queryInformation, originalBaseUrl);
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

        it("Mutation will fail with invalid 'orderId' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { orderId: true }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation, undefined, originalBaseUrl);
        });

        // TODO: Failing with message "Currency is Required"
        it("Mutation will update item to a full refund with valid 'orderId' input", () => {
            const newRefund = {
                amount: orderTotal,
                currency: "USD"
            };
            const dummyOrder = {
                id: id,
                paymentInfo: {
                    paymentStatus: "REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [false, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                ${responseBody}
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });

        it("Mutation will fail with deleted Refund of 'OrderId' input", () => {
            const deleteMutName = "deleteRefund"
            cy.visit("/");
            cy.setTheme();
            cy.storefrontLogin();
            cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
                const { orderId, orderAmount } = orderInfo;
                const localRefundAmount = {
                    amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                    currency: "USD"
                };
                const input = `{orderId: "${orderId}", refundAmount: ${toFormattedString(localRefundAmount)}}`;
                cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    orderTotal = orderAmount;
                }).then(()=> {
                    const mutation = `mutation {
                        ${mutationName}(
                            input: {
                                orderId: "${id}"
                                refundAmount: ${toFormattedString(localRefundAmount)}
                            }
                        ) {
                            ${standardMutationBody}
                        }
                    }`;
                cy.mutationDeletedId(id, mutationName, deleteMutName, mutation, itemPath, originalBaseUrl)
                })
            });
                
            
        });

        it.only("Mutation will fail with deleted 'OrderId' input", () => {
            cy.visit("/");
            cy.setTheme();
            cy.storefrontLogin();
            cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
                const { orderId, orderAmount } = orderInfo;
                const localRefundAmount = {
                    amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                    currency: "USD"
                };
                const input = `{orderId: "${orderId}", refundAmount: ${toFormattedString(localRefundAmount)}}`;
                cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    orderTotal = orderAmount;

                }).then(()=>{
                    cy.get('@OrderNumber').then((orderNo)=>{
                    cy.visit('/');
                    cy.get(".administration").click({ force: true });
                    cy.wait(1000);
                    cy.location("pathname").should("eq", "/Admin");
                    cy.openAdminSidebar();
                    cy.openParentTree("Sales", { force: true });
                    cy.get(".nav-sidebar")
                        .find("li")
                        .find(".nav-treeview")
                        .find("li")
                        .contains("Orders")
                        .click({ force: true });
                    cy.location("pathname").should("include", "/Order/List");
                    cy.get("#orders-grid")
                        .contains(orderNo)
                        .parent()
                        .find("a")
                        .contains("View")
                        .click({ force: true });
                    });
                    cy.wait(500);
                    //cy.location("pathname").should("include", `/Order/Edit/${orderNo.split("-")[0]}`);
                    cy.get("#order-delete").click();
                    cy.get("button[type = 'submit']").last().click();
                }).then(()=> {
                    const mutation = `mutation {
                        ${mutationName}(
                            input: {
                                orderId: "${id}"
                                refundAmount: ${toFormattedString(localRefundAmount)}
                            }
                        ) {
                            ${standardMutationBody}
                        }
                    }`;
                cy.postAndConfirmMutationError(mutation, mutationName, itemPath, originalBaseUrl).then((res)=> {
                    expect(res.body.data[mutationName].errors[0].message).to.have.string("Invalid Aptean Id");
                })
                })
            });  
        });


        // TODO: Failing with message "Currency is Required"
        it("Mutation will update item to a partial refund with valid 'orderId' and 'isPartialRefund' input", () => {
            cy.visit("/");
            cy.setTheme();
            cy.storefrontLogin();
            cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
                const { orderId, orderAmount } = orderInfo;
                const localRefundAmount = {
                    amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                    currency: "USD"
                };
                const input = `{orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(localRefundAmount)}}`;
                cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    orderTotal = orderAmount;
                }).then(() => {
                    const newRefund = {
                        amount: 0,
                        currency: "USD"
                    };
                    const dummyOrder = {
                        id: id,
                        paymentInfo: {
                            paymentStatus: "PARTIALLY_REFUNDED",
                        },
                        totals: {
                            refund: newRefund
                        }
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
                    cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                        const propNames = ["isPartialRefund", "refundAmount", "order"];
                        const propValues = [true, newRefund, dummyOrder];
                        cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
    });

    context("Testing 'refundAmount'", () => {
        beforeEach(() => {
            cy.visit("/");
            cy.setTheme();
            cy.storefrontLogin();
            cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
                const { orderId, orderAmount } = orderInfo;
                const localRefundAmount = {
                    amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                    currency: "USD"
                };
                const input = `{orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(localRefundAmount)}}`;
                cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    orderTotal = orderAmount;
                });
            });
        });

        // TODO: Failing. coming back as partially refunded
        it("Mutation that updates a refund to a full refund with a refundAmount will set the refundedAmount to that amount", () => {
            const newRefund = {
                amount: orderTotal,
                currency: "USD"
            };
            const dummyOrder = {
                id: id,
                paymentInfo: {
                    paymentStatus: "REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [false, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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
                paymentInfo: {
                    paymentStatus: "PARTIALLY_REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [true, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                ${responseBody}
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });

        // TODO: Response behavior doesn't match. Update?
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
                paymentInfo: {
                    paymentStatus: "REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [false, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            nodes {
                                ${responseBody}
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                });
            });
        });

        // TODO: Got an error with a specific message for this scenario. Update test.
        it("Mutation that attempts to refund more than the order's total will accept the amount provided", () => {
            const newRefund = {
                amount: orderTotal * 2,
                currency: "USD"
            };
            const dummyOrder = {
                id: id,
                paymentInfo: {
                    paymentStatus: "REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [false, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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

    context("Testing all optional input", () => {
        beforeEach(() => {
            cy.visit("/");
            cy.setTheme();
            cy.storefrontLogin();
            cy.createOrderRetrieveId(originalBaseUrl).then((orderInfo: {orderId: string, orderAmount: number}) => {
                const { orderId, orderAmount } = orderInfo;
                const localRefundAmount = {
                    amount: Math.floor(Cypress._.random(1, orderAmount / 10)),
                    currency: "USD"
                };
                const input = `{orderId: "${orderId}", isPartialRefund: true, refundAmount: ${toFormattedString(localRefundAmount)}}`;
                cy.createAndGetId(createName, itemPath, input, undefined, originalBaseUrl).then((returnedId: string) => {
                    assert.exists(returnedId);
                    id = returnedId;
                    orderTotal = orderAmount;
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
                paymentInfo: {
                    paymentStatus: isPartialRefund ? "PARTIALLY_REFUNDED" : "REFUNDED",
                },
                totals: {
                    refund: newRefund
                }
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
            cy.postMutAndValidate(mutation, mutationName, itemPath, originalBaseUrl).then((res) => {
                const propNames = ["isPartialRefund", "refundAmount", "order"];
                const propValues = [isPartialRefund, newRefund, dummyOrder];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: TIMESTAMP}) {
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