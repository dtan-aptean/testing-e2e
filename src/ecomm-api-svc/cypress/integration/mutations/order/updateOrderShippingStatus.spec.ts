/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../../support/commands";

var originalBaseUrl = Cypress.config("baseUrl");   // The original baseUrl config. We will need it for making api calls
const orderStatuses = ["PENDING", "PROCESSING", "COMPLETE", "CANCELLED"];
const shippingStatuses = ["NOT_YET_SHIPPED", "SHIPPING_NOT_REQUIRED", "PARTIALLY_SHIPPED", "SHIPPED", "DELIVERED"];
const shippingMethods = ["Ground", "Next Day Air", "2nd Day Air"];

const goHomeAndOrder = (checkoutOptions?) => {
    return cy.goToPublicHome().then(() => {
        return cy.get(".header-links").then(($el) => {
            if (!$el[0].innerText.includes('LOG OUT')) {
                cy.storefrontLogin();
            }
            return cy.createShippingOrderId(originalBaseUrl, checkoutOptions);
        });
    });
};

const productQtyWgtId = (orderId: string) => {
    const productQuery = `{
        orders(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
            nodes {
                id
                items {
                    quantityOrdered
                    product {
                        id
                        shippingInformation {
                            weight
                        }
                    }
                }
            }
        }
    }`;
    return cy.postAndValidate(productQuery, "orders", originalBaseUrl).then((res) => {
        const orderItems = res.body.data.orders.nodes[0].items;
        expect(orderItems.length).to.be.gt(0);
        var items = [] as {quantity: number, weight: number, id: string}[];
        orderItems.forEach((item) => {
            items.push({quantity: item.quantityOrdered, weight: item.product.shippingInformation.weight, id: item.product.id});
        });
        return items;
    });
};

const createShipmentRecord = (orderedProducts: {quantity: number, weight: number, id: string}[], shipAll?: boolean, shipQty?: number | number[], customData?) => {
    const trackingNo  = `cypress${Cypress._.random(1000, 9999)}-${Cypress._.random(1e5, 1e6)}`;
    const today = new Date();
    const nextWeek = new Date(today.valueOf() + 604800000);
    const nextWeek10Am = new Date(`${nextWeek.getMonth() + 1}/${nextWeek.getDate()}/${nextWeek.getFullYear()} 10:00`);
    var weight = 0;
    const shipmentItems = [];
    orderedProducts.forEach((product, index) => {
        var qty;
        if (shipAll) {
            qty = product.quantity;
        } else if (shipQty) {
            qty = Array.isArray(shipQty) ? shipQty[index] : shipQty;
        } else {
            qty = Cypress._.random(1, product.quantity);
        }
        weight = weight + (qty * product.weight);
        shipmentItems.push({productId: product.id, quantityShipped: qty});
    });
   const shipmentRecord = {
        trackingNumber: trackingNo,
        shippedDate: today.toISOString(), 
        deliveryDate: nextWeek10Am.toISOString(),
        totalWeight: weight,
        shippingLineItems: shipmentItems
    };
    if (customData) {
        shipmentRecord.customData = customData;
    }
    return shipmentRecord;
};

// To account for totalWeight not being on the orderShippingStatus response
const dummyResponseRecords = (shipmentRecords) => {
    const responseRecords = [];
    shipmentRecords.forEach((rec) => {
        const dummyRec = {};
        const recProps = Object.getOwnPropertyNames(rec);
        for (var i = 0; i < recProps.length; i++) {
            if (recProps[i] !== "totalWeight") {
                dummyRec[recProps[i]] = rec[recProps[i]]; 
            }
        }
        responseRecords.push(dummyRec);
    });
    return responseRecords;
};

const confirmRecordCustomData = (response, expectedData) => {
    const records = response.body.data.updateOrderShippingStatus.orderShippingStatus.shipmentRecords;
    records.forEach((rec, i) => {
        expect(rec.customData).to.be.eql(expectedData[i]);
    });
};

const getDiffShippingMethod = (i: number): string => {
    const exclusiveShippingMethods = shippingMethods.slice(0);
    exclusiveShippingMethods.splice(i, 1);
    return exclusiveShippingMethods[Cypress._.random(0, exclusiveShippingMethods.length - 1)];
};

// TEST COUNT: 13

