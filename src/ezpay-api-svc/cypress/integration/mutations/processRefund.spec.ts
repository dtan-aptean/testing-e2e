/// <reference types="cypress" />

describe('Mutation: processRefund', () => {
  let amount = 0;
  let paymentId = '';
  let paymentRequestId = '';
  let tenantId = '';
  let refundReason = '';

  before(() => {
    cy.fixture('processRefund').then(testData => {
      // load test data
      ({ amount, paymentId, paymentRequestId, tenantId, refundReason } = testData);
    });
  });

  it.skip('should pass if the mutation process a refund request with all arguments', () => {
    const gqlQuery = `mutation {
      processRefund(
        input: {
          paymentId: "${paymentId}"
          amount: ${amount}
          refundReason: "${refundReason}"
        }
      ) {
        code
        error
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
      assert.isNotNull(res.body.data.processRefund);
      assert.isNotNull(res.body.data.processRefund.code);
      assert.isNull(res.body.data.processRefund.error, res.body.data.processRefund.message);
      assert.equal(res.body.data.processRefund.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should fail if input argument is empty', () => {
    const gqlQuery = `mutation {
      processRefund(
        input: {}
      ) {
        code
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
      processRefund(
        input: {
          paymentId: "${paymentId}"
          amount: ${amount}
          refundReason: "${refundReason}"
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
      processRefund {
        code
        error
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

  it.skip('should pass if the mutation has at least one return type', () => {
    const gqlQuery = `mutation {
      processRefund(
        input: {
          paymentId: "${paymentId}"
          amount: ${amount}
          refundReason: "${refundReason}"
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
      assert.exists(res.body.data.processRefund);
      assert.exists(res.body.data.processRefund.code);
    });
  });
});
