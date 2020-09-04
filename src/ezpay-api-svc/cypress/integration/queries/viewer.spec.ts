/// <reference types="cypress" />

describe('Query: viewer', () => {
  it('should pass if the query returns valid return type', () => {
    const gqlQuery = `{
      viewer {
        currentUser {
          id
          address {
            city
            country
            line1
            line2
            postalCode
            region
          }
          createdAt
          createdBy
          email
          firstName
          lastName
          customData
          phone {
            countryCode
            phoneNumber
          }
          relationship {
            owner
            percentOwnership
            primaryAccountHolder
            role
            title
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
          owner {
            tenantId
            adjustmentId
            disputeId
            paymentId
            payoutId
            recoveryId
            refundId
          }
          payerProfile {
            billing {
              address {
                city
                country
                line1
                line2
                postalCode
                region
              }
              firstName
              lastName
              email
            }
            paymentMethod {
              status
              accountType
              accountLastFour
              accountHolder
            }
          }
          updatedAt
          updatedBy
          verification {
            additionalDocuments {
              customData
              documentId
              rejectReason
              status
              type
            }
            documents {
              customData
              documentId
              rejectReason
              status
              type
            }
            status
          }
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
        }
      }
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      console.log(res);
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.exists(res.body.data.viewer);
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `{
				viewer {
				}
			}`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
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
				viewer {
          currentUser{
            id
          }
				}
      }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
    });
  });
});
