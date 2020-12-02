/// <reference types="cypress" />

import { find } from "cypress/types/lodash";

describe('Payer Portal - Payment Methods', () => {
    before(() => {
        cy.login();
        cy.wait(5000);
      });
    
    context('Logged in', () => {
        beforeEach(() => {
            cy.visit('/');
        });
        it('can add a payment method', () => {
            cy.get('[data-cy=add-payment-method]').click();
            cy.get('[data-cy=payment-method-add]').should('be.visible');
            cy.get('[data-cy=use-default-billing]').click({force: true});
            cy.get('[data-cy=holder-name]').type('Test User');
            cy.get('[data-cy=email]').type('testuser@testusers.com');
            cy.get('[data-cy=street-address]').type('4324 somewhere st');
            cy.get('[data-cy=country]').find('select').select('US');
            cy.get('[data-cy=zipcode]').type('30022');
            cy.get('[data-cy=country-code]').type('1');
            cy.get('[data-cy=phone-number]').type('6784324574');
            cy.get('[data-cy=continue-to-payment]').should('be.enabled').click();

            cy.get('[data-cy=use-bank-account]').click();
            cy.get('[data-cy=select-account-type]').find('select').select('checking');
            cy.get('[data-cy=payment-routing]').type('021000021');
            cy.get('[data-cy=payment-account]').type('12345');

            cy.get('[data-cy=continue-to-payment]').should('be.enabled');
        });
        it('can set a payment method to default', () => {
            cy.get('[data-cy=add-payment-method]').click();
            cy.get('[data-cy=payment-method-add]').should('be.visible');
            cy.get('[data-cy=use-default-billing]').click({force: true});
            cy.get('[data-cy=holder-name]').type('Test User');
            cy.get('[data-cy=email]').type('testuser@testusers.com');
            cy.get('[data-cy=street-address]').type('4324 somewhere st');
            cy.get('[data-cy=country]').find('select').select('US');
            cy.get('[data-cy=zipcode]').type('30022');
            cy.get('[data-cy=country-code]').type('1');
            cy.get('[data-cy=phone-number]').type('6784324574');
            cy.get('[data-cy=continue-to-payment]').should('be.enabled').click();

            cy.get('[data-cy=use-bank-account]').click();
            cy.get('[data-cy=select-account-type]').find('select').select('checking');
            cy.get('[data-cy=payment-routing]').type('021000021');
            cy.get('[data-cy=payment-account]').type('12345');

            cy.get('[data-cy=make-payment-default]').find('input').check();

            cy.get('[data-cy=continue-to-payment]').should('be.enabled').click();
            cy.wait(15000);
            cy.get('body').contains('Bank account ending in 2345');
        });
        it('can use the default billing information when adding a new payment method', () => {
            cy.get('[data-cy=add-payment-method]').click();
            cy.get('[data-cy=payment-method-add]').should('be.visible');
            cy.get('[data-cy=use-default-billing]').find('input').should('be.checked');
        });
        it ('can delete an existing payment method', () => {
            cy.get('[data-cy=delete-default-payment]').click();
            cy.get('[data-cy=delete]').click();
            cy.wait(5000);
            cy.get('body').contains('No Default Payment Method Set');
        });
    });
});