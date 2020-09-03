/// <reference types="cypress" />

describe('Query: transactionRecords', () => {
  it('should pass if the query has an orderBy argument and returns valid return types', () => {
    const gqlQuery = `{
			transactionRecords(orderBy: { direction: ASC, field: TIMESTAMP }) {
        edges {
          cursor
          node {
            createdAt
            currency
            feeAmount
            grossAmount
            id
            netAmount
            transactionType
            owner {
              tenantId
              adjustmentId
              disputeId
              paymentId
              payoutId
              recoveryId
              refundId
            }
          }
        }
        nodes {
          createdAt
          currency
          feeAmount
          grossAmount
          id
          netAmount
          transactionType
          owner {
            tenantId
            adjustmentId
            disputeId
            paymentId
            payoutId
            recoveryId
            refundId
          }
        }
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
        totalCount
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
      assert.isNotNull(res.body.data.transactionRecords);
      assert.isNotNull(res.body.data.transactionRecords.edges);
      assert.isNotNull(res.body.data.transactionRecords.nodes);
      assert.isNotNull(res.body.data.transactionRecords.pageInfo);
      assert.isNotNull(res.body.data.transactionRecords.totalCount);

      // validate data types
      assert.isArray(res.body.data.transactionRecords.edges);
      assert.isArray(res.body.data.transactionRecords.nodes);
      assert.isObject(res.body.data.transactionRecords.pageInfo);
      assert.isNotNaN(res.body.data.transactionRecords.totalCount);
    });
  });

  it('should pass if the query has an orderBy argument and at least one return type is provided', () => {
    const gqlQuery = `{
			transactionRecords(orderBy: { direction: ASC, field: TIMESTAMP }) {
        totalCount
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

  it('should fail if the query has only direction provided in orderBy argument', () => {
    const gqlQuery = `{
			transactionRecords(orderBy: { direction: ASC }) {
        totalCount
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

  it('should fail if the query has only field provided in orderBy argument', () => {
    const gqlQuery = `{
			transactionRecords(orderBy: { field: TIMESTAMP }) {
        totalCount
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

  it('it should fail if no argument passed', () => {
    const gqlQuery = `{
			transactionRecords {
        totalCount
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
			transactionRecords(orderBy: { direction: ASC, field: TIMESTAMP }) {
        totalCount
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

  it('should pass if the query has all valid arguments', () => {
    const gqlQuery = `{
			transactionRecords(
        orderBy: { direction: ASC, field: TIMESTAMP }
        after: ""
        before: ""
        first: 0
        last: 0
        startDate: "1/1/2001"
        endDate: "1/1/2001"
      ) {
        totalCount
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
