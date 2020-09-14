/// <reference types="cypress"/>

import { should } from "chai";

describe('Ecommerce Portal', function() {
    context('PublicStore', () => {
        before(() => {
            cy.fixture('aptean-pay-plugin').then((data) => {
                this.PaymentFixture = data;
            });
        })

        beforeEach(() => {            
            cy.visit('/');
        })

        it('GuestSubmitsOrder', () => {  
            const cardProfile = this.PaymentFixture.cardProfiles[0];
            const guestProfile = this.PaymentFixture.guestProfile;

            cy.log("Add items to cart");
            cy.get(':nth-child(1) > .product-item > .details > .add-info > .buttons > .product-box-add-to-cart-button')
                .should('be.visible')
                .click();
            cy.get('#add-to-cart-button-1')
                .should('be.visible')
                .click();

            cy.log("Checkout as guest");
            cy.fromPublicStore_QuickCheckout();
            cy.get('.checkout-as-guest-button')
                .should('be.visible')
                .click();

            cy.log("Complete checkout form");
            cy.fromCheckoutAsGuest_FillForm(guestProfile);

            cy.get('#billing-buttons-container > .button-1')
                .should('be.visible')
                .click();
            cy.get('#shipping-method-buttons-container > .button-1')
                .should('be.visible')
                .click();

            cy.log("Submit payment details");
            cy.get('#payment-container')
                .should('be.visible');
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-cc-number')
                .type(cardProfile.creditCardNumber)
                .should('have.value', cardProfile.creditCardFormattedNumber);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-expiration-month')
                .type(cardProfile.expirationMonth)
                .should('have.value', cardProfile.expirationMonth);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-expiration-year')
                .type(cardProfile.expirationYear)
                .should('have.value', cardProfile.expirationYear);
            cy.getIframeBody('#credit-card-iframe_iframe')
                .find('#text-input-cvv-number')
                .type(cardProfile.cvv)
                .should('have.value', cardProfile.cvv);

            cy.get('#submit-credit-card-button')
                .should('be.visible')
                .click();

            cy.log("Ensure payment submitted successfully");
            cy.wait(2000)
                .get('#payment-success')
                .should('contain.text', 'Your payment has been successfully processed!');

            cy.get('#payment-info-buttons-container > .button-1')
                .should('be.visible')
                .click();

            cy.get('#confirm-order-buttons-container > .button-1')
                .should('be.visible')
                .click();

            cy.log("Ensure order submitted successfully");
            cy.get('.section > .title > strong')
                .should('contain.text', 'Your order has been successfully processed!');
            cy.get('.details-link > a')
                .should('be.visible')
                .click();
            cy.get('.order-number > strong')
                .should('contain.text', 'Order #');

        })
    })
})