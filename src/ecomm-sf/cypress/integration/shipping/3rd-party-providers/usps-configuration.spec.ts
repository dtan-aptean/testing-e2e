/// <reference types="cypress" />
// TEST COUNT: 18

import { mainProductTwo } from "../../../support/setupCommands";

describe("Ecommerce", function () {
  context("USPS Shipping Provider Configuration", () => {
    const provider = "USPS (US Postal Service)";
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

    context("Subsection: All USPS Methods", () => {
      it("USPS methods will show in checkout according to shipping location when properly configured with all carrier services", () => {
        cy.allMethodsCheckout(provider);
      });

      it("USPS methods will show on product page according to shipping location when properly configured with all carrier services", () => {
        cy.allMethodsProduct(provider);
      });
    });

    context("Subsection: Domestic USPS methods", () => {
      it("USPS methods will show in checkout when properly configured with domestic carrier services", () => {
        cy.methodsPresentCheckout(provider, true);
      });

      it("USPS methods will show on product page when properly configured with domestic carrier services", () => {
        cy.methodsPresentProductPage(provider, true);
      });

      it("USPS domestic shipping prices in checkout will increase when an additional shipping charge is configured", () => {
        cy.providerChargeCheckout(provider, true);
      });

      it("USPS domestic shipping prices on product page will increase when an additional shipping charge is configured", () => {
        cy.providerChargeProduct(provider, true);
      });
    });

    context("Subsection: International USPS methods", () => {
      it("USPS methods will show in checkout when properly configured with international carrier services", () => {
        cy.methodsPresentCheckout(provider, false);
      });
    
      it("USPS methods will show on product page when properly configured with international carrier services", () => {
        cy.methodsPresentProductPage(provider, false);
      });

      it("USPS international shipping prices in checkout will increase when an additional shipping charge is configured", () => {
        cy.providerChargeCheckout(provider, false);
      });

      it("USPS international shipping prices on product page will increase when an additional shipping charge is configured", () => {
        cy.providerChargeProduct(provider, false);
      });
    });

    context("Subsection: Domestic USPS methods with a product's additional shipping cost", () => {
      beforeEach(() => {
        cy.clearProductShipping(mainProductTwo).then(() => {
          cy.goToShippingProviders();
        });
      });

      it("USPS domestic shipping prices in checkout will include an product's additional shipping cost", () => {
        cy.productChargeCheckout(provider, true);
      });

      it("USPS domestic shipping prices on product page will include an product's additional shipping cost", () => {
        cy.productChargeProductPage(provider, true);
      });

      it("USPS domestic shipping prices in checkout will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeCheckout(provider, true);
      });

      it("USPS domestic shipping prices on product page will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeProductPage(provider, true);
      });
    });

    context("Subsection: International USPS methods with a product's additional shipping cost", () => {
      beforeEach(() => {
        cy.clearProductShipping(mainProductTwo).then(() => {
          cy.goToShippingProviders();
        });
      });

      it("USPS international shipping prices in checkout will include an product's additional shipping cost", () => {
        cy.productChargeCheckout(provider, false);
      });

      it("USPS international shipping prices on product page will include an product's additional shipping cost", () => {
        cy.productChargeProductPage(provider, false);
      });

      it("USPS international shipping prices in checkout will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeCheckout(provider, false);
      });

      it("USPS international shipping prices on product page will include an product's additional shipping cost and the provider's additional cost", () => {
        cy.productProviderChargeProductPage(provider, false);
      });
    });
  });
});