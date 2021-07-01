/// <reference types="cypress" />

describe("Payer Portal - Logged in user", function () {
  before(() => {
    cy.login();
    cy.waitForRootPageLoading(1);
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("routes to root when clicking on the home logo", () => {
      cy.get("[data-cy=home-logo]").should("be.visible").click();

      cy.location().should((loc) => {
        expect(loc.pathname).to.eq("/");
      });
    });

    it("selecting aspecific merchant takes to payments route", () => {
      cy.wait(10000);
      cy.getMerchantIndex().then((resp) => {
        if (resp.merchantLength > 0) {
          cy.get("h6:contains(Balance Due)")
            .eq(resp.merchantIndex)
            .parent()
            .parent()
            .within(() => {
              cy.get("button").click({ force: true });
            });
          cy.wait(5000);
        }

        //checking for route
        cy.location().should((loc) => {
          expect(loc.pathname).to.eq("/payments");
        });
      });
    });
  });
});