describe('Mutation: updateOrderShippingStatus', () => {
    const mutationName = 'updateOrderShippingStatus';
    const queryName = 'orders';
    const dataPath = 'orderShippingStatus';
    const standardMutationBody = `
        code
        message
        error
        ${dataPath} {
            orderId
            orderStatus
            shippingMethodName
            shippingStatus
            customData
            shipmentRecords {
                customData
                trackingNumber
                shippedDate
                deliveryDate
                shippingLineItems {
                    productId
                    quantityShipped
                }
            }
        }
    `;
    const standardQueryBody = `
        nodes {
            id
            shippingMethodName
            shippingStatus
            status
            customData
        }
    `;

    before(() => {
        confirmStorefrontEnvValues();
        Cypress.config("baseUrl", Cypress.env("storefrontUrl"));
        cy.wait(1000);
        cy.visit("/");
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
    });

    context("Testing various input", () => {
        it("Mutation using orderStatus will properly update the orderStatus", () => {
            goHomeAndOrder().then((orderId: string) => {
                const orderStatus = orderStatuses[Cypress._.random(1, orderStatuses.length - 1)];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    const propNames = ["orderStatus"]
                    const propValues = [orderStatus];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                ${standardQueryBody}
                            }
                        }`;
                        propNames.splice(propNames.indexOf("orderStatus"), 1, "status");
                        cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        it("Mutation using shippingStatus will properly update the shippingStatus", () => {
            goHomeAndOrder().then((orderId: string) => {
                const orderStatus = orderStatuses[Cypress._.random(1, orderStatuses.length - 1)];
                const shippingStatus = shippingStatuses[Cypress._.random(1, shippingStatuses.length - 1)];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                        shippingStatus: ${shippingStatus}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    const propNames = ["shippingStatus", "orderStatus"]
                    const propValues = [shippingStatus, orderStatus];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                ${standardQueryBody}
                            }
                        }`;
                        propNames.splice(propNames.indexOf("orderStatus"), 1, "status");
                        cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        it("Mutation using shippingMethodName will properly update the shippingMethodName", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                const orderStatus = orderStatuses[Cypress._.random(1, orderStatuses.length - 1)];
                const shippingMethodName = getDiffShippingMethod(checkoutOptions.shippingMethod);
                const shippingStatus = shippingStatuses[Cypress._.random(1, shippingStatuses.length - 1)];
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                        shippingStatus: ${shippingStatus}
                        shippingMethodName: "${shippingMethodName}"
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    const propNames = ["shippingMethodName", "shippingStatus", "orderStatus"]
                    const propValues = [shippingMethodName, shippingStatus, orderStatus];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                ${standardQueryBody}
                            }
                        }`;
                        propNames.splice(propNames.indexOf("orderStatus"), 1, "status");
                        cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                    });
                });
            });
        });

        it("Mutation using shipmentRecords will properly update the shipmentRecords", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                productQtyWgtId(orderId).then((orderedProducts) => {
                    const shipmentRecords = [createShipmentRecord(orderedProducts, true)];
                    const orderStatus = "PENDING";
                    const shippingStatus = "SHIPPED";
                    const shippingMethodName = shippingMethods[checkoutOptions.shippingMethod];
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shippingMethodName: "${shippingMethodName}"
                            shippingStatus: ${shippingStatus}
                            shipmentRecords: ${toFormattedString(shipmentRecords)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        const propNames = ["shipmentRecords", "orderStatus", "shippingMethodName", "shippingStatus"];
                        const propValues = [dummyResponseRecords(shipmentRecords), orderStatus, shippingMethodName, shippingStatus];
                        cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues);
                    });
                });
            });
        });

        it("Mutation using shipmentRecords without including shipmentMethodName will fail", () => {
            goHomeAndOrder().then((orderId: string) => {
                productQtyWgtId(orderId).then((orderedProducts) => {
                    const shipmentRecords = [createShipmentRecord(orderedProducts, true)];
                    const orderStatus = "PENDING";
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shipmentRecords: ${toFormattedString(shipmentRecords)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postAndConfirmMutationError(mutation, mutationName, undefined, originalBaseUrl).then((res) => {
                        const errorMessage = res.body.errors[0].message;
                        expect(errorMessage).to.contain("Shipping Method Name Is Required");
                    });
                });
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation using 'customData' input updates order with customData", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                const shippingMethodName = getDiffShippingMethod(checkoutOptions.shippingMethod);
                const orderStatus = "PENDING";
                const customData = {data: `${dataPath} customData`, canDelete: true};
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                        shippingMethodName: "${shippingMethodName}"
                        customData: ${toFormattedString(customData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    const propNames = ["customData", "orderStatus", "shippingMethodName"];
                    const propValues = [customData, orderStatus, shippingMethodName];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                ${standardQueryBody}
                            }
                        }`;
                        cy.postAndCheckCustom(query, queryName, orderId, customData, originalBaseUrl);
                    });
                });
            });
        });
        
        it("Mutation using 'customData' input will overwrite the existing customData on an order", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                const shippingMethodName = getDiffShippingMethod(checkoutOptions.shippingMethod);
                const orderStatus = "PENDING";
                const customData = {data: `${dataPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                        shippingMethodName: "${shippingMethodName}"
                        customData: ${toFormattedString(customData)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((resp) => {
                    const newShippingMethodName = getDiffShippingMethod(shippingMethods.indexOf("2nd Day Air"));
                    const newCustomData = {data: `${dataPath} customData`, newDataField: { canDelete: true }};
                    const secondMutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shippingMethodName: "${newShippingMethodName}"
                            customData: ${toFormattedString(newCustomData)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(secondMutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        const propNames = ["customData", "orderStatus", "shippingMethodName"];
                        const propValues = [newCustomData, orderStatus, shippingMethodName];
                        cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                    ${standardQueryBody}
                                }
                            }`;
                            cy.postAndCheckCustom(query, queryName, orderId, newCustomData, originalBaseUrl);
                        });
                    });
                });
            });
        });

        it("Mutation using shipmentRecord 'customData' input updates shipmentRecord with customData", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                productQtyWgtId(orderId).then((orderedProducts) => {
                    const shippingMethodName = shippingMethods[checkoutOptions.shippingMethod];
                    const orderStatus = "COMPLETE";
                    const shippingStatus = "SHIPPED";
                    const customData = { specialInstructions: 'Mailbox is in the back of complex', customerComplaints: []};
                    const shipmentRecords = [createShipmentRecord(orderedProducts, true, undefined, customData)];
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shippingMethodName: "${shippingMethodName}"
                            shippingStatus: ${shippingStatus}
                            shipmentRecords: ${toFormattedString(shipmentRecords)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        const propNames = ["shippingStatus", "orderStatus", "shippingMethodName"];
                        const propValues = [shippingStatus, orderStatus, shippingMethodName];
                        cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                            confirmRecordCustomData(res, [customData]);
                        });
                    });
                });
            });
        });

        it("Mutation using shipmentRecord 'customData' input will overwrite the existing customData on a shipmentRecord", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                productQtyWgtId(orderId).then((orderedProducts) => {
                    const shippingMethodName = shippingMethods[checkoutOptions.shippingMethod];
                    const orderStatus = "PROCESSING";
                    const shippingStatus = "PARTIALLY_SHIPPED";
                    const customData = { specialInstructions: {task: 'Mailbox is in the back of complex', completed: false}, customerComplaints: []};
                    const shipmentRecords = [createShipmentRecord(orderedProducts, false, undefined, customData)];
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shippingMethodName: "${shippingMethodName}"
                            shippingStatus: ${shippingStatus}
                            shipmentRecords: ${toFormattedString(shipmentRecords)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        const propNames = ["shippingStatus", "orderStatus", "shippingMethodName"];
                        const propValues = [shippingStatus, orderStatus, shippingMethodName];
                        cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                            confirmRecordCustomData(res, [customData]);
                            const qtyShipped = shipmentRecords[0].shippingLineItems[0].quantityShipped;
                            const remainingQty = orderedProducts[0].quantity - qtyShipped;
                            const newOrderStatus = "COMPLETE";
                            const newShippingStatus = "SHIPPED";
                            const newCustomData = { specialInstructions: {task: 'Mailbox is in the back of complex', completed: true}, customerComplaints: ["Left beside mailbox"]};
                            const newRecords = [createShipmentRecord(orderedProducts, false, qtyShipped, newCustomData), createShipmentRecord(orderedProducts, false, remainingQty, customData)]
                            const secondMutation = `mutation {
                                ${mutationName}(input: {
                                    orderId: "${orderId}"
                                    orderStatus: ${newOrderStatus}
                                    shippingMethodName: "${shippingMethodName}"
                                    shippingStatus: ${newShippingStatus}
                                    shipmentRecords: ${toFormattedString(newRecords)}
                                }) {
                                    ${standardMutationBody}
                                }
                            }`;
                            cy.postMutAndValidate(secondMutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                                const propNames = ["shippingStatus", "orderStatus", "shippingMethodName"];
                                const propValues = [newShippingStatus, newOrderStatus, shippingMethodName];
                                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                                    confirmRecordCustomData(res, [newCustomData, customData]);
                                });
                            });
                        });
                    });
                });
            });
        });

        it("Mutation will correctly use all input", () => {
            const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
            goHomeAndOrder(checkoutOptions).then((orderId: string) => {
                productQtyWgtId(orderId).then((orderedProducts) => {
                    const customData = {data: `${dataPath} customData`, canDelete: true};
                    const recordsCustomData = { specialInstructions: 'Mailbox is in the back of complex', customerComplaints: []};
                    const shipmentRecords = [createShipmentRecord(orderedProducts, true, undefined, recordsCustomData)];
                    const orderStatus = "PENDING";
                    const shippingStatus = "SHIPPED";
                    const shippingMethodName = shippingMethods[checkoutOptions.shippingMethod];
                    const mutation = `mutation {
                        ${mutationName}(input: {
                            orderId: "${orderId}"
                            orderStatus: ${orderStatus}
                            shippingMethodName: "${shippingMethodName}"
                            shippingStatus: ${shippingStatus}
                            customData
                            shipmentRecords: ${toFormattedString(shipmentRecords)}
                        }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                        const propNames = ["shipmentRecords", "customData", "orderStatus", "shippingMethodName", "shippingStatus"];
                        const propValues = [dummyResponseRecords(shipmentRecords), customData, orderStatus, shippingMethodName, shippingStatus];
                        cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                                    ${standardQueryBody}
                                }
                            }`;
                            propNames.splice(0, 1);
                            propValues.splice(0, 1);
                            propNames.splice(propNames.indexOf("orderStatus"), 1, "status");
                            cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                        });
                    });
                });
            });
        });
    });
});