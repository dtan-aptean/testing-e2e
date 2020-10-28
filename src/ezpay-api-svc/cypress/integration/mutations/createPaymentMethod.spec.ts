/// <reference types="cypress" />

describe('Mutation: createPaymentMethod', () => {
    it('should fail if no argument is provided', () => {
        const gqlQuery = `mutation {
          createPaymentMethod {
            code
            error
            status
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
});