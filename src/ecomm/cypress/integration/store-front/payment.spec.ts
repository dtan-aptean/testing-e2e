/// <reference types="cypress"/>

describe('Ecommerce Portal', function() {
    context('PublicStore', () => {
        before(() => {
        })

        beforeEach(() => {
            cy.visit('/');
            cy.fixture('payment.json').then((data) => {
                this.PaymentFixture = data;
            });
        })

        it('GuestSubmitsOrder', () => {  
            const cardProfile = this.PaymentFixture.cardProfiles[0];
            const guestProfile = this.PaymentFixture.guestProfile;

            cy.get(':nth-child(1) > .product-item > .details > .add-info > .buttons > .product-box-add-to-cart-button')
                .click();
            cy.get('#add-to-cart-button-1')
                .click();

            cy.fromPublicStore_QuickCheckout();

            cy.get('.checkout-as-guest-button')
              .click();

            cy.fromCheckoutAsGuest_FillForm(guestProfile);

            cy.get('#billing-buttons-container > .button-1')
                .click();
            cy.get('#shipping-method-buttons-container > .button-1')
                .click();
                
            cy.get('#payment-container')
                .should('be.visible');

            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-cc-number')
                .type(cardProfile.creditCard);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-expiration-month')
                .type(cardProfile.expirationMonth);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-expiration-year')
                .type(cardProfile.expirationYear);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-cvv-number')
                .type(cardProfile.cvv);

            cy.get('#submit-credit-card-button')
                .click()

            cy.wait(2000)

            cy.get('#payment-info-buttons-container > .button-1')
                .click()

            cy.get('#confirm-order-buttons-container > .button-1')
                .click()

            cy.get('.details-link > a')
                .click()
        })
    })
})