// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import 'cypress-file-upload';
import 'cypress-mochawesome-reporter/register';
import './commands';
import './setupCommands';
import './shippingCommands';

/**
 * These hooks will prepare the environment with required products and categories before the tests run
 * The before hook will delete any existing Cypress products and categories, then create new Cypress products and categories
 * After the tests run, the after hook will deleting the products and categories created by the before hook
 * 
 * doNotPrepEnv and doNotClearEnv are configs for when one is writing tests
 * After the environment is prepped the first time, set doNotPrepEnv to true in cypress.json to prevent the environment from being cleaned and prepared again.
 * Similarly, set doNotClearEnv to true in cypress.json if you don't want the categories and products to be cleared after the tests
 */

before(() => {
    if (!Cypress.config("doNotPrepEnv")) {
        Cypress.log({displayName: "Index.ts", message: "Preparing enviornment"});
        cy.prepareEnvironment();
    } else if (!Cypress.env("userDetails")) {
        // User details contains user first/last name and company, retrieved from public store account details
        // Used for several different tests that work with checkout
        cy.fetchUserDetails();
    }
});

if (!Cypress.config("doNotResetEnv")) {
    after(() => {
        Cypress.log({displayName: "Index.ts", message: "Resetting enviornment"});
        cy.revertEnvironment();
    });
}
// Alternatively you can use CommonJS syntax:
// require('./commands')
