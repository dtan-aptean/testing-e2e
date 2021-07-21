/// <reference types="cypress" />

describe("Merchant portal", function () {
  before(() => {
    sessionStorage.clear();
    cy.login();
  });

  context("Monthly Statements", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
      cy.waitAfterLogIn(0, 5);
    });

    it("can open and close download statement dialog when recent statement is clicked", () => {
      //opening the dialog
      cy.get("[data-cy=last-three-months]").find("a").first().click();
      cy.get('[type="radio"]').should("exist");

      //closing the dialog
      cy.get("button").contains("CANCEL").should("be.visible").click();
      cy.get('[type="radio"]').should("not.exist");
    });

    it("selecting different download option should download respective statement extension", () => {
      //opening the dialog
      cy.get("[data-cy=last-three-months]").find("a").first().click();
      cy.get('[type="radio"]').should("exist");

      cy.get("body").then(($body) => {
        if ($body.find("span:contains(Download as CSV)").length) {
          //selecting download as csv
          cy.get('[type="radio"]').first().check();
          cy.get("a")
            .parent()
            .contains("DOWNLOAD")
            .should("have.attr", "href")
            .and("include", ".csv")
            .then((href) => {
              cy.request("GET", href).then((response) => {
                cy.expect(response.status).to.eq(200);
              });
            });
        }

        if ($body.find("span:contains(Download as PDF)").length) {
          //selecting download as pdf
          cy.get('[type="radio"]').last().check();
          cy.get("a")
            .parent()
            .contains("DOWNLOAD")
            .should("have.attr", "href")
            .and("include", ".pdf")
            .then((href) => {
              cy.request("GET", href).then((response) => {
                cy.expect(response.status).to.eq(200);
              });
            });
        }
      });

      //closing the dialog
      cy.get("button").contains("CANCEL").should("be.visible").click();
      cy.get('[type="radio"]').should("not.exist");
    });

    it("can view all statements", () => {
      cy.get("[data-cy=view-all-statements")
        .should("be.visible")
        .and("be.enabled")
        .click();

      cy.get("[data-cy=monthly-statement-dialog]").should("be.visible");
    });

    it("can expand a year and month and download monthly statements with appropriate extension", () => {
      cy.get("[data-cy=view-all-statements").click();

      cy.get("[data-cy=year-list")
        .should("be.visible")
        .find("svg")
        .first()
        .click();

      cy.get("[data-cy=year-list").find("svg").eq(1).click();
      cy.get('[type="radio"]').should("exist");

      cy.get("body").then(($body) => {
        if ($body.find("span:contains(Download as CSV)").length) {
          //selecting download as csv
          cy.get('[type="radio"]').first().check({ force: true });
          cy.get("a")
            .parent()
            .contains("DOWNLOAD")
            .should("have.attr", "href")
            .and("include", ".csv")
            .then((href) => {
              cy.request("GET", href).then((response) => {
                cy.expect(response.status).to.eq(200);
              });
            });
        }

        if ($body.find("span:contains(Download as PDF)").length) {
          //selecting download as pdf
          cy.get('[type="radio"]').last().check({ force: true });
          cy.get("a")
            .parent()
            .contains("DOWNLOAD")
            .should("have.attr", "href")
            .and("include", ".pdf")
            .then((href) => {
              cy.request("GET", href).then((response) => {
                cy.expect(response.status).to.eq(200);
              });
            });
        }
      });
    });

    it("can close the statement dialog and go back to viewing the home page", () => {
      cy.get("[data-cy=view-all-statements").click();

      cy.get("[data-cy=close-monthly-statement-dialog")
        .should("be.visible")
        .and("be.enabled")
        .click();

      cy.get("[data-cy=monthly-statement-dialog]").should("not.exist");
    });
  });
});
