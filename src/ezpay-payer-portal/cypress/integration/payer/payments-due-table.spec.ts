/// <reference types="cypress" />

describe("Payer Portal - Payments Due Table", function () {
  before(() => {
    cy.login();
    cy.wait(5000);
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
    });

    it("shows the payments due list", () => {
      cy.get("[id=payment-requests-tab]").should("be.visible").click();
      cy.get("[data-cy=payments-due-list").should("be.visible");
    });

    it("Creating the payment request add the data in recent payments table", () => {
      cy.createPaymentRequest(661).then((response) => {
        cy.visit("/");
        cy.wait(5000);
        cy.get("[data-cy=payments-due-list").should("be.visible");
        cy.wait(3000);
        //confirming the payment request has been created
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(1)
          .should("contain", response.referenceNumber);
      });
    });

    it("Clicks on the refrence link and it opens payment details modal", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
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
      cy.get("[data-cy=payments-due-list").should("be.visible");
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
      cy.get("[data-cy=payments-due-list").should("be.visible");
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

    it("Payment deatils dialog should have make payment button", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
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

      //make payment button should be visible and enabled
      cy.get("[data-cy=make-payment]")
        .should("be.visible")
        .should("be.enabled")
        .should("contain", "MAKE PAYMENT");
    });

    it("Unpaid Payment deatils dialog should not contain payment history", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
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
        .should("not.contain", "Payment History");
    });

    it("Failed Payment should have status as failed and button as retry payment", () => {
      cy.makePayment();
      cy.visit("/");
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(10000);
      //checking status as failed
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(3)
        .should("contain", "Failed");
      //checking button as retry payment
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(5)
        .find("button")
        .should("contain", "RETRY PAYMENT");
    });

    it("Failed Payment deatils dialog should contain payment history", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
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

    it("Failed payment deatils dialog should have retry payment button", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
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

      //retry payment button should be visible and enabled
      cy.get("[data-cy=make-payment]")
        .should("be.visible")
        .should("be.enabled")
        .should("contain", "RETRY PAYMENT");
    });
  });
});
