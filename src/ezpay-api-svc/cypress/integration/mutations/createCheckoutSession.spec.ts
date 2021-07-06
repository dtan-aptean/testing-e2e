/// <reference types="cypress" />

describe("Mutation: checkout session", () => {
  it("should pass if the session is created", () => {
    const gqlQuery = `mutation {
        createCheckoutSession(
          input: {
            amount: 3500
            cancelUrl: "www.youtube.com"
            successUrl: "www.google.com"
            currency: USD
            failOnReview: true
            immediateCapture: true
            orderDetails: {
              customerReferenceNumber: "ref"
              lineItems: [
                {
                  currency: USD
                  description: "desc"
                  quantity: 1
                  totalAmount: 100
                  unitOfMeasure: "pieces"
                  unitPrice: 100
                }
              ]
              orderType: GOODS
              shortDescription: "SHORTDESC"
              taxAmount: 2
            }
            payerDetails: {
              address: { country: "NL", postalCode: "4711 JJ" }
              email: "fjongmans@aptean.com"
              name: "Ferry Jongmans"
              phone: { countryCode: "+31", number: "0623963878" }
            }
          }
        ) {
          checkoutSession {
            id
          }
        }
      }      
      `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, "no errors");

      // has data
      assert.exists(res.body.data);

      // return type should not be nulll
      assert.isNotNull(res.body.data.createCheckoutSession.checkoutSession.id);
    });
  });

  it("should fail if the amount is less than $1", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 0.1
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
                payerDetails: {
                  address: { country: "NL", postalCode: "4711 JJ" }
                  email: "fjongmans@aptean.com"
                  name: "Ferry Jongmans"
                  phone: { countryCode: "+31", number: "0623963878" }
                }
              }
            ) {
              checkoutSession {
                id
              }
            }
          }      
          `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if input argument is empty", () => {
    const gqlQuery = `mutation {
        createCheckoutSession(
          input: {
          }
        ) {
          checkoutSession {
            id
          }
        }
      }
      
      `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 1200
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
                payerDetails: {
                  address: { country: "NL", postalCode: "4711 JJ" }
                  email: "fjongmans@aptean.com"
                  name: "Ferry Jongmans"
                  phone: { countryCode: "+31", number: "0623963878" }
                }
              }
            )
          }`;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass creating a checkout session without address", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 1200
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
                payerDetails: {
                  email: "fjongmans@aptean.com"
                  name: "Ferry Jongmans"
                  phone: { countryCode: "+31", number: "0623963878" }
                }
              }
            ) {
              checkoutSession {
                id
                payerDetails{
                  address{
                    city
                    country
                  }
                  email
                  name
                }
              }
            }
          }
          `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, "no errors");

      // has data
      assert.exists(res.body.data);

      // if address is not specified then in result it will be null
      assert.isNull(
        res.body.data.createCheckoutSession.checkoutSession.payerDetails.address
      );
    });
  });

  it("should pass creating a checkout session without payer-details", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 1200
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
              }
            ) {
              checkoutSession {
                id
                payerDetails{
                  address{
                    city
                    country
                  }
                  email
                  name
                }
              }
            }
          }
          `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, "no errors");

      // has data
      assert.exists(res.body.data);

      // if address is not specified then in result it will be null
      assert.isNull(
        res.body.data.createCheckoutSession.checkoutSession.payerDetails.address
      );
    });
  });

  it("should fail when creating a checkout session with invalid country in payer details", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 1200
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
                payerDetails: {
                  address: { country: "Holland", postalCode: "4711 JJ" }
                  email: "fjongmans@aptean.com"
                  name: "Ferry Jongmans"
                  phone: { countryCode: "+31", number: "0623963878" }
                }
              }
            )
          }`;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass creating a checkout session without phone", () => {
    const gqlQuery = `mutation {
            createCheckoutSession(
              input: {
                amount: 1200
                cancelUrl: "www.youtube.com"
                successUrl: "www.google.com"
                currency: USD
                failOnReview: true
                immediateCapture: true
                orderDetails: {
                  customerReferenceNumber: "ref"
                  lineItems: [
                    {
                      currency: USD
                      description: "desc"
                      quantity: 1
                      totalAmount: 100
                      unitOfMeasure: "pieces"
                      unitPrice: 100
                    }
                  ]
                  orderType: GOODS
                  shortDescription: "SHORTDESC"
                  taxAmount: 2
                }
                payerDetails: {
                  address: { country: "NL", postalCode: "4711 JJ" }
                  email: "fjongmans@aptean.com"
                  name: "Ferry Jongmans"
                }
              }
            ) {
              checkoutSession {
                id
                payerDetails{
                  address{
                    city
                    country
                  }
                  email
                  name
                  phone{
                    countryCode
                    number
                  }
                }
              }
            }
          }
          `;

    cy.postGQLCheckoutConsumer(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, "no errors");

      // has data
      assert.exists(res.body.data);

      // if address is not specified then in result it will be null
      assert.isNull(
        res.body.data.createCheckoutSession.checkoutSession.payerDetails.phone
      );
    });
  });
});
