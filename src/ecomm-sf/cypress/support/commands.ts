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
  cy.get(".header-links").find(".ico-cart").click({ force: true });
  cy.wait(500);
});

// Empty the cart and remove applied discounts
Cypress.Commands.add("clearCart", () => {
  Cypress.log({
    name: "clearCart",
  });
  cy.goToCart();
  cy.wait(500);
  cy.get(".order-summary-content").then(($div) => {
    if (!$div[0].innerHTML.includes("no-data")) {
      cy.get(".coupon-box").then(($box) => {
        if ($box[0].innerHTML.includes("remove-discount-button")) {
          cy.get(".remove-discount-button").click();
          cy.wait(200);
        }
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
    }
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
        "New Language":
          newLanguage ||
          `Not provided. Defaulted to ${Cypress.config("defaultLanguage")}`,
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
  cy.get(".administration").click({ force: true });
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

// Checks to make sure English is the language. Used for navigating the sidebar in Admin.
Cypress.Commands.add("correctLanguage", () => {
  Cypress.log({ name: "correctLanguage" });
  cy.get("#customerlanguage").then(($select) => {
    if ($select[0].selectedOptions[0].text !== "English") {
      cy.switchLanguage("English");
    }
  })
});

// Goes to the languages page under configurations in admin store
Cypress.Commands.add("goToLanguages", () => {
  Cypress.log({
    name: "goToLanguages",
  });
  cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
  cy.location().then((loc) => {
    if (!loc.pathname.includes("Language/List")) {
      cy.get(".sidebar-menu.tree").find("li").contains("Configuration").click();
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Languages")
      .click();
    cy.wait(500);
  });
});

// Goes to a product page in admin store. Must provide name of product
Cypress.Commands.add("goToAdminProduct", (productName) => {
  Cypress.log({
    name: "goToAdminProduct",
    message: productName,
    consoleProps: () => {
      return {
        "Product Name": productName,
      };
    },
  });
  // Make sure product name is valid
  expect(productName).to.not.be.null;
  expect(productName).to.not.be.undefined;
  assert.isString(productName);
  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("Product/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("Catalog").click();
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Products")
      .click();
    cy.wait(500);
    cy.get("#products-grid")
      .find("tbody")
      .find("tr")
      .then(($rows) => {
        const row = $rows.filter((index, item) => {
          return item.cells[2].innerText === productName;
        });
        cy.wrap(row[0]).find(".button-column").click();
        cy.wait(500);
      });
  });
});

// Goes to campaigns page. Can be done from public or admin
Cypress.Commands.add("goToCampaigns", () => {
  Cypress.log({ name: "goToCampaigns" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("Campaign/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("Promotions").click();
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Campaigns")
      .click();
    cy.wait(500);
  });
});

// Adds a new campaign. Assumes you're on the campaign list page
Cypress.Commands.add("addNewCampaign", (name, subject, body, date, role) => {
  Cypress.log({ name: "addNewCampaign" });

  cy.get(".content-header").find("a").contains("Add new").click();
  // Fill in content
  cy.get("#Name").type(name);
  cy.get("#Subject").type(subject);
  cy.get("#Body").type(body);
  cy.get("#DontSendBeforeDate").type(date);
  cy.get("#CustomerRoleId").select(role);
  cy.get("button[name=save]").click();
  cy.wait(500);
});

// Send a test email for a specific campaign. Assumes you're on the campaign list page
Cypress.Commands.add("sendCampaignTest", (campaignName) => {
  Cypress.log({
    name: "sendCampaignTest",
    message: campaignName,
    consoleProps: () => {
      return {
        "Campaign name": campaignName,
      };
    },
  });
  // Make sure campaign name and email are valid
  expect(campaignName).to.not.be.null;
  expect(campaignName).to.not.be.undefined;
  assert.isString(campaignName);
  cy.get("#campaigns-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === campaignName;
      });
      cy.wrap(row).find("td").contains("Edit").click();
      cy.wait(500);
      cy.get("#TestEmail").type(Cypress.config("campaignReceiver"));
      cy.get("button[name=send-test-email").click();
    });
});

// Delete a specific campaign
Cypress.Commands.add("deleteCampaign", (campaignName) => {
  Cypress.log({
    name: "deleteCampaign",
    message: campaignName,
    consoleProps: () => {
      return {
        "Campaign name": campaignName,
      };
    },
  });
  // Make sure campaign name is valid
  expect(campaignName).to.not.be.null;
  expect(campaignName).to.not.be.undefined;
  assert.isString(campaignName);
  cy.get("#campaigns-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === campaignName;
      });
      cy.wrap(row).find("td").contains("Edit").click();
      cy.wait(500);
      cy.get("#campaign-delete").click();
      cy.wait(200);
      cy.get("#campaignmodel-Delete-delete-confirmation")
        .find(".modal-footer")
        .find("button")
        .contains("Delete")
        .click();
    });
});

// Goes to discounts page. Can be done from public or admin
Cypress.Commands.add("goToDiscounts", () => {
  Cypress.log({ name: "goToDiscounts" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("Discount/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree")
        .find("li")
        .contains("Promotions")
        .click({ force: true });
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Discounts")
      .click({ force: true });
    cy.wait(500);
  });
});

/** Adds a new discount with given information
 * options = {
 *  name: string,
 *  discountType: string,
 *  applySubcategories: boolean || undefined,
 *  usePercentage: boolean || undefined,
 *  amount: string,
 *  maxAmount: string || undefined,
 *  useCode: boolean || undefined,
 *  code: string || undefined,
 *  date = { startDate: string, endDate: string },
 *  isCumulative: boolean || undefined,
 *  limitation: string,
 *  nTimes: string || undefined
 *  maxDiscountQty: string || undefined,
 * }
 */
Cypress.Commands.add("addNewDiscount", (options) => {
  Cypress.log({
    name: "addNewDiscount",
  });

  cy.get(".content-header").find("a").contains("Add new").click();
  // Fill in content
  cy.get("#Name").type(options.name);
  cy.get("#DiscountTypeId").select(options.discountType);
  cy.wait(100);
  if (options.applySubcategories) {
    cy.get("#AppliedToSubCategories").check();
  }
  if (options.usePercentage) {
    cy.get("#UsePercentage").check();
    cy.wait(100);
    cy.get("#DiscountPercentage").clear({ force: true }).type(options.amount, {
      force: true,
    });
    if (options.maxAmount)
      cy.get("#MaximumDiscountAmount").type(options.maxAmount, {
        force: true,
      });
  } else {
    cy.get("#DiscountAmount")
      .clear({ force: true })
      .type(options.amount, { force: true });
  }
  if (options.useCode) {
    cy.get("#RequiresCouponCode").check();
    cy.wait(100);
    cy.get("#CouponCode").type(options.code, { force: true });
  }
  cy.get("#StartDateUtc").type(options.date.startDate, { force: true });
  cy.get("#EndDateUtc").type(options.date.endDate, { force: true });
  if (options.isCumulative) {
    cy.get("#IsCumulative").check();
  }
  cy.get("#DiscountLimitationId").select(options.limitation);
  if (options.nTimes) {
    cy.get("#LimitationTimes").clear({ force: true });
    cy.get("#LimitationTimes").type(options.nTimes, { force: true });
  }
  if (options.maxDiscountQty) {
    cy.get("#MaximumDiscountedQuantity").type(options.maxDiscountQty, {
      force: true,
    });
  }
  cy.get("button[name=save]").click();
  cy.wait(500);
  cy.get(".alert").should(
    "contain.text",
    "The new discount has been added successfully."
  );
});

// Progresses through checkout to get to confirm order.
Cypress.Commands.add("getToConfirmOrder", () => {
  Cypress.log({
    name: "getToConfirmOrder",
  });
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
  cy.wait(2000);

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
  cy.get('.cart').should("exist").and("be.visible");
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

// COMMANDS FOR LANGUAGE FUNCTIONALITY TESTS
/**
 * Swaps the language order
 * Takes two language names and swaps the language at each index
 * Assumes you're already on the languages page
 */
Cypress.Commands.add("swapOrder", (langOne, langTwo) => {
  Cypress.log({
    name: "swapOrder",
    message: `${langOne}, ${langTwo}`,
    consoleProps: () => {
      return {
        "First language": langOne,
        "Second language": langTwo,
      };
    },
  });
  // Make sure indices are valid
  expect(langOne).to.not.be.null;
  expect(langTwo).to.not.be.null;
  expect(langOne).to.not.be.undefined;
  expect(langTwo).to.not.be.undefined;
  assert.isString(langOne);
  assert.isString(langTwo);
  expect(langOne).to.not.eq(langTwo);
  // Swap the numbers
  cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const rowOne = $rows.filter((index, item) => {
        return item.cells[0].innerText === langOne;
      });
      const indexOne = rowOne[0].rowIndex - 1;
      const rowTwo = $rows.filter((index, item) => {
        return item.cells[0].innerText === langTwo;
      });
      const displayOrderOne = rowOne[0].cells[3].innerText;
      const displayOrderTwo = rowTwo[0].cells[3].innerText;
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .eq(indexOne)
        .find("td")
        .contains("Edit")
        .click();
      cy.get("#DisplayOrder").siblings(".k-input").clear();
      cy.get("#DisplayOrder").type(displayOrderTwo);
      cy.get('button[name="save"]').click();
      cy.wait(500);
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($newRows) => {
          const rowTwoUpdate = $newRows.filter((index, item) => {
            return item.cells[0].innerText === langTwo;
          });
          const indexTwo = rowTwoUpdate[0].rowIndex - 1;
          cy.get("#languages-grid")
            .find("tbody")
            .find("tr")
            .eq(indexTwo)
            .find("td")
            .contains("Edit")
            .click();
          cy.get("#DisplayOrder").siblings(".k-input").clear();
          cy.get("#DisplayOrder").type(displayOrderOne);
          cy.get('button[name="save"]').click();
          cy.wait(500);
        });
    });
});

