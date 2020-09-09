/// <reference types="cypress" />

describe('Merchant portal', function() {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  })

  context('Account Button', () => {
    let viewerUser;
    
    before(() => {
      cy.getViewerUser(Cypress.config("username")).then(response => {
        viewerUser = response;
      })
    });

    beforeEach(() => {
      cy.visit('/');
    })

    it('should show the account button with the correct initials', () => {
      cy.get('[data-cy=user-avatar]').should('be.visible')
      
      cy.get('[data-cy=user-avatar]')
        .find('span')
        .should(($span) => {
          expect($span).to.contain(`${viewerUser.firstName.substring(0, 1)}${viewerUser.lastName.substring(0, 1)}`);
        });
    });

    it('should show the user settings menu when the account button is clicked', () => {
      cy.get('[data-cy=user-settings')
        .should('be.visible')
        .and('be.enabled');

      cy.get('[data-cy=user-settings]').click();

      cy.get('[data-cy=settings-menu]').should('be.visible');

      cy.get('[data-cy=manage-account]')
        .should('be.visible')
        .and(($option) => {
          expect($option).to.contain('Manage account');
        });

      cy.get('[data-cy=manage-users]')
        .should('be.visible')
        .and(($option) => {
          expect($option).to.contain('Manage users');
        });

      cy.get('[data-cy=help]')
        .should('be.visible')
        .and(($option) => {
          expect($option).to.contain('Help');
        });

      cy.get('[data-cy=sign-out]')
        .should('be.visible')
        .and(($option) => {
          expect($option).to.contain('Sign out');
        });
    })

    it('should redirect the user to /settings when the "Manage account" button is clicked', () => {
      cy.get('[data-cy=user-settings]').click();
      cy.get('[data-cy=manage-account]').click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/settings');
      })
    });

    it('should redirect the user to /user-management when the "Manage users" button is clicked', () => {
      cy.get('[data-cy=user-settings]').click();
      cy.get('[data-cy=manage-users]').click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/user-management');
      })
    });

    it('should redirect the user to /help when the "Help" button is clicked', () => {
      cy.get('[data-cy=user-settings]').click();
      cy.get('[data-cy=help]').click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq('/help');
      })
    });
  });
});
