/// <reference types="cypress" />

describe("Merchant portal", function () {
  context("Refunds", () => {
    let globalReferenceNumber = "";
    let globalPaymentId = "";
    before(() => {
      sessionStorage.clear();
      // navigate to home screen
      cy.login();
    });

    beforeEach(() => {
      // navigate to home screen
      cy.visit("/");
      cy.wait(7000);
      cy.waitAfterLogIn(0, 5);

      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);
      cy.get("[data-cy=payments-table-body]")
        .find("tr")
        .eq(0)
        .find("td")
        .as("firstPaymentCells");

      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);
      cy.get("[data-cy=payment-request-table-body]")
        .find("tr")
        .eq(0)
        .find("td")
        .as("firstPaymentRequestCells");
    });
    //need to change to general user
    it("Unpaid payment request cannot refund", () => {
      const amount = 10;
      const invoicePath = "sample.pdf";
      const referenceNumber = `${Date.now()
        .toString()
        .slice(-4)}-${Cypress._.random(0, 1e12)}`;
      cy.getInput("recipient-email").type(Cypress.config("username"));
      cy.getInput("amount").type(amount);
      cy.getInput("reference-number").type(referenceNumber);
      cy.getInput("invoice").attachFile(invoicePath);
      cy.get("[data-cy=send-payment]").should("not.be.disabled").click();
      cy.wait(3000);
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      cy.get("[data-cy=payment-request-table-body]")
        .find(`tr:contains(${referenceNumber})`)
        .first()
        .find("td")
        .eq(2)
        .should(($cell) => {
          expect($cell.eq(0)).to.contain("Unpaid");
        })
        .click();

      // checking via info modal
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]").should("not.exist");
    });

    it("Merchant clicks the refund button and an issue refund modal opens", () => {
      cy.createAndPay(1, "10", "refund").then((resp) => {
        globalReferenceNumber = resp[0].toString();

        cy.wait(5000);
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

            //Checking in payments
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
              cy.get("[data-cy=payments-table-body]")
                .find(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            } else {
              cy.get("@firstPaymentCells")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            }

            cy.get('[data-cy="refund"]').should("exist").click();
            // Make sure the modal is showing
            cy.get('[data-cy="refund-dialog-title"]')
              .should("exist")
              .and("be.visible");
            // Close the modal
            cy.get("[data-cy=cancel-refund]").should("exist");
            cy.get("[data-cy=cancel-refund]").click({ force: true });

            //Checking in payment requests
            cy.get("[data-cy=payment-requests-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(5000);

            if (globalReferenceNumber && globalReferenceNumber.length > 0) {
              cy.get("[data-cy=payment-request-table-body]")
                .find(`tr:contains(${globalReferenceNumber})`)
                .first()
                .find("td")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            } else {
              cy.get("@firstPaymentRequestCells")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            }

            //opening refund modal from payment request
            cy.get("[data-cy=view-details]").should("be.visible").click();
            cy.get("[data-cy=payment-history-refund]")
              .should("exist")
              .first()
              .click({ force: true });
            // Make sure the modal is showing
            cy.get('[data-cy="refund-dialog-title"]')
              .should("exist")
              .and("be.visible");
            // Close the modal
            cy.get("[data-cy=cancel-refund]").should("exist");
            cy.get("[data-cy=cancel-refund]").click({ force: true });
          });
      });
    });

    it("User clicks full refund and the amount is disabled", () => {
      //Checking in payments
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get('[data-cy="refund"]').should("exist").click();
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select Full refund
      cy.get("[data-cy=full-refund]").find("input").check();
      // Ensure amount is disabled
      cy.get("[data-cy=refund-amount]").find("input").should("be.disabled");
      // Close the modal before the next test
      cy.get("[data-cy=cancel-refund]").click();

      //Checking in payment requests
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select Full refund
      cy.get("[data-cy=full-refund]").find("input").check();
      // Ensure amount is disabled
      cy.get("[data-cy=refund-amount]").find("input").should("be.disabled");
      // Close the modal before the next test
      cy.get("[data-cy=cancel-refund]").click();
    });

    it("User clicks partial refund and the amount is not disabled", () => {
      //Checking in payments
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get('[data-cy="refund"]').should("exist").click();
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select Partial refund
      cy.get("[data-cy=partial-refund]").find("input").check();
      // Ensure amount is not disabled
      cy.get("[data-cy=refund-amount]").find("input").should("not.be.disabled");
      // Close the modal before the next test
      cy.get("[data-cy=cancel-refund]").click();

      //Checking in payment requests
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select Partial refund
      cy.get("[data-cy=partial-refund]").find("input").check();
      // Ensure amount is not disabled
      cy.get("[data-cy=refund-amount]").find("input").should("not.be.disabled");
      // Close the modal before the next test
      cy.get("[data-cy=cancel-refund]").click();
    });

    it("Entering a refund amount greater than the request amount should display a warning", () => {
      //Checking in payments
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get('[data-cy="refund"]').should("exist").click();
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select partial refund
      cy.get("[data-cy=partial-refund]").find("input").check();
      // Ensure amount is not disabled
      cy.get("[data-cy=refund-amount]").find("input").should("not.be.disabled");
      // Enter the input amount
      cy.get("[data-cy=refund-amount]").find("input").clear().type("15");
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

      //Checking in payment requests
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
        .should("exist")
        .and("be.visible");
      // Select partial refund
      cy.get("[data-cy=partial-refund]").find("input").check();
      // Ensure amount is not disabled
      cy.get("[data-cy=refund-amount]").find("input").should("not.be.disabled");
      // Enter the input amount
      cy.get("[data-cy=refund-amount]").find("input").clear().type("15");
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

    it("Not entering a refund reason should display a warning", () => {
      //Checking in payments
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get('[data-cy="refund"]').should("exist").click();
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
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

      //Checking in payment requests
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get('[data-cy="refund-dialog-title"]')
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

    it("Clicking the cancel button closes the modal and shows the table again", () => {
      //Checking in payments
      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get('[data-cy="refund"]').should("exist").click();
      // Make sure the modal is showing
      cy.get("[data-cy=refund-dialog-title]").should("exist").and("be.visible");
      // Close the modal
      cy.get("[data-cy=cancel-refund]").click();
      // Make sure the modal isn't showing anymore
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
      // Make sure the payments table is showing
      cy.get("[data-cy=payments-table-body]").should("exist").and("be.visible");

      //Checking in payment requests
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }
      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get("[data-cy=refund-dialog-title]").should("exist").and("be.visible");
      // Close the modal
      cy.get("[data-cy=cancel-refund]").click();
      // Make sure the modal isn't showing anymore
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
      // Make sure the payment request table is showing
      cy.get("[data-cy=payment-request-table-body]")
        .should("exist")
        .and("be.visible");
    });

    it("Refunding a request updates that request and payment in the table", () => {
      cy.get("[data-cy=payment-requests-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);
      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Completed");
          })
          .click();
      }

      cy.get("[data-cy=view-details]").should("be.visible").click();
      cy.get("[data-cy=payment-history-refund]")
        .should("exist")
        .first()
        .click({ force: true });
      // Make sure the modal is showing
      cy.get("[data-cy=refund-dialog-title]").should("exist").and("be.visible");
      // Select full refund
      cy.get("[data-cy=full-refund]").find("input").check();
      // Input a reason
      cy.get("[data-cy=refund-reason]").find("input").type("test");
      // Send the request
      cy.get("[data-cy=process-refund]").click();
      cy.wait(5000);
      // Make sure the modal isn't showing anymore
      cy.get("[data-cy=refund-dialog-title]").should("not.exist");
      // Make sure the table is showing
      cy.get("[data-cy=payment-request-table-body]")
        .should("exist")
        .and("be.visible");

      if (globalReferenceNumber && globalReferenceNumber.length > 0) {
        cy.get("[data-cy=payment-request-table-body]")
          .find(`tr:contains(${globalReferenceNumber})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Refund");
          });
      } else {
        cy.get("@firstPaymentRequestCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Refund");
          });
      }

      cy.get("[data-cy=payment-tab]").click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);

      if (globalPaymentId && globalPaymentId.length > 0) {
        cy.get("[data-cy=payments-table-body]")
          .find(`tr:contains(${globalPaymentId})`)
          .first()
          .find("td")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Refund");
          });
      } else {
        cy.get("@firstPaymentCells")
          .eq(2)
          .should(($cell) => {
            expect($cell.eq(0)).to.contain("Refund");
          });
      }
    });

    it("Refunding a payment updates the payment and request in the table", () => {
      //creating the payment
      cy.createAndPay(1, "10.00", "payment").then((resp) => {
        globalReferenceNumber = resp[0].toString();
        cy.wait(5000);
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
                  .find("td:contains(Pending)").length
              ) {
                cy.wait(35000);
                cy.get("[data-cy=refresh]").click();
                cy.wait(5000);
              }
            });

            //making remaining amount refund
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .find(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            } else {
              cy.get("@firstPaymentCells")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Completed");
                })
                .click();
            }
            cy.get("[data-cy=refund]").should("be.enabled").click();
            cy.get("[data-cy=refund-dialog-title]")
              .should("exist")
              .should("be.visible");
            cy.get("[data-cy=refund-reason]").find("input").type("test");
            cy.get("[data-cy=process-refund]").click();
            cy.wait(5000);
            cy.get("[data-cy=refund-dialog-title]").should("not.exist");

            //checking payment status
            if (globalPaymentId && globalPaymentId.length > 0) {
              cy.get("[data-cy=payments-table-body]")
                .find(`tr:contains(${globalPaymentId})`)
                .first()
                .find("td")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Refund");
                });
            } else {
              cy.get("@firstPaymentCells")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Refund");
                });
            }

            //checking payment request status
            cy.get("[data-cy=payment-requests-tab]").click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(5000);
            if (globalReferenceNumber && globalReferenceNumber.length > 0) {
              cy.get("[data-cy=payment-request-table-body]")
                .find(`tr:contains(${globalReferenceNumber})`)
                .first()
                .find("td")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Refund");
                });
            } else {
              cy.get("@firstPaymentRequestCells")
                .eq(2)
                .should(($cell) => {
                  expect($cell.eq(0)).to.contain("Refund");
                });
            }
          });
      });
    });
  });
});
