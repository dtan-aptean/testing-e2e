/// <reference types="cypress" />

describe('Merchant portal', function() {
  context('Monthly Statements', () => {
    beforeEach(() => {
      // navigate to home page
      cy.visit('/');
    });

    // it('should pass if able to view all statements', () => {
    //   cy.get('[data-cy=last-three-months]').should('be.visible');
    //   cy.get('[data-cy=view-all-statements]')
    //     .should('be.visible')
    //     .and('be.enabled');
    //   cy.get('[data-cy=view-all-statements]').click();
    //   cy.get('[data-cy=monthly-statement-dialog]').should('be.visible');
    //   cy.get('[data-cy=close-monthly-statement-dialog]').click();
    //   cy.get('[data-cy=monthly-statement-dialog]').should('not.be.visible');
    //   cy.get('[data-cy=view-all-statements]').click();

    //   // is year list collapsible?
    //   cy.get('[data-cy=first-year]')
    //     .find('svg')
    //     .click();
    //   cy.get('[data-cy=first-year-months]').should('be.visible');
    //   cy.get('[data-cy=first-year-months]')
    //     .find('li')
    //     .its('length')
    //     .should('be.gt', 0);

    //   cy.get('[data-cy=first-year]')
    //     .find('svg')
    //     .click();
    //   cy.get('[data-cy=first-year-months]').should('not.be.visible');

    //   // view first year's statements
    //   cy.get('[data-cy=first-year]')
    //     .find('svg')
    //     .click();
    //   cy.get('[data-cy=first-year-months]')
    //     .find('li')
    //     .eq(0)
    //     .within(() => {
    //       cy.get('[data-cy=download-statement]').click();
    //     });

    //   // TODO: Verify statement download
    // });
  });
});
