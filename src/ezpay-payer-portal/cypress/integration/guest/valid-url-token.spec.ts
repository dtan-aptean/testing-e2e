/// <reference types="cypress" />

describe('Payer Portal - Guest User', function() {
  context('Valid URL token for a payment request', () => {
    let urlToken;
    let paymentRequest;

    //function to select the credit card iframe
    const getIframeBody = () => {
      return cy.get('#cc_iframe_iframe')
        .its('0.contentDocument.body')
        .should('not.be.empty')
        .then(cy.wrap);
    };

    before(() => {
      cy.generatePaymentRequest().then(response => {
        urlToken = response.paymentUrl.substring(response.paymentUrl.indexOf('?'));
        cy.visit(`${urlToken}`);
      })
        .then(() => {
          cy.wait(2000);
          cy.getPaymentRequestInfo(urlToken).then(response => {
            paymentRequest = response;
            console.log(paymentRequest);
          });
        });
    });

    it('should show the correct reference number', () => {
      cy.get('[data-cy=reference-number]')
        .should('be.visible')
        .and('contain', paymentRequest.referenceNumber)
    });

    it('should show the correct amount', () => {
      cy.get('[data-cy=amount]')
        .should('be.visible')
        .and('contain', paymentRequest.amount / 100); //amount is in cents, display is in dollars
    });

    it('should have a working "Download Invoice" link', () => {
      cy.get('[data-cy=download-invoice]')
        .should('have.attr', 'href')
        .then(href => {
          cy.request('GET', href).then(response => {
            cy.expect(response.status).to.eq(200);
          });
        });
    });

    it('should toggle to show the refund policy', () => {
      cy.get('[data-cy=view-refund-policy]')
        .should('contain', 'View refund policy');
      
      cy.get('[data-cy=view-refund-policy]').click();

      cy.get('[data-cy=refund-policy]')
        .should('be.visible')
        .and('contain', paymentRequest.refundPolicy);
    });  

    it('should prevent saving billing information if first/last name is not entered', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('email')
        .type('Bob.Bob@test.com')
        .should('have.value', 'Bob.Bob@test.com');
      cy.getInput('street-address')
        .type('1234 Street Road')
        .should('have.value', '1234 Street Road');
      cy.getSelect('country')
        .select('United States')
        .should('have.value', 'US');
      cy.getInput('zipcode')
        .type('12345')
        .should('have.value', '12345');
      cy.getInput('country-code')
        .type('1')
        .should('have.value', '1');
      cy.getInput('phone-number')
        .type('1231231234')
        .should('have.value', '(123) 123-1234');    
        
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should prevent saving billing information if email is not entered', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('holder-name')
        .type('Bobo Obob')
        .should('have.value', 'Bobo Obob');
      cy.getInput('street-address')
        .type('1234 Street Road')
        .should('have.value', '1234 Street Road');
      cy.getSelect('country')
        .select('United States')
        .should('have.value', 'US');
      cy.getInput('zipcode')
        .type('12345')
        .should('have.value', '12345');
      cy.getInput('country-code')
        .type('1')
        .should('have.value', '1');
      cy.getInput('phone-number')
        .type('1231231234')
        .should('have.value', '(123) 123-1234');    
        
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should prevent saving billing information if address is not entered', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('holder-name')
        .type('Bobo Obob')
        .should('have.value', 'Bobo Obob');
      cy.getInput('email')
        .type('Bob.Bob@test.com')
        .should('have.value', 'Bob.Bob@test.com');
      cy.getSelect('country')
        .select('United States')
        .should('have.value', 'US');
      cy.getInput('zipcode')
        .type('12345')
        .should('have.value', '12345');
      cy.getInput('country-code')
        .type('1')
        .should('have.value', '1');
      cy.getInput('phone-number')
        .type('1231231234')
        .should('have.value', '(123) 123-1234');    
        
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should prevent saving billing information if postal code is not entered', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('holder-name')
        .type('Bobo Obob')
        .should('have.value', 'Bobo Obob');
      cy.getInput('email')
        .type('Bob.Bob@test.com')
        .should('have.value', 'Bob.Bob@test.com');
      cy.getInput('street-address')
        .type('1234 Street Road')
        .should('have.value', '1234 Street Road');
      cy.getInput('country-code')
        .type('1')
        .should('have.value', '1');
      cy.getInput('phone-number')
        .type('1231231234')
        .should('have.value', '(123) 123-1234');    
        
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should prevent saving billing information if phone number is not entered', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('holder-name')
        .type('Bobo Obob')
        .should('have.value', 'Bobo Obob');
      cy.getInput('email')
        .type('Bob.Bob@test.com')
        .should('have.value', 'Bob.Bob@test.com');
      cy.getInput('street-address')
        .type('1234 Street Road')
        .should('have.value', '1234 Street Road');
      cy.getSelect('country')
        .select('United States')
        .should('have.value', 'US');
      cy.getInput('zipcode')
        .type('12345')
        .should('have.value', '12345');
        
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');
    });

    it('should be able to fill in all mandatory values and continue to credit card info', () => {
      cy.reload();

      cy.get('[data-cy=checkout-as-guest]').click();
      cy.get('[data-cy=continue-to-payment]').should('be.disabled');

      cy.getInput('holder-name')
        .type('Bobo Obob')
        .should('have.value', 'Bobo Obob');
      cy.getInput('email')
        .type('Bob.Bob@test.com')
        .should('have.value', 'Bob.Bob@test.com');
      cy.getInput('street-address')
        .type('1234 Street Road')
        .should('have.value', '1234 Street Road');
      cy.getSelect('country')
        .select('United States')
        .should('have.value', 'US');
      cy.getInput('zipcode')
        .type('12345')
        .should('have.value', '12345');
      cy.getInput('country-code')
        .type('1')
        .should('have.value', '1');
      cy.getInput('phone-number')
        .type('1231231234')
        .should('have.value', '(123) 123-1234');
      
      cy.get('[data-cy=continue-to-payment]').click();

      getIframeBody().should('not.be.undefined');
    });

    it('should be able to go back to billing and then continue back to the credit card info', () => {
      cy.get('[data-cy=back-to-billing]').click();

      cy.getInput('holder-name')
        .should('have.value', 'Bobo Obob');

      cy.get('[data-cy=continue-to-payment]').click();
    })

    it('should not be able to make the payment with invalid credit card details', () => {
      cy.get('[data-cy=make-payment]').click();
      cy.get('[data-cy=pay-now').should('not.exist');
    })

    it('should be able to make the payment with valid credit card details', () => {
      getIframeBody()
        .find('#text-input-cc-number')
        .type('4003830171874018');
      getIframeBody()
        .find('#text-input-expiration-month')
        .type('12');
      getIframeBody()
        .find('#text-input-expiration-year')
        .type('30');
      getIframeBody()
        .find('#text-input-cvv-number')
        .type('123');
      cy.get('[data-cy=make-payment]').click();
      cy.get('[data-cy=pay-now').click();
      cy.get('[data-cy=payment-success-message]').should('be.visible');
    });
  });
});
