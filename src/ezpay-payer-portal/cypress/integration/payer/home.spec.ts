/// <reference types="cypress" />

describe("Payer Portal - Logged in user", function () {
  let merchantIndex = 0;
  let merchantLength = 0;
  before(() => {
    cy.login();
    cy.wait(5000);
    cy.getMerchantIndex().then((resp) => {
      merchantIndex = resp.merchantIndex;
      merchantLength = resp.merchantLength;
    });
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
    });

    it("If merchant length greater than 1 the owed companies should show else table should show", () => {
      if (merchantLength === 1) {
        cy.get("[id=payment-requests-tab]").should("be.visible").click();
        cy.get("[data-cy=payments-due-list").should("be.visible");
      } else if (merchantLength > 1) {
        cy.get("h6:contains(Balance Due)").should("have.length.above", 1);
      }
    });

    it("shows the payments due list", () => {
      if (merchantLength > 1) {
        cy.get("h6:contains(Balance Due)")
          .eq(merchantIndex)
          .parent()
          .parent()
          .within(() => {
            cy.get("button").click({ force: true });
          });
        cy.wait(5000);
      }
      cy.get("[id=payment-requests-tab]").should("be.visible").click();
      cy.get("[data-cy=payments-due-list").should("be.visible");
    });

    it("clicks on the recent transactions tab and shows the recent transactions list", () => {
      if (merchantLength > 1) {
        cy.get("h6:contains(Balance Due)")
          .eq(merchantIndex)
          .parent()
          .parent()
          .within(() => {
            cy.get("button").click({ force: true });
          });
        cy.wait(5000);
      }
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list").should("be.visible");
    });
  });
});
