/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

var originalBaseUrl = "";   // The original baseUrl config. We will need it for making api calls

const validateQuery = (query: string, res) => {
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
    assert.isArray(res.body.data.orders.nodes);
    expect(res.body.data.orders.nodes.length).to.be.eql(1);
};

const retrieveOrderSpecifics = (query: string, props?: string[]) => {
    return cy.postGQL(query, originalBaseUrl).then((res) => {
        validateQuery(query, res);
        var orderResponse = res.body.data.orders.nodes[0];
        if (props) {
            var dummyOrder = {};
            for(var i = 0; i < props.length; i++) {
                expect(orderResponse).to.have.property(props[i]);
                dummyOrder[props[i]] = orderResponse[props[i]];
            }
            return cy.wrap(dummyOrder);
        } else {
            return cy.wrap(orderResponse);
        }
    })
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
        cy.goToPublicHome().then(() => {
            cy.get(".header-links").then(($el) => {
                if (!$el[0].innerText.includes('LOG OUT')) {
                    cy.storefrontLogin();
                }
                cy.altCreateOrderRetrieveId(originalBaseUrl).then((orderInfo) => {
                    const { orderId } = orderInfo;
                    const query = `{
                        ${queryName}(id: "${orderId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
                            ${standardQueryBody}
                        }
                    }`;
                    retrieveOrderSpecifics(query).then((orderData) => {
                        const { status } = orderData;
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
                            // TODO: Get property names from first query and property names from mutation so I can do something with them
                            var result = res.body.data[mutationName][dataPath];
                            expect(result.orderStatus).to.not.eql(status);
                            const mutPropNames = ["orderStatus"];
                            const propValues = [orderStatus];
                            cy.confirmMutationSuccess(res, mutationName, dataPath, mutPropNames, propValues).then(() => {
                                const quePropNames = ["status"];
                                cy.confirmUsingQuery(query, queryName, orderId, quePropNames, propValues, originalBaseUrl);
                            });
                        });
                    });
                });
            });
        });
    });
});