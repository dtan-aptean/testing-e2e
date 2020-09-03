/// <reference types="cypress" />

describe('Payer portal', function() {
  context('Actions', () => {
    before(() => {
      cy.generatePaymentRequest().then(response => {
        cy.wrap(response).as('paymentRequest');
        cy.visit(response.paymentUrl);
      });
    });

    it('should pass if reference number and amount are correct', () => {
      cy.get('[data-cy=reference-number]').should('be.visible');
      cy.get('[data-cy=reference-number]').should('be.visible');

      // contains valid reference number
      cy.get('@paymentRequest')
        .its('referenceNumber')
        .then($referenceNumber => {
          cy.contains(`# ${$referenceNumber}`);
        });

      // contains valid amount
      cy.get('@paymentRequest')
        .its('amount')
        .then($amount => {
          cy.contains(`$${$amount / 100}`);
        });
    });

    it('should pass if lending screen has all basic details', () => {
      cy.contains('Total');
      cy.get('[data-cy=checkout-as-guest]').should('be.visible');
      cy.get('[data-cy=create-an-account]').should('be.visible');
      cy.get('[data-cy=sign-in]').should('be.visible');
      cy.get('[data-cy=merchant-name]').should('be.visible');
      cy.get('[data-cy=view-refund-policy]').should('be.visible');
      cy.get('[data-cy=download-invoice]').should('be.visible');
    });

    it('should pass if refund policy is displayed', () => {
      cy.get('[data-cy=view-refund-policy]').click();
      cy.get('[data-cy=refund-policy]').should('be.visible');

      cy.get('[data-cy=view-refund-policy]').click();
      cy.get('[data-cy=refund-policy]').should('not.be.visible');
    });

    it('should pass if download invoice url returns 200 status code', () => {
      cy.get('[data-cy=download-invoice]')
        .should('have.attr', 'href')
        .then(href => {
          console.log(href);
          cy.request('GET', href).then(response => {
            cy.expect(response.status).to.eq(200);
          });
        });
    });

    it('should pass if back takes you back to lending page', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();
      cy.contains('Billing Information');
      cy.get('[data-cy=back]').click();
      cy.get('[data-cy=checkout-as-guest]').should('be.visible');
    });

    it('should pass if billing takes you back to billing page', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();

      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').click();

      cy.contains('Credit card information');
      cy.get('[data-cy=back-to-billing]').click();
      cy.contains('Billing Information');
      cy.get('[data-cy=continue-to-payment]').should('be.visible');
    });

    it('should fail if first/last name not entered in the billing information', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe@aptean.com');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should fail if email address not entered in the billing information', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe.com');
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should fail if address not entered in the billing information', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe@aptean.com');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should fail if postal code not entered in the billing information', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe@aptean.com');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should pass if payment request is processed with only mandatory values as guest', () => {
      cy.reload();

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();

      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe@aptean.com');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').click();

      //get an iframe
      const getIframeBody = () => {
        return cy
          .get('#cc_iframe_iframe')
          .its('0.contentDocument.body')
          .should('not.be.empty')
          .then(cy.wrap);
      };
      getIframeBody().should('not.be.undefined');
      getIframeBody()
        .find('#text-input-cc-number')
        .type('4003830171874018');
      getIframeBody()
        .find('#text-input-expiration-month')
        .type('12');
      getIframeBody()
        .find('#text-input-expiration-year')
        .type('21');
      getIframeBody()
        .find('#text-input-cvv-number')
        .type('123');
      cy.get('[data-cy=make-payment]').click();
      cy.get('[data-cy=payment-success-message]').should('be.visible');
      cy.wait(2000);
      cy.reload();
      cy.get('[data-cy=payment-request-not-found]').should('be.visible');
    });

    it('should pass if payment request is processed with all values as guest', () => {
      // create a new payment request
      cy.generatePaymentRequest().then(response => {
        cy.wrap(response).as('paymentRequest');
        cy.visit(response.paymentUrl);
      });

      // checkout as guest
      cy.get('[data-cy=checkout-as-guest]').click();

      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email')
        .type('John.Doe@aptean.com')
        .should('have.value', 'John.Doe@aptean.com');
      cy.getInput('street-address')
        .type('40 Grandville Ave')
        .should('have.value', '40 Grandville Ave');
      cy.getInput('secondary-address')
        .type('Hamilton, ON')
        .should('have.value', 'Hamilton, ON');
      cy.getSelect('country')
        .select('Canada')
        .should('have.value', 'CA');
      cy.getInput('zipcode')
        .type('L0R 1W0')
        .should('have.value', 'L0R 1W0');
      cy.get('[data-cy=continue-to-payment]').click();

      //get an iframe
      const getIframeBody = () => {
        return cy
          .get('#cc_iframe_iframe')
          .its('0.contentDocument.body')
          .should('not.be.empty')
          .then(cy.wrap);
      };
      getIframeBody().should('not.be.undefined');
      getIframeBody()
        .find('#text-input-cc-number')
        .type('4003830171874018');
      getIframeBody()
        .find('#text-input-expiration-month')
        .type('12');
      getIframeBody()
        .find('#text-input-expiration-year')
        .type('21');
      getIframeBody()
        .find('#text-input-cvv-number')
        .type('123');
      cy.get('[data-cy=make-payment]').click();
      cy.get('[data-cy=payment-success-message]').should('be.visible');
    });

    it('should pass if user doesn not get an option to continue as guest when token is not passed', () => {
      cy.visit('/');
      cy.get('[data-cy=checkout-as-guest]').should('not.be.visible');
      cy.get('[data-cy=create-an-account]').should('be.visible');
      cy.get('[data-cy=sign-in]').should('be.visible');
    });
  });
});
