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
  cy.on("uncaught:exception", (err, runnable) => {
    return false;
  });
  cy.get(".header-links").then(($el) => {
    if (!$el[0].innerText.includes('LOG OUT')) {
      cy.get(".header-links").find(".ico-login").click({force: true});
      cy.wait(200);
      cy.get(".email").type(Cypress.config("username"));
      cy.get(".password").type(Cypress.config("password"));
      cy.get(".login-button").click();
    }
  });
});

// Go to cart
Cypress.Commands.add("goToCart", () => {
  Cypress.log({
    name: "goToCart",
  });
  cy.get(".header-links").find(".ico-cart").click({ force: true });
  cy.wait(1000);
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
  cy.wait(1000);
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
  if (Cypress.$("#customerlanguage").length !== 0) {
    cy.get("#customerlanguage").then(($select) => {
      if ($select[0].selectedOptions[0].text !== "English") {
        cy.switchLanguage("English");
      }
    });
  }
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
      cy.get(".sidebar-menu.tree").find("li").contains("Promotions").click({force: true});
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Campaigns")
      .click({force: true});
    cy.wait(500);
  });
});

// Go to customers page. Can be done from public or admin
Cypress.Commands.add("goToCustomers", () => {
  Cypress.log({ name: "goToCustomers" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("/Customer/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("Customers").click();
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Customers")
      .click();
    cy.wait(500);
  });
});

// Goes to campaigns page. Can be done from public or admin
Cypress.Commands.add("goToSubscribers", () => {
  Cypress.log({ name: "goToSubscribers" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("/NewsLetterSubscription/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("Promotions").click({force: true});
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Newsletter subscribers")
      .click({force: true});
    cy.wait(500);
  });
});

// Go to message queue page. Can be done from public or admin
Cypress.Commands.add("goToMessageQueue", () => {
  Cypress.log({ name: "goToMessageQueue" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("/QueuedEmail/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("System").click({force: true});
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Message queue")
      .click({force: true});
    cy.wait(500);
  });
});

// Goes to general settings page. Can be done from public or admin
Cypress.Commands.add("goToGeneralSettings", () => {
  Cypress.log({ name: "goToGeneralSettings" });

  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("/Setting/GeneralCommon")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".sidebar-menu.tree").find("li").contains("Configuration").click({force: true});
    }
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Settings")
      .click({force: true});
    cy.wait(200);
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .find(".treeview-menu")
      .contains("General settings")
      .click({force: true});
    cy.wait(500);
  });
});

// Find an item in the table. Pass in table id, id for pagination next button, and function to filter with
// Can work for finding multiple items if remaining on the same page.
Cypress.Commands.add("findTableItem", (tableId: string, nextButtonId: string, filterFunction) => {
  // Filter this page of the table. Return the row if found, null otherwise
  const runFilter = () => {
    return cy.get(tableId)
      .find("tbody")
      .find("tr")
      .then(($rows) => {
        const row = $rows.filter(filterFunction);
        if (row.length > 0) {
          return row;
        } else {
          return null;
        }
      });
  };
  return cy.get(".pagination").invoke('children').then(($li) => {
    if ($li.length === 2) {
      // No items in table, nothing to edit
      return null;
    } else if ($li.length === 3) {
      // Table has one page to search
      runFilter().then((row) => {
        return row;
      });
    } else if ($li.length > 3) {
      // Table has multiple pages to search.
      for (var i = 1; i < $li.length - 1; i++) {
        // Search the current page
        runFilter().then((row) => {
          if (row) {
            i = $li.length;
            return row;
          } else {
            if (i !== $li.length - 2) {
              // Go to the next page if not on the last page
              cy.get(nextButtonId).find("a").click();
              cy.wait(1000);
            } else {
              return null;
            }
          }
        });
      }
    }
  });
});


