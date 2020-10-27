/// <reference types="cypress" />
// @ts-check

describe('Query: paymentRequestFromUrlToken', () => {
  let urlToken = '';

  before(() => {
    cy.generatePaymentRequest().then(response => {
      const qsTokenIndex = 1;
      urlToken = response.paymentUrl.split('?')[qsTokenIndex];
    });
  });

  it('should pass if the query has an email argument and returns valid return types', () => {
    const gqlQuery = `{
			paymentRequestFromUrlToken(urlToken: "${urlToken}") {
				amount
				currency
				invoiceLink
				referenceNumber
				paymentRequestId
				status
				statusReason
				merchantName
				merchantStatementDescription
				refundPolicy
				tenantId
			}
		}`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // validate all not-nullable fields
      assert.exists(res.body.data.paymentRequestFromUrlToken);
      assert.isNumber(res.body.data.paymentRequestFromUrlToken.amount);
      assert.exists(res.body.data.paymentRequestFromUrlToken.currency);
      assert.exists(res.body.data.paymentRequestFromUrlToken.referenceNumber);
      assert.exists(res.body.data.paymentRequestFromUrlToken.paymentRequestId);
      assert.exists(res.body.data.paymentRequestFromUrlToken.status);
      assert.exists(res.body.data.paymentRequestFromUrlToken.merchantName);
      assert.exists(res.body.data.paymentRequestFromUrlToken.merchantStatementDescription);
      assert.exists(res.body.data.paymentRequestFromUrlToken.refundPolicy);
      assert.exists(res.body.data.paymentRequestFromUrlToken.tenantId);
    });
  });

  it('should fail if the email argument is null', () => {
    const gqlQuery = `{
      paymentRequestFromUrlToken(urlToken: null) {
          amount
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

  it('should fail if the email argument is not passed', () => {
    const gqlQuery = `{
      paymentRequestFromUrlToken {
					amount
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

  it('should fail if no return type is provided', () => {
    const gqlQuery = `{
				paymentRequestFromUrlToken(urlToken: "${urlToken}") {
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

  it('should pass if the query has at least one return type', () => {
    const gqlQuery = `{
				paymentRequestFromUrlToken(urlToken: "${urlToken}") {
					amount
				}
			}`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
    });
  });

  it('should pass if the query has all mandatory return types', () => {
    const gqlQuery = `{
		paymentRequestFromUrlToken(urlToken: "${urlToken}") {
          amount
          currency
          referenceNumber
          paymentRequestId
          status
          merchantName
          merchantStatementDescription
          refundPolicy
          tenantId
		}
	}`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
    });
  });
});
