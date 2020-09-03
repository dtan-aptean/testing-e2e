/// <reference types="cypress" />

describe('Payer Portal - Guest User', function() {
  context('Root Page', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should show the user options', () => {
      cy.get('[data-cy=create-an-account]')
      .should('be.visible')
      .and('be.enabled');

      cy.get('[data-cy=sign-in]')
      .should('be.visible')
      .and('be.enabled');
    })
  })
});
  