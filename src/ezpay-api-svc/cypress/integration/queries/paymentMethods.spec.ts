/// <reference types="cypress" />

describe('Query: paymentMethods', () => {
    let resourceId = Cypress.env('x-aptean-tenant');

    it('passes if able to query payment methods off a tenantId', () => {
        const gqlQuery = `{
            paymentMethods(resourceId:"${resourceId}") {
                nodes {
                    id
                    type
                    status
                }
                totalCount
            }
        }`
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