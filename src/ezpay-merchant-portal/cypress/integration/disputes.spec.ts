/// <reference types="cypress" />

describe("Merchant portal", function () {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  });

  context("Disputes", () => {
    beforeEach(() => {
      //navigate to home screen
      cy.visit("/");
      cy.wait(5000);
      cy.waitAfterLogIn(0, 5);
      // Onbaord if necessary
      cy.onboard({
        entityType: "business",
        structure: "corporation",
        industryCategory: 0,
        industryType: 0,
        businessName: "Aqueas",
        businessEIN: "121212121",
        businessDescription: "Aqueas Description",
        businessWebsite: "a.co.uk",
        businessAddress: "123 St",
        businessCity: "Atlanta",
        businessRegion: "GA",
        businessPostal: "30338",
        businessPhone: "4045675678",
        controllerFirstName: "Aqueas",
        controllerLastName: "Ocean",
        controllerTitle: "Owner",
        controllerAddress: "123 St",
        controllerCity: "Atlanta",
        controllerRegion: "GA",
        controllerPostal: "30338",
        controllerCountryCode: "1",
        controllerPhone: "4045675678",
        controllerDOBMonth: "March",
        controllerDOBDay: "6",
        controllerDOBYear: "1990",
        controllerSSNLastFour: "1234",
        controllerOwn25orMore: true,
        accountName: "Aqueas",
        accountDescription: "Aqueas Ocean Corp",
        accountStatementDescription: "aqueas-pay",
        refundPolicy: "No refunds",
        tosName: "Mike Riehlman",
      });
      // Get the disputes
      cy.get("[data-cy=payment-disputes-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(5000);
      cy.get("[data-cy=dispute-table-body]").invoke("children").as("rows");
    });

    it("Create a new dispute if there are none or there are no active disputes", () => {
      cy.get("@rows").then(($el) => {
        const originalLength = $el.length;
        if (originalLength === 0) {
          cy.createAndPay(1, "9.61", "disputes");
          cy.wait(5000);
          cy.waitAfterLogIn(0, 5);
          cy.get("[data-cy=payment-disputes-tab]", { timeout: 20000 }).click();
          cy.wait(800000);
          cy.get("[data-cy=refresh]").click();
          cy.wait(5000);
          cy.get("[data-cy=dispute-table-body]")
            .invoke("children")
            .then(($children) => {
              expect($children.length).to.be.greaterThan(originalLength);
            });
        } else {
          // Make sure there are active disputes available
          cy.get("[data-cy=dispute-table-body]").find("tr").as("currentRows");
          const activeArray = [];
          cy.get("@currentRows")
            .each(($row, index, $list) => {
              let status = undefined;
              let daysRemaining = undefined;
              cy.wrap($row)
                .find("td")
                .then(($cells) => {
                  status = $cells.eq(2).text();
                  daysRemaining = $cells.eq(4).text();
                  if (
                    status === "Action Needed" &&
                    daysRemaining !== "0 days left"
                  ) {
                    activeArray.push($row);
                  }
                });
            })
            .then(() => {
              if (activeArray.length === 0) {
                cy.createAndPay(1, "9.61", "disputes");
                cy.wait(5000);
                cy.waitAfterLogIn(0, 5);
                cy.get("[data-cy=payment-disputes-tab]", {
                  timeout: 20000,
                }).click();
                cy.wait(800000);
                cy.get("[data-cy=refresh]").click();
                cy.wait(5000);
                cy.get("@rows").should("have.length.gte", 1);
                let hasActiveDispute = false;
                // Get the rows with active disputes
                cy.get("@rows")
                  .each(($el, index, $list) => {
                    let status = undefined;
                    let daysRemaining = undefined;
                    cy.wrap($el)
                      .find("td")
                      .then(($cells) => {
                        status = $cells.eq(2).text();
                        daysRemaining = $cells.eq(4).text();
                        if (
                          status === "Action Needed" &&
                          daysRemaining !== "0 days left"
                        ) {
                          hasActiveDispute = true;
                        }
                      });
                  })
                  .then(($list) => {
                    assert.equal(hasActiveDispute, true, "Dispute Created");
                  });
              }
            });
        }
      });
    });

    it("View disputes table on dispute tab", () => {
      cy.visit("/");
      cy.wait(5000);
      cy.waitAfterLogIn(0, 5);
      // Visit the tab as if going to it for the first time
      cy.get("[data-cy=payment-disputes-tab]", { timeout: 20000 }).click();
      // Make sure the table exists and is visible
      cy.get("[data-cy=dispute-table-body]").should("exist").and("be.visible");
      cy.get("[data-cy=dispute-table-body]").find("tr").as("disputeRows");
      cy.get("@disputeRows").then(($rows) => {
        // If we have disputes available, make sure the user can see them
        if ($rows.length >= 1) {
          cy.wrap($rows[0]).as("firstRow");
          cy.get("@firstRow").should("exist").and("be.visible");
        }
      });
    });

    it("Details modal shows after clicking details button and dispute id", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const detailsArray = [];
      // Find the disputes that aren't active
      // Only none active disputes show the details button
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          cy.wrap($el)
            .find("td")
            .eq(2)
            .then(($cell) => {
              status = $cell.text();
              if (status !== "Action Needed") {
                detailsArray.push($el);
              }
            });
        })
        .then(($list) => {
          //using details button
          // Find the cell that holds the button
          cy.wrap(detailsArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          // Trigger the mouseover
          cy.wrap(detailsArray[0]).trigger("mouseover");
          cy.get("@actionsCell").should("be.empty");

          //using view deatils option
          cy.wrap(detailsArray[0]).click();
          cy.get("[data-cy=dispute-details]").should("be.enabled").click();
          cy.get("[data-cy=dispute-information]").should("exist");
          cy.get("[data-cy=close-dispute]").should("exist").and("be.visible");
          cy.get("[data-cy=close-dispute]").click();
          cy.get("[data-cy=dispute-information]").should("not.exist");

          //using dispute id link
          cy.wrap(detailsArray[0])
            .find("td")
            .eq(1)
            .within(() => {
              cy.get('a[href="#"]').click({ force: true });
            });
          cy.get("[data-cy=dispute-information]").should("exist");
          cy.get("[data-cy=close-dispute]").should("exist").and("be.visible");
          cy.get("[data-cy=close-dispute]").click();
          cy.get("[data-cy=dispute-information]").should("not.exist");
        });
    });

    it("Details modal is closes and the user is returned to dispute table", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const detailsArray = [];
      // Find the disputes that aren't active
      // Only none active disputes show the details button
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          cy.wrap($el)
            .find("td")
            .eq(2)
            .then(($cell) => {
              status = $cell.text();
              if (status !== "Action Needed") {
                detailsArray.push($el);
              }
            });
        })
        .then(($list) => {
          // Find the cell that holds the button
          cy.wrap(detailsArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          // Trigger the mouseover
          cy.wrap(detailsArray[0]).trigger("mouseover");
          cy.get("@actionsCell").should("be.empty");
          cy.wrap(detailsArray[0]).dblclick();
          cy.get("[data-cy=dispute-information]").should("exist");
          // Close modal with the close button
          cy.get("[data-cy=close-dispute]").should("exist").and("be.visible");
          cy.get("[data-cy=close-dispute]").click();
          // Make sure modal is closed
          cy.get("[data-cy=dispute-information]").should("not.exist");
          // Open the modal again
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.wrap(detailsArray[0]).trigger("mouseover");
          cy.get("@actionsCell").should("be.empty");
          cy.wrap(detailsArray[0]).dblclick();
          cy.get("[data-cy=dispute-information]").should("exist");
          // Close the modal via the backdrop
          cy.get("div.MuiDialog-root")
            .find(".MuiBackdrop-root")
            .should("exist");
          cy.get("div.MuiDialog-root")
            .find(".MuiBackdrop-root")
            .click({ force: true }); // Force the click because Cypress considers the backdrop not visible, and thus unclickable
          cy.get("[data-cy=dispute-information]").should("not.exist");
        });
    });

    it("The href for the invoice download is correct", () => {
      cy.get("@rows").should("have.length.gte", 1);
      cy.get("@rows").eq(0).as("firstRow");
      // Just get the first row, there's an invoice regardless of status
      cy.get("@firstRow")
        .find("td")
        .eq(1)
        .within(() => {
          cy.get('a[href="#"]').click({ force: true });
        });
      cy.wait(1000);
      cy.get("[data-cy=dispute-information]").should("exist");
      cy.get("[data-cy=download-dispute-invoice]")
        .should("exist")
        .and("be.visible");
      // Checks for the download link
      cy.get("[data-cy=download-dispute-invoice]").should("have.attr", "href");
      // Checks that the download link is to the correct location
      cy.get("[data-cy=download-dispute-invoice]").then(($el) => {
        const href = $el.attr("href");
        const correctLocation = href?.includes("invoice-uploads/");
        cy.expect(correctLocation).to.equal(true);
      });
    });

    it("Sorting the table by date reverses the order of enteries", () => {
      cy.get("@rows").should("have.length.gte", 1);
      // Get the current value of the date
      cy.get("@rows")
        .eq(0)
        .find("td")
        .eq(1)
        .then((el) => {
          const originalId = el.text();

          // Change the date ordering
          cy.get("[data-cy=payment-disputes-panel]")
            .find("table>thead>tr>th")
            .eq(4)
            .as("date");
          cy.get("@date").click();
          cy.wait(5000);

          // Check the value of the new first row
          cy.get("[data-cy=dispute-table-body]")
            .find("tr")
            .eq(0)
            .find("td")
            .eq(1)
            .then((newEl) => {
              // Confirm that the new value is different than the previous value
              cy.expect(newEl.text()).to.not.equal(originalId);

              // Click again and make sure it goes back to the original
              cy.get("@date").click();
              cy.wait(5000);
              cy.get("[data-cy=dispute-table-body]")
                .find("tr")
                .eq(0)
                .find("td")
                .eq(1)
                .then((finalEl) => {
                  cy.expect(finalEl.text()).to.equal(originalId);
                });
            });
        });
    });

    it("The search bar is hidden while on the disputes tab", () => {
      cy.get("[data-cy=search]").should("not.exist");
    });

    it("The review button is showing for a row that needs action", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      cy.wait(2000);
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
          });
        });
    });

    it("Clicking the review button opens the chargeback modal", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Click the review button
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          // Check that the modal is open
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          cy.get("[data-cy=close-dispute]").should("exist").and("be.visible");
          cy.get("[data-cy=close-dispute]").click();
        });
    });

    // CONCEDE TESTING
    it("Clicking ethe Concede button should open the concede modal and close the chargeback modal", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Open the modal
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          // Check for the concede button
          cy.get("[data-cy=concede]").should("exist");
          cy.get("[data-cy=concede]").click();
          // Makes sure the chargeback modal has closed and concede modal opens
          cy.get("[data-cy=chargeback-review]").should("not.exist");
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
        });
    });

    it("Clicking the back button should open the chargeback modal and close the concede modal", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Open the chargeback modal
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          // Open the concede modal
          cy.get("[data-cy=concede]").should("exist");
          cy.get("[data-cy=concede]").click();
          cy.get("[data-cy=chargeback-review]").should("not.exist");
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
          // Find the back button
          cy.get("[data-cy=back-concede]").should("exist").and("be.visible");
          cy.get("[data-cy=back-concede]").click();
          // Make sure chargeback modal has opened and concede modal has closed
          cy.get("[data-cy=concede-modal]").should("not.exist");
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
        });
    });

    it("Clicking the gray area around the concede modal should not close the modal", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      cy.wait(2000);
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Open the chargeback modal
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          // Open the concede modal
          cy.get("[data-cy=concede]").should("exist");
          cy.get("[data-cy=concede]").click();
          cy.get("[data-cy=chargeback-review]").should("not.exist");
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
          // Find the gray backdrop and click it
          cy.get("div.MuiDialog-root")
            .find(".MuiBackdrop-root")
            .should("exist");
          cy.get("div.MuiDialog-root")
            .find(".MuiBackdrop-root")
            .click({ force: true });
          // Make sure modal is still open
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
        });
    });

    it("Not entering a concede reason displays a warning", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Open chargeback review modal
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          // Open the concede modal
          cy.get("[data-cy=concede]").should("exist");
          cy.get("[data-cy=concede]").click();
          cy.get("[data-cy=chargeback-review]").should("not.exist");
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
          cy.get("[data-cy=submit-concede]").should("exist").and("be.visible");
          // Submit the concede without entering an explanation
          cy.get("[data-cy=submit-concede]").click();
          // Look for the error message
          cy.get("[data-cy=concede-error-message]").should(
            "contain.text",
            "This field is required"
          );
        });
    });

    it("Conceding a dispute updates that dispute in the table", () => {
      cy.get("@rows").should("have.length.gte", 1);
      const activeArray = [];
      // We need to grab the original index of the dispute since we can't search for it
      let relevantIndex = 0;
      // Get the rows with active disputes
      cy.get("@rows")
        .each(($el, index, $list) => {
          let status = undefined;
          let daysRemaining = undefined;
          cy.wrap($el)
            .find("td")
            .then(($cells) => {
              status = $cells.eq(2).text();
              daysRemaining = $cells.eq(4).text();
              if (
                status === "Action Needed" &&
                daysRemaining !== "0 days left"
              ) {
                if (activeArray.length === 0) {
                  relevantIndex = index;
                }
                activeArray.push($el);
              }
            });
        })
        .then(($list) => {
          cy.wrap(activeArray[0]).find("td").eq(6).as("actionsCell");
          cy.get("@actionsCell").scrollIntoView().should("be.visible");
          cy.get("@actionsCell").should("not.be.empty");
          // Open chargeback review modal
          cy.get("@actionsCell").within(() => {
            cy.get("[data-cy=view-dispute]")
              .scrollIntoView()
              .should("be.visible");
            cy.get("[data-cy=view-dispute]").should("have.text", "Review");
            cy.get("[data-cy=view-dispute]").click({ force: true });
          });
          cy.get("[data-cy=chargeback-review]")
            .should("exist")
            .and("be.visible");
          // Open the concede modal
          cy.get("[data-cy=concede]").should("exist");
          cy.get("[data-cy=concede]").click();
          cy.get("[data-cy=chargeback-review]").should("not.exist");
          cy.get("[data-cy=concede-modal]").should("exist").and("be.visible");
          cy.get("[data-cy=submit-concede]").should("exist").and("be.visible");
          // Enter an explanation
          cy.get("[data-cy=concede-explanation-input]")
            .find("textarea")
            .type("Merchant requested incorrect amount");
          // Submit the concede
          cy.get("[data-cy=submit-concede]").click();
          // Watch the concede button become disabled
          cy.get("[data-cy=submit-concede]").should("be.disabled");
          // Modal should close
          cy.get("[data-cy=concede-modal]").should("not.exist");
          // Wait for table to refresh
          cy.wait(5000);
          // Get table rows
          cy.get("[data-cy=dispute-table-body]").find("tr").as("updatedRows");
          // Find the original row and check its status
          cy.get("@updatedRows").then(($rowList) => {
            cy.wrap($rowList[relevantIndex])
              .find("td")
              .eq(2)
              .should("have.text", "Conceded (Processing)");
          });
        });
    });
  });
});
