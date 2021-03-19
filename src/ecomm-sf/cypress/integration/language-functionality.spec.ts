/// <reference types="cypress" />

import { mainCategory, mainProductOne, secondCategory } from "../support/setupCommands";

// TEST COUNT: 13

describe("Ecommerce", function () {
  context("Language Functionality", () => {
    const availableLanguages = [] as string[];
    before(() => {
      cy.checkAvailableLanguages().then((languages) => {
        languages.forEach((lang) => {
          availableLanguages.push(lang);
        });
        cy.storeLanguageProperties(languages);
      });
    });

    after(() => {
      cy.resetLanguages();
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    it("Changing the language updates the url in the public store", () => {
      const allLanguages = ["English"].concat(availableLanguages);
      cy.getSeoCodes(allLanguages).then((codes) => {
        cy.goToPublic();
        cy.wrap(allLanguages).each((lang, index, $languages) => {
          cy.switchLanguage(lang);
          cy.location("pathname").should("eq", `/${codes[index]}/`);
        }).then(() => {
          cy.switchLanguage();
        });
      });
    });

    it("Changing language overrides the standard", () => {
      cy.getVisibleMenu().should("contain.text", mainCategory);
      cy.getVisibleMenu().invoke("children").then(($li) => {
        const target = $li.filter((index, item) => {
          return item.innerText === mainCategory;
        })[0];
        const targetIndex = $li.index(target);
        cy.switchLanguage(availableLanguages[0]);
        cy.getVisibleMenu()
          .invoke("children")
          .eq(targetIndex)
          .invoke("prop", "innerText")
          .should("not.eql", mainCategory)
          .and("eql", `${mainCategory} (${availableLanguages[0]})`);
        cy.switchLanguage("English");
        cy.goToAdmin();
        cy.get(".content-header").should("contain.text", "Dashboard");
        cy.switchLanguage(availableLanguages[0]);
        cy.get(".content-header").should("not.contain.text", "Dashboard");
      });
    });

    it("Standard shows when a language doesn't have a translation", () => {
      cy.goToAdminCategory(secondCategory);
      cy.wait(2000);
      cy.get("#selected-tab-name-category-name-localized")
          .siblings("ul")
          .find("a")
          .contains(availableLanguages[1])
          .click();
      cy.wait(2000)
      cy.get("#category-name-localized")
          .find(".tab-pane.active")
          .find("input")
          .eq(0)
          .clear();
      cy.get("button[name=save]").click();
      cy.goToPublic();
      cy.getVisibleMenu().then(($el) => {
        cy.wrap($el).should("contain.text", secondCategory);
        const originalText = $el.text();
        cy.switchLanguage(availableLanguages[1]);
        cy.getVisibleMenu().then(($le) => {
          cy.wrap($le).should("contain.text", secondCategory);
          expect($le.text()).to.not.equal(originalText);
        });
      });
    });

    it("Switching language changes the labels in admin store", () => {
      cy.switchLanguage("English");
      cy.goToAdminProduct(mainProductOne);
      cy.switchLanguage(availableLanguages[0]);
      cy.get("#product-info-localized-standard-tab")
        .find(".form-group")
        .then(($divs) => {
          cy.wrap($divs[0])
            .find("label")
            .should("not.have.text", "Product name");
          const firstLabel = Cypress.$($divs[0]).find("label").text();
          cy.wrap($divs[1])
            .find("label")
            .should("not.have.text", "Short description");
          const secondLabel = Cypress.$($divs[1]).find("label").text();
          cy.wrap($divs[2])
            .find("label")
            .should("not.have.text", "Full description");
          const thirdLabel = Cypress.$($divs[2]).find("label").text();
          cy.switchLanguage();
          cy.get("#product-info-localized-standard-tab")
            .find(".form-group")
            .then(($formGroups) => {
              cy.wrap($formGroups[0])
                .find("label")
                .should("not.have.text", firstLabel)
                .and("have.text", "Product name");
              cy.wrap($formGroups[1])
                .find("label")
                .should("not.have.text", secondLabel)
                .and("have.text", "Short description");
              cy.wrap($formGroups[2])
                .find("label")
                .should("not.have.text", thirdLabel)
                .and("have.text", "Full description");
            });
        });
    });

    it("Changing the language updates the currency", () => {
      // Make sure that the language uses a specific currency
      cy.goToLanguages();
      const langFilter = (index, item) => {
        return item.cells[0].innerText === availableLanguages[0];
      };
      cy.findTableItem("#languages-grid", "#languages-grid_next", langFilter).then(($row) => {
        if ($row) {
          cy.wrap($row).find(".button-column").find("a").click();
          cy.wait(5000).then(() => {
            const selected = Cypress.$("#DefaultCurrencyId").prop("selectedOptions");
            const originalValue = selected[0].innerText;
            if (originalValue !== "Euro") {
              cy.get("#DefaultCurrencyId").select("Euro");
              cy.get("button[name=save]").click();
            }
          });
        }
      }).then(() => {
        cy.goToPublic();
        cy.goToProduct(mainProductOne);
        cy.wait(5000);
        cy.get(".product-price").then(($div) => {
          const orgPrice = $div[0].innerText;
          cy.switchLanguage(availableLanguages[0]);
          cy.wait(5000);
          cy.get(".product-price").then(($newDiv) => {
            const price = $newDiv[0].innerText;
            expect(price).to.not.eq(orgPrice);
            expect($newDiv[0]).to.not.contain.text(orgPrice.substring(0, 1));
            expect($newDiv[0]).to.contain.text("€");
            cy.switchLanguage("English");
          });
        });
      });
    });

    it("Changing from any language to any other language in the public store", () => {
      cy.getVisibleMenu().then(($en) => {
        const enMenu = $en.text();
        cy.switchLanguage(availableLanguages[1]);
        cy.getVisibleMenu().then(($hi) => {
          const hiMenu = $hi.text();
          expect(hiMenu).to.not.equal(enMenu);
          cy.switchLanguage(availableLanguages[0]);
          cy.getVisibleMenu().then(($de) => {
            const deMenu = $de.text();
            expect(deMenu).to.not.equal(enMenu);
            expect(deMenu).to.not.equal(hiMenu);
            cy.switchLanguage();
            cy.getVisibleMenu()
              .should("have.text", enMenu)
              .and("not.have.text", deMenu)
              .and("not.have.text", hiMenu);
            cy.switchLanguage(availableLanguages[0]);
            cy.getVisibleMenu()
              .should("have.text", deMenu)
              .and("not.have.text", enMenu)
              .and("not.have.text", hiMenu);
            cy.switchLanguage(availableLanguages[1]);
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
        cy.switchLanguage(availableLanguages[1]);
        cy.get(".content-header").then(($hi) => {
          const hiHeader = $hi.text();
          expect(hiHeader).to.not.equal(enHeader);
          cy.switchLanguage(availableLanguages[0]);
          cy.get(".content-header").then(($de) => {
            const deHeader = $de.text();
            expect(deHeader).to.not.equal(enHeader);
            expect(deHeader).to.not.equal(hiHeader);
            cy.switchLanguage();
            cy.get(".content-header")
              .should("have.text", enHeader)
              .and("not.have.text", deHeader)
              .and("not.have.text", hiHeader);
            cy.switchLanguage(availableLanguages[0]);
            cy.get(".content-header")
              .should("have.text", deHeader)
              .and("not.have.text", enHeader)
              .and("not.have.text", hiHeader);
            cy.switchLanguage(availableLanguages[1]);
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

    context("Subsection: Language display order", () => {
      it("Changing the language display order updates the table", () => {
        cy.goToLanguages();
        cy.get("#languages-grid")
          .find("tbody")
          .find("tr")
          .then(($list) => {
            var indexOne = $list.filter((index, item) => {
              return item.cells[0].innerText === availableLanguages[0];
            }).prop("rowIndex") - 1;
            var indexTwo = $list.filter((index, item) => {
                return item.cells[0].innerText === availableLanguages[1];
            }).prop("rowIndex") - 1;
            // Swap the languages
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // Check for the correct order
            cy.compareTableOrder(availableLanguages[0], indexTwo, availableLanguages[1], indexOne, $list);
            // Swap the languages back
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // compare order
            cy.compareTableOrder(availableLanguages[0], indexOne, availableLanguages[1], indexTwo, $list);
          });
      });

      it("Changing the language display order updates the dropdown in the public store", () => {
        cy.get("#customerlanguage")
          .find("option")
          .then(($options) => {
            var indexOne = $options.filter((index, item) => {
              return item.innerText === availableLanguages[0];
            }).prop("index");
            var indexTwo = $options.filter((index, item) => {
              return item.innerText === availableLanguages[1];
            }).prop("index");

            cy.goToLanguages();
            // Swap the languages
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // Check the public dropdown
            cy.goToPublic();
            cy.compareDropdownOrder(
              availableLanguages[0],
              indexTwo,
              availableLanguages[1],
              indexOne,
              $options
            );
            // reset the languages
            cy.goToLanguages();
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // Check the public dropdown
            cy.goToPublic();
            cy.compareDropdownOrder(
              availableLanguages[0],
              indexOne,
              availableLanguages[1],
              indexTwo,
              $options
            );
          });
      });

      it("Changing the language display order updates the dropdowns in the admin store", () => {
        cy.goToAdmin();
        cy.get("#customerlanguage")
          .find("option")
          .then(($options) => {
            var indexOne = $options.filter((index, item) => {
              return item.innerText === availableLanguages[0];
            }).prop("index");
            var indexTwo = $options.filter((index, item) => {
              return item.innerText === availableLanguages[1];
            }).prop("index");

            cy.goToLanguages();
            // Swap the languages
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // Check the dropdown
            cy.compareDropdownOrder(
              availableLanguages[0],
              indexTwo,
              availableLanguages[1],
              indexOne,
              $options
            );
            // reset the languages
            cy.goToLanguages();
            cy.swapOrder(availableLanguages[0], availableLanguages[1]);
            // Check the dropdown
            cy.compareDropdownOrder(
              availableLanguages[0],
              indexOne,
              availableLanguages[1],
              indexTwo,
              $options
            );
          });
      });
    });

    context.only("Subsection: Language publicity", () => {
      // Make sure that the languages are publishe before these tests run
      // Makes sure that if one of these fails, it doesn't affect the others
      beforeEach(() => {
        cy.goToLanguages();
        cy.wrap(availableLanguages).each((langName) => {
          cy.publishLanguage(langName);
        });
      });

      it("Publishing and unpublishing a language updates the table", () => {
        var testLanguage = availableLanguages[Cypress._.random(0, availableLanguages.length - 1)];      
        cy.goToLanguages();
        cy.get("#languages-grid")
          .find("tbody")
          .find("tr")
          .then(($rows) => {
            var index = $rows.filter((index, item) => {
              return item.cells[0].innerText === testLanguage;
            }).prop("rowIndex") - 1;
            cy.unpublishLanguage(testLanguage);
            // Check that the table has updated.
            cy.get("#languages-grid")
              .find("tbody")
              .find("tr")
              .eq(index)
              .should("contain.html", "false-icon")
              .and("not.contain.html", "true-icon");
            // Republish the language
            cy.publishLanguage(testLanguage);
            // Check that the table updated
            cy.get("#languages-grid")
              .find("tbody")
              .find("tr")
              .eq(index)
              .should("contain.html", "true-icon")
              .and("not.contain.html", "false-icon");
          });
      });

      it("Unpublished languages no longer show in admin store dropdowns", () => {
        var testLanguage = availableLanguages[Cypress._.random(0, availableLanguages.length - 1)];      
        cy.goToLanguages();
        cy.unpublishLanguage(testLanguage);
        cy.get("#customerlanguage")
          .find("option")
          .each(($el, index, $list) => {
            cy.wrap($el).should("not.have.text", testLanguage);
          });
        // Republish the language
        cy.publishLanguage(testLanguage);
        cy.get("#customerlanguage")
          .find("option")
          .should("contain.text", testLanguage);
      });

      it("Unpublished languages no longer show in public store dropdowns", () => {
        var testLanguage = availableLanguages[Cypress._.random(0, availableLanguages.length - 1)];
        cy.goToLanguages();
        cy.unpublishLanguage(testLanguage);
        cy.goToPublic();
        cy.get("#customerlanguage")
          .find("option")
          .each(($el, index, $list) => {
            cy.wrap($el).should("not.have.text", testLanguage);
          });
        // Republish the language
        cy.goToLanguages();
        cy.publishLanguage(testLanguage);
        cy.goToPublic();
        cy.get("#customerlanguage")
          .find("option")
          .should("contain.text", testLanguage);
      });
    });
  });
});
