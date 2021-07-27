/// <reference types="cypress" />

describe("Payer Portal - Recent Payments Table", function () {
  let merchantIndex = 0;
  let merchantLength = 0;
  let consolidated = false;
  let partial = false;
  before(() => {
    cy.login();
    cy.waitForRootPageLoading(1);
    cy.getMerchantIndex().then((resp) => {
      merchantIndex = resp.merchantIndex;
      merchantLength = resp.merchantLength;
      consolidated = resp.consolidatedPayment;
      partial = resp.partialPayment;
    });
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
      if (merchantLength > 0) {
        cy.get("h6:contains(Balance Due)")
          .eq(merchantIndex)
          .parent()
          .parent()
          .within(() => {
            cy.get("button").click({ force: true });
          });
        cy.waitForRequestLoading(1);
      }
    });

    it("clicks on the recent transactions tab and shows the recent transactions list", () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
    });

    it("Creating and paying the payment request add the data in recent payments table", () => {
      cy.createPaymentRequest(1000).then((response) => {
        // Creating the recent payment
        cy.makePayment(merchantIndex, merchantLength, consolidated, partial, 1);
        if (merchantLength > 0) {
          cy.get("h6:contains(Balance Due)")
            .eq(merchantIndex)
            .parent()
            .parent()
            .within(() => {
              cy.get("button").click({ force: true });
            });
          cy.waitForRequestLoading(1);
        }
        cy.get("[id=disputes-tab]").should("be.visible").click();
        cy.get("[data-cy=recent-transactions-list]").should("be.visible");
        cy.wait(3000);
        //confirming the payment is being created
        cy.get("table")
          .find(`tr:contains(${response.referenceNumber})`)
          .should("exist");
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
        .eq(0)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=recent-payment-details-modal]")
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
        .eq(0)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=recent-payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //closes the payment details dialog
      cy.get("[data-cy=recent-payment-details-close]")
        .should("be.visible")
        .should("be.enabled")
        .click();
      cy.get("[data-cy=recent-payment-details-modal]").should("not.exist");
    });

    it('should have a working "Download Invoice" link', () => {
      cy.get("[id=disputes-tab]").should("be.visible").click();
      cy.get("[data-cy=recent-transactions-list]").should("be.visible");
      cy.wait(5000);

      //checking in table
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() =>
          cy
            .get("a")
            .should("have.attr", "href")
            .then((href) => {
              cy.request("GET", href).then((response) => {
                cy.expect(response.status).to.eq(200);
              });
            })
        );

      //checking in modal
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(0)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=recent-payment-details-modal]")
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
        .eq(0)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=recent-payment-details-modal]")
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
        .eq(0)
        .within(() => cy.get('a[href="#"]').click());
      //contains payment history
      cy.get("[data-cy=recent-payment-details-modal]").then(($modal) => {
        if ($modal.find('div:contains("Completed")').length) {
          cy.get("[data-cy=recent-payment-details-modal]")
            .should("exist")
            .should("be.visible")
            .should("contain", "Payment History");
        }
      });
    });
  });
});
