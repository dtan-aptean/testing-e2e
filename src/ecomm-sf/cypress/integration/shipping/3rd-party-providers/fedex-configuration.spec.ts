/// <reference types="cypress" />
// TEST COUNT: 18

import { mainProductTwo } from "../../../support/setupCommands";

describe("Ecommerce", function () {
  context("FedEx Shipping Provider Configuration", () => {
    const provider = "FedEx";
    var originalConfiguration = [] as {inputType: string, inputValue: boolean | string | Array}[];

    before(() => {
      cy.prepForShipping(provider).then(() => {
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
      cy.resetShippingProviders().then(() => {
        cy.resetProviderConfig(provider, originalConfiguration);
      });
    });

    context("Subsection: All FedEx Methods", () => {
      it("FedEx methods will show in checkout according to shipping location when properly configured with all carrier services", () => {
        cy.allMethodsCheckout(provider);
      });

      it("FedEx methods will show on product page according to shipping location when properly configured with all carrier services", () => {
        cy.allMethodsProduct(provider);
      });
    });

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

    context("Subsection: Domestic FedEx methods with a product's additional shipping cost", () => {
      beforeEach(() => {
        cy.clearProductShipping(mainProductTwo).then(() => {
          cy.goToShippingProviders();
        });
      });

      it("FedEx domestic shipping prices in checkout will include an product's additional shipping cost", () => {
        cy.productChargeCheckout(provider, true);
      });

      it("FedEx domestic shipping prices on product page will include an product's additional shipping cost", () => {
        cy.productChargeProductPage(provider, true);
      });

      it("FedEx domestic shipping prices in checkout will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeCheckout(provider, true);
      });

      it("FedEx domestic shipping prices on product page will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeProductPage(provider, true);
      });
    });

    context("Subsection: International FedEx methods with a product's additional shipping cost", () => {
      beforeEach(() => {
        cy.clearProductShipping(mainProductTwo).then(() => {
          cy.goToShippingProviders();
        });
      });

      it("FedEx international shipping prices in checkout will include an product's additional shipping cost", () => {
        cy.productChargeCheckout(provider, false);
      });

      it("FedEx international shipping prices on product page will include an product's additional shipping cost", () => {
        cy.productChargeProductPage(provider, false);
      });

      it("FedEx international shipping prices in checkout will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeCheckout(provider, false);
      });

      it("FedEx international shipping prices on product page will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeProductPage(provider, false);
      });
    });

    // TODO: Tests for unique configs, currently expecting at least 7?
  });
});