/// <reference types="cypress" />

describe('Mutation: processPaymentRequest', () => {
  let amount = 0;
  let payerEmailAddress = '';
  let paymentRequestId = '';
  let paymentToken = '';
  let referenceNumber = '';
  const payerCountry = 'US';
  const payerFullName = 'Cypress User2';
  const payerPostalCode = '10001';
  const tenantId = Cypress.env('x-aptean-tenant');

  before(() => {
    cy.fixture('person').then(testData => {
      cy.generatePaymentRequest().then(paymentRequest => {
        // get test data from fixture
        const { email } = testData;
        payerEmailAddress = email;

        // get test data from payment request
        ({ amount, paymentRequestId, referenceNumber } = paymentRequest);

        // get payment token by calling a wepay api
        cy.fixture('wepay').then(wepaySettings => {
          cy.request({
            method: 'POST',
            url: `${wepaySettings.apiBaseUrl}/tokens`,
            headers: {
              'app-id': wepaySettings.appId,
              'app-token': wepaySettings.appToken,
              'api-version': wepaySettings.apiVersion,
              'content-type': 'application/json',
            },
            body: wepaySettings.creditCardTokenReqBody,
            failOnStatusCode: true,
          }).then(response => {
            const {
              body: { id },
            } = response;
            paymentToken = id;
          });
        });
      });
    });
  });

  it('should pass if the mutation process a payment request with all arguments', () => {
    const gqlQuery = `mutation {
      processPaymentRequest(
        input: {
          referenceNumber: "${referenceNumber}"
          paymentToken: "${paymentToken}"
          paymentRequestId: "${paymentRequestId}"
          tenantId: "${tenantId}"
          payerPostalCode: "${payerPostalCode}"
          payerCountry: "${payerCountry}"
          payerEmailAddress: "${payerEmailAddress}"
          payerFullName: "${payerFullName}"
          expectedPaymentAmount: ${amount}
        }
      ) {
        code
        message
        error
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      console.log(gqlQuery);
      console.log(res);
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.processPaymentRequest);
      assert.isNotNull(res.body.data.processPaymentRequest.code);
      assert.isNull(res.body.data.processPaymentRequest.error, res.body.data.processPaymentRequest.message);
      assert.equal(res.body.data.processPaymentRequest.code, 'PENDING', 'Code is not PENDING');
    });
  });

  it('should fail if input argument is empty', () => {
    const gqlQuery = `mutation {
      processPaymentRequest(
        input: {}
      ) {
        code
        message
        error
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // has data
      assert.notExists(res.body.data);

      // assertions
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `mutation {
      processPaymentRequest(
        input: {
          referenceNumber: "${referenceNumber}"
          paymentToken: "${paymentToken}"
          paymentRequestId: "${paymentRequestId}"
          tenantId: "${tenantId}"
          payerPostalCode: "${payerPostalCode}"
          payerCountry: "${payerCountry}"
          payerEmailAddress: "${payerEmailAddress}"
          payerFullName: "${payerFullName}"
          expectedPaymentAmount: ${amount}
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
      processPaymentRequest(
        input: {
          referenceNumber: "${referenceNumber}"
          paymentToken: "${paymentToken}"
          paymentRequestId: "${paymentRequestId}"
          tenantId: "${tenantId}"
          payerPostalCode: "${payerPostalCode}"
          payerCountry: "${payerCountry}"
          payerEmailAddress: "${payerEmailAddress}"
          payerFullName: "${payerFullName}"
          expectedPaymentAmount: ${amount}
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
      assert.exists(res.body.data.processPaymentRequest);
      assert.exists(res.body.data.processPaymentRequest.code);
    });
  });
});
