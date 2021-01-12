/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

var originalBaseUrl = "";   // The original baseUrl config. We will need it for making api calls

const validateQuery = (query: string, res, dataPath?: string, expectMultiple?: boolean) => {
    const path = dataPath ? dataPath : "orders";
    expect(res.isOkStatusCode).to.be.equal(true);
    var errorMessage = `No errors while executing query: \n${query}`;
    if (res.body.errors) {
        errorMessage = `One or more errors ocuured while executing query: \n${query}`;
        res.body.errors.forEach((item) => {
            errorMessage = errorMessage + " \n" + item.extensions.code + ". " + item.message;
        });
        errorMessage = errorMessage + "\n";
    }
    assert.notExists(res.body.errors, errorMessage);
    assert.exists(res.body.data);
    assert.isArray(res.body.data[path].nodes);
    if (expectMultiple) {
        expect(res.body.data[path].nodes.length).to.be.gt(0);
    } else {
        expect(res.body.data[path].nodes.length).to.be.eql(1);
    }
};

const retrieveOrderSpecifics = (query: string, includeProps?: string[], excludeProps?: string[]) => {
    return cy.postGQL(query, originalBaseUrl).then((res) => {
        validateQuery(query, res);
        var orderResponse = res.body.data.orders.nodes[0];
        if (includeProps) {
            var includedValues = [];
            for (var i = 0; i < includeProps.length; i++) {
                expect(orderResponse).to.have.property(includeProps[i]);
                includedValues.push(orderResponse[includeProps[i]]);
            }
            return cy.wrap({ orderProps: includeProps, orderValues: includedValues });
        } else if (excludeProps) {
            var orderProps = Object.getOwnPropertyNames(orderResponse);
            var desiredProps = [] as string[];
            var desiredValues = [];
            for(var i = 0; i < orderProps.length; i++) {
                if (!excludeProps.includes(orderProps[i]) && orderProps[i] !== "id") {
                    desiredProps.push(orderProps[i]);
                    desiredValues.push(orderResponse[orderProps[i]]);
                }
            }
            return cy.wrap({ orderProps: desiredProps, orderValues: desiredValues });
        } else {
            var allProps = Object.getOwnPropertyNames(orderResponse);
            var allValues = Object.values(orderResponse);
            return cy.wrap({ orderProps: allProps, orderValues: allValues });
        }
    });
};

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
    return cy.postGQL(productQuery, originalBaseUrl).then((res) => {
        validateQuery(productQuery, res);
        const orderItems = res.body.data.orders.nodes[0].items;
        expect(orderItems.length).to.be.gt(0);
        var items = [] as {quantity: number, weight: number, id: string}[];
        orderItems.forEach((item) => {
            items.push({quantity: item.quantityOrdered, weight: item.product.shippingInformation.weight, id: item.product.id});
        });
        return items;
    });
};

const createShipmentRecord = (orderedProducts: {quantity: number, weight: number, id: string}[], shipAll?: boolean, customData?) => {
    const trackingNo  = `cypress${Cypress._.random(1000, 9999)}-${Cypress._.random(1e5, 1e6)}`;
    const today = new Date();
    const nextWeek = new Date(today.valueOf() + 604800000);
    const nextWeek10Am = new Date(`${nextWeek.getMonth() + 1}/${nextWeek.getDate()}/${nextWeek.getFullYear()} 10:00`);
    var weight = 0;
    const shipmentItems = [];
    orderedProducts.forEach((product) => {
        var qty = shipAll ? product.quantity : Cypress._.random(1, product.quantity);
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

// TEST COUNT: 3

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

    const orderStatuses = ["PENDING", "PROCESSING", "COMPLETE", "CANCELLED"];
    const shippingStatuses = ["NOT_YET_SHIPPED", "SHIPPING_NOT_REQUIRED", "PARTIALLY_SHIPPED", "SHIPPED", "DELIVERED"];
    const shippingMethods = ["Ground", "Next Day Air", "2nd Day Air"];

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
        cy.wait(1000);
        cy.visit("/");
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
                    propNames.splice(0, 1, "status");
                    cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it("Mutation using shippingStatus will properly update the shippingStatus", () => {
        goHomeAndOrder().then((orderId: string) => {
            const shippingStatus = shippingStatuses[Cypress._.random(1, shippingStatuses.length - 1)];
            const mutation = `mutation {
                ${mutationName}(input: {
                    orderId: "${orderId}"
                    shippingStatus: ${shippingStatus}
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                const propNames = ["shippingStatus"]
                const propValues = [shippingStatus];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it("Mutation using shippingMethodName will properly update the shippingMethodName", () => {
        const checkoutOptions = { shippingMethod: Cypress._.random(0, shippingMethods.length - 1) };
        goHomeAndOrder(checkoutOptions).then((orderId: string) => {
            const exclusiveShippingMethods = shippingMethods.slice(0);
            exclusiveShippingMethods.splice(checkoutOptions.shippingMethod, 1);
            const shippingMethodName = exclusiveShippingMethods[Cypress._.random(0, exclusiveShippingMethods.length - 1)];
            const mutation = `mutation {
                ${mutationName}(input: {
                    orderId: "${orderId}"
                    shippingMethodName: "${shippingMethodName}"
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                const propNames = ["shippingMethodName"]
                const propValues = [shippingMethodName];
                cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, orderId, propNames, propValues, originalBaseUrl);
                });
            });
        });
    });

    it.only("Mutation using shipmentRecords will properly update the shipmentRecords", () => {
        //goHomeAndOrder().then((orderId: string) => {
            const orderId = "d153a3ef-14be-4b09-8e6a-b4de440e9f15";
            productQtyWgtId(orderId).then((orderedProducts) => {
                const shipmentRecords = createShipmentRecord(orderedProducts, true);
                const orderStatus = "PENDING";
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                        shippingStatus: SHIPPED
                        shipmentRecords: ${toFormattedString(shipmentRecords)}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    const propNames = ["shipmentRecords"];
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
                    const propValues = [responseRecords];
                    cy.confirmMutationSuccess(res, mutationName, dataPath, propNames, propValues);
                });
            });
        //});
    });

    // Very early test that probably isn't useful: should remove at some point
    it.skip("Mutation will update shippingStatus when the mutations is first called on the order", () => {
        goHomeAndOrder().then((orderId: string) => {
            const query = `{
                ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                    ${standardQueryBody}
                }
            }`;
            retrieveOrderSpecifics(query, ["shippingMethodName", "customData"]).then((orderData) => {
                const { orderProps, orderValues } = orderData;
                const orderStatus = "COMPLETE";
                const mutation = `mutation {
                    ${mutationName}(input: {
                        orderId: "${orderId}"
                        orderStatus: ${orderStatus}
                    }) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, dataPath, originalBaseUrl).then((res) => {
                    var changedProps = ["orderStatus", "shippingStatus"];
                    var changedValues = [orderStatus, "PARTIALLY_SHIPPED"]
                    const mutPropNames = changedProps.concat(orderProps);
                    const propValues = changedValues.concat(orderValues)
                    cy.confirmMutationSuccess(res, mutationName, dataPath, mutPropNames, propValues).then(() => {
                        const quePropNames = mutPropNames.slice(0);
                        quePropNames.splice(0, 1, "status");
                        cy.confirmUsingQuery(query, queryName, orderId, quePropNames, propValues, originalBaseUrl);
                    });
                });
            });
        });
    });
});