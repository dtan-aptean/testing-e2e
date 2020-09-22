Cypress.Commands.add("fromPublicStore_loginAsUser", (userProfile) => {
  cy.get(".ico-login").click();

  cy.get("#Email")
    .type(userProfile.username)
    .get("#Password")
    .type(userProfile.password)
    .get("form > .buttons > .button-1")
    .click();
});

Cypress.Commands.add("fromPublicStore_logout", () => {
  cy.get(".ico-logout").click();
});

Cypress.Commands.add("fromPublicStore_QuickCheckout", (profileName) => {
  cy.get(".ico-cart").should("be.visible").click();

  cy.get("#termsofservice")
    .should("be.visible")
    .check()
    .should("be.visible")
    .get("#checkout")
    .click();
});

Cypress.Commands.add("fromCheckoutAsGuest_FillForm", (profile) => {
  var contactDetails = [
    {
      key: "#BillingNewAddress_FirstName",
      value: profile.firstName,
    },
    {
      key: "#BillingNewAddress_LastName",
      value: profile.lastName,
    },
    {
      key: "#BillingNewAddress_Email",
      value: profile.email,
    },
    {
      key: "#BillingNewAddress_City",
      value: profile.city,
    },
    {
      key: "#BillingNewAddress_Address1",
      value: profile.address,
    },
    {
      key: "#BillingNewAddress_PhoneNumber",
      value: profile.phone,
    },
    {
      key: "#BillingNewAddress_ZipPostalCode",
      value: profile.zipcode,
    },
  ];
  var dropDowns = [
    {
      key: "#BillingNewAddress_CountryId",
      value: profile.countryId,
    },
    {
      key: "#BillingNewAddress_StateProvinceId",
      value: profile.stateId,
    },
  ];
  contactDetails.forEach((detail) => {
    cy.get(detail.key).type(detail.value).should("have.value", detail.value);
  });
  dropDowns.forEach((detail) => {
    cy.get(detail.key).select(detail.value).should("have.value", detail.value);
  });
});

Cypress.Commands.add("getIframeBody", (iFrameName) => {
  // get the iframe > document > body
  // and retry until the body element is not empty
  return (
    cy
      .get(iFrameName)
      .its("0.contentDocument.body")
      .should("not.be.empty")
      // wraps "body" DOM element to allow
      // chaining more Cypress commands, like ".find(...)"
      // https://on.cypress.io/wrap
      .then(cy.wrap)
  );
});

// Logs in with the configured username/password
Cypress.Commands.add("login", () => {
  Cypress.log({
    name: "login",
  });
  cy.get(".header-links").find(".ico-login").click();
  cy.wait(200);
  cy.get(".email").type(Cypress.config("username"));
  cy.get(".password").type(Cypress.config("password"));
  cy.get(".login-button").click();
});

// Go to cart
Cypress.Commands.add("goToCart", () => {
  Cypress.log({
    name: "goToCart",
  });
  cy.get(".header-links").find(".ico-cart").click();
  cy.wait(500);
});

// Empty the cart
Cypress.Commands.add("clearCart", () => {
  Cypress.log({
    name: "clearCart",
  });
  cy.goToCart();
  cy.get(".cart > tbody")
    .find("tr")
    .each(($tr, $i, $all) => {
      cy.wrap($tr).find("td").eq(0).find("input").check();
    })
    .then(() => {
      cy.get(".update-cart-button").click();
      cy.wait(500);
    });
});

// Get the visible top-menu. Cypress may display the mobile or desktop top-menu depending on screen size.
Cypress.Commands.add("getVisibleMenu", () => {
  if (Cypress.$(".menu-toggle:visible").length === 0) {
    return cy.get(".top-menu.notmobile").then(cy.wrap);
  } else {
    cy.get(".menu-toggle").click();
    return cy.get(".top-menu.mobile").then(cy.wrap);
  }
});

// Go to a catgory page. Will go to the default category page unless another category is specified
Cypress.Commands.add("goToCategory", (categoryName) => {
  Cypress.log({
    name: "goToCategory",
    message: `${categoryName || Cypress.config("defaultCategory")}`,
    consoleProps: () => {
      return {
        "Category Name": categoryName,
      };
    },
  });
  cy.getVisibleMenu()
    .find("li")
    .contains(categoryName || Cypress.config("defaultCategory"))
    .click();
  cy.wait(500);
});

/**
 * Goes to a specific product page.
 * Assumes that the product is under the default category,
 * unless a category name is specified
 */
Cypress.Commands.add("goToProduct", (productName, categoryName) => {
  Cypress.log({
    name: "goToProduct",
    message: `${categoryName ? categoryName + ", " : ""}${productName}`,
    consoleProps: () => {
      return {
        "Category Name": categoryName || "Not provided",
        "Product Name": productName,
      };
    },
  });
  cy.goToCategory(categoryName || Cypress.config("defaultCategory"));

  cy.get(".item-box")
    .filter((index, item) => {
      return item.innerText.includes(productName);
    })
    .as("targetProduct");
  cy.get("@targetProduct")
    .find(".details")
    .scrollIntoView()
    .should("be.visible");
  cy.get("@targetProduct").find(".product-title").find("a").click();
  cy.wait(500);
});

