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

    it('shows the account button', () => {
      cy.get('[data-cy=account-button]')
        .should('be.visible')
        .and('be.enabled');
    });

    it('routes to root when clicking on the home logo', () => {
      cy.get('[data-cy=home-logo]')
        .should('be.visible')
        .click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/');
      })
    })

    it('can sign out', () => {
      cy.get('[data-cy=account-button]')
        .click();
      
      cy.get('[data-cy=sign-out]')
        .should('be.visible')
        .click();

      cy.wait(2000);
      cy.get('body').then(($body) => {
        assert.isNotOk($body.find('[data-cy=account-button]').length, "expect account button not to exist in DOM")
      })
    })
  });
});
