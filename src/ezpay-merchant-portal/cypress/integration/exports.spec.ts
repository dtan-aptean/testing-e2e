/// <reference types="cypress" />

describe("Merchant portal", function () {
    context("Exports", () => {
        before(() => {
          sessionStorage.clear();
          // navigate to home screen
          cy.login();
        });
        beforeEach(() => {
            // navigate to manage users screen
            cy.visit("/");
            cy.wait(5000);
            cy.waitAfterLogIn(0, 5);
        });
        it('should show the exports button', () => {
            cy.get("[data-cy=export-payments]").should('exist');
        });
        it('should open the exports dialog when pressing the export button', () => {
            cy.get("[data-cy=export-payments]").click();
            cy.contains('Download Payments').should('exist');
        });
        it('should show an error when inputting an invalid start date', () => {
            cy.get("[data-cy=export-payments]").click();
            cy.contains('Download Payments').should('exist');
            cy.getInput("start-date").type('2000-01-01').blur();
            cy.contains("Please enter a valid Date.").should('exist');
        });
        it('should show an error when inputting an invalid end date', () => {
            cy.get("[data-cy=export-payments]").click();
            cy.contains('Download Payments').should('exist');
            cy.getInput("end-date").type('2000-01-01').blur();
            cy.contains("Please enter a valid Date.").should('exist');
        });
    });
});