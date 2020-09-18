/// <reference types="cypress" />

describe("Ecommerce", function () {
  context("Language Functionality", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });
  });
});