// Adds a product to the cart, go to cart, agree with TOS, and click checkout
Cypress.Commands.add("addToCartAndCheckout", () => {
  Cypress.log({
    name: "addToCartAndCheckout",
  });
  cy.goToProduct("Bald Cypress");
  cy.get(".add-to-cart-button").scrollIntoView().should("be.visible");
  cy.get(".add-to-cart-button").click();
  cy.goToCart();
  cy.get("#termsofservice").click();
  cy.get(".checkout-button").click();
  cy.wait(500);
});

/**
 * Switches the language to the provided one.
 * Works for both public and admin stores
 * If not provided a language, automatically switches to English
 */
Cypress.Commands.add("switchLanguage", (newLanguage) => {
  Cypress.log({
    name: "switchLanguage",
    message: `${newLanguage || Cypress.config("defaultLanguage")}`,
    consoleProps: () => {
      return {
        "New Language": newLanguage || "Not provided. Defaulted to English",
      };
    },
  });
  cy.get("#customerlanguage").select(
    newLanguage || Cypress.config("defaultLanguage")
  );
  cy.wait(1000);
});

// Goes to the admin site. Assumes user is logged in
Cypress.Commands.add("goToAdmin", () => {
  Cypress.log({
    name: "goToAdmin",
  });
  // Admin site has undefined Globalize, causes Cypress to autofail tests
  cy.on("uncaught:exception", (err, runnable) => {
    return false;
  });
  cy.get(".administration").click();
  cy.wait(1000);
  cy.location("pathname").should("eq", "/Admin");
});

// Goes to public site
Cypress.Commands.add("goToPublic", () => {
  Cypress.log({
    name: "goToPublic",
  });
  cy.get(".navbar-nav").find("li").eq(4).find("a").click();
  cy.wait(1000);
  cy.location("pathname").should("not.contain", "Admin");
});

// Goes to the languages page under configurations in admin store
Cypress.Commands.add("goToLanguages", () => {
  Cypress.log({
    name: "goToLanguages",
  });
  cy.get(".sidebar-menu.tree")
    .find("li")
    .contains("Configuration")
    .as("sidebar");
  cy.get("@sidebar").click();
  cy.get(".sidebar-menu.tree")
    .find("li")
    .find(".treeview-menu")
    .find("li")
    .contains("Languages")
    .as("languages");
  cy.get("@languages").click();
  cy.wait(500);
});

// COMMANDS FOR TESTS THAT ARE THE SAME BETWEEN REGISTERED USERS AND GUESTS

// Test going to a category
Cypress.Commands.add("testCategory", () => {
  cy.getVisibleMenu()
    .find("li")
    .contains(Cypress.config("defaultCategory"))
    .as("category");
  cy.get("@category").should("be.visible").and("have.attr", "href");
  cy.get("@category").then(($li) => {
    const href = $li.attr("href");
    const correctLocation = href?.includes(
      `/en/${Cypress.config("defaultCategoryUrl")}`
    );
    cy.expect(correctLocation).to.equal(true);
    cy.wrap($li).click();
  });
  cy.wait(500);
  cy.location("pathname").should(
    "eq",
    `/en/${Cypress.config("defaultCategoryUrl")}`
  );
  cy.get(".page.category-page").should(
    "contain.text",
    Cypress.config("defaultCategory")
  );
});

// Test going to product via Image
Cypress.Commands.add("testProductImage", () => {
  Cypress.log({
    name: "testProductImage",
  });
  cy.goToCategory();
  cy.location("pathname").should("eq", "/en/cypress");
  cy.get(".page.category-page").should(
    "contain.text",
    Cypress.config("defaultCategory")
  );
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

// Tests going to product via Title
Cypress.Commands.add("testProductTitle", () => {
  Cypress.log({
    name: "testProductTitle",
  });
  cy.goToCategory();
  cy.location("pathname").should(
    "eq",
    `/en/${Cypress.config("defaultCategoryUrl")}`
  );
  cy.get(".page.category-page").should(
    "contain.text",
    Cypress.config("defaultCategory")
  );
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

// Test adding an item to the cart
Cypress.Commands.add("testAddToCart", () => {
  Cypress.log({
    name: "testAddToCart",
  });
  cy.goToProduct("Bald Cypress");
  // Get the name of the product
  cy.get(".product-name").then(($h1) => {
    const product = $h1.text();
    // Get current amount of shopping cart
    cy.get(".header-links")
      .find(".cart-qty")
      .then(($amt) => {
        const quantity = $amt.text().replace("(", "").replace(")", "");
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
            const qty = $cartLink
              .children()[1]
              .innerText.replace("(", "")
              .replace(")", "");
            expect(parseInt(qty)).to.be.greaterThan(parseFloat(quantity));
            cy.wrap($cartLink).click();
            cy.wait(500);
            // Check and see if the item's in the cart
            cy.get(".cart").should("contain.text", product);
          });
      });
  });
});
