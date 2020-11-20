/// <reference types="cypress" />

describe('Merchant portal', function() {
  before(() => {
    sessionStorage.clear();
    cy.login();
  })

  context('Monthly Statements', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('downloads a monthly statement when one is clicked', () => {
      cy.get('[data-cy=last-three-months]').find('a').first()
        .should('have.attr', 'href')
        .then(href => {
          cy.request('GET', href).then(response => {
            cy.expect(response.status).to.eq(200);
          });
        })
    });

    it('can view all statements', () => {
      cy.get('[data-cy=view-all-statements')
        .should('be.visible')
        .and('be.enabled')
        .click();

      cy.get('[data-cy=monthly-statement-dialog]')
        .should('be.visible');
    })

    it('can expand a year and download monthly statements', () => {
      cy.get('[data-cy=view-all-statements').click();

      cy.get('[data-cy=year-list')
        .should('be.visible')
        .find('svg').click();

      cy.get('[data-cy=year-list')
        .find('li > a').first()
        .should('have.attr', 'href')
        .then(href => {
          cy.request('GET', href).then(response => {
            cy.expect(response.status).to.eq(200);
          });
        })
    })

    it('can close the statement dialog and go back to viewing the home page', () => {
      cy.get('[data-cy=view-all-statements').click();

      cy.get('[data-cy=close-monthly-statement-dialog')
        .should('be.visible')
        .and('be.enabled')
        .click();

      cy.get('[data-cy=monthly-statement-dialog]')
        .should('not.be.visible');
    })
  });
});
