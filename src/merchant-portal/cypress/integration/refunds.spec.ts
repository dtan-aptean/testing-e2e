/// <reference types="cypress" />

describe("Merchant portal", function () {
  context("Refunds", () => {
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });

    beforeEach(() => {
      // navigate to home screen
      cy.visit("/");
      // Make sure we're on the correct tab, then get the updated contents
      cy.get("[data-cy=payment-requests-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(1000);
      // Scroll down so that we get as many rows as possible
      cy.get("[data-cy=payment-requests-panel]")
        .find(".MuiTableContainer-root")
        .scrollTo("bottom", { duration: 20000 });
      cy.wait(1000);
      cy.get("[data-cy=payment-request-table-body]").find("tr").as("rows");

      // Get the payment requests that are completed
      const arr = [];
      cy.get("@rows").each(($el, index, $list) => {
        let status = undefined;
        cy.wrap($el)
          .find("td")
          .eq(0)
          .then(($cell) => {
            status = $cell.text();
            // Find the rows that are completed
            if (status === "Completed") {
              arr.push($el);
            }
          });
      });
      cy.wrap(arr).as("completedArray");

      // Get the payment requests that are partially refunded - commented out as current tests don't use it
      /* const parRef = [];
      cy.get('@rows')
        .each(($el, index, $list) => {
          let status = undefined;
          cy.wrap($el)
            .find('td')
            .eq(0)
            .then(($cell) => {
              status = $cell.text();
              // Find the rows that are partially refunded
              if (status === 'Partially Refunded') {
                parRef.push($el);
              }
            });
        });
      cy.wrap(parRef)
        .as('partialArray'); */
    });

    it("Unpaid payment cannot refund", () => {
      cy.generatePaymentRequest().then((response) => {
        cy.wrap(response.referenceNumber).as("referenceNumber");
      });
      cy.get("[data-cy=refresh]").click();
      cy.get("@referenceNumber").then((referenceNumber) => {
        // search and get created payment request
        cy.getInput("search")
          .type(referenceNumber)
          .should("have.value", referenceNumber.toString());
        cy.wait(5000);
        cy.get("[data-cy=payment-request-table-body]")
          .find("tr")
          .eq(0)
          .find("td")
          .eq(5)
          .should("contain.text", referenceNumber.toString());
        cy.get("[data-cy=payment-request-table-body]")
          .find("tr")
          .eq(0)
          .as("relevantRow");
        cy.get("@relevantRow").find("th").as("actionsCell");
        cy.get("@actionsCell")
          .scrollIntoView()
          .should("be.visible")
          .and("be.empty");
        cy.get("@relevantRow").trigger("mouseover");
        cy.get("@actionsCell").within(() => {
          // This will scroll us all the way to the right
          cy.get("[data-cy=view-payment-icon]")
            .scrollIntoView()
            .should("be.visible");
          // Now we can see the whole cell
          cy.get("[data-cy=payment-request-refund]").should("not.be.visible");
        });

        cy.get("@relevantRow").click();
        cy.get("[data-cy=refund]").should("be.disabled");
      });
    });

    it("Merchant clicks the refund button and an issue refund modal opens", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get('[data-cy="refund"]').should("not.be.disabled");
        cy.get('[data-cy="refund"]').click();
        // Make sure the modal is showing
        cy.get('[data-cy="refund-dialog-title"]')
          .should("exist")
          .and("be.visible");
        // Close the modal
        cy.get("[data-cy=cancel-refund]").should("exist").and("be.visible");
        cy.get("[data-cy=cancel-refund]").click();
      });
    });

    it("User clicks full refund and the amount is disabled", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get("[data-cy=refund]").should("not.be.disabled");
        cy.get("[data-cy=refund]").click();
        // Make sure the modal is showing
        cy.get("[data-cy=refund-dialog-title]")
          .should("exist")
          .and("be.visible");
        // Select Full refund
        cy.get("[data-cy=full-refund]").find("input").check();
        // Ensure amount is disabled
        cy.get("[data-cy=refund-amount]").find("input").should("be.disabled");
        // Close the modal before the next test
        cy.get("[data-cy=cancel-refund]").click();
      });
    });

    it("User clicks partial refund and the amount is not disabled", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get("[data-cy=refund]").should("not.be.disabled");
        cy.get("[data-cy=refund]").click();
        // Make sure the modal is showing
        cy.get("[data-cy=refund-dialog-title]")
          .should("exist")
          .and("be.visible");
        // Select partial refund
        cy.get("[data-cy=partial-refund]").find("input").check();
        // Ensure amount is not disabled
        cy.get("[data-cy=refund-amount]")
          .find("input")
          .should("not.be.disabled");
        // Close the modal before the next test
        cy.get("[data-cy=cancel-refund]").click();
      });
    });

    it("Entering a refund amount greater than the request amount should display a warning", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get("[data-cy=refund]").should("not.be.disabled");
        cy.get("[data-cy=refund]").click();
        // Make sure the modal is showing
        cy.get("[data-cy=refund-dialog-title]")
          .should("exist")
          .and("be.visible");
        // Acquire the amount
        cy.get("[data-cy=requested-amount]").then(($el) => {
          let requestedAmount = undefined;
          if ($el.text()[0] === "$") {
            requestedAmount = Number.parseFloat(
              $el.text().substring(1, $el.text().length)
            );
          } else if ($el.text()[0] === "C") {
            requestedAmount = Number.parseFloat(
              $el.text().substring(3, $el.text().length)
            );
          }
          // Select partial refund
          cy.get("[data-cy=partial-refund]").find("input").check();
          // Ensure amount is not disabled
          cy.get("[data-cy=refund-amount]")
            .find("input")
            .should("not.be.disabled");
          // Enter the input amount
          cy.get("[data-cy=refund-amount]")
            .find("input")
            .type((requestedAmount + 1.0).toString());
          // Enter the reason
          cy.get("[data-cy=refund-reason]").find("input").type("test");
          // Click refund button
          cy.get("[data-cy=process-refund]").click();
          // Look for the error message
          cy.get("[data-cy=refund-error-message]").should(
            "contain.text",
            "Cannot refund more than the amount paid"
          );
          // Close the modal before the next test
          cy.get("[data-cy=cancel-refund]").click();
        });
      });
    });

    it("Not entering a refund reason should display a warning", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get("[data-cy=refund]").should("not.be.disabled");
        cy.get("[data-cy=refund]").click();
        // Make sure the modal is showing
        cy.get("[data-cy=refund-dialog-title]")
          .should("exist")
          .and("be.visible");
        // Select full refund
        cy.get("[data-cy=full-refund]").find("input").check();
        // Click refund button
        cy.get("[data-cy=process-refund]").click();
        // Look for the error message
        cy.get("[data-cy=refund-error-message]").should(
          "contain.text",
          "Must include reason for refund."
        );
        // Close the modal before the next test
        cy.get("[data-cy=cancel-refund]").click();
      });
    });

    it("Clicking the cancel button closes the modal and shows the table again", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0]).click();
        cy.get("[data-cy=refund]").should("not.be.disabled");
        cy.get("[data-cy=refund]").click();
        // Make sure the modal is showing
        cy.get("[data-cy=refund-dialog-title]")
          .should("exist")
          .and("be.visible");
        // Close the modal
        cy.get("[data-cy=cancel-refund]").click();
        // Make sure the modal isn't showing anymore
        cy.get("[data-cy=refund-dialog-title]")
          .should("not.exist")
          .and("not.be.visible");
        // Make sure the table is showing
        cy.get("[data-cy=payment-request-table-body]")
          .should("exist")
          .and("be.visible");
      });
    });

    it("Refunding a request updates that request in the table", () => {
      cy.get("@completedArray").should("have.length.gte", 1);
      cy.get("@completedArray").then((objectArray) => {
        cy.wrap(objectArray[0])
          .find("td")
          .eq(5)
          .then(($refNum) => {
            cy.wrap(objectArray[0]).click();
            cy.get("[data-cy=refund]").should("not.be.disabled");
            cy.get("[data-cy=refund]").click();
            // Make sure the modal is showing
            cy.get("[data-cy=refund-dialog-title]")
              .should("exist")
              .and("be.visible");
            // Select full refund
            cy.get("[data-cy=full-refund]").find("input").check();
            // Input a reason
            cy.get("[data-cy=refund-reason]").find("input").type("test");
            // Send the request
            cy.get("[data-cy=process-refund]").click();
            cy.wait(5000);
            // Make sure the modal isn't showing anymore
            cy.get("[data-cy=refund-dialog-title]")
              .should("not.exist")
              .and("not.be.visible");
            // Make sure the table is showing
            cy.get("[data-cy=payment-request-table-body]")
              .should("exist")
              .and("be.visible");

            // Type the reference number
            cy.getInput("search")
              .type($refNum.text())
              .should("have.value", $refNum.text().toString());
            cy.wait(5000);
            cy.get("[data-cy=payment-request-table-body]")
              .find("tr")
              .as("searchedRows");
            cy.get("@searchedRows").should("have.length.greaterThan", 0);
            cy.get("@searchedRows").then(($list) => {
              cy.wrap($list[0])
                .find("td")
                .eq(5)
                .contains($refNum.text().toString())
                .then((el) => {
                  if (el.text() === $refNum.text().toString()) {
                    cy.wrap($list[0])
                      .find("td")
                      .eq(0)
                      .then(($status) => {
                        cy.expect($status).to.have.text("Refund Pending");
                      });
                  }
                });
            });
          });
      });
    });
  });
});