/**
 * Compares the table when the language order is updated
 * Expects the language to be at the matching index.
 * langOne - first language name to compare. indexOne - the index you expect that language to be at
 * list - the original list before the update, to compare the non-target items
 */
Cypress.Commands.add(
  "compareTableOrder",
  (langOne, indexOne, langTwo, indexTwo, list) => {
    Cypress.log({
      name: "compareTableOrder",
    });
    cy.get("#languages-grid")
      .find("tbody")
      .find("tr")
      .each(($item, index, $newList) => {
        if (index === indexOne) {
          cy.wrap($item[0].cells[0].innerText)
            .should("eq", langOne)
            .and("not.eq", langTwo);
        } else if (index === indexTwo) {
          cy.wrap($item[0].cells[0].innerText)
            .should("eq", langTwo)
            .and("not.eq", langOne);
        } else {
          // NOTE: not sure if this is a good idea when the number of languages gets very large.
          // Included it to make sure no other enteries in the list were affected by the order change
          cy.wrap($item[0].cells[0].innerText).should(
            "eq",
            list[index].cells[0].innerText
          );
        }
      });
  }
);

/**
 * Compares the dropdown when the language order is updated
 * Expects the language to be at the matching index.
 * langOne - first language name to compare. indexOne - the index you expect that language to be at
 * list - the original list before the update, to compare the non-target items
 */
