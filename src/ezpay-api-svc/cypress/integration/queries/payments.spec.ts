/// <reference types="cypress" />
// @ts-check

describe('Query: payments', () => {
    it('should pass if the query has an order by argument and returns valid return types', () => {
      const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
        }
      }
      `;
  
      cy.postGQL(gqlQuery).then(res => {
        // should be 200 ok
        console.log(res);
        cy.expect(res.isOkStatusCode).to.be.equal(true);
  
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);
  
        // has data
        assert.exists(res.body.data);
  
        // validate all not-nullable fields
        assert.isNotNull(res.body.data.payments);
        assert.isNotNull(res.body.data.payments.totalCount);
        assert.isNotNull(res.body.data.payments.edges);
        
        if (res.body.data.payments.edges.length > 0) {
          for (let i = 0; i < res.body.data.payments.edges.length; i++) {
            const edge = res.body.data.payments.edges[i];
  
            assert.isNotNull(edge.node.id);
            assert.isNotNull(edge.node.amount);
            assert.isNotNull(edge.node.currency);
            assert.isNotNull(edge.node.refunds);
          }
        }
      });
    });
  
    it('should fail if the orderby argument is null', () => {
      const gqlQuery = `query payments {
        payments(orderBy: null) {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
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
  
    it('should fail if the order by argument is not passed', () => {
      const gqlQuery = `query payments {
        payments {
          totalCount
          edges {
            node {
              id
              amount
              amountRefunded
              currency
              refunds {
                amount
              }
            }
          }
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
      const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
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
      const gqlQuery = `query payments {
        payments(orderBy: { direction: ASC, field: TIMESTAMP }) {
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
  