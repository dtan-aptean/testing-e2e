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

// Go to a catgory page. Will go to the Cypress Trees page unless another category is specified
Cypress.Commands.add("goToCategory", (categoryName) => {
  Cypress.log({
    name: "goToCategory",
    message: `${categoryName || "Cypress Trees"}`,
    consoleProps: () => {
      return {
        "Category Name": categoryName,
      };
    },
  });
  cy.get(".top-menu.notmobile").then(($el) => {
    if ($el.css("display") === "none") {
      cy.get(".menu-toggle").click();
      cy.wait(500);
      cy.get(".top-menu.mobile")
        .find("li")
        .contains(categoryName || "Cypress Trees")
        .click();
    } else {
      cy.wrap($el)
        .find("li")
        .contains(categoryName || "Cypress Trees")
        .click();
    }
    cy.wait(500);
  });
});

/**
 * Goes to a specific product page.
 * Assumes that the product is under the Cypress Trees category,
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
  cy.goToCategory(categoryName || "Cypress Trees");

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
