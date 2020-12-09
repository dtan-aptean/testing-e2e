/// <reference types="cypress" />
// @ts-check

describe('Query: refund', () => {

    it('should pass if the query returns valid refunds', () => {
      const gqlQuery = `query refunds {
        refunds(
          orderBy: { direction: ASC, field: TIMESTAMP }
        ) {
          totalCount
          edges {
            node {
              amount
              attemptTimestamp
              createTime
              currency
              failureReason
              id
              owner {
                tenantId
              }
              payment {
                id
                amount
              }
              pendingReason
              refundReason
              status
              
            }
          }
        }
      }
      `;
  
      cy.postGQL(gqlQuery).then(res => {
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);
  
        // no errors
        assert.notExists(res.body.errors, `One or more errors occured while executing query: ${gqlQuery}`);
  
        // has data
        assert.exists(res.body.data);
  
        // validate all not-nullable fields
        assert.isNotNull(res.body.data.refunds);
        assert.isNotNull(res.body.data.refunds.totalCount);
        assert.isNotNull(res.body.data.refunds.edges);
        assert.isAbove(res.body.data.refunds.edges.length, 0);
        for (let i = 0; i < res.body.data.refunds.edges.length; i += 1) {
          assert.isNotNull(res.body.data.refunds.edges[i]);
          assert.isNotNull(res.body.data.refunds.edges[i].amount);
          assert.isNotNull(res.body.data.refunds.edges[i].attemptTimestamp);
          assert.isNotNull(res.body.data.refunds.edges[i].createTime);
          assert.isNotNull(res.body.data.refunds.edges[i].currency);
          assert.isNotNull(res.body.data.refunds.edges[i].id);
          assert.isNotNull(res.body.data.refunds.edges[i].owner);
          assert.isNotNull(res.body.data.refunds.edges[i].payment);
          assert.isNotNull(res.body.data.refunds.edges[i].paymentId);
          assert.isNotNull(res.body.data.refunds.edges[i].refundReason);
          assert.isNotNull(res.body.data.refunds.edges[i].status);
        }
      });
    });
  
    it('should fail if the orderby argument is null', () => {
      const gqlQuery = `query refunds {
        refunds(orderBy: null }) {
          totalCount
          edges {
            node {
              id
            }
          }
        }
      }
      `;
  
      cy.postGQL(gqlQuery).then(res => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(false);
  
        // should have errors
        assert.exists(res.body.errors);
  
        // no data
        assert.notExists(res.body.data);
      });
    });
  
    it('should fail if the orderby argument is not passed', () => {
      const gqlQuery = `{
        refunds() {
          totalCount
          edges {
            node {
              id
            }
          }
        }
      }
      `;
  
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
      const gqlQuery = `query refunds {
        refunds(
          orderBy: { direction: ASC, field: TIMESTAMP }
        ) {
          
        }
      }
      `;
  
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
      const gqlQuery = `query refunds {
        refunds(
          orderBy: { direction: ASC, field: TIMESTAMP }
        ) {
          totalCount
        }
      }
      `;
  
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
  