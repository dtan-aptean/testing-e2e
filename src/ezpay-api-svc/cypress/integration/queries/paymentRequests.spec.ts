/// <reference types="cypress" />
// @ts-check

describe("Query: paymentRequests", () => {
  it("should pass if the query has an orderBy argument and returns valid return types", () => {
    const gqlQuery = `{
  	paymentRequests(orderBy: { direction: ASC, field: TIMESTAMP }) {
        edges {
          cursor
          node {
            amount
            communications {
              communicationType
              email
              id
              phoneNumber
              requestTimestamp
              sentTimestamp
            }
            createdAt
            id
            invoiceId
            owner {
              tenantId
              adjustmentId
              disputeId
              paymentId
              payoutId
              recoveryId
              refundId
            }
            referenceNumber
            status
            statusReason
            payments {
              amount
              amountDisputed
              amountRefunded
              attemptTimestamp
              completedTimestamp
              currency
              failureReason
              feeAmount
              id
              initiatedBy
              owner {
                tenantId
                adjustmentId
                disputeId
                paymentId
                payoutId
                recoveryId
                refundId
              }
              pendingReason
              status
            }
          }
        }
        nodes {
          amount
          communications {
            communicationType
            email
            id
            phoneNumber
            requestTimestamp
            sentTimestamp
          }
          createdAt
          id
          invoiceId
          owner {
            tenantId
            adjustmentId
            disputeId
            paymentId
            payoutId
            recoveryId
            refundId
          }
          referenceNumber
          status
          statusReason
          payments {
            amount
            amountDisputed
            amountRefunded
            attemptTimestamp
            completedTimestamp
            currency
            failureReason
            feeAmount
            id
            initiatedBy
            owner {
              tenantId
              adjustmentId
              disputeId
              paymentId
              payoutId
              recoveryId
              refundId
            }
            pendingReason
            status
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

      // validate all not-nullable fields
      assert.isNotNull(res.body.data.paymentRequests);
      assert.isNotNull(res.body.data.paymentRequests.edges);
      assert.isNotNull(res.body.data.paymentRequests.nodes);
      assert.isNotNull(res.body.data.paymentRequests.pageInfo);
      assert.isNotNull(res.body.data.paymentRequests.totalCount);

      // validate data types
      assert.isArray(res.body.data.paymentRequests.edges);
      assert.isArray(res.body.data.paymentRequests.nodes);
      assert.isObject(res.body.data.paymentRequests.pageInfo);
      assert.isNotNaN(res.body.data.paymentRequests.totalCount);
    });
  });

  it("should pass if the query has an orderBy argument and at least one return type is provided", () => {
    const gqlQuery = `{
  		paymentRequests(orderBy: { direction: ASC, field: TIMESTAMP }) {
        totalCount
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
    });
  });

  it("should fail if the query has only direction provided in orderBy argument", () => {
    const gqlQuery = `{
  		paymentRequests(orderBy: { direction: ASC }) {
        totalCount
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

  it("should fail if the query has only field provided in orderBy argument", () => {
    const gqlQuery = `{
  		paymentRequests(orderBy: { field: TIMESTAMP }) {
        totalCount
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

  it("it should fail if no argument passed", () => {
    const gqlQuery = `{
  		paymentRequests {
        totalCount
      }
  	}`;

    cy.postGQL(gqlQuery).then((res) => {
      console.log(res);
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass if the query has at least one return type", () => {
    const gqlQuery = `{
  		paymentRequests(orderBy: { direction: ASC, field: TIMESTAMP }) {
        totalCount
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
    });
  });

  it("should pass if the query returns the latest completed order", () => {
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const gqlQuery = `{
			paymentRequests(
        orderBy: { direction: DESC, field: TIMESTAMP }
        first: 1
        dateRangeType: PAYMENT_COMPLETED
        startDate: "1/1/2001"
        endDate: "${endDate.toLocaleDateString()}"
        status: FULLY_REFUNDED
      ) {
        nodes {
          amount
        }
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

      assert.equal(res.body.data.paymentRequests.nodes.length, 1);
    });
  });

  it("should pass if the querystring parameter filters the order by the reference number", () => {
    cy.generatePaymentRequest().then((paymentRequest) => {
      const gqlQuery = `{
          paymentRequests(
            orderBy: { direction: DESC, field: TIMESTAMP }
            first: 1
            queryString: "${paymentRequest.referenceNumber}"
          ) {
            nodes {
              referenceNumber
            }
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

        assert.equal(res.body.data.paymentRequests.nodes.length, 1);
        assert.equal(
          res.body.data.paymentRequests.nodes[0].referenceNumber,
          paymentRequest.referenceNumber
        );
      });
    });
  });

  it("should pass if the paging works using cursor(before & after)", () => {
    const gqlQuery = `{
			paymentRequests(
        orderBy: { direction: DESC, field: TIMESTAMP }
        first: 2
      ) {
        totalCount
        nodes {
          referenceNumber
        }
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

      cy.expect(res.body.data.paymentRequests.totalCount).to.be.least(2);

      const firstRefNumber =
        res.body.data.paymentRequests.nodes[0].referenceNumber;
      const secondRefNumber =
        res.body.data.paymentRequests.nodes[1].referenceNumber;

      // get first page request
      const gqlFirstPageQuery = `{
        paymentRequests(
          orderBy: { direction: DESC, field: TIMESTAMP }
          first: 1
        ) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }
          nodes {
            referenceNumber
          }
        }
      }`;
      cy.postGQL(gqlFirstPageQuery).then((firstPage) => {
        // should be 200 ok
        cy.expect(firstPage.isOkStatusCode).to.be.equal(true);

        // no errors
        assert.notExists(
          firstPage.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // has data
        assert.exists(firstPage.body.data);

        cy.expect(firstPage.body.data.paymentRequests.nodes.length).to.be.equal(
          1
        );
        assert.equal(
          firstPage.body.data.paymentRequests.nodes[0].referenceNumber,
          firstRefNumber
        );
        assert.equal(
          firstPage.body.data.paymentRequests.pageInfo.hasNextPage,
          true
        );
        assert.equal(
          firstPage.body.data.paymentRequests.pageInfo.hasPreviousPage,
          false
        );

        // get second page request
        const gqlSecondPageQuery = `{
          paymentRequests(
            orderBy: { direction: DESC, field: TIMESTAMP }
            after: "${firstPage.body.data.paymentRequests.pageInfo.startCursor}"
            first: 1
          ) {
            totalCount
            pageInfo {
              endCursor
              hasNextPage
              hasPreviousPage
              startCursor
            }
            nodes {
              referenceNumber
            }
          }
        }`;
        cy.postGQL(gqlSecondPageQuery).then((secondPage) => {
          // should be 200 ok
          cy.expect(secondPage.isOkStatusCode).to.be.equal(true);

          // no errors
          assert.notExists(
            secondPage.body.errors,
            `One or more errors ocuured while executing query: ${gqlQuery}`
          );

          // has data
          assert.exists(secondPage.body.data);

          cy.expect(
            secondPage.body.data.paymentRequests.nodes.length
          ).to.be.equal(1);
          assert.equal(
            secondPage.body.data.paymentRequests.nodes[0].referenceNumber,
            secondRefNumber
          );
          assert.equal(
            secondPage.body.data.paymentRequests.pageInfo.hasPreviousPage,
            true
          );
        });
      });
    });
  });
});
