/// <reference types="cypress" />

describe("Merchant Portal", function () {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  });

  context("Challenge Dispute", () => {
    beforeEach(() => {
      cy.visit("/");
      // Get the first active dispute and open the modal so we can challenge it
      cy.get("[data-cy=payment-disputes-tab]", { timeout: 20000 }).click();
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      // Make sure that we have enough active disputes
      cy.getTableBodyAfterLoad("[data-cy=dispute-table-body]", true).then(
        ($el) => {
          const originalLength = $el.length;
          if (originalLength === 0) {
            cy.createAndPay(2, "1.09", "challenge");
            cy.get("[data-cy=payment-disputes-tab]", {
              timeout: 20000,
            }).click();
            cy.get("[data-cy=refresh]").click();
            cy.wait(2000);
            cy.getTableBodyAfterLoad("[data-cy=dispute-table-body]", true).then(
              ($children) => {
                expect($children.length).to.be.greaterThan(originalLength);
              }
            );
          } else {
            // Make sure there are active disputes available
            cy.get("[data-cy=dispute-table-body]").find("tr").as("currentRows");
            const activeArray = [];
            cy.get("@currentRows")
              .each(($row, index, $list) => {
                let status = undefined;
                cy.wrap($row)
                  .find("td")
                  .eq(1)
                  .then(($cell) => {
                    status = $cell.text();
                    if (status === "Action Needed") {
                      activeArray.push($row);
                    }
                  });
              })
              .then(() => {
                if (activeArray.length === 0) {
                  cy.createAndPay(1, "1.09", "challenge");
                  cy.get("[data-cy=payment-disputes-tab]", {
                    timeout: 20000,
                  }).click();
                  cy.wait(35000);
                  cy.get("[data-cy=refresh]").click();
                  cy.wait(3000);
                  cy.get("@currentRows").should("have.length.gte", 1);
                  let hasActiveDispute = false;
                  // Get the rows with active disputes
                  cy.get("@currentRows")
                    .each(($el, index, $list) => {
                      let status = undefined;
                      cy.wrap($el)
                        .find("td")
                        .eq(1)
                        .then(($cell) => {
                          status = $cell.text();
                          if (status === "Action Needed") {
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
        }
      );

      // Get the first active dispute
      cy.getTableBodyAfterLoad("[data-cy=dispute-table-body]")
        .find("tr")
        .contains("Action Needed")
        .parent()
        .as("activeDispute");
      cy.get("@activeDispute")
        .find("td")
        .eq(5)
        .scrollIntoView()
        .should("be.visible");
      // Open the modal
      cy.get("@activeDispute")
        .find("td")
        .eq(5)
        .within(() => {
          cy.get("[data-cy=view-dispute]")
            .scrollIntoView()
            .should("be.visible")
            .and("have.text", "Review");
          cy.get("[data-cy=view-dispute]").click({ force: true });
        });
      cy.get("[data-cy=chargeback-review]").should("exist").and("be.visible");
    });

    it("Visiting the challenge page without selecting a challenge redirects back to the main page", () => {
      cy.visit("/challenge-dispute");
      cy.wait(500);
      cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    });

    it("Clicking the challenge button brings us to the disputes page", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);
      cy.url().should("eq", `${Cypress.config("baseUrl")}/challenge-dispute`);
    });

    it("The inputs and instructions for challenging a dispute should be visible", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      // Look for the content
      cy.get("[data-cy=challenge-dispute-box]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=challenge-dispute-header]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=documentation-instructions]")
        .should("be.visible")
        .and(
          "have.text",
          "Please upload acceptable supporting documentation. The file must be a .png, .jpg, or .pdf smaller than 10MB. You may attach up to 5 documents"
        );
      cy.get("[data-cy=hidden-file-input]")
        .should("exist")
        .and("not.be.visible");
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .then(($el) => {
          const type = $el.attr("type");
          const accept = $el.attr("accept");
          cy.expect(type).to.equal("file");
          cy.expect(accept).to.equal(".pdf,.png,.jpg");
        });
      cy.get("[data-cy=documentation-select]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");
      cy.get("[data-cy=challenge-explanation]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=challenge-explanation]")
        .find("textarea")
        .should("have.value", "");
    });

    it("The disputes details should be visible", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=dispute-information]").should("exist").and("be.visible");
      cy.get("[data-cy=dispute-information]")
        .should("contain.text", "Dispute ID")
        .and("contain.text", "Dispute Reason");
    });

    it("Clicking cancel opens a model to confirm leaving the page", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-cancel]").should("exist");
      cy.get("[data-cy=challenge-cancel]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-cancel]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("exist").and("be.visible");
      cy.get("[data-cy=cancel-dialog]")
        .should("contain.text", "Leave this page?")
        .and(
          "contain.text",
          "Your documentation and explanation will be cleared."
        );
      cy.get("[data-cy=dialog-cancel-button]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=dialog-leave-button]").should("exist").and("be.visible");
    });

    it("Clicking cancel on the dialog closes the modal and returns to the challenge page", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-cancel]").should("exist");
      cy.get("[data-cy=challenge-cancel]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-cancel]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("exist").and("be.visible");
      cy.get("[data-cy=dialog-cancel-button]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("not.exist");
      cy.get("[data-cy=challenge-dispute-box]")
        .should("exist")
        .and("be.visible");
    });

    it("Clicking leave on the cancel dialog closes the modal and returns to the main page", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-cancel]").should("exist");
      cy.get("[data-cy=challenge-cancel]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-cancel]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("exist").and("be.visible");
      cy.get("[data-cy=dialog-leave-button]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("not.exist");
      cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
    });

    it("Clicking the gray area around the cancel dialog should not close it", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-cancel]").should("exist");
      cy.get("[data-cy=challenge-cancel]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-cancel]").click();
      cy.wait(500);
      cy.get("[data-cy=cancel-dialog]").should("exist").and("be.visible");
      // Find the gray backdrop and click it
      cy.get("div.MuiDialog-root").find(".MuiBackdrop-root").should("exist");
      cy.get("div.MuiDialog-root")
        .find(".MuiBackdrop-root")
        .click({ force: true });
      // Make sure modal is still open
      cy.get("[data-cy=cancel-dialog]").should("exist").and("be.visible");
    });

    it("Displays an error if no explanation is entered before clicking submit", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-submit]").should("exist");
      cy.get("[data-cy=challenge-submit]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-submit]").click();
      cy.get("[data-cy=challenge-dispute-error]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=challenge-dispute-error]").should(
        "have.text",
        "You must provide a written explanation for the challenge"
      );
    });

    it("Displays an error if no supporting documents are uploaded before clicking submit", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=challenge-explanation]")
        .find("textarea")
        .type(
          "The payer is citing the wrong invoice. The attached invoice shows that the amount they were charged is correct."
        );
      cy.get("[data-cy=challenge-submit]").should("exist");
      cy.get("[data-cy=challenge-submit]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-submit]").click();
      cy.get("[data-cy=challenge-dispute-error]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=challenge-dispute-error]").should(
        "have.text",
        "You must provide supporting documents"
      );
    });

    it("The upload button is disabled until a document type is selected", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");

      cy.get("[data-cy=documentation-select]").find("select").select("invoice");
      cy.get("[data-cy=documentation-upload]").should("be.enabled");
    });

    it("Clicking the upload button attaches a document, and resets the select and button", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");

      cy.get("[data-cy=documentation-select]").find("select").select("invoice");
      cy.get("[data-cy=documentation-upload]").should("be.enabled");
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile("disputeSample1.pdf");
      cy.wait(500);
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .should("contain.value", "disputeSample1.pdf");

      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");
    });

    it("After uploading a file, the file name, size, and documentation type are visible", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");

      const documentType = "Invoice";
      const fileName = "disputeSample1.pdf";
      cy.get("[data-cy=documentation-select]")
        .find("select")
        .select(`${documentType}`);
      cy.get("[data-cy=documentation-upload]").should("be.enabled");
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile(`${fileName}`);
      cy.wait(500);
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .should("contain.value", `${fileName}`);
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .then(($fileInput) => {
          // Get the display size of the file
          const fileSize = $fileInput.prop("files")[0].size;
          const bytesConverter = (bytes: number) => {
            if (bytes === 0) {
              return "0 Bytes";
            }
            const decimals = 2;
            const k = 1024;
            const sizes = [
              "Bytes",
              "KB",
              "MB",
              "GB",
              "TB",
              "PB",
              "EB",
              "ZB",
              "YB",
            ];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${
              sizes[i]
            }`;
          };
          const sizeDisplay = bytesConverter(fileSize);

          cy.get(
            `[data-cy=${fileName.substring(0, fileName.length - 4)}-display]`
          ).then(($el) => {
            cy.wrap($el)
              .should("contain.text", `${fileName}`)
              .and("contain.text", `${documentType}`);
            cy.wrap($el).should("contain.text", `${sizeDisplay}`);
          });
        });
    });

    it("File is removed when the X button is clicked", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      cy.get("[data-cy=documentation-select]")
        .find("select")
        .should("have.value", "");
      cy.get("[data-cy=documentation-upload]")
        .should("be.visible")
        .and("be.disabled");

      const fileName = "disputeSample1.pdf";
      cy.get("[data-cy=documentation-select]").find("select").select("invoice");
      cy.get("[data-cy=documentation-upload]").should("be.enabled");
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile(`${fileName}`);
      cy.wait(500);
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .should("contain.value", `${fileName}`);

      cy.get(`[data-cy=${fileName.substring(0, fileName.length - 4)}-display]`)
        .should("exist")
        .and("be.visible");
      cy.get(
        `[data-cy=${fileName.substring(0, fileName.length - 4)}-display]`
      ).should("contain.text", `${fileName}`);
      cy.get(`[data-cy=${fileName.substring(0, fileName.length - 4)}-display]`)
        .find("button")
        .click();
      cy.wait(500);
      cy.get(
        `[data-cy=${fileName.substring(0, fileName.length - 4)}-display]`
      ).should("not.exist");
    });

    it("Cannot upload more than 5 documents and an error is displayed if you try", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);

      const fileNames = [
        { filePath: "disputeSample1.pdf", fileName: "disputeSample1.pdf" },
        { filePath: "disputeSample2.png", fileName: "disputeSample2.png" },
        { filePath: "disputeSample3.jpg", fileName: "disputeSample3.jpg" },
        { filePath: "disputeSample4.pdf", fileName: "disputeSample4.pdf" },
        { filePath: "disputeSample5.pdf", fileName: "disputeSample5.pdf" },
        { filePath: "sample.pdf", fileName: "sample.pdf" },
      ];
      const docTypes = ["invoice", "contract"];
      // Attach the first 3 files
      cy.get("[data-cy=documentation-select]")
        .find("select")
        .select(`${docTypes[0]}`);
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile(fileNames[0])
        .attachFile(fileNames[1])
        .attachFile(fileNames[2]);
      cy.wait(5000);

      // Upload the next set of files
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .then(($el) => {
          const clearInput = new DataTransfer();
          $el.prop("files", clearInput.files);
          $el.val("");
          cy.get("[data-cy=documentation-select]")
            .find("select")
            .select(`${docTypes[1]}`);
          cy.get("[data-cy=documentation-upload]").click();
          cy.wrap($el).attachFile(fileNames[3]).attachFile(fileNames[4]);
          cy.wait(3000);

          // Try and upload the 6th file
          cy.get("[data-cy=hidden-file-input]")
            .find("input")
            .then(($el2) => {
              const clearIn = new DataTransfer();
              $el2.prop("files", clearIn.files);
              $el2.val("");
              cy.get("[data-cy=documentation-select]")
                .find("select")
                .select(`${docTypes[1]}`);
              cy.get("[data-cy=documentation-upload]").click();
              cy.wrap($el2).attachFile(fileNames[5]);
              cy.wait(5000);

              // Check for the error
              cy.get("[data-cy=challenge-dispute-error]")
                .should("exist")
                .and("be.visible");
              cy.get("[data-cy=challenge-dispute-error]").should(
                "have.text",
                "You may not upload more than 5 documents"
              );
            });
        });
    });

    it("Cannot upload the same document twice and an error is displayed if you try", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);
      // Attach the file
      cy.get("[data-cy=documentation-select]").find("select").select("invoice");
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile("disputeSample1.pdf");
      cy.wait(5000);

      // Upload duplicate file
      cy.get("[data-cy=documentation-select]")
        .find("select")
        .select("contract");
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile("disputeSample1.pdf");
      cy.wait(5000);
      // Check for the error
      cy.get("[data-cy=challenge-dispute-error]")
        .should("exist")
        .and("be.visible");
      cy.get("[data-cy=challenge-dispute-error]").should(
        "have.text",
        "You may not upload file disputeSample1.pdf twice"
      );
    });

    it("Redirects and a success banner displays after successfully submitting a challenge", () => {
      // Get to the challenge dispute page
      cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
      cy.get("[data-cy=challenge]").click();
      cy.wait(500);
      // Attach the file
      cy.get("[data-cy=documentation-select]").find("select").select("invoice");
      cy.get("[data-cy=documentation-upload]").click();
      cy.get("[data-cy=hidden-file-input]")
        .find("input")
        .attachFile("disputeSample1.pdf");
      cy.wait(500);

      // Add explanation
      cy.get("[data-cy=challenge-explanation]")
        .find("textarea")
        .type(
          "The payer is citing the wrong invoice. The attached invoice shows that the amount they were charged is correct."
        );
      cy.get("[data-cy=challenge-submit]").should("exist");
      cy.get("[data-cy=challenge-submit]")
        .scrollIntoView()
        .should("be.visible");
      cy.get("[data-cy=challenge-submit]").click();
      cy.wait(500);
      // Check that we've been redirected
      cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
      // Check for the banner
      cy.get("[data-cy=challenge-banner]").should(
        "contain.text",
        "Your challenge has been successfully submitted"
      );
    });

    it("After submitting a challenge, the row in the disputes table updates to the appropriate status", () => {
      cy.get("@activeDispute").then(($el) => {
        const index = $el.prop("rowIndex") - 1;
        // Get to the challenge dispute page
        cy.wait(5000);
        cy.get("[data-cy=challenge]").scrollIntoView().should("be.visible");
        cy.get("[data-cy=challenge]").click();
        cy.wait(500);
        // Attach the file
        cy.get("[data-cy=documentation-select]")
          .find("select")
          .select("invoice");
        cy.get("[data-cy=documentation-upload]").click();
        cy.get("[data-cy=hidden-file-input]")
          .find("input")
          .attachFile("disputeSample4.pdf");
        cy.get("[data-cy=documentation-select]")
          .find("select")
          .select("invoice");
        cy.wait(500);

        // Add explanation
        cy.get("[data-cy=challenge-explanation]")
          .find("textarea")
          .type(
            "The payer is citing the wrong invoice. The attached invoice shows that the amount they were charged is correct."
          );
        cy.get("[data-cy=challenge-submit]").should("exist");
        cy.get("[data-cy=challenge-submit]")
          .scrollIntoView()
          .should("be.visible");
        cy.get("[data-cy=challenge-submit]").click();
        cy.wait(500);

        cy.get("[data-cy=payment-disputes-tab]", { timeout: 20000 }).click();
        cy.getTableBodyAfterLoad("[data-cy=dispute-table-body]")
          .find("tr")
          .eq(index)
          .find("td")
          .eq(1)
          .should("have.text", "Challenged (Processing)");
      });
    });
  });
});
