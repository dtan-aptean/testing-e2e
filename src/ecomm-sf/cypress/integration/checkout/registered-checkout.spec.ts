/// <reference types="cypress" />

describe("Ecommerce", function () {
  context("Registered User Checkout", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    it("Clicking the Cypress trees category brings us to the appropriate page", () => {
      cy.testCategory();
    });

    it("Clicking the product image brings us to the product page", () => {
      cy.testProductImage();
    });

    it("Clicking the product title brings us to the product page", () => {
      cy.testProductTitle();
    });

    it("Clicking Add to Cart successfully adds a product to the cart", () => {
      cy.testAddToCart();
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
          const quantity = $amt.text().replace("(", "").replace(")", "");
          cy.get(".header-links").find(".ico-cart").click();
          cy.wait(500);
          cy.get(".remove-from-cart").find("input").check();
          cy.get(".update-cart-button").click();
          cy.wait(500);
          cy.contains("Your Shopping Cart is empty!");
          cy.get(".header-links")
            .find(".cart-qty")
            .then(($qty) => {
              const newQty = $qty.text().replace("(", "").replace(")", "");
              expect(parseInt(newQty)).to.be.lessThan(parseFloat(quantity));
            });
        });
    });

    it("Updating the quantity succesfully updates the price and amount", () => {
      cy.goToProduct("Bald Cypress");
      const count = Cypress._.random(2, 5);
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".qty-input").clear();
      cy.get(".qty-input").type(count.toString());
      cy.get(".add-to-cart-button").click();
      cy.wait(500);
      cy.goToCart();
      cy.get(".cart > tbody").find("tr").eq(0).as("target");
      cy.get(".header-links")
        .find(".cart-qty")
        .then(($amt) => {
          const quantity = $amt.text().replace("(", "").replace(")", "");
          cy.get("@target")
            .find("td")
            .then(($td) => {
              const orgQty = $td[5].children[1].value;
              const orgSubtotal = $td[6].children[1].innerText
                .replace(",", "")
                .replace("$", "");
              cy.get(".cart-total")
                .find("tr")
                .then(($rows) => {
                  const orgCartSubtotal = $rows[0].cells[1].innerText
                    .replace(",", "")
                    .replace("$", "");
                  const orgCartTotal = $rows[3].cells[1].innerText
                    .replace(",", "")
                    .replace("$", "");

                  cy.get("@target").within(() => {
                    cy.get(".qty-input").clear();
                    cy.get(".qty-input").type((count - 1).toString());
                  });
                  cy.get(".update-cart-button").click();
                  cy.wait(500);
                  cy.get("@target")
                    .find("td")
                    .then(($newTd) => {
                      const qty = $newTd[5].children[1].value;
                      const subtotal = $newTd[6].children[1].innerText
                        .replace(",", "")
                        .replace("$", "");
                      cy.get(".cart-total")
                        .find("tr")
                        .then(($newRows) => {
                          const cartSubtotal = $newRows[0].cells[1].innerText
                            .replace(",", "")
                            .replace("$", "");
                          const cartTotal = $newRows[3].cells[1].innerText
                            .replace(",", "")
                            .replace("$", "");
                          cy.get(".header-links")
                            .find(".cart-qty")
                            .then(($qty) => {
                              const newQuantity = $qty
                                .text()
                                .replace("(", "")
                                .replace(")", "");
                              expect(parseInt(quantity)).to.be.greaterThan(
                                parseInt(newQuantity)
                              );
                              expect(parseInt(orgQty)).to.be.greaterThan(
                                parseInt(qty)
                              );
                              expect(parseFloat(orgSubtotal)).to.be.greaterThan(
                                parseFloat(subtotal)
                              );
                              expect(
                                parseFloat(orgCartSubtotal)
                              ).to.be.greaterThan(parseFloat(cartSubtotal));
                              expect(
                                parseFloat(orgCartTotal)
                              ).to.be.greaterThan(parseFloat(cartTotal));

                              cy.clearCart();
                            });
                        });
                    });
                });
            });
        });
    });

    it("User should receive points equal to total cost of cart", () => {
      cy.goToProduct("Bald Cypress");
      const count = Cypress._.random(1, 5);
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".qty-input").clear();
      cy.get(".qty-input").type(count.toString());
      cy.get(".add-to-cart-button").click();
      cy.wait(500);
      cy.goToCart();
      cy.get(".order-total")
        .find("td")
        .eq(1)
        .then(($td) => {
          const dollarAmount = $td.text();
          const numericalAmount = dollarAmount
            .replace(",", "")
            .replace("$", "");
          const points = Math.floor(parseFloat(numericalAmount) / 10);
          cy.get(".earn-reward-points")
            .find("td")
            .eq(1)
            .find(".value-summary")
            .should("have.text", `${points} points`);
          cy.clearCart();
        });
    });

    it("Clicking checkout without agreeing to TOS prevents checkout", () => {
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
      cy.get(".add-to-cart-button").click();
      cy.goToCart();
      cy.get(".checkout-button").click();
      cy.get("#terms-of-service-warning-box").should("exist").and("be.visible");
      cy.get(".ui-dialog-titlebar-close").click();
      cy.clearCart();
    });

    it("The billing information is already partially filled out when checking out", () => {
      cy.addToCartAndCheckout();
      cy.get("#co-billing-form").then(($el) => {
        const select = $el.find(".select-billing-address");
        if (select.length > 0) {
          cy.wrap(select).find("select").select("New Address");
          cy.wait(500);
        }
        // TODO: Set up something that will make this available to multiple testing accounts
        // Configs in cypress.json? Pros: Low complication, tester-reliant. Cons: tedious to fill out everytime, tester-reliant
        // Retrieve the data from the admin side? Pro: Tester doesn't need to do anything. Con: assumes user is admin. Possibly complicated.
        cy.get("#BillingNewAddress_FirstName").should("have.value", "Cypress");
        cy.get("#BillingNewAddress_LastName").should("have.value", "McTester");
        cy.get("#BillingNewAddress_Email").should(
          "have.value",
          "cypress.tester@testenvironment.com"
        );
        cy.get("#BillingNewAddress_Company").should(
          "have.value",
          "Cypress Greenhouses"
        );
      });
      cy.clearCart();
    });

    it("Empty fields show errors during checkout", () => {
      cy.addToCartAndCheckout();

      cy.get("#ShipToSameAddress").uncheck();
      cy.get("#co-billing-form").then(($el) => {
        const select = $el.find(".select-billing-address");
        if (select.length > 0) {
          cy.wrap(select).find("select").select("New Address");
        }
      });
      // Test Billing Validation, should get errors
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.get(".field-validation-error").should("have.length", 5);
      // Input billing info, using Aptean's Alpharetta address
      cy.get("#BillingNewAddress_CountryId").select("United States");
      cy.get("#BillingNewAddress_StateProvinceId").select("Georgia");
      cy.get("#BillingNewAddress_City").type("Alpharetta");
      cy.get("#BillingNewAddress_Address1").type("4325 Alexander Dr #100");
      cy.get("#BillingNewAddress_ZipPostalCode").type("30022");
      cy.get("#BillingNewAddress_PhoneNumber").type("5555555555");
      cy.get("#BillingNewAddress_FaxNumber").type("8888888888");
      // Check to see if errors clear
      cy.get(".field-validation-error").should("have.length", 0);
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.wait(200);

      // Test Shipping validation, should get errors
      cy.get("#shipping-address-select").select("New Address");
      cy.wait(200);
      // Test Validation
      cy.get(".new-address-next-step-button").eq(1).click();
      cy.get(".field-validation-error").should("have.length", 5);
      // Input shipping info, using Lenox Mall's addresss
      cy.get("#ShippingNewAddress_CountryId").select("United States");
      cy.get("#ShippingNewAddress_StateProvinceId").select("Georgia");
      cy.get("#ShippingNewAddress_City").type("Atlanta");
      cy.get("#ShippingNewAddress_Address1").type("3393 Peachtree Rd NE");
      cy.get("#ShippingNewAddress_ZipPostalCode").type("30326");
      cy.get("#ShippingNewAddress_PhoneNumber").type("5555556666");
      cy.get("#ShippingNewAddress_FaxNumber").type("8888889999");
      // Shipping validation errors don't seem to clear or update, but this line can be uncommented if that ever changes
      // cy.get(".field-validation-error").should("have.length", 0);
      cy.get(".new-address-next-step-button").eq(1).click();
      cy.wait(200);
      cy.get(".shipping-method-next-step-button").click();
      cy.wait(1000);
      // Payment Information
      cy.getIframeBody("#credit-card-iframe_iframe")
        .scrollIntoView()
        .should("be.visible");
      // Test Credit card validation, should get errors
      cy.get("#submit-credit-card-button").click();
      cy.wait(200);
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-month")
        .type("03")
        .clear();
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-year")
        .type("24")
        .clear();
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 3);
      // Input credit card info, test validation along the way
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cc-number")
        .type("6011111111111117");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 2);
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-month")
        .type("03");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-year")
        .type("24");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 1);
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cvv-number")
        .type("123");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 0);

      cy.clearCart();
    });

    it("Different billing and shipping address should be correct at confirmation", () => {
      cy.addToCartAndCheckout();

      cy.get("#ShipToSameAddress").uncheck();
      cy.get("#co-billing-form").then(($el) => {
        const select = $el.find(".select-billing-address");
        if (select.length === 0) {
          // Inputting Aptean's address
          cy.get("#BillingNewAddress_CountryId").select("United States");
          cy.get("#BillingNewAddress_StateProvinceId").select("Georgia");
          cy.get("#BillingNewAddress_City").type("Alpharetta");
          cy.get("#BillingNewAddress_Address1").type("4325 Alexander Dr #100");
          cy.get("#BillingNewAddress_ZipPostalCode").type("30022");
          cy.get("#BillingNewAddress_PhoneNumber").type("5555555555");
          cy.get("#BillingNewAddress_FaxNumber").type("8888888888");
          cy.get(".field-validation-error").should("have.length", 0);
        }
      });
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.wait(200);
      // Select a different shipping address
      cy.get("#shipping-address-select").select("New Address");
      cy.wait(200);
      // Input shipping info, using Lenox Mall's address
      cy.get("#ShippingNewAddress_FirstName").clear().type("Cypress");
      cy.get("#ShippingNewAddress_LastName").clear().type("Guest");
      cy.get("#ShippingNewAddress_Email")
        .clear()
        .type("cypress.guest@testenvironment.com");
      cy.get("#ShippingNewAddress_Company").clear().type("Guest Company");
      cy.get("#ShippingNewAddress_CountryId").select("United States");
      cy.get("#ShippingNewAddress_StateProvinceId").select("Georgia");
      cy.get("#ShippingNewAddress_City").type("Atlanta");
      cy.get("#ShippingNewAddress_Address1").type("3393 Peachtree Rd NE");
      cy.get("#ShippingNewAddress_ZipPostalCode").type("30326");
      cy.get("#ShippingNewAddress_PhoneNumber").type("5555556666");
      cy.get("#ShippingNewAddress_FaxNumber").type("8888889999");
      cy.get(".field-validation-error").should("have.length", 0);
      cy.get(".new-address-next-step-button").eq(1).click();
      cy.wait(200);

      cy.get(".shipping-method-next-step-button").click();
      cy.wait(1000);

      // Payment Information
      cy.getIframeBody("#credit-card-iframe_iframe")
        .scrollIntoView()
        .should("be.visible");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cc-number")
        .type("6011111111111117");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-month")
        .type("03");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-year")
        .type("24");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cvv-number")
        .type("123");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 0);
      cy.get("#submit-credit-card-button").click();
      cy.wait(2000);
      cy.get("#payment-success").should(
        "contain.text",
        "Your payment has been successfully processed!"
      );
      cy.get(".payment-info-next-step-button").click();
      cy.wait(1000);

      // Compare information
      cy.get(".billing-info")
        .children(".info-list")
        .find("li")
        .then(($li) => {
          const name = $li[0].innerText;
          const email = $li[1].innerText;
          const phone = $li[2].innerText;
          const fax = $li[3].innerText;
          const address1 = $li[4].innerText;
          const region = $li[5].innerText;
          cy.get(".shipping-info")
            .children(".info-list")
            .find("li")
            .then(($il) => {
              expect(name).not.to.equal($il[0].innerText);
              expect(email).not.to.equal($il[1].innerText);
              expect(phone).not.to.equal($il[2].innerText);
              expect(fax).not.to.equal($il[3].innerText);
              expect(address1).not.to.equal($il[4].innerText);
              expect(region).not.to.equal($il[5].innerText);
              cy.clearCart();
            });
        });
    });

    it("Checking out as a registered user is successful", () => {
      cy.addToCartAndCheckout();

      cy.get("#co-billing-form").then(($el) => {
        const select = $el.find(".select-billing-address");
        if (select.length === 0) {
          // Inputting Aptean's address
          cy.get("#BillingNewAddress_CountryId").select("United States");
          cy.get("#BillingNewAddress_StateProvinceId").select("Georgia");
          cy.get("#BillingNewAddress_City").type("Alpharetta");
          cy.get("#BillingNewAddress_Address1").type("4325 Alexander Dr #100");
          cy.get("#BillingNewAddress_ZipPostalCode").type("30022");
          cy.get("#BillingNewAddress_PhoneNumber").type("5555555555");
          cy.get("#BillingNewAddress_FaxNumber").type("8888888888");
          cy.get(".field-validation-error").should("have.length", 0);
        }
      });
      cy.get(".new-address-next-step-button").eq(0).click();
      cy.wait(200);

      // Pick shipping method
      cy.get("#shippingoption_1").check();
      cy.get(".shipping-method-next-step-button").click();
      cy.wait(1000);

      // Payment Information
      cy.getIframeBody("#credit-card-iframe_iframe")
        .scrollIntoView()
        .should("be.visible");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cc-number")
        .type("6011111111111117");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-month")
        .type("03");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-expiration-year")
        .type("24");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find("#text-input-cvv-number")
        .type("123");
      cy.getIframeBody("#credit-card-iframe_iframe")
        .find(".error-text")
        .should("have.length", 0);
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
