/// <reference types="cypress" />
// @ts-check

describe('Query: disputes', () => {
    it('should pass if the query returns valid return type', () => {
      const gqlQuery = `query {
        disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
          edges {
            node {
              id
              amount
              cardBrand
              concedeMessage
              status
              createdAt
              currency
              disputeType
              reason
              reasonMessage
              reasonDetails {
                code
                message
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
              resolution
              resolvedAt
              status
            }
          }
        }
      }`;
  
      cy.postGQLBearer(gqlQuery).then(res => {
        console.log(res);
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
  
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);
  
        // has data
        assert.exists(res.body.data);
  
        // assertions
        assert.exists(res.body.data.disputes);
        assert.isArray(res.body.data.disputes.edges);
      });
    });
  
    it('should fail if no return type is provided', () => {
      const gqlQuery = `query {
        disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
        }
      }
      `;
  
      cy.postGQLBearer(gqlQuery).then(res => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(false);
  
        // should have errors
        assert.exists(res.body.errors);
  
        // no data
        assert.notExists(res.body.data);
      });
    });

    it('should fail if no orderBy type is provided', () => {
        const gqlQuery = `query {
          disputes() {
            totalCount
          }
        }
        `;
    
        cy.postGQLBearer(gqlQuery).then(res => {
          // should not be 200 ok
          cy.expect(res.isOkStatusCode).to.be.equal(false);
    
          // should have errors
          assert.exists(res.body.errors);
    
          // no data
          assert.notExists(res.body.data);
        });
      });
  
    it('should pass if the query has at least one return type', () => {
      const gqlQuery = `query {
        disputes(orderBy: { direction: ASC, field: TIMESTAMP }) {
          totalCount
        }
      }
      `;
  
      cy.postGQLBearer(gqlQuery).then(res => {
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
  
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);
  
        // has data
        assert.exists(res.body.data);
      });
    });
  });
  