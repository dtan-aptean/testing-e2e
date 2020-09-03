/// <reference types="cypress" />

describe('Mutation: upsertPaymentRequest', () => {
  let email = '';
  let invoiceRef = '';
  const amount = Cypress._.random(0, 1e3);
  const phoneNumber = '';

  before(() => {
    cy.fixture('person').then(testData => {
      cy.getInvoiceRef().then(uploadResponse => {
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

  it('should pass if the mutation upsert a payment request with all arguments', () => {
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
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPaymentRequest);
      assert.isNotNull(res.body.data.upsertPaymentRequest.code);
      assert.isNull(res.body.data.upsertPaymentRequest.error, res.body.data.upsertPaymentRequest.message);
      assert.equal(res.body.data.upsertPaymentRequest.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should fail if input argument is empty', () => {
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

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it('should fail if no return type is provided', () => {
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

    cy.postGQL(gqlQuery).then(res => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it('should fail if no argument is provided', () => {
    const gqlQuery = `mutation {
      upsertPaymentRequest {
        code
        message
        error
        paymentRequestId
        paymentUrl
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it('should pass if the mutation has at least one return type', () => {
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

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPaymentRequest);
      assert.exists(res.body.data.upsertPaymentRequest.code);
    });
  });

  it('should pass if the mutation has all mandatory inputs', () => {
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

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPaymentRequest);
      assert.exists(res.body.data.upsertPaymentRequest.code);
    });
  });
});
