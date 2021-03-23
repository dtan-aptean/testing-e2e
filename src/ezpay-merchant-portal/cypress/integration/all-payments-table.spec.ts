/// <reference types="cypress" />

describe("All Payments Table", function () {
  context("All payments table", () => {
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });

    beforeEach(() => {
      cy.visit("/");
      cy.wait(4000);
      // navigate to help center screen
      cy.get("[data-cy=payment-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      cy.get("[data-cy=payments-table-body]").find("tr").eq(0).as("firstRow");
    });

    it("Creating a payment should add the new payment row in table", () => {
      cy.createAndPay(1, "10.00", "payment");
      cy.wait(35000);
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);

      //checking if status is still pending and then waiting accordingly
      cy.get("body").then(($body) => {
        if (
          $body
            .find("[data-cy=payments-table-body]")
            .find("tr")
            .eq(0)
            .find("td:contains(Pending)").length
        ) {
          cy.wait(35000);
          cy.get("[data-cy=refresh]").click();
          cy.wait(3000);
        }
      });

      cy.get("@firstRow").find("td").eq(2).should("contain", "Completed");
      cy.get("@firstRow").find("td").eq(4).should("contain", "10.00");
    });

    it("Selecting completed payment should enable view details and refund button", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]")
        .should("be.visible")
        .should("be.enabled");
      cy.get("[data-cy=refund]").should("be.visible").should("be.enabled");
    });

    it("should be able to open and close the info modal", () => {
      //using view details button
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-close]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");

      //using payment id hyperlink
      cy.get("@firstRow")
        .get("td")
        .eq(1)
        .within(() => {
          cy.get('a[href="#"]').click({ force: true });
        });
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-close]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
    });

    it("should be able to open and close the refund modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=refund-modal-close]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
    });

    it("should be able to open refund modal from payment details modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-refund]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
    });

    it("Copy button in payment details modal should be enabled", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-id-copy")
        .should("be.visible")
        .should("be.enabled");
    });

    it("should be able to open payment request details modal from the payment request link in payment details modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get('a[href="#"]').last().click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
      cy.get("[data-cy=payment-request-details-modal]")
        .should("exist")
        .should("be.visible");
    });

    it("should be able to open payment details modal from payment link in refund modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get('a[href="#"]').last().click();
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
    });

    it("Fully refunded payment should not have refund option", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=refund-reason]").find("input").type("test");
      cy.get("[data-cy=process-refund]").click();
      cy.wait(5000);
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.disabled");
    });

    it("Fully refunded payment should not have refund button in payment details modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-refund]").should("not.exist");
    });

    it("Payment refund status should work as expected", () => {
      //creating the payment
      cy.createAndPay(1, "10.00", "payment");
      cy.wait(35000);
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);

      //checking if status is still pending and then waiting accordingly
      cy.get("body").then(($body) => {
        if (
          $body
            .find("[data-cy=payments-table-body]")
            .find("tr")
            .eq(0)
            .find("td:contains(Pending)").length
        ) {
          cy.wait(35000);
          cy.get("[data-cy=refresh]").click();
          cy.wait(3000);
        }
      });

      //making partial refund
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");

      cy.get("[data-cy=partial-refund]").find("input").check();
      cy.get("[data-cy=refund-amount]").find("input").clear();
      cy.get("[data-cy=refund-amount]").find("input").type("5");
      cy.get("[data-cy=refund-reason]").find("input").type("test");
      cy.get("[data-cy=process-refund]").click();
      cy.wait(5000);
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");

      //checking the status for partially refunded
      cy.get("@firstRow").find("td").eq(2).contains("Refund Pending");
      cy.wait(90000);
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      cy.get("@firstRow").find("td").eq(2).contains("Partially Refunded");

      //making remaining amount refund
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=refund-reason]").find("input").type("test");
      cy.get("[data-cy=process-refund]").click();
      cy.wait(5000);
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");

      //checking the status for fully refunded
      cy.get("@firstRow").find("td").eq(2).contains("Refund Pending");
      cy.wait(90000);
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      cy.get("@firstRow").find("td").eq(2).contains("Fully Refunded");
    });

    //To be tested once the payment starts failing for magic number
    it.skip("Failed payment should not have refund option", () => {
      cy.createAndPay(1, "6.61", "payment");
      cy.wait(20000);
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      cy.get("@firstRow").find("td").eq(2).should("contain", "Failed");
      cy.get("@firstRow").click();
      cy.get("[data-cy=refund]").should("be.disabled");
    });

    it.skip("Failed payment should not have refund button in payment details modal", () => {
      cy.get("@firstRow").click();
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-refund]").should("not.exist");
    });
  });
});