Cypress.Commands.add(
  "compareDropdownOrder",
  (langOne, indexOne, langTwo, indexTwo, list) => {
    Cypress.log({
      name: "compareDropdownOrder",
    });
    cy.get("#customerlanguage")
      .find("option")
      .each(($item, index, $newList) => {
        if (index === indexOne) {
          cy.wrap($item[0].innerText)
            .should("eq", langOne)
            .and("not.eq", langTwo);
        } else if (index === indexTwo) {
          cy.wrap($item[0].innerText)
            .should("eq", langTwo)
            .and("not.eq", langOne);
        } else {
          // NOTE: not sure if this is a good idea when the number of languages gets very large.
          // Included it to make sure no other enteries in the list were affected by the order change
          cy.wrap($item[0].innerText).should("eq", list[index].innerText);
        }
      });
  }
);

/**
 * Unpublishes a random language.
 * Can get the language name calling cy.get('@languageName') after calling this command
 * Can provide a specific index to unpublish a specific language
 */
Cypress.Commands.add("unpublishLanguage", (removalIndex) => {
  Cypress.log({
    name: "unpublishLanguage",
  });
  // Make sure that removalIndex is a valid argument if included
  if (removalIndex) {
    assert.isNotNaN(removalIndex);
    assert.isNumber(removalIndex);
  }
  // Broken up into functions that we then wrap
  // In order to be able to grab the language name
  function changePublicity(eligibleRows, index) {
    cy.wrap(eligibleRows[index])
      .find("td")
      .then(($cells) => {
        // Grab the language name and unpublish it
        const language = $cells[0].innerText;
        cy.wrap($cells[5]).click();
        cy.wait(500);
        cy.get("#Published").should("have.attr", "checked");
        cy.get("#Published").uncheck();
        cy.get('button[name="save"]').click();
        cy.wait(500);
        cy.wrap(language).as("languageName");
      });
  }
  function accessLanguages() {
    cy.location().then((loc) => {
      if (!loc.pathname.includes("Admin")) {
        cy.goToAdmin();
      }
      cy.goToLanguages();
      cy.wait(1000);
      // Find published rows
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($el) => {
          if (removalIndex) {
            cy.wrap(changePublicity($el, removalIndex));
          } else {
            // returns the rows that are published - looks for the checkmark
            const eligibleRows = $el.filter((index, item) => {
              return (
                item.innerHTML.includes("true-icon") &&
                item.cells[0].innerText !== "English"
              );
            });
            // It's assumed there will always be one published language
            expect(eligibleRows.length).to.be.gte(1);
            // Find a random row to unpublish
            const index = Cypress._.random(0, eligibleRows.length - 1);
            cy.wrap(changePublicity(eligibleRows, index));
          }
        });
    });
  }
  cy.wrap(accessLanguages());
});

