/// <reference types="cypress" />

describe("Merchant Portal", function () {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  });

  context("Help Center", () => {
    beforeEach(() => {
      cy.visit("/");
      // navigate to help center screen
      cy.get("[data-cy=user-settings]").click();
      cy.get("[data-cy=help]").click();
    });

    it("should pass if displaying the product name or unknown", () => {
      // Ensuring the product name is displaying, or at least unknown
      cy.get("[data-cy=product-name]").should("be.visible");
    });
  });
});
