/// <reference types="cypress" />

describe("Payment Request Table", function () {
  context("Payment request table", () => {
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });

    beforeEach(() => {
      cy.visit("/");
      // navigate to help center screen
      cy.get("[data-cy=payment-requests-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.get("[data-cy=payment-request-table-body]")
        .invoke("children")
        .as("rows");
    });

    it("should pass if able to access the table row", () => {
      cy.get("@rows").then(($rows) => {
        if ($rows.length > 0) {
          // If there are already entries, just access the first one
          cy.get("@rows").eq(0).should("exist");
        } else {
          // If there are not entries, create a new one and make sure we can access it
          const amount = Cypress._.random(1, 1e3);
          const invoicePath = "sample.pdf";
          const referenceNumber = Cypress._.random(0, 1e9);
          cy.getInput("recipient-email").type("john.doe@aptean.com");
          cy.getInput("amount").type(amount);
          cy.getInput("reference-number").type(referenceNumber);
          cy.getInput("invoice").attachFile(invoicePath);
          cy.get("[data-cy=send-payment]").click();
          cy.wait(500);
          cy.get("[data-cy=refresh]").click();
          cy.wait(500);
          cy.get("[data-cy=payment-request-table-body]")
            .find("tr")
            .eq(0)
            .should("exist");
        }
      });
    });

    it("should pass if the details button shows when a row is selected", () => {
      cy.get("[data-cy=view-details]")
        .should("not.be.visible");
      cy.get("@rows").eq(0).as("firstRow").click();
      cy.get("[data-cy=view-details]")
        .scrollIntoView()
        .should("be.visible");
    });

    it("should be able to open and close the info modal", () => {
      cy.get("@rows").eq(0).as("firstRow").click(); //selecting a row should add action buttons to the payment request toolbar
      // Open the modal
      cy.get("[data-cy=view-details]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=view-details]").click({ force: true });
      // Close via the close button
      cy.get("[data-cy=payment-request-details-modal]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=pr-details-close]").should("exist");
      cy.get("[data-cy=pr-details-close]").click({ force: true });
      cy.get("[data-cy=payment-request-details-modal]").should("not.exist");
      // Open the modal again
      cy.get("@actionsCell").scrollIntoView().should("be.visible");
      cy.get("@firstRow").trigger("mouseover");
      cy.get("@actionsCell").within(() => {
        cy.get("[data-cy=view-payment-icon]")
          .scrollIntoView()
          .should("be.visible");
        cy.get("[data-cy=view-payment-icon]").click({ force: true });
      });
      // Now close via the backdrop
      cy.get("div.MuiDialog-root").find(".MuiBackdrop-root").should("exist");
      cy.get("div.MuiDialog-root")
        .find(".MuiBackdrop-root")
        .click({ force: true }); // Force the click because Cypress considers the backdrop not visible, and thus unclickable
      cy.get("[data-cy=payment-request-details-modal]").should("not.exist");
    });

    it("should pass if it can successfully send a reminder when unpaid, failed, or canceled, and when the reminder button is disabled otherwise", () => {
      cy.get("@rows").eq(0).as("firstRow");
      cy.get("@firstRow").find("td").eq(0).as("firstCell");
      cy.get("@firstCell").then(($first) => {
        const status = $first.text();
        cy.get("@firstRow").find("th").as("actionsCell");
        cy.get("@actionsCell").scrollIntoView().should("be.visible");
        cy.get("@firstRow").trigger("mouseover");
        cy.get("@actionsCell").within(() => {
          cy.get("[data-cy=view-payment-icon]")
            .scrollIntoView()
            .should("be.visible");
          cy.get("[data-cy=view-payment-icon]").click({ force: true });
        });
        cy.get("[data-cy=payment-request-details-modal]")
          .should("exist")
          .and("be.visible");
        if (
          status === "Unpaid" ||
          status === "Failed" ||
          status === "Canceled"
        ) {
          cy.get("[data-cy=pr-details-comm-table]").should("exist");
          cy.get("[data-cy=pr-details-comm-table]")
            .children()
            .then(($el) => {
              cy.get("[data-cy=pr-details-comm-table]")
                .children()
                .should("have.length.gte", 1);
              const originalLength = $el.length;
              cy.get("[data-cy=pr-details-remind]").click();
              cy.wait(500);
              cy.get("[data-cy=pr-details-comm-table]")
                .children()
                .should("have.length.greaterThan", originalLength);
            });
        } else {
          cy.get("[data-cy=pr-details-remind]").should("be.disabled");
        }
      });
    });

    it("should pass if the modal refund button is disabled for anything other than completed, partially refunded, or failed refunded", () => {
      cy.get("@rows").each(($el, index, $list) => {
        cy.wrap($el).find("td").eq(0).as("statusCell");
        cy.wrap($el).find("th").as("actionsCell");
        let status = undefined;
        cy.get("@statusCell").then(($cell) => {
          status = $cell.text();

          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.wrap($el).trigger("mouseover");
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-payment-icon]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-payment-icon]").click({ force: true });
          });
          cy.get("[data-cy=pr-details-refund]").should("exist");
          if (
            status === "Completed" ||
            status === "Partially Refunded" ||
            status === "Refund Failed"
          ) {
            cy.get("[data-cy=pr-details-refund]").should("not.be.disabled");
          } else {
            cy.get("[data-cy=pr-details-refund]").should("be.disabled");
          }
          cy.get("[data-cy=pr-details-close]").click({ force: true });
        });
      });
    });

    it("should pass if the refund button shows when hovering over a completed, partially refunded, or failed refunded row, and not show otherwise", () => {
      cy.get("@rows").each(($el, index, $list) => {
        cy.wrap($el).find("td").eq(0).as("statusCell");
        cy.wrap($el).find("th").as("actionsCell");
        let status = undefined;
        cy.get("@statusCell").then(($cell) => {
          status = $cell.text();

          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.wrap($el).trigger("mouseover");

          if (
            status === "Completed" ||
            status === "Partially Refunded" ||
            status === "Refund Failed"
          ) {
            cy.get("@actionsCell").within(() => {
              cy.get("[data-cy=payment-request-refund]").should("exist");
              cy.get("[data-cy=payment-request-refund]")
                .scrollIntoView()
                .should("be.visible");
            });
          } else {
            cy.get("@actionsCell").within(() => {
              cy.get("[data-cy=payment-request-refund]").should(
                "not.be.visible"
              );
            });
          }
        });
      });
    });

    it("should pass if the in-row refund button opens the refund modal", () => {
      const arr = [];
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          cy.wrap($el)
            .find("td")
            .eq(0)
            .then(($cell) => {
              status = $cell.text();
              // So that we only test the rows that apply, since the previous test already confirmed which rows show the buttons
              if (
                status === "Completed" ||
                status === "Partially Refunded" ||
                status === "Refund Failed"
              ) {
                arr.push($el);
              }
            });
        })
        .then(($list) => {
          arr.forEach(($ele) => {
            cy.wrap($ele).find("th").as("actionsCell");
            cy.get("@actionsCell").scrollIntoView().should("be.visible");
            cy.wrap($ele).trigger("mouseover");
            cy.get("@actionsCell").should("not.be.empty");
            cy.get("@actionsCell").within(() => {
              cy.get("[data-cy=payment-request-refund]")
                .scrollIntoView()
                .should("be.visible");
              cy.get("[data-cy=payment-request-refund]").click({ force: true });
            });
            cy.get("[data-cy=cancel-refund]").should("exist").and("be.visible");
            cy.get("[data-cy=cancel-refund]").click();
            cy.get("[data-cy=cancel-refund]")
              .should("not.exist")
              .and("not.be.visible");
          });
        });
    });

    it("should pass if a new request shows in the table", () => {
      const amount = Cypress._.random(1, 1e3);
      const invoicePath = "sample.pdf";
      const referenceNumber = Cypress._.random(0, 1e9);
      const email = "john.doe@aptean.com";
      cy.getInput("recipient-email").type(email);
      cy.getInput("amount").type(amount);
      cy.getInput("reference-number").type(referenceNumber);
      cy.getInput("invoice").attachFile(invoicePath);
      cy.get("[data-cy=send-payment]").should("not.be.disabled").click();
      cy.wait(2000);
      cy.get("[data-cy=refresh]").click();
      cy.wait(2000);
      cy.get("[data-cy=payment-request-table-body]")
        .find("tr")
        .eq(0)
        .find("td")
        .as("newCells");
      cy.get("@newCells")
        .eq(0)
        .should(($cell) => {
          expect($cell.eq(0)).to.contain("Unpaid");
        });
      cy.get("@newCells")
        .eq(2)
        .should(($cell) => {
          const today = new Date().toLocaleDateString();
          expect($cell.eq(0)).to.contain(today);
        });
      cy.get("@newCells")
        .eq(3)
        .should(($cell) => {
          // TODO: Fix this to work with other currencies
          const amountFormatted = amount.toString();
          expect($cell.eq(0).text()).to.include(amountFormatted);
        });
      cy.get("@newCells")
        .eq(4)
        .should(($cell) => {
          expect($cell.eq(0)).to.contain(email);
        });
      cy.get("@newCells")
        .eq(5)
        .should(($cell) => {
          expect($cell.eq(0)).to.contain(referenceNumber);
        });
    });

    /* it("should pass if sorting by date reverses the order", () => {
      // Get the current value of the date
      cy.get("@rows")
        .eq(0)
        .find("td")
        .eq(2)
        .then((el) => {
          const originalDate = el.text();

          // Change the date ordering
          cy.get("[data-cy=payment-requests-panel]")
            .find("table>thead>tr>th")
            .eq(2)
            .as("date");
          cy.get("@date").click();
          cy.wait(5000);

          // Check the value of the new first row
          cy.get("[data-cy=payment-request-table-body]")
            .find("tr")
            .eq(0)
            .find("td")
            .eq(2)
            .then((newEl) => {
              const newDate = new Date(newEl.text());
              const oldDate = new Date(originalDate);

              // Confirm that the new value is less recent than the previous value
              cy.expect(oldDate).to.be.greaterThan(newDate);

              // Click again and make sure it goes back to the original
              cy.get("@date").click();
              cy.wait(5000);
              cy.get("[data-cy=payment-request-table-body]")
                .find("tr")
                .eq(0)
                .find("td")
                .eq(2)
                .then((finalEl) => {
                  cy.expect(finalEl.text()).to.equal(originalDate);
                });
            });
        });
    }); */

    it("should pass if searching brings up the correct result", () => {
      cy.generatePaymentRequest().then((response) => {
        const referenceNumber = response.referenceNumber;
        const email = response.email;
        const phone = response.phone;

        cy.get("[data-cy=refresh]").click();
        // search for reference number and get created payment request
        cy.getInput("search")
          .type(referenceNumber)
          .should("have.value", referenceNumber.toString());
        cy.wait(10000);
        cy.get("[data-cy=payment-request-table-body]")
          .find("tr")
          .as("searchedRows");
        cy.get("@searchedRows").should("have.length.greaterThan", 0);
        let matches = false;
        cy.get("@searchedRows").then(($list) => {
          cy.wrap($list[0])
            .find("td")
            .eq(5)
            .contains(referenceNumber.toString())
            .then((el) => {
              if (el.text() === referenceNumber.toString()) {
                matches = true;
              }
              cy.expect(matches).to.equal(true);
            });
        });

        // Clear search field and refresh table
        cy.getInput("search").clear();
        cy.wait(5000);
        cy.get("[data-cy=refresh]").click();

        // search for email and get created payment request
        cy.getInput("search")
          .type(email)
          .should("have.value", email.toString());
        cy.wait(10000);
        cy.get("[data-cy=payment-request-table-body]").find("tr").as("newRows");
        cy.get("@newRows").should("have.length.greaterThan", 0);
        let emailMatches = false;
        cy.get("@newRows").then(($newList) => {
          cy.wrap($newList[0])
            .find("td")
            .eq(5)
            .contains(referenceNumber.toString())
            .then((newEl) => {
              if (newEl.text() === referenceNumber.toString()) {
                emailMatches = true;
              }
              cy.expect(emailMatches).to.equal(true);
            });
        });

        // Clear search field and refresh table
        cy.getInput("search").clear();
        cy.wait(5000);
        cy.get("[data-cy=refresh]").click();

        // search for email and get created payment request
        cy.getInput("search")
          .type(phone)
          .should("have.value", phone.toString());
        cy.wait(10000);
        cy.get("[data-cy=payment-request-table-body]")
          .find("tr")
          .as("phoneRows");
        cy.get("@phoneRows").should("have.length.greaterThan", 0);
        let phoneMatches = false;
        cy.get("@newRows").then(($phoneList) => {
          cy.wrap($phoneList[0])
            .find("td")
            .eq(5)
            .contains(referenceNumber.toString())
            .then((phoneEl) => {
              if (phoneEl.text() === referenceNumber.toString()) {
                phoneMatches = true;
              }
              cy.expect(phoneMatches).to.equal(true);
            });
        });
      });
    });

    it("should pass if the href for the invoice download is correct", () => {
      cy.get("@rows").eq(0).as("firstRow");
      cy.get("@firstRow").find("th").as("actionsCell");
      cy.get("@actionsCell").scrollIntoView().should("be.visible");
      cy.get("@firstRow").trigger("mouseover");
      cy.get("@actionsCell").within(() => {
        cy.get("[data-cy=view-payment-icon]")
          .scrollIntoView()
          .should("be.visible");
        cy.get("[data-cy=view-payment-icon]").click({ force: true });
      });
      cy.get("[data-cy=payment-request-details-modal]")
        .should("exist")
        .and("be.visible");

      // Checks for the download link
      cy.get("[data-cy=download-invoice]").should("have.attr", "href");

      cy.get("[data-cy=download-invoice]").then(($el) => {
        const href = $el.attr("href");
        const correctLocation = href?.includes(
          ".merchant.apteanpay.com/invoice-uploads/"
        );
        cy.expect(correctLocation).to.equal(true);
      });
    });
  });
});
