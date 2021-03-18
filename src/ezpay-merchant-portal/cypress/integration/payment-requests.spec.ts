/// <reference types="cypress" />

describe('Merchant portal', function() {
  context('Payment Requests', () => {
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });
    beforeEach(() => {
      // navigate to home screen
      cy.visit('/');
    });

    it('should pass if able to upload and delete an invoice ', () => {
      const invoicePath = 'sample.pdf';
      cy.getInput('invoice').should('have.value', '');
      cy.getInput('invoice').attachFile(invoicePath);
      cy.wait(4000);
      cy.contains('sample.pdf');
      cy.getInput('invoice').should('not.have.value', '');
      cy.get('[data-cy=delete-invoice]') //TODO: this might have to change? 10/30/2020
        .find('svg')
        .click();
      cy.getInput('invoice').should('have.value', '');
    });

    it('should pass if able to make a payment request when mandatory fields are completed', () => {
      const amount = Cypress._.random(0, 1e3);
      const invoicePath = 'sample.pdf';
      const referenceNumber = `${Date.now()
        .toString()
        .slice(-4)}-${Cypress._.random(0, 1e12)}`;

      // mandatory field validation for payment request
      cy.get('[data-cy=payment-request-error]').should('not.exist');
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // validate that invoice is mandatory
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // validate if email is mandatory
      cy.getInput('recipient-email').clear();
      cy.getInput('invoice').attachFile(invoicePath);
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // validate if amount is mandatory
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount').clear();
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // validate if reference number is mandatory
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number').clear();
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // create a payment request
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('not.exist');
    });

    it('should fail if same reference number is entered', () => {
      const amount = Cypress._.random(0, 1e3);
      const invoicePath = 'sample.pdf';
      const referenceNumber = `${Date.now()
        .toString()
        .slice(-4)}-${Cypress._.random(0, 1e12)}`;

      // make first payment request
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.getInput('invoice').attachFile(invoicePath);
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('not.exist');
      
      // wait for payment completed
      cy.get('[data-cy=send-payment]').should('be.disabled');

      // make second payment request with same reference number
      cy.wait(4000); //if we do not wait, the e-mail field from the last request is not properly cleared.
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.getInput('invoice').attachFile(invoicePath);
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');
    });
  });
});
