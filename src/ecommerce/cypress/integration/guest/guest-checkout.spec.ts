/// <reference types="cypress" />

describe("Ecommere", function () {
  context("Guest Checkout", () => {
    beforeEach(() => {
      cy.visit("/");
    });

    it("Clicking the Cypress trees category brings us to the appropriate page", () => {
      cy.get(".top-menu.notmobile").then(($el) => {
        if ($el.css("display") === "none") {
          cy.get(".menu-toggle").click();
          cy.wait(500);
          cy.get(".top-menu.mobile")
            .find("li")
            .contains("Cypress Trees")
            .as("mobileCypress");
          cy.get("@mobileCypress")
            .should("be.visible")
            .and("have.attr", "href");
          cy.get("@mobileCypress").then(($li) => {
            const href = $li.attr("href");
            const correctLocation = href?.includes("/en/cypress");
            cy.expect(correctLocation).to.equal(true);
            cy.wrap($li).click();
          });
        } else {
          cy.wrap($el)
            .find("li")
            .contains("Cypress Trees")
            .as("desktopCypress");
          cy.get("@desktopCypress")
            .should("be.visible")
            .and("have.attr", "href");
          cy.get("@desktopCypress").then(($li) => {
            const href = $li.attr("href");
            const correctLocation = href?.includes("/en/cypress");
            cy.expect(correctLocation).to.equal(true);
            cy.wrap($li).click();
          });
        }
        cy.wait(500);
        cy.location("pathname").should("eq", "/en/cypress");
        cy.get(".page.category-page").should("contain.text", "Cypress Trees");
      });
    });

    it("Clicking the product image brings us to the product page", () => {
      cy.goToCategory();
      cy.location("pathname").should("eq", "/en/cypress");
      cy.get(".page.category-page").should("contain.text", "Cypress Trees");
      cy.get(".item-box").eq(0).as("targetProduct");
      cy.get("@targetProduct")
        .find(".picture")
        .scrollIntoView()
        .should("be.visible");
      cy.get("@targetProduct")
        .find(".picture")
        .find("a")
        .then(($link) => {
          const href = $link.attr("href");
          cy.get("@targetProduct").find(".picture").click();
          cy.wait(500);
          cy.location("pathname").should("eq", href);
        });
    });

    it("Clicking the product title brings us to the product page", () => {
      cy.goToCategory();
      cy.location("pathname").should("eq", "/en/cypress");
      cy.get(".page.category-page").should("contain.text", "Cypress Trees");
      cy.get(".item-box").eq(0).as("targetProduct");
      cy.get("@targetProduct")
        .find(".details")
        .scrollIntoView()
        .should("be.visible");
      cy.get("@targetProduct")
        .find(".product-title")
        .find("a")
        .then(($link) => {
          const href = $link.attr("href");
          cy.wrap($link).click();
          cy.wait(500);
          cy.location("pathname").should("eq", href);
        });
    });

    it("Clicking Add to Cart successfully adds a product to the cart", () => {
      cy.goToProduct("Bald Cypress");
      // Get the name of the product
      cy.get(".product-name").then(($h1) => {
        const product = $h1.text();
        // Get current amount of shopping cart
        cy.get(".header-links")
          .find(".cart-qty")
          .then(($amt) => {
            const quantity = $amt.text();
            cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
            cy.get(".add-to-cart-button").click();
            // Check for the success banner
            cy.wait(500);
            cy.get(".bar-notification.success")
              .find(".content")
              .should(
                "contain.text",
                "The product has been added to your shopping cart"
              );
            cy.get(".header-links")
              .find(".ico-cart")
              .then(($cartLink) => {
                const qty = $cartLink.children()[1];
                expect(qty.innerText).to.not.eq(quantity);
                cy.wrap($cartLink).click();
                cy.wait(500);
                // Check and see if the item's in the cart
                cy.get(".cart").should("contain.text", product);
              });
          });
      });
    });

    it("Removing an item from the cart successfully removes it", () => {
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".add-to-cart-button").click();
      cy.wait(500);
      // Get current amount of shopping cart
      cy.get(".header-links")
        .find(".cart-qty")
        .then(($amt) => {
          const quantity = $amt.text();
          cy.get(".header-links").find(".ico-cart").click();
          cy.wait(500);
          cy.get(".remove-from-cart").find("input").check();
          cy.get(".update-cart-button").click();
          cy.wait(500);
          cy.contains("Your Shopping Cart is empty!");
          cy.get(".header-links")
            .find(".cart-qty")
            .then(($qty) => {
              expect($qty.text()).to.not.eq(quantity);
            });
        });
    });

    it("Clicking checkout without agreeing to TOS prevents checkout", () => {
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".add-to-cart-button").click();
      cy.goToCart();
      cy.get(".checkout-button").click();
      cy.get("#terms-of-service-warning-box").should("exist").and("be.visible");
    });

    it("Accepting TOS and clicking checkout brings us to a sign in page", () => {
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".add-to-cart-button").click();
      cy.goToCart();
      cy.get("#termsofservice").click();
      cy.get(".checkout-button").click();
      cy.contains("Welcome, Please Sign In!");
      cy.get(".checkout-as-guest-button").should("exist");
    });

    it("Checking out as a guest goes through form filling out.", () => {
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".add-to-cart-button").click();
      cy.goToCart();
      cy.get("#termsofservice").click();
      cy.get(".checkout-button").click();
      cy.get(".checkout-as-guest-button").click();
      cy.wait(500);

      // Input billing info
      // Test validation
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.get(".field-validation-error").should("have.length", 8);
      cy.get("#BillingNewAddress_FirstName").type("Cypress");
      cy.get("#BillingNewAddress_LastName").type("Guest");
      cy.get("#BillingNewAddress_Email").type(
        "cypress.guest@testenvironment.com"
      );
      // Inputting Aptean's address
      cy.get("#BillingNewAddress_CountryId").select("United States");
      cy.get("#BillingNewAddress_StateProvinceId").select("Georgia");
      cy.get("#BillingNewAddress_City").type("Alpharetta");
      cy.get("#BillingNewAddress_Address1").type("4325 Alexander Dr #100");
      cy.get("#BillingNewAddress_ZipPostalCode").type("30022");
      cy.get("#BillingNewAddress_PhoneNumber").type("5555555555");
      cy.get("#BillingNewAddress_FaxNumber").click(); // To make the validation update
      cy.get(".field-validation-error").should("have.length", 0);
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.wait(200);

      // Pick shipping method
      cy.get("#shippingoption_1").check();
      cy.get(".shipping-method-next-step-button").click();
      cy.wait(1000);

      // Payment Information
      const getIframeBody = () => {
        return cy
          .get("#credit-card-iframe_iframe")
          .its("0.contentDocument.body")
          .should("not.be.empty")
          .then(cy.wrap);
      };
      getIframeBody().scrollIntoView().should("be.visible");
      // Check validation
      cy.get("#submit-credit-card-button").click();
      getIframeBody().find(".error-text").should("have.length", 2);
      // Input card info
      getIframeBody().find("#text-input-cc-number").type("6011111111111117");
      getIframeBody().find("#text-input-expiration-month").type("03");
      getIframeBody().find("#text-input-expiration-year").type("24");
      getIframeBody().find("#text-input-cvv-number").type("123");
      cy.get("#submit-credit-card-button").click();
      cy.wait(2000);
      cy.get("#payment-success").should(
        "contain.text",
        "Your payment has been successfully processed!"
      );
      cy.get(".payment-info-next-step-button").click();
      cy.wait(1000);

      // Confirm order
      cy.get(".confirm-order-next-step-button")
        .should("exist")
        .and("be.visible");
      cy.get(".confirm-order-next-step-button").click();
      cy.wait(2000);

      // Completed
      cy.get(".order-number").should("contain.text", "Order number");
      cy.get(".order-completed-continue-button")
        .should("exist")
        .and("be.visible");
      cy.get(".order-completed-continue-button").click();
      cy.wait(500);
      cy.location("pathname").should("eq", "/en/");
    });
  });
});
