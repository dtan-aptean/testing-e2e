/// <reference types="cypress" />
// TEST COUNT: 4

describe("Ecommerce", function () {
  context("Shipping Provider Configuration", () => {
    var providerNames = [] as string[];
    var alteredProvider = "";
    var altProvOriginalConfigs = [] as {inputType: string, inputValue: boolean | string | Array}[];

    before(() => {
      cy.checkAvailableShippers().then((providers) => {
        providerNames = providers.filter((prov) => {
          return !prov.includes("Manual");
        });
      });
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.goToShippingProviders();
    });

    after(() => {
      if (alteredProvider !== "" && altProvOriginalConfigs !== []) {
        cy.visit("/");
        cy.login();
        cy.resetProviderConfig(alteredProvider, altProvOriginalConfigs);
      }
    });

    it("Clicking the 'Configure' button sends the user to a page specific to the provider", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
        cy.wait(1000);
        cy.location("pathname").should("contain", "Configure");
        cy.contains(`Configure - ${provider}`).should("exist").and("be.visible");
      });
    });

    it("Clicking the 'Back to list' button sends the user back to the shipping provider list", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
        cy.wait(1000);
        cy.location("pathname").should("contain", "Configure");

        cy.clickBack().then(() => {
          cy.wait(1000);
          cy.location("pathname").should("eql", "/Admin/Shipping/Providers");
        });
      });
    });

    it("Clicking the 'Back to list' button after changes have been made does not save those changes", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
        cy.wait(1000);
        cy.location("pathname").should("contain", "Configure");

        cy.get(".content").find("input[type=checkbox]").eq(0).then(($el) => {
          const orgVal = $el.prop("checked");
          cy.wrap($el).toggle();
          cy.get("#AdditionalHandlingCharge").then(($inp) => {
            const orgCharge = $inp.val();
            cy.wrap($inp).clear({ force: true }).type("5.00", { force: true });
            cy.clickBack().then(() => {
              cy.allowLoad();
              cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
                cy.wait(1000);
                cy.get(".content")
                  .find("input[type=checkbox]")
                  .eq(0)
                  .invoke("prop", "checked")
                  .should("eql", orgVal)
                  .and("not.eql", !orgVal);
                cy.get("#AdditionalHandlingCharge")
                  .should("have.value", orgCharge)
                  .and("not.have.value", "5.00");
              });
            });
          });
        });
      });
    });

    it("Clicking the 'Save' button after changes have been made will save those changes", () => {
      alteredProvider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.saveProviderConfiguration(alteredProvider).then((configValues) => {
        altProvOriginalConfigs = configValues;
        cy.findShippingProvider(alteredProvider).clickRowBtn("Configure").then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          cy.get(".content").find("input[type=checkbox]").eq(0).then(($el) => {
            const orgVal = $el.prop("checked");
            cy.wrap($el).toggle();
            cy.get("#AdditionalHandlingCharge").then(($inp) => {
              const orgCharge = $inp.val();
              cy.wrap($inp).clear({ force: true }).type("5.00", { force: true });
              cy.clickSave().then(() => {
                cy.allowLoad();
                cy.get(".alert")
                  .should("exist")
                  .and("be.visible")
                  .and("contain.text", "The plugin has been updated successfully");
                cy.wait(1000);
                cy.get(".content")
                  .find("input[type=checkbox]")
                  .eq(0)
                  .invoke("prop", "checked")
                  .should("eql", !orgVal)
                  .and("not.eql", orgVal);
                cy.get("#AdditionalHandlingCharge")
                  .should("have.value", "5")
                  .and("not.have.value", orgCharge);
              });
            });
          });
        });
      });
    });
  });
});