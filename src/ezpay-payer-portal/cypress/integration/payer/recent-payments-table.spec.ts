/// <reference types="cypress" />

describe("Payer Portal - Recent Payments Table", function () {
  before(() => {
    cy.login();
    cy.wait(5000);
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
    });

    it("clicks on the recent transactions tab and shows the recent transactions list", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
    });

    it("Creating and paying the payment request add the data in recent payments table", () => {
      cy.createPaymentRequest(1000).then((response) => {
        // Creating the recent payment
        cy.makePayment();
        cy.get("[id=disputes-tab]").should("be.visible").click();
        cy.get("[data-cy=recent-transactions-list]").should("be.visible");
        cy.wait(3000);
        //confirming the payment is being created
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(1)
          .should("contain", response.referenceNumber);
      });
    });

    it("Clicks on the refrence link and it opens payment details modal", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
    });

    it("Close button closes the payment details modal", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //closes the payment details dialog
      cy.get("[data-cy=payment-details-close]")
        .should("be.visible")
        .should("be.enabled")
        .click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
    });

    it('should have a working "Download Invoice" link', () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //checks the download invoice link
      cy.get("[data-cy=download-invoice]")
        .should("have.attr", "href")
        .then((href) => {
          cy.request("GET", href).then((response) => {
            cy.expect(response.status).to.eq(200);
          });
        });
    });

    it("Payment deatils dialog should not have make/retry payment button", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //make/retry payment button should not exist
      cy.get("[data-cy=make-payment]").should("not.exist");
    });

    it("Payment deatils dialog should contain payment history", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      //contains payment history
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible")
        .should("contain", "Payment History");
    });
  });
});
