/// <reference types="cypress" />

describe("Ecommerce", function () {
  context("Language Functionality", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    it("Changigng language overrides the standard", () => {
      cy.getVisibleMenu().should("contain.text", "Cypress Trees");
      cy.switchLanguage("Deutsch");
      cy.getVisibleMenu()
        .should("not.contain.text", "Cypress Trees")
        .and("contain.text", "Zypressen");
      cy.switchLanguage("English");
      cy.goToAdmin();
      cy.get(".content-header").should("contain.text", "Dashboard");
      cy.switchLanguage("Deutsch");
      cy.get(".content-header")
        .should("not.contain.text", "Dashboard")
        .and("contain.text", "Übersicht");
    });

    it("Standard shows when a language doesn't have a translation", () => {
      cy.getVisibleMenu().then(($el) => {
        cy.wrap($el).should("contain.text", "Cypress Trees");
        const originalText = $el.text();
        cy.switchLanguage("Hindi");
        cy.getVisibleMenu().then(($le) => {
          cy.wrap($le).should("contain.text", "Cypress Trees");
          expect($le.text()).to.not.equal(originalText);
        });
      });
    });

    it("Changing from any language to any other language in the public store", () => {
      cy.getVisibleMenu().then(($en) => {
        const enMenu = $en.text();
        cy.switchLanguage("Hindi");
        cy.getVisibleMenu().then(($hi) => {
          const hiMenu = $hi.text();
          expect(hiMenu).to.not.equal(enMenu);
          cy.switchLanguage("Deutsch");
          cy.getVisibleMenu().then(($de) => {
            const deMenu = $de.text();
            expect(deMenu).to.not.equal(enMenu);
            expect(deMenu).to.not.equal(hiMenu);
            cy.switchLanguage();
            cy.getVisibleMenu()
              .should("have.text", enMenu)
              .and("not.have.text", deMenu)
              .and("not.have.text", hiMenu);
            cy.switchLanguage("Deutsch");
            cy.getVisibleMenu()
              .should("have.text", deMenu)
              .and("not.have.text", enMenu)
              .and("not.have.text", hiMenu);
            cy.switchLanguage("Hindi");
            cy.getVisibleMenu()
              .should("have.text", hiMenu)
              .and("not.have.text", deMenu)
              .and("not.have.text", enMenu);
            cy.switchLanguage();
            cy.getVisibleMenu()
              .should("have.text", enMenu)
              .and("not.have.text", hiMenu)
              .and("not.have.text", deMenu);
          });
        });
      });
    });

    it("Changing from any language to any other language in the admin store", () => {
      cy.goToAdmin();
      cy.get(".content-header").then(($en) => {
        const enHeader = $en.text();
        cy.switchLanguage("Hindi");
        cy.get(".content-header").then(($hi) => {
          const hiHeader = $hi.text();
          expect(hiHeader).to.not.equal(enHeader);
          cy.switchLanguage("Deutsch");
          cy.get(".content-header").then(($de) => {
            const deHeader = $de.text();
            expect(deHeader).to.not.equal(enHeader);
            expect(deHeader).to.not.equal(hiHeader);
            cy.switchLanguage();
            cy.get(".content-header")
              .should("have.text", enHeader)
              .and("not.have.text", deHeader)
              .and("not.have.text", hiHeader);
            cy.switchLanguage("Deutsch");
            cy.get(".content-header")
              .should("have.text", deHeader)
              .and("not.have.text", enHeader)
              .and("not.have.text", hiHeader);
            cy.switchLanguage("Hindi");
            cy.get(".content-header")
              .should("have.text", hiHeader)
              .and("not.have.text", deHeader)
              .and("not.have.text", enHeader);
            cy.switchLanguage();
            cy.get(".content-header")
              .should("have.text", enHeader)
              .and("not.have.text", hiHeader)
              .and("not.have.text", deHeader);
          });
        });
      });
    });

    it("Changing the language display order updates the dropdowns", () => {
      cy.get("#customerlanguage")
        .find("option")
        .then(($options) => {
          var enIndex: number;
          var ausIndex: number;
          var hiIndex: number;
          var deIndex: number;
          for (var i = 0; i < $options.length; i++) {
            if ($options[i].innerText === "English") {
              enIndex = i;
            } else if ($options[i].innerText === "English, Australia") {
              ausIndex = i;
            } else if ($options[i].innerText === "Hindi") {
              hiIndex = i;
            } else if ($options[i].innerText === "Deutsch") {
              deIndex = i;
            }
          }
          cy.goToAdmin();
          cy.get("#customerlanguage")
            .find("option")
            .then(($admOptions) => {
              cy.wrap($admOptions[enIndex]).should("contain.text", "English");
              cy.wrap($admOptions[ausIndex]).should(
                "contain.text",
                "English, Australia"
              );
              cy.wrap($admOptions[hiIndex]).should("contain.text", "Hindi");
              cy.wrap($admOptions[deIndex]).should("contain.text", "Deutsch");

              cy.goToLanguages();
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .eq(0)
                .find("td")
                .contains("Edit")
                .click();
              cy.wait(500);
              cy.get("#DisplayOrder").siblings(".k-input").clear();
              cy.get("#DisplayOrder").type("3");
              cy.get('button[name="save"]').click();
              cy.wait(500);
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .eq(2)
                .find("td")
                .contains("Edit")
                .click();
              cy.wait(500);
              cy.get("#DisplayOrder").siblings(".k-input").clear();
              cy.get("#DisplayOrder").type("1");
              cy.get('button[name="save"]').click();
              cy.wait(500);
              // Check that the order has updated.
              cy.get("#customerlanguage")
                .find("option")
                .then(($newAdmOpt) => {
                  cy.wrap($newAdmOpt[enIndex])
                    .should("not.contain.text", "English")
                    .and("contain.text", "Hindi");
                  cy.wrap($newAdmOpt[ausIndex]).should(
                    "contain.text",
                    "English, Australia"
                  );
                  cy.wrap($newAdmOpt[hiIndex])
                    .should("not.contain.text", "Hindi")
                    .and("contain.text", "English");
                  cy.wrap($newAdmOpt[deIndex]).should(
                    "contain.text",
                    "Deutsch"
                  );
                  cy.goToPublic();
                  cy.get("#customerlanguage")
                    .find("option")
                    .then(($newOptions) => {
                      cy.wrap($newOptions[enIndex])
                        .should("not.contain.text", "English")
                        .and("contain.text", "Hindi");
                      cy.wrap($newOptions[ausIndex]).should(
                        "contain.text",
                        "English, Australia"
                      );
                      cy.wrap($newOptions[hiIndex])
                        .should("not.contain.text", "Hindi")
                        .and("contain.text", "English");
                      cy.wrap($newOptions[deIndex]).should(
                        "contain.text",
                        "Deutsch"
                      );
                      // Set it back to the original order
                      cy.goToAdmin();
                      cy.goToLanguages();
                      cy.get("#languages-grid")
                        .find("tbody")
                        .find("tr")
                        .eq(0)
                        .find("td")
                        .contains("Edit")
                        .click();
                      cy.wait(500);
                      cy.get("#DisplayOrder").siblings(".k-input").clear();
                      cy.get("#DisplayOrder").type("3");
                      cy.get('button[name="save"]').click();
                      cy.wait(500);
                      cy.get("#languages-grid")
                        .find("tbody")
                        .find("tr")
                        .eq(1)
                        .find("td")
                        .contains("Edit")
                        .click();
                      cy.wait(500);
                      cy.get("#DisplayOrder").siblings(".k-input").clear();
                      cy.get("#DisplayOrder").type("1");
                      cy.get('button[name="save"]').click();
                      cy.wait(500);
                    });
                });
            });
        });
    });

    it("Unpublished languages no longer show in dropdowns", () => {
      cy.goToAdmin();
      cy.goToLanguages();
      cy.wait(1000);
      // Find published rows
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($el) => {
          // returns the rows that are published - looks for the checkmark
          const eligibleRows = $el.filter((index, item) => {
            return item.innerHTML.includes("true-icon");
          });
          // It's assumed there will always be one published language
          expect(eligibleRows.length).to.be.gte(1);
          // Find a random row to unpublish
          const index = Cypress._.random(0, eligibleRows.length - 1);
          const trueIndex = eligibleRows[index].rowIndex - 1; // The index of the row in the full table
          cy.wrap(eligibleRows[index])
            .find("td")
            .then(($cells) => {
              // Grab the language name and unpublish it
              const language = $cells[0].innerText;
              cy.wrap($cells[5]).click();
              cy.wait(500);
              cy.get("#Published").should("have.attr", "checked");
              cy.get("#Published").uncheck();
              cy.get('button[name="save"]').click();
              cy.wait(500);
              // Check that the table updated
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .eq(trueIndex)
                .should("contain.html", "false-icon")
                .and("not.contain.html", "true-icon");
              // Check that this language doesn't show up in dropdowns
              cy.get("#customerlanguage")
                .find("option")
                .should("not.contain.text", language);
              cy.goToPublic();
              cy.get("#customerlanguage")
                .find("option")
                .should("not.contain.text", language);
              // Now re-publish the language
              cy.goToAdmin();
              cy.goToLanguages();
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .eq(trueIndex)
                .find("td")
                .contains("Edit")
                .click();
              cy.get("#Published").should("not.have.attr", "checked");
              cy.get("#Published").check();
              cy.get('button[name="save"]').click();
              cy.wait(500);
              // Check that the table updated
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .eq(trueIndex)
                .should("contain.html", "true-icon")
                .and("not.contain.html", "false-icon");
              // Check that the dropdowns updated
              cy.get("#customerlanguage")
                .find("option")
                .should("contain.text", language);
              cy.goToPublic();
              cy.get("#customerlanguage")
                .find("option")
                .should("contain.text", language);
            });
        });
    });
  });
});
