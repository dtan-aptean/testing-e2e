/// <reference types="cypress" />

const clickConfigure = (row) => {
  return cy.wrap(row).find("a").contains("Configure").click();
};

const clickBack = () => {
  return cy.get(".content-header").find("small").find("a").click();
};

const clickSave = () => {
  return cy.get("input[name=save]").click();
};

describe.only("Ecommerce", function () {
  context("Shipping Provider Configuration", () => {
    var providerNames = [] as string[];
    before(() => {
      cy.checkAvailableShippers().then((providers) => {
        providerNames = providers;
      });
      // TODO
      // Log original configuration? Would require picking a single provider to work with.
      // Alternative: Log original configuration in each test.
      // Would require either a unique provider for each test, or for each test to check if there's an existing logged config
      // Already a problem with configuration affecting later tests
      // Could solve that by resetting config in afterEach or beforeEach instead of after (b4Each is better practice)
      // Maybe need a stronger idea of all the Config tests before making any decisions about this
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.goToShippingProviders();
    });

    after(() => {
      // TODO
      // Set original configurations back
    });

    it("Clicking the 'Configure' button sends the user to a page specific to the provider", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");
          cy.contains(`Configure - ${provider}`).should("exist").and("be.visible");
          
          // TODO: Check the fields for containing the provider names?
        });
      });
    });

    it("Clicking the 'Back to list' button sends the user back to the shipping provider list", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          clickBack().then(() => {
            cy.wait(1000);
            cy.location("pathname").should("eql", "/Admin/Shipping/Providers");
          });
        });
      });
    });

    it("Clicking the 'Back to list' button after changes have been made does not save those changes", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          cy.get(".content").find("input[type=checkbox]").eq(0).then(($el) => {
            const orgVal = $el.prop("checked");
            cy.wrap($el).toggle();
            cy.get("#AdditionalHandlingCharge").then(($inp) => {
              const orgCharge = $inp.val();
              cy.wrap($inp).clear().type("5.00");
              clickBack().then(() => {
                cy.allowLoad();
                cy.findShippingProvider(provider).then((rowTwo) => {
                  clickConfigure(rowTwo).then(() => {
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
      });
    });

    // TODO: Test for saving changes

    // TODO: Tests for specific effects of individual configurations

    // TODO: Tests for configuring Manual, which seems to be a very different page. Could be its own suite?
  });
});