// Republish a language. Needs the language name
Cypress.Commands.add("publishLanguage", (language) => {
  Cypress.log({
    name: "publishLanguage",
    message: `${language}`,
    consoleProps: () => {
      return {
        "Language Name": language,
      };
    },
  });
  // Make sure language name is valid
  expect(language).to.not.be.null;
  expect(language).to.not.be.undefined;
  assert.isString(language);

  cy.location().then((loc) => {
    if (!loc.pathname.includes("Admin")) {
      cy.goToAdmin();
    }
    cy.goToLanguages();
    cy.wait(1000);
    cy.get("#languages-grid")
      .find("tbody")
      .find("tr")
      .then(($el) => {
        const relevantRow = $el.filter((index, item) => {
          return item.innerText.includes(language);
        });

        cy.wrap(relevantRow).find("td").contains("Edit").click();
        cy.get("#Published").should("not.have.attr", "checked");
        cy.get("#Published").check();
        cy.get('button[name="save"]').click();
        cy.wait(500);
      });
  });
});

// Gets the seo codes for 4 languages
Cypress.Commands.add("getSeoCodes", () => {
  Cypress.log({
    name: "getSeoCodes",
  });
  cy.goToAdmin();
  cy.goToLanguages();
  const codes = [];
  function getToCode(row) {
    cy.wrap(row).find("td").contains("Edit").click();
    cy.get("#UniqueSeoCode").then(($el) => {
      codes.push($el.val());
      cy.get(".content-header")
        .find(".pull-left")
        .find("small")
        .find("a")
        .click();
      cy.wait(500);
    });
  }
  cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const english = $rows.filter((index, item) => {
        return item.cells[0].innerText === "English";
      });
      getToCode(english);
      cy.get("#languages-grid")
        .find("tbody")
        .find("tr")
        .then(($rows2) => {
          const aussie = $rows2.filter((index, item) => {
            return item.cells[0].innerText === "English, Australia";
          });
          getToCode(aussie);
          cy.get("#languages-grid")
            .find("tbody")
            .find("tr")
            .then(($rows3) => {
              const hindi = $rows3.filter((index, item) => {
                return item.cells[0].innerText === "Hindi";
              });
              getToCode(hindi);
              cy.get("#languages-grid")
                .find("tbody")
                .find("tr")
                .then(($rows4) => {
                  const german = $rows4.filter((index, item) => {
                    return item.cells[0].innerText === "Deutsch";
                  });
                  getToCode(german);
                  cy.wrap(codes).as("seoCodes");
                });
            });
        });
    });
});

/**
 * Change the default currency of a language
 * Mandatory to pass in a language name.
 * Currency can be left blank to select the currency as ---
 */
Cypress.Commands.add("changeDefaultCurrency", (language, currency) => {
  Cypress.log({
    name: "changeDefaultCurrency",
  });
  cy.goToAdmin();
  cy.goToLanguages();
  cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === language;
      });
      cy.wrap(row).find("td").contains("Edit").click();
      const value = !currency || currency === "default" ? 0 : currency;
      cy.get("#DefaultCurrencyId").then(($select) => {
        const orgVal = $select.val();
        cy.get("#DefaultCurrencyId").select(value);
        cy.get('button[name="save"]').click();
        cy.wait(500);
        cy.wrap(orgVal).as("originalValue");
      });
    });
});
