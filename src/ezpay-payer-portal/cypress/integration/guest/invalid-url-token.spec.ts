/// <reference types="cypress" />

const invalidUrlToken = 'asdfasdf';

describe('Payer Portal - Guest User', function() {
  context('Invalid URL, i.e. a search query string that is not a valid payment request URL token', () =>{
    beforeEach(() => {
      cy.visit(`/?${invalidUrlToken}`);
    });

    it('should show the error message saying payment request not found', () =>{
      cy.get('[data-cy=payment-not-found-error-message]')
      .should('be.visible');
    })
  })
});
