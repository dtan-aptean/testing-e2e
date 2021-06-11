/// <reference types="cypress" />

describe('Payer Portal - Logged in user', function() {
  before(() => {
    cy.login();
    cy.wait(5000);
  });
  
  context('Logged In', () => {
    beforeEach(() => {
      cy.visit('/');
    })

    it('routes to root when clicking on the home logo', () => {
      cy.get('[data-cy=home-logo]')
        .should('be.visible')
        .click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/');
      })
    })
  });
});
