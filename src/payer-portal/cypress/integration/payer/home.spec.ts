/// <reference types="cypress" />

describe('Payer Portal - Logged in user', function() {
    before(() => {
      cy.login();
      cy.wait(5000);
    });
    
    context('Logged In', () => {
      beforeEach(() => {
        cy.visit('/');
      });
  
      it ('shows the payments due list', () => {
        cy.get('[id=payment-requests-tab]').should('be.visible').click();
        cy.get('[data-cy=payments-due-list').should('be.visible');
      });

      it ('clicks on the recent transactions tab and shows the recent transactions list', () => {
        cy.get('[id=disputes-tab]').should('be.visible').click();
        cy.get('[data-cy=recent-transactions-list').should('be.visible');
      });
    });
  });
  