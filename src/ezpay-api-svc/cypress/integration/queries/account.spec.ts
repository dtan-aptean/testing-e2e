/// <reference types="cypress" />

describe('Query: account', () => {
  it('should pass if the query returns valid return type', () => {
    const gqlQuery = `{
      account {
        balances {
          balance
          incomingPending
          outgoingPending
          reserve
          updatedTimestamp
        }
        businessProfile {
          description
          name
          supportAddress {
            city
            country
            line1
            line2
            postalCode
            region
          }
          supportEmail
          supportPhone {
            countryCode
            phoneNumber
          }
          supportUrl
          url
          mcc
        }
        businessType
        capabilities {
          cardPayments
          achPayments
          accountPayouts
        }
        company {
          address {
            city
            country
            line1
            line2
            postalCode
            region
          }
          description
          name
          phone {
            countryCode
          }
          structure
          taxIdProvided
          verification {
            documents {
              customData
              documentId
              rejectReason
              status
              type
            }
          }
        }
        createdAt
        createdBy
        country
        customData
        defaultCurrency
        email
        id
        owner {
          tenantId
          adjustmentId
          disputeId
          paymentId
          payoutId
          recoveryId
          refundId
        }
        payfac {
          ids {
            resourceType
            resourceId
          }
        }
        requirements {
          currentDeadline
          currentlyDue
          disabledReason
          errors
          eventuallyDue
          pastDue
          pendingVerification
        }
        settings {
          cardPayments {
            refundPolicy
            statementDescription
          }
          achPayments {
            refundPolicy
            statementDescription
          }
          accountPayouts {
            statementDescription
            status
            schedule {
              interval
            }
            currency
            accountType
            accountLastFour
          }
          features {
            paymentMethods {
              autoUpdate
            }
            paymentRequests {
              consolidatedPayments
              partialPayment
            }
          }
          supportedPaymentMethods
        }
        tosAcceptance {
          date
          ip
          userAgent
        }
        updatedAt
        updatedBy
        feeSchedule
        statements {
          createdAt
          startTime
          endTime
          url
        }
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
      assert.isNotNull(res.body.data.account);
      assert.isNotNull(res.body.data.account.capabilities);
      assert.isNotNull(res.body.data.account.capabilities.cardPayments);
      assert.isNotNull(res.body.data.account.capabilities.achPayments);
      assert.isNotNull(res.body.data.account.capabilities.accountPayouts);
      assert.isNotNull(res.body.data.account.id);
      assert.isNotNull(res.body.data.account.owner);
      assert.isNotNull(res.body.data.account.owner.tenantId);
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `{
				account {
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
				account {
          owner {
            tenantId
          }
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