// Adds a new campaign. Assumes you're on the campaign list page or the create a new campaign page
Cypress.Commands.add("addNewCampaign", (name, subject, body, date, role) => {
  Cypress.log({ name: "addNewCampaign" });
  cy.location("pathname").then((loc) => {
    if (loc.includes("Campaign/List")) {
      cy.get(".content-header").find("a").contains("Add new").click();
    }
    // Fill in content
    cy.get("#Name").type(name);
    cy.get("#Subject").type(subject);
    cy.get("#Body").type(body);
    cy.get("#DontSendBeforeDate").type(date);
    cy.get("#CustomerRoleId").select(role);
    cy.get("button[name=save]").click();
    cy.wait(500);
    cy.get("#campaigns-grid").should("contain.text", name);
  });
});

// Opens up a specific campaign to edit
Cypress.Commands.add("editCampaign", (campaignName: string, failOnAbsentee?: boolean) => {
  Cypress.log({
    name: "editCampaign",
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
  const campaignFilter = (index, item) => {
    return item.cells[0].innerText === campaignName;
  };
  cy.findTableItem("#campaigns-grid", "#campaigns-grid_next", campaignFilter).then((row) => {
    if (row) {
      cy.wrap(row).find("td").contains("Edit").click({ force: true });
      cy.wait(500);
    } else {
      if (failOnAbsentee) {
        assert.exists(row, "Item could not be found in table");
      }
    }
  });
});

// Delete a specific campaign. Use shouldExist to fail the test if the item can't be found
Cypress.Commands.add("deleteCampaign", (campaignName: string, shouldExist?: boolean) => {
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
  cy.editCampaign(campaignName, shouldExist);
  cy.location("pathname").then((loc) => {
    if (loc.includes("Campaign/Edit")) {
      cy.get("#campaign-delete").click({force: true});
      cy.wait(200);
      cy.get("#campaignmodel-Delete-delete-confirmation")
        .find(".modal-footer")
        .find("button")
        .contains("Delete")
        .click({force: true});
      cy.get("#campaigns-grid").should("not.contain.text", campaignName);
    }
  });
});

// Send a test email for a specific campaign. Assumes you're on the campaign list page
Cypress.Commands.add("sendCampaignTest", (campaignName, email) => {
  Cypress.log({
    name: "sendCampaignTest",
    message: campaignName,
    consoleProps: () => {
      return {
        "Campaign name": campaignName,
        "Email Used": email
      };
    },
  });
  // Make sure campaign name and email are valid
  expect(campaignName).to.not.be.null;
  expect(campaignName).to.not.be.undefined;
  assert.isString(campaignName);
  cy.location("pathname").then((loc) => {
    if (!loc.includes("Campaign/Edit")) {
      cy.editCampaign(campaignName, true);
    }
    cy.get("#TestEmail").type(email);
    cy.get("button[name=send-test-email").click();
    cy.wait(500);
    cy.get(".alert").should(
      "contain.text",
      "Email has been successfully sent"
    );
  });
});

// Sends a mass email for a campaign test
Cypress.Commands.add("sendMassCampaign", (campaignName) => {
  Cypress.log({
    name: "sendMassCampaign",
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
  cy.location("pathname").then((loc) => {
    if (!loc.includes("Campaign/Edit")) {
      cy.editCampaign(campaignName, true);
    }
    cy.get("button[name=send-mass-email").click();
    cy.get(".alert").invoke('text').should(
      "not.include",
      "0 emails have been successfully queued."
    ).and(
      'include', 
      'emails have been successfully queued.'
    );
  });
});

// Search message queue for a specific message. Searches by subject
Cypress.Commands.add("searchMessageQueue", (subject) => {
  Cypress.log({
    name: "searchMessageQueue",
    message: subject,
    consoleProps: () => {
      return {
        "Campaign subject": subject,
      };
    },
  });
  const messageQueueFilter = (index, item) => {
    const today = new Date();
    const formatedToday = today.toLocaleString(undefined, {month: "2-digit", day: "2-digit", year: "numeric"});
    return item.cells[2].innerText === subject && item.cells[5].innerText.includes(formatedToday);
  };
  return cy.findTableItem("#queuedEmails-grid", "#queuedEmails-grid_next", messageQueueFilter).then((rows) => {
    expect(rows.length).to.be.gte(1, "Expecting at least one email in the queue");
    return rows;
  });
});

// Creates a new customer
Cypress.Commands.add("addNewCustomer", (roleObject) => {
  assert.exists(roleObject);
  assert.isNotEmpty(roleObject);
  const displayObject = (obj) => {
    const props = Object.getOwnPropertyNames(obj);
    var message = "";
    props.forEach((prop) => {
      message = message + `${prop}:\t${obj[prop]}\n`;
    });
    return message;
  };
  Cypress.log({
    name: "addNewCustomer",
    message: `${roleObject.email} as ${roleObject.role}`,
    consoleProps: () => {
      return {
        "Customer Object": displayObject(roleObject),
      };
    },
  });
  cy.get('a').contains("Add new").click();
  cy.get('#Email').type(roleObject.email);
  cy.get('#Password').type(roleObject.password);
  cy.get('#FirstName').type(roleObject.first);
  cy.get('#LastName').type(roleObject.last);
  cy.get(`#Gender_${roleObject.gender}`).check();
  cy.get('#DateOfBirth').type(roleObject.dob);
  if (roleObject.newsletter) {
    cy.get('#SelectedNewsletterSubscriptionStoreIds').select(roleObject.newsletter, {force: true});
    cy.get('#SelectedNewsletterSubscriptionStoreIds').parent().find('input').blur();
  }
  if (roleObject.roles) {
    cy.get('#SelectedCustomerRoleIds_taglist').within(() => {
      cy.get("span[title=delete]").click();
    });
    cy.get('#SelectedCustomerRoleIds').select(roleObject.roles, {force: true});
  }
  cy.get('#AdminComment').type('Created for Cypress testing');
  cy.get("button[name=save]").click();
  cy.wait(500);
  cy.get(".alert").should(
    "contain.text",
    "The new customer has been added successfully"
  );
});

// Searches for a customer
Cypress.Commands.add("searchForCustomer", (firstName: string, lastName: string) => {
  Cypress.log({
    name: "searchForCustomer",
    message: `${firstName} ${lastName}`,
    consoleProps: () => {
      return {
        "Customer Name": `${firstName} ${lastName}`,
      };
    },
  });

  const customerSearchFilter = (index, item) => {
    return item.cells[2].innerText === `${firstName} ${lastName}`;
  };

  return cy.get('#SelectedCustomerRoleIds').then(($el) => {
    if ($el.val().length > 0) {
      cy.get('#SelectedCustomerRoleIds_taglist').within(() => {
        cy.get("span[title=delete]").click();
      });
    }
    cy.get('#SelectedCustomerRoleIds').invoke('val').should('be.a', 'array').and('be.empty');
    cy.get('#SearchFirstName').type(firstName);
    cy.get('#SearchLastName').type(lastName);
    cy.get('#search-customers').click({force: true});
    cy.wait(1000);
    cy.get('#SearchFirstName').clear();
    cy.get('#SearchLastName').clear();
    cy.findTableItem("#customers-grid", "#customers-grid_next", customerSearchFilter).then((rows) => {
      return rows;
    });
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
 *  name?: string,
 *  discountType?: string,
 *  applySubcategories?: boolean,
 *  usePercentage?: boolean,
 *  amount?: string,
 *  maxAmount?: string,
 *  useCode?: boolean,
 *  code?: string,
 *  date? = { startDate: string, endDate: string },
 *  isCumulative?: boolean,
 *  limitation?: string,
 *  nTimes?: string
 *  maxDiscountQty?: string,
 * }
 */
Cypress.Commands.add("addNewDiscount", (options) => {
  Cypress.log({
    name: "addNewDiscount",
  });

  cy.get(".content-header").find("a").contains("Add new").click();
  // Fill in content
  cy.get("#Name").type(options.name);
  if (options.discountType) {
    cy.get("#DiscountTypeId").select(options.discountType);
    cy.wait(100);
  }
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
  } else if (options.amount) {
    cy.get("#DiscountAmount")
      .clear({ force: true })
      .type(options.amount, { force: true });
  }
  if (options.useCode) {
    cy.get("#RequiresCouponCode").check();
    cy.wait(100);
    cy.get("#CouponCode").type(options.code, { force: true });
  }
  if (options.date) {
    cy.get("#StartDateUtc").type(options.date.startDate, { force: true });
    cy.get("#EndDateUtc").type(options.date.endDate, { force: true });
  }
  if (options.isCumulative) {
    cy.get("#IsCumulative").check();
  }
  if (options.limitation) {
    cy.get("#DiscountLimitationId").select(options.limitation);
  }
  if (options.nTimes) {
    cy.get("#LimitationTimes").clear({ force: true });
    cy.get("#LimitationTimes").type(options.nTimes, { force: true });
  }
  if (options.maxDiscountQty) {
    cy.get("#MaximumDiscountedQuantity").type(options.maxDiscountQty, {
      force: true,
    });
  }
  cy.server();
  cy.route("POST", "/Admin/Discount/List").as('tableLoaded');
  cy.get("button[name=save]").click();
  cy.wait('@tableLoaded');
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

  // Payment Method
  cy.get("#payment-method-block").find("#paymentmethod_1").check();
  cy.get(".payment-method-next-step-button").click();
  cy.wait(200);
  // Payment Information
  cy.get("#CreditCardType").select("Discover");
  cy.get("#CardholderName").type("Cypress McTester")
  cy.get("#CardNumber")
    .type("6011111111111117");
  cy.get("#ExpireMonth")
    .select("03");
  cy.get("#ExpireYear")
    .select("2024");
  cy.get("#CardCode")
    .type("123");
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
    const product = $h1[0].innerText;
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
  function publishIfNecessary(eligibleRows) {
    return cy.get("#languages-grid")
      .find("tbody")
      .find("tr")
      .then(($rows) => {
        if (eligibleRows.length === 1) {
          const unpublished = $rows.filter((index, item) => {
            return (item.innerHTML.includes("false-icon") && !item.innerText.includes("English"));
          });
          if (unpublished.length >= 1) {
            const name = unpublished[0].cells[0].innerText;
            cy.publishLanguage(name);
            cy.get("#languages-grid")
              .find("tbody")
              .find("tr")
              .then(($tr) => {
                const validRows = $tr.filter((index, item) => {
                  return (
                    item.innerHTML.includes("true-icon") &&
                    item.cells[0].innerText !== "English"
                  );
                });
                return validRows;
              });
          }
        } else {
          return null;
        }
      });
  };

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
            // Call the function to publish another row if we need one
            publishIfNecessary(eligibleRows).then((validRows) => {
              if (validRows) {
                // Find a random row to unpublish
                const index = Cypress._.random(0, validRows.length - 1);
                cy.wrap(changePublicity(validRows, index));
              } else {
                // Find a random row to unpublish
                const index = Cypress._.random(0, eligibleRows.length - 1);
                cy.wrap(changePublicity(eligibleRows, index));
              }
            })
            
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

// Gets the seo codes for all languages
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
  };
  function findName(name: string) {
    return cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === name;
      });
      getToCode(row);
    });
  }
  function filterPage() {
    return cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const rowNames = [];
      const eligibleRows = $rows.filter((index, item) => {
        return item.innerHTML.includes("true-icon");
      });
      if (eligibleRows.length > 0) {
        cy.wrap(eligibleRows).each(($val, index, $list) => {
          rowNames.push($val[0].cells[0].innerText);
        }).then(() => {
          return rowNames;
        });
      } else {
        return [];
      }
    });
  };
  cy.get(".pagination")
    .find("li")
    .then(($li) => {
      const truePages = $li.filter((index, item) => {
        return (!item.outerHTML.includes("previous") && !item.outerHTML.includes("next"));
      });
      for (var i = 0; i < truePages.length; i++) {
        filterPage().then((names) => {
          if (names.length > 0) {
            names.forEach((name) => {
              findName(name);
            });
            cy.wait(1000);
          }
          cy.get(".pagination")
            .find("li")
            .then(($el) => {
              if (!$el[$el.length - 1].outerHTML.includes("disabled")) {
                cy.wrap($el[$el.length - 1]).find('a').click();
                cy.wait(500);
              }
            });
        });
      }
    }).then(() => {
      cy.wrap(codes).as("seoCodes");
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
