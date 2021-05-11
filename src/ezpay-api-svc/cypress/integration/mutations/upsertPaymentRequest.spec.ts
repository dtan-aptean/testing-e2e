/// <reference types="cypress" />

describe("Mutation: upsertPaymentRequest", () => {
  let email = "";
  let invoiceRef = "";
  const amount = Cypress._.random(1000, 1e4);
  const discountAmount = Cypress._.random(100, 900);
  const phoneNumber = "";
  const tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(new Date().getDate() - 1);

  before(() => {
    cy.fixture("person").then((testData) => {
      cy.getInvoiceRef().then((uploadResponse) => {
        // load test data
        ({ email } = testData);
        const {
          data: {
            upload: { uniqueId },
          },
        } = uploadResponse;
        invoiceRef = uniqueId;
      });
    });
  });

  it("should pass if the mutation upsertPaymentRequest has all input arguments", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${tomorrow.toISOString()}"
          discountAmount: ${discountAmount}
          discountEndDate: "${tomorrow}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPaymentRequest);
      assert.isNotNull(res.body.data.upsertPaymentRequest.code);
      assert.isNull(
        res.body.data.upsertPaymentRequest.error,
        res.body.data.upsertPaymentRequest.message
      );
      assert.equal(
        res.body.data.upsertPaymentRequest.code,
        "SUCCESS",
        "Code is not SUCCESS"
      );
    });
  });

  it("should pass if the mutation upsertPaymentRequest has only required input arguments", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPaymentRequest);
      assert.isNotNull(res.body.data.upsertPaymentRequest.code);
      assert.isNull(
        res.body.data.upsertPaymentRequest.error,
        res.body.data.upsertPaymentRequest.message
      );
      assert.equal(
        res.body.data.upsertPaymentRequest.code,
        "SUCCESS",
        "Code is not SUCCESS"
      );
    });
  });

  it("should fail if the discount is greater than the amount", () => {
    const discount = Cypress._.random(10000, 1e5);
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${tomorrow}"
          discountAmount: ${discount}
          discountEndDate: "${tomorrow}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the payable amount is less than $1", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: 500
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${tomorrow}"
          discountAmount: 450
          discountEndDate: "${tomorrow}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the discount end date is in the past", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${tomorrow}"
          discountAmount: ${discountAmount}
          discountEndDate: "${yesterday}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the discount end date is after the due date", () => {
    const dayafter = new Date();
    dayafter.setDate(new Date().getDate() + 2);
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${tomorrow}"
          discountAmount: ${discountAmount}
          discountEndDate: "${yesterday}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the due date is in the past", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
          dueDate: "${yesterday}"
          customData: {
            id: 1234567890
          }
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if the amount is less than $1", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: 99
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
        }
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // Should be 200 OK
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if input argument is empty", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {}
      ) {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
        }
      ) {}
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass if the mutation has at least one return type", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          type: NONE
          email: "${email}"
          phoneNumber: "${phoneNumber}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
          sendCommunication: false
        }
      ) {
        code
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPaymentRequest);
      assert.exists(res.body.data.upsertPaymentRequest.code);
    });
  });

  it("should pass if the mutation has all mandatory inputs", () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest(
        input: {
          referenceNumber: "${Cypress._.random(0, 1e20)}"
          amount: ${amount}
          invoiceRef: "${invoiceRef}"
        }
      ) {
        code
      }
    }`;

    cy.postGQL(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPaymentRequest);
      assert.exists(res.body.data.upsertPaymentRequest.code);
    });
  });
});
