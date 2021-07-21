/// <reference types="cypress" />

describe("All Payments Table", function () {
  context("All payments table", () => {
    let globalReferenceNumber = "";
    let globalPaymentId = "";
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });

    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
      cy.waitAfterLogIn(0, 5);
      // navigate to help center screen
      cy.get("[data-cy=payment-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);
      cy.get("[data-cy=payments-table-body]").find("tr").eq(0).as("firstRow");
    });

    it("Creating a payment should add the new payment row in table", () => {
      cy.createAndPay(1, "10.00", "payment").then((resp) => {
        globalReferenceNumber = resp[0].toString();
        cy.wait(5000);
        cy.waitAfterLogIn(0, 5);

        //opening paymentRequest modal and storing payment id last 9 digits
        cy.get("[data-cy=payment-requests-tab]").click();
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .click({ force: true });
        cy.get("[data-cy=view-details]").click({ force: true });
        cy.get("[data-cy=payment-history-id]")
          .should("exist")
          .first()
          .then(($el) => {
            globalPaymentId = $el.text();
            cy.get("[data-cy=pr-details-close]").click({ force: true });

            cy.wait(35000);
            cy.get("[data-cy=payment-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(5000);

            //checking if status is still pending and then waiting accordingly
            cy.get("body").then(($body) => {
              if (
                $body
                  .find("[data-cy=payments-table-body]")
                  .find(`tr:contains(${globalPaymentId})`)
                  .first()
                  .find("td:contains(Pending)").length
              ) {
                cy.wait(35000);
                cy.get("[data-cy=refresh]").click();
                cy.wait(5000);
              }
            });

            if (globalPaymentId && globalPaymentId.length > 0) {
              //fetching via payment id
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .should("contain", "Completed");

              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(4)
                .should("contain", "10.00");
            } else {
              // incase payment id isn't fetched
              cy.get("@firstRow")
                .find("td")
                .eq(2)
                .should("contain", "Completed");
              cy.get("@firstRow").find("td").eq(4).should("contain", "10.00");
            }
          });
      });
    });

    it("Selecting completed payment should enable view details and refund button", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }

      cy.get("[data-cy=view-details]")
        .should("be.visible")
        .should("be.enabled");
      cy.get("[data-cy=refund]").should("be.visible").should("be.enabled");
    });

    it("should be able to open and close the info modal", () => {
      //using view details button
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-close]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");

      //using payment id hyperlink
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .get("td")
          .eq(1)
          .within(() => {
            cy.get('a[href="#"]').click({ force: true });
          });
      } else {
        cy.get("@firstRow")
          .get("td")
          .eq(1)
          .within(() => {
            cy.get('a[href="#"]').click({ force: true });
          });
      }

      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-close]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
    });

    it("should be able to open and close the refund modal", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=refund-modal-close]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
    });

    it("should be able to open refund modal from payment details modal", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
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
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-id-copy")
        .should("be.visible")
        .should("be.enabled");
    });

    it("should be able to open payment request details modal from the payment request link in payment details modal", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
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
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
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
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }

      cy.get("[data-cy=refund]").should("be.enabled").click();
      cy.get("[data-cy=refund-dialog-title]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=refund-reason]").find("input").type("test");
      cy.get("[data-cy=process-refund]").click();
      cy.wait(5000);
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
      cy.get("[data-cy=refund]").should("be.disabled");
    });

    it("Fully refunded payment should not have refund button in payment details modal", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }
      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-refund]").should("not.exist");
    });

    it("Payment refund status should work as expected", () => {
      //creating the payment
      cy.createAndPay(1, "10.00", "payment").then((resp) => {
        globalReferenceNumber = resp[0].toString();

        cy.wait(7000);
        cy.waitAfterLogIn(0, 5);

        cy.get("[data-cy=payment-requests-tab]").click();
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .click({ force: true });
        cy.get("[data-cy=view-details]").click({ force: true });
        cy.get("[data-cy=payment-history-id]")
          .should("exist")
          .first()
          .then(($el) => {
            globalPaymentId = $el.text();
            cy.get("[data-cy=pr-details-close]").click({ force: true });

            cy.wait(35000);
            cy.get("[data-cy=payment-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(5000);

            //checking if status is still pending and then waiting accordingly
            cy.get("body").then(($body) => {
              if (
                $body
                  .find("[data-cy=payments-table-body]")
                  .find(`tr:contains(${globalReferenceNumber})`)
                  .first()
                  .find("td:contains(Pending)").length
              ) {
                cy.wait(35000);
                cy.get("[data-cy=refresh]").click();
                cy.wait(5000);
              }
            });

            //making partial refund
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .click({ force: true });
            } else {
              cy.get("@firstRow").click();
            }
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
            cy.wait(5000);
            cy.get("body").then(($body) => {
              if (
                $body
                  .find("[data-cy=payments-table-body]")
                  .find(`tr:contains(${globalPaymentId})`)
                  .first()
                  .find("td:contains(Partially Refunded)").length < 1
              ) {
                cy.get("[data-cy=payments-table-body]")
                  .get(`tr:contains(${globalPaymentId})`)
                  .first()
                  .find("td")
                  .eq(2)
                  .contains("Refund Pending");
                cy.wait(90000);
              }
            });
            cy.get("[data-cy=refresh]").click();
            cy.wait(7000);
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .contains("Partially Refunded");
            } else {
              cy.get("@firstRow")
                .find("td")
                .eq(2)
                .contains("Partially Refunded");
            }

            //making remaining amount refund
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .click({ force: true });
            } else {
              cy.get("@firstRow").click();
            }
            cy.get("[data-cy=refund]").should("be.enabled").click();
            cy.get("[data-cy=refund-dialog-title]")
              .should("exist")
              .should("be.visible");
            cy.get("[data-cy=refund-reason]").find("input").type("test");
            cy.get("[data-cy=process-refund]").click();
            cy.wait(5000);
            cy.get("[data-cy=refund-dialog-title]").should("not.exist");

            //checking the status for fully refunded
            cy.wait(5000);
            cy.get("body").then(($body) => {
              if (
                $body
                  .find("[data-cy=payments-table-body]")
                  .find(`tr:contains(${globalPaymentId})`)
                  .first()
                  .find("td:contains(Fully Refunded)").length < 1
              ) {
                cy.get("[data-cy=payments-table-body]")
                  .get(`tr:contains(${globalPaymentId})`)
                  .first()
                  .find("td")
                  .eq(2)
                  .contains("Refund Pending");
                cy.wait(90000);
              }
            });
            cy.get("[data-cy=refresh]").click();
            cy.wait(7000);
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .contains("Fully Refunded");
            } else {
              cy.get("@firstRow").find("td").eq(2).contains("Fully Refunded");
            }
          });
      });
    });

    it("Failed payment should not have refund option", () => {
      cy.createAndPay(1, "6.61", "payment").then((resp) => {
        globalReferenceNumber = resp[0].toString();

        cy.wait(7000);
        cy.waitAfterLogIn(0, 5);

        cy.get("[data-cy=payment-requests-tab]").click();
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .click({ force: true });
        cy.get("[data-cy=view-details]").click({ force: true });
        cy.get("[data-cy=payment-history-id]")
          .should("exist")
          .first()
          .then(($el) => {
            globalPaymentId = $el.text();
            cy.get("[data-cy=pr-details-close]").click({ force: true });

            cy.get("[data-cy=payment-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(7000);
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .should("contain", "Failed");
            } else {
              cy.get("@firstRow").find("td").eq(2).should("contain", "Failed");
            }

            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .click({ force: true });
            } else {
              cy.get("@firstRow").click();
            }

            cy.get("[data-cy=refund]").should("be.disabled");
          });
      });
    });

    it("Failed payment should not have refund button in payment details modal", () => {
      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .get(`tr:contains(${globalPaymentId})`)
          .first()
          .click({ force: true });
      } else {
        cy.get("@firstRow").click();
      }

      cy.get("[data-cy=view-details]").should("be.enabled").click();
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=payment-details-refund]").should("not.exist");
    });

    it("Consolidated payment should have invoices section", () => {
      cy.createAndPay(2, "10.00", "payment", 1, 2).then((resp) => {
        globalReferenceNumber = resp[0].toString();

        cy.wait(7000);
        cy.waitAfterLogIn(0, 5);

        cy.get("[data-cy=payment-requests-tab]").click();
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .click({ force: true });
        cy.get("[data-cy=view-details]").click({ force: true });
        cy.get("[data-cy=payment-history-id]")
          .should("exist")
          .first()
          .then(($el) => {
            globalPaymentId = $el.text();
            cy.get("[data-cy=pr-details-close]").click({ force: true });

            cy.wait(35000);
            cy.get("[data-cy=payment-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(5000);

            //checking if status is still pending and then waiting accordingly
            cy.get("body").then(($body) => {
              if (
                $body
                  .find("[data-cy=payments-table-body]")
                  .find(`tr:contains(${globalPaymentId})`)
                  .first()
                  .eq(0)
                  .find("td:contains(Pending)").length
              ) {
                cy.wait(35000);
                cy.get("[data-cy=refresh]").click();
                cy.wait(5000);
              }
            });

            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .get(`tr:contains(${globalPaymentId})`)
                .first()
                .click({ force: true });
            } else {
              cy.get("@firstRow").click();
            }

            cy.get("[data-cy=view-details]").should("be.enabled").click();
            cy.get("[data-cy=payment-details-modal]")
              .should("exist")
              .should("be.visible");

            cy.get("[data-cy=payment-details-modal]")
              .parent()
              .within(() => {
                cy.get('a[href="#"]').should("have.length.above", 1);
              });

            cy.get("[data-cy=request-refund]").should("have.length.above", 1);

            //clicking refund button should open the refund modal
            cy.get("[data-cy=request-refund]").first().click({ force: true });
            cy.get('[data-cy="refund-dialog-title"]')
              .should("exist")
              .and("be.visible");
            cy.get("[data-cy=cancel-refund]").click({ force: true });

            //opening request modal from invoices section
            cy.get("[data-cy=view-details]").should("be.enabled").click();
            cy.get("[data-cy=payment-details-modal]")
              .should("exist")
              .should("be.visible");

            cy.get("[data-cy=payment-details-modal]")
              .parent()
              .within(() => {
                cy.get('a[href="#"]').first().click({ force: true });
              });

            cy.get("[data-cy=payment-request-details-modal]")
              .should("exist")
              .and("be.visible");
            cy.get("[data-cy=pr-details-close]").click({ force: true });
          });
      });
    });
  });
});
