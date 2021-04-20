/// <reference types="cypress" />

describe("Ecommerce", function () {
  context("FedEx Shipping Provider Configuration", () => {
    const provider = "FedEx";
    var originalConfiguration = [] as {inputType: string, inputValue: boolean | string | Array}[];

    before(() => {
      cy.visit("/");
      cy.login();
      cy.setShippingOrigin().then(() => {
        cy.saveProviderConfiguration(provider).then((configValues) => {
          originalConfiguration = configValues;
        });
      });
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.clearCart();
      cy.goToShippingProviders();
    });

    after(() => {
      cy.visit("/");
      cy.login();
      cy.clearCart();
      cy.resetProviderConfig(provider, originalConfiguration);
    });

    // TODO: Test for enabling all methods and expecting checkout to only show some of them, based on shipping location

    // TODO: Test for enabling all methods and expecting product page to only show some of them, based on shipping location

    context("Subsection: Domestic FedEx methods", () => {
      it("FedEx methods will show in checkout when properly configured with domestic carrier services", () => {
        cy.methodsPresentCheckout(provider, true);
      });

      it("FedEx methods will show on product page when properly configured with domestic carrier services", () => {
        cy.methodsPresentProductPage(provider, true);
      });

      it("FedEx domestic shipping prices in checkout will increase when an additional shipping charge is configured", () => {
        cy.providerChargeCheckout(provider, true);
      });

      it("FedEx domestic shipping prices on product page will increase when an additional shipping charge is configured", () => {
        cy.providerChargeProduct(provider, true);
      });
    });

    context("Subsection: International FedEx methods", () => {
      it("FedEx methods will show in checkout when properly configured with international carrier services", () => {
        cy.methodsPresentCheckout(provider, false);
      });

      it("FedEx methods will show on product page when properly configured with international carrier services", () => {
        cy.methodsPresentProductPage(provider, false);
      });

      it("FedEx international shipping prices in checkout will increase when an additional shipping charge is configured", () => {
        cy.providerChargeCheckout(provider, false);
      });

      it("FedEx international shipping prices on product page will increase when an additional shipping charge is configured", () => {
        cy.providerChargeProduct(provider, false);
      });
    });

    // TODO: Tests for unique configs, currently expecting at least 7?
  });
});