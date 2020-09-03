/// <reference types="cypress" />

describe('Merchant portal', function() {
  context('Payment Requests', () => {
    beforeEach(() => {
      // navigate to home screen
      cy.visit('/');
    });

    it('should pass if able to upload and delete an invoice ', () => {
      const invoicePath = 'sample.pdf';
      cy.getInput('invoice').should('have.value', '');
      cy.getInput('invoice').attachFile(invoicePath);
      cy.contains('sample.pdf');
      cy.getInput('invoice').should('not.have.value', '');
      cy.get('[data-cy=delete-invoice]')
        .find('svg')
        .click();
      cy.getInput('invoice').should('have.value', '');
    });

    it('should pass if able to make a payment request with email communication type', () => {
      const amount = Cypress._.random(0, 1e3);
      const invoicePath = 'sample.pdf';
      const referenceNumber = Cypress._.random(0, 1e9);

      // mandatory field validation for payment request
      cy.getInput('communication-type-email').check();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if invoice is mendatory
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if email is mendatory
      cy.getInput('recipient-email').clear();
      cy.getInput('invoice').attachFile(invoicePath);
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if amount is mendatory
      cy.getInput('recipient-email')
        .type('john.doe@aptean.com')
        .should('have.value', 'john.doe@aptean.com');
      cy.getInput('amount').clear();
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if reference number is mendatory
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number').clear();
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // create a payment request
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
    });

    it('should pass if able to make a payment request with sms communication type', () => {
      const amount = Cypress._.random(0, 1e3);
      const invoicePath = 'sample.pdf';
      const referenceNumber = Cypress._.random(0, 1e9);

      // mandatory field validation for payment request
      cy.getInput('communication-type-sms').check();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if invoice is mendatory
      cy.getInput('recipient-phone')
        .type('8554112783')
        .should('have.value', '(855) 411-2783');
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if email is mendatory
      cy.getInput('recipient-phone').clear();
      cy.getInput('invoice').attachFile(invoicePath);
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if amount is mendatory
      cy.getInput('recipient-phone')
        .type('8554112783')
        .should('have.value', '(855) 411-2783');
      cy.getInput('amount').clear();
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // validate if reference number is mendatory
      cy.getInput('amount')
        .type(amount)
        .should('have.value', amount.toString());
      cy.getInput('reference-number').clear();
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('be.visible');

      // create a payment request
      cy.getInput('reference-number')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=send-payment]').click();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');

      // search with reference number and make sure it filters correctly
      cy.getInput('search')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
      cy.get('[data-cy=payment-requests-tab]').click();
      cy.get('[data-cy=payment-requests-panel]')
        .find('table>tbody>tr')
        .should('have.length', 1);
      cy.get('[data-cy=payment-requests-panel]')
        .find('table>tbody>tr')
        .eq(0)
        .within(() => {
          cy.contains(referenceNumber);
          cy.contains('UNPAID');
        });
    });

    it('should fail if same reference number is entered', () => {
      const amount = Cypress._.random(0, 1e3);
      const invoicePath = 'sample.pdf';
      const referenceNumber = Cypress._.random(0, 1e9);

      // make first payment request
      cy.getInput('communication-type-email').check();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
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
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
      
      // wait for payment completed
      cy.get('[data-cy=send-payment]').should('be.enabled');

      // make second payment request with same reference number
      cy.getInput('communication-type-email').check();
      cy.get('[data-cy=payment-request-error]').should('not.be.visible');
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
