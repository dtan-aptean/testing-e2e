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
import './commands';
import './paginationCommands';
import './storefrontCommands';
import './setupCommands';
import './queryTests';
import 'cypress-mochawesome-reporter/register';

/**
 * Runs before all tests to decide whether or not to delete items after a test file runs
 * Cypress best practice is to reset an ENV beforehand, and leave created items for devs to examine if tests fail
 * However, we don't want to leave created items behind in certain ENVs, so we check the ENV to see if we should delete afterwards or not
 * This can also be configured by including "deleteItemsAfter" in the env object in cypress.json and setting it to true or false.
 */
before(() => {
  var deleteConfig = Cypress.env("deleteItemsAfter");
  if (typeof deleteConfig !== "boolean") {
    var url = Cypress.config("baseUrl");
    if (url.includes("prf")) {
      Cypress.env("deleteItemsAfter", true);
      Cypress.log({displayName: "Index.ts", message: "Delete created items after the tests"});
    } else {
      Cypress.env("deleteItemsAfter", false);
      Cypress.log({displayName: "Index.ts", message: "Preserve created items after the tests"});
    }
  }
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
