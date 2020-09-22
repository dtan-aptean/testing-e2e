/// <reference types="cypress" />

describe("Ecommerce", function () {
  context("Language Functionality", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    it("Changing the language updates the url in the public store", () => {
      cy.getSeoCodes();
      cy.get("@seoCodes").then(($codes) => {
        expect($codes.length).to.eq(4);
        cy.goToPublic();
        cy.switchLanguage("English");
        cy.location("pathname").should("eq", `/${$codes[0]}/`);
        cy.switchLanguage("English, Australia");
        cy.location("pathname").should("eq", `/${$codes[1]}/`);
        cy.switchLanguage("Hindi");
        cy.location("pathname").should("eq", `/${$codes[2]}/`);
        cy.switchLanguage("Deutsch");
        cy.location("pathname").should("eq", `/${$codes[3]}/`);
        cy.switchLanguage();
      });
    });

    it("Changing language overrides the standard", () => {
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

    it("Changing the language display order updates the table", () => {
      cy.goToAdmin();
      cy.goToLanguages();
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($list) => {
          const indexOne = Cypress._.random(0, $list.length - 1);
          const indexTwo =
            indexOne > $list.length / 2 - 1
              ? Cypress._.random(0, indexOne - 1)
              : Cypress._.random(indexOne + 1, $list.length - 1);
          const langOne = $list[indexOne].cells[0].innerText;
          const langTwo = $list[indexTwo].cells[0].innerText;
          // Swap the languages
          cy.swapOrder(langOne, langTwo);
          // Check for the correct order
          cy.compareTableOrder(langOne, indexTwo, langTwo, indexOne, $list);
          // Swap the languages back
          cy.swapOrder(langOne, langTwo);
          // compare order
          cy.compareTableOrder(langOne, indexOne, langTwo, indexTwo, $list);
        });
    });

    it("Changing the language display order updates the dropdown in the public store", () => {
      cy.get("#customerlanguage")
        .find("option")
        .then(($options) => {
          const indexOne = Cypress._.random(0, $options.length - 1);
          const indexTwo =
            indexOne > $options.length / 2 - 1
              ? Cypress._.random(0, indexOne - 1)
              : Cypress._.random(indexOne + 1, $options.length - 1);
          const langOne = $options[indexOne].innerText;
          const langTwo = $options[indexTwo].innerText;
          cy.goToAdmin();
          cy.goToLanguages();
          // Swap the languages
          cy.swapOrder(langOne, langTwo);
          // Check the public dropdown
          cy.goToPublic();
          cy.compareDropdownOrder(
            langOne,
            indexTwo,
            langTwo,
            indexOne,
            $options
          );
          // reset the languages
          cy.goToAdmin();
          cy.goToLanguages();
          cy.swapOrder(langOne, langTwo);
          // Check the public dropdown
          cy.goToPublic();
          cy.compareDropdownOrder(
            langOne,
            indexOne,
            langTwo,
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
          const indexOne = Cypress._.random(0, $options.length - 1);
          const indexTwo =
            indexOne > $options.length / 2 - 1
              ? Cypress._.random(0, indexOne - 1)
              : Cypress._.random(indexOne + 1, $options.length - 1);
          const langOne = $options[indexOne].innerText;
          const langTwo = $options[indexTwo].innerText;
          cy.goToLanguages();
          // Swap the languages
          cy.swapOrder(langOne, langTwo);
          // Check the dropdown
          cy.compareDropdownOrder(
            langOne,
            indexTwo,
            langTwo,
            indexOne,
            $options
          );
          // reset the languages
          cy.goToLanguages();
          cy.swapOrder(langOne, langTwo);
          // Check the dropdown
          cy.compareDropdownOrder(
            langOne,
            indexOne,
            langTwo,
            indexTwo,
            $options
          );
        });
    });

    it("Publishing and unpublishing a language updates the table", () => {
      cy.goToAdmin();
      cy.goToLanguages();
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($el) => {
          // returns the rows that are published - looks for the checkmark
          const eligibleRows = $el.filter((index, item) => {
            return item.innerHTML.includes("true-icon");
          });
          expect(eligibleRows.length).to.be.gte(1);
          // Find a random row to unpublish
          const index = Cypress._.random(0, eligibleRows.length - 1);
          const trueIndex = eligibleRows[index].rowIndex - 1; // The index of the row in the full table
          cy.unpublishLanguage(trueIndex);
          // Check that the table has updated.
          cy.get("#languages-grid")
            .find("tbody")
            .find("tr")
            .eq(trueIndex)
            .should("contain.html", "false-icon")
            .and("not.contain.html", "true-icon");
          // Republish the language
          cy.get("@languageName").then((languageName) => {
            cy.publishLanguage(languageName);
            // Check that the table updated
            cy.get("#languages-grid")
              .find("tbody")
              .find("tr")
              .eq(trueIndex)
              .should("contain.html", "true-icon")
              .and("not.contain.html", "false-icon");
          });
        });
    });

    it("Unpublished languages no longer show in admin store dropdowns", () => {
      cy.goToAdmin();
      cy.unpublishLanguage();
      cy.get("@languageName").then((languageName) => {
        cy.get("#customerlanguage")
          .find("option")
          .each(($el, index, $list) => {
            cy.wrap($el).should("not.have.text", languageName);
          });
        // Republish the language
        cy.publishLanguage(languageName);
        cy.get("#customerlanguage")
          .find("option")
          .should("contain.text", languageName);
      });
    });

    it("Unpublished languages no longer show in public store dropdowns", () => {
      cy.unpublishLanguage();
      cy.goToPublic();
      cy.get("@languageName").then((languageName) => {
        cy.get("#customerlanguage")
          .find("option")
          .each(($el, index, $list) => {
            cy.wrap($el).should("not.have.text", languageName);
          });
        // Republish the language
        cy.publishLanguage(languageName);
        cy.goToPublic();
        cy.get("#customerlanguage")
          .find("option")
          .should("contain.text", languageName);
      });
    });
  });
});
