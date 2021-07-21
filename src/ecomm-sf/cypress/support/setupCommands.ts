/**
 * Contains commands for setting up the environment with items the tests rely on
 * Also contains commands for cleaning up the environment and deleting items created during testing.
 */

// Names of products and categories created
export const mainCategory = "Cypress Trees"
export var mainCategorySeo = "cypress-trees";
export const secondCategory = "Non-Cypress Flora";
export const mainProductOne = "Bald Cypress";
export const mainProductTwo = "Montezuma Cypress";
export const secondProduct = "(Non Cypress) Mountain Laurel";

// Prepare the enviornment by cleaning up any previous cypress items, make sure discounts are enabled, and creating the categories and products
Cypress.Commands.add("prepareEnvironment", () => {
  Cypress.log({
    displayName: "prepareEnv",
    message: "Cleaning env and creating required items"
  });
  // Delete any previous Cypress discounts, products, or categories. We cannot reuse these in case there's an issue with them.
  cy.cleanupEnvironment().then(() => {
    // Create the categories we need.
    cy.setupCategories().then(() => {
      // Create the products we need.
      cy.setupProducts().then(() => {
        // Fetch and store the user's first and last name
        cy.fetchUserDetails();
      })
    });
  });
});

// cleanupEnvironment and then disable discounts if they were disabled when test suite started
Cypress.Commands.add("revertEnvironment", () => {
  Cypress.log({
    displayName: "revertEnv",
    message: "Post suite cleanup, deleting items and restoring original settings."
  });
  cy.cleanupEnvironment().then(() => {
    var disableDiscounts = Cypress.env("envDisableDiscounts");
    if (disableDiscounts === true) {
      cy.switchEnabledDiscounts(true);
    }
  });
});

// Clean up discounts and check if discounts needs to be re-disabled.
// This is called in the after of discounts.spec.ts
Cypress.Commands.add("revertDiscounts", () => {
  cy.visit("/");
  cy.login();
  cy.wait(1000);
  cy.clearCart();
  cy.wait(1000);
  cy.cleanupDiscounts();
  const disableDiscounts = Cypress.env("envDisableDiscounts");
  if (disableDiscounts === true) {
    cy.switchEnabledDiscounts(true).then(() => {
      Cypress.env("envDisableDiscounts", false);
    });
  }
});

const goToCategories = () => {
  cy.location("pathname").then((loc) => {
    cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
    if (!loc.includes("Category/List")) {
      if (!loc.includes("Admin")) {
        cy.goToAdmin();
        cy.correctLanguage(); // Fail safe to make sure we can effectively navigate
      }
      cy.get(".nav-sidebar").find("li").contains("Catalog").click({ force: true });
    }
    cy.get(".nav-sidebar")
      .find("li")
      .find(".nav-treeview")
      .find("li")
      .contains("Categories")
      .click({ force: true });
    cy.wait(2000);
    cy.allowLoad();
  });
};

// Delete any Cypress discounts, products, and categories
Cypress.Commands.add("cleanupEnvironment", () => {
  const cleanupCatalog = (isCategory: boolean) => {
    return cy.get(".pagination").invoke('children').then(($li) => {
      if ($li.length === 2) {
        return;
      } else {
        var hasChildren = false;
        if (isCategory){
          var pageText = Cypress.$("#categories-grid").find("tbody").find("tr").text();
          hasChildren = pageText.toLowerCase().includes("cypress") && pageText.includes(">>");
        }
        cy.get(isCategory ? "#categories-grid" : "#products-grid")
          .find("tbody")
          .find("tr")
          .each(($row) => {
            const text = $row[0].innerText.toLowerCase();
            expect(text).to.include("cypress");
            if (isCategory && hasChildren) {
              if ($row.text().includes(">>")) {
                cy.wrap($row).find("input").check({ force: true });
              }
            } else {
              cy.wrap($row).find("input").check({ force: true });
            }
          }).then(() => {
            cy.get("#delete-selected").click({ force: true })
            cy.wait(500);
            cy.get("#delete-selected-action-confirmation-submit-button").click({ force: true });
            cy.wait(2000);
            cy.allowLoad();
            cleanupCatalog(isCategory);
          });
      }
    });
  };

  const searchCatalog = (isCategory: boolean) => {
    var inputId = "#SearchProductName";
    var buttonId = "#search-products";
    if (isCategory) {
      inputId = "#SearchCategoryName";
      buttonId = "#search-categories";
    }
    cy.get(inputId).type("Cypress", { force: true });
    cy.get(buttonId).click({ force: true });
    cy.allowLoad();
    return cleanupCatalog(isCategory);
  };

  cy.visit("/");
  cy.login();
  // Remove any items from cart
  cy.clearCart();
  // Clean up discounts
  cy.cleanupDiscounts().then(() => {
    Cypress.log({ displayName: "cleanupProducts", message: "Deleting Cypress products" });
    // Clean up products
    cy.visit("/Admin/Product/List");
    cy.allowLoad();
    searchCatalog(false).then(() => {
      Cypress.log({ displayName: "cleanupCategories", message: "Deleting Cypress categories" });
      //cy.visit("/Admin/Category/List");
      //cy.allowLoad();
      goToCategories();
      searchCatalog(true);
    });
  });
});

const deleteItem = (row, deleteId: string, pathName: string) => {
  var editPath = new RegExp(`/Admin/${pathName}/Edit`, "g");
  cy.intercept(editPath).as("editPageLoaded");
  cy.wrap(row)
    .find(".button-column")
    .find("a")
    .click({ force: true });
  cy.wait(5000);
  cy.wait("@editPageLoaded");
  cy.get(`#${deleteId}-delete`).click({ force: true });
  cy.get(`#${deleteId}model-Delete-delete-confirmation`)
    .find("button[type=submit]")
    .click({ force: true });
  cy.wait(10000);
  cy.location("pathname").should("eql", `/Admin/${pathName}/List`);
};

// TODO: function is now only being used by cleanupDiscounts. Remove it and move its functionalities back into cleanupDiscounts
const openEditableItem = (tableId: string, deleteId: string, pathName: string, filterFn) => {
  return cy.findTableItem(`#${tableId}-grid`, `#${tableId}-grid_next`, filterFn).then((cypressRows) => {
    if (cypressRows) {
      deleteItem(cypressRows[0], deleteId, pathName);
    } else {
      return true;
    }
  });
};

// Delete any Cypress discounts
Cypress.Commands.add("cleanupDiscounts", () => {
  Cypress.log({ displayName: "cleanupDiscounts", message: "Deleting Cypress discounts" });
  const cleanupDiscounts = () => {
    cy.get("#SearchDiscountName").type("Cypress", { force: true });
    cy.get("#search-discounts").click({ force: true });
    cy.allowLoad();
    return cy.get(".pagination").invoke('children').then(($li) => {
      if ($li.length === 2) {
        return;
      } else {
        var discountFilter = (index, row) => {
          const text = row.innerText.toLowerCase();
          return text.includes("cypress");
        };
        openEditableItem("discounts", "discount", "Discount", discountFilter);
        cleanupDiscounts();
      }
    });
  };
  cy.visit("/Admin/Discount/List");
  cy.allowLoad();
  cleanupDiscounts();
});

// Delete any Cypress customers
Cypress.Commands.add("cleanupCustomers", () => {
  Cypress.log({ displayName: "cleanupCustomers", message: "Deleting Cypress customers" });
  const cleanupCustomers = () => {
    cy.get('#SelectedCustomerRoleIds_taglist').within(() => {
      if (Cypress.$("span[title=delete]").length > 0) {
        cy.get("span[title=delete]").click({ force: true });
      }
    });
    cy.get("#SearchFirstName").clear({ force: true }).type("Cypress", { force: true });
    cy.get("#search-customers").click({ force: true });
    cy.allowLoad();
    return cy.get(".pagination").invoke('children').then(($li) => {
      if ($li.length === 2) {
        return;
      } else {
        const customerFilter = (index, row) => {
          const name = row.cells[2].innerText;
          const emailGood = row.cells[1].innerText !== Cypress.config("username");
          const nameGood = name.includes("cypress") || name.includes("Cypress");
          return emailGood && nameGood;
        };
        return cy.findTableItem("#customers-grid", "customers-grid_next", customerFilter).then((row) => {
          if (row) {
            deleteItem(row[0], "customer", "Customer");
            cleanupCustomers();
          } else {
            return
          }
        });
      }
    });
  };

  cy.visit("/Admin/Customer/List")
  cy.allowLoad();
  cleanupCustomers();
});

// Delete any Cypress campaigns
Cypress.Commands.add("cleanupCampaigns", () => {
  Cypress.log({ displayName: "cleanupCampaigns", message: "Deleting Cypress campaigns" });
  const cleanupCampaigns = () => {
    cy.allowLoad();
    return cy.get(".pagination").invoke('children').then(($li) => {
      if ($li.length === 2) {
        return;
      } else {
        const campaignFilter = (index, item) => {
          const text = item.cells[0].innerText.toLowerCase();
          return text.includes("cypress");
        }
        cy.findTableItem("#campaigns-grid", "campaigns-grid_next", campaignFilter).then((row) => {
          if (row) {
            deleteItem(row[0], "campaign", "Campaign");
            cleanupCampaigns();
          } else {
            return;
          }
        });
      }
    });
  };
  cy.visit("/Admin/Campaign/List");
  cy.allowLoad();
  cleanupCampaigns();
});

// Delete any Cypress emails in the message queue
Cypress.Commands.add("cleanupMessageQueue", () => {
  Cypress.log({ displayName: "cleanupMessageQueue", message: "Deleting queued Cypress messages" });
  const cleanupEmails = () => {
    cy.get("#queuedEmails-grid").find("tbody").find("tr").then(($rows) => {
      var cypressEmails = $rows.filter((index, item) => {
        return item.cells[2].innerText.includes("cypress") || item.cells[2].innerText.includes("Cypress");
      });
      if (cypressEmails.length > 0) {
        cy.wrap(cypressEmails).each(($row, index, $list) => {
          const subject = $row[0].cells[2].innerText;
          if (subject.includes("Cypress") || subject.includes("cypress")) {
            cy.wrap($row).find("input[name=checkbox_queuedemails]").check({ force: true });
          }
        }).then(() => {
          const boxes = Cypress.$("input[name=checkbox_queuedemails]");
          const checkedBoxes = boxes.filter((index, $box) => { return $box.checked === true });
          if (checkedBoxes.length > 0) {
            cy.get("#delete-selected").click({ force: true });
            cy.wait(200);
            cy.get("#delete-selected-action-confirmation-submit-button").click({ force: true });
          }
          cy.allowLoad();
          cleanupEmails();
        });
      } else {
        return;
      }
    });
  };
  cy.visit("/Admin/QueuedEmail/List");
  cy.allowLoad();
  const today = new Date();
  cy.get("#SearchStartDate").type(today.toLocaleString(undefined, { dateStyle: "short" }), { force: true });
  cy.get("#search-queuedemails").click({ force: true });
  cy.allowLoad();
  cleanupEmails();
});

const enableAdvancedSettings = () => {
  return cy.get("body").then(($el) => {
    if ($el.hasClass("basic-settings-mode")) {
      cy.get("#advanced-settings-mode").click({ force: true });
      cy.wait(500);
    }
  });
};

Cypress.Commands.add("openPanel", (panelId: string) => {
  return cy.get(panelId).then(($el) => {
    if ($el.hasClass("collapsed-card")) {
      cy.wrap($el).find(".card-header").find("button").click({ force: true });
      cy.wait(500);
    }
  });
});

Cypress.Commands.add("switchEnabledDiscounts", (disableDiscounts: boolean) => {
  Cypress.log({ displayName: "switchEnabledDiscounts", message: "Verifying that discounts are enabled" });
  cy.visit("/Admin/Setting/Catalog");
  enableAdvancedSettings().then(() => {
    cy.openPanel("#catalogsettings-performance").then(() => {
      if (disableDiscounts) {
        Cypress.log({ displayName: "switchEnabledDiscounts", message: "Disabling discounts" });
        // Disable the discounts, as part of post-test clean up.
        if (Cypress.$("#IgnoreDiscounts").prop("checked") !== true) {
          cy.get("#IgnoreDiscounts").check({ force: true });
          cy.get("button[name=save]").click({ force: true });
          cy.wait(10000);
        }
      } else {
        // Check that discounts aren't disabled, as that would interfere with our tests
        // If they are disabled, enabled them and save an env variable so that post-test clean up will disable them again once we're done
        if (Cypress.$("#IgnoreDiscounts").prop("checked") === true) {
          cy.get("#IgnoreDiscounts").uncheck({ force: true });
          cy.get("button[name=save]").click({ force: true });
          Cypress.env("envDisableDiscounts", true);
          cy.wait(10000);
        }
      }
    });
  });
});

Cypress.Commands.add("checkAvailableLanguages", () => {
  Cypress.log({
    displayName: "checkAvailableLanguages",
    message: "Checking there are enough published languages"
  });
  const publishLanguage = (unpubLang: string[], neededLangs: number, affectedLangs: string[]) => {
    Cypress.log({
      message: `Publishing language: ${unpubLang[0]}`
    });
    cy.get("#languages-grid")
      .find("tbody")
      .find("tr")
      .contains(unpubLang[0])
      .parent()
      .find(".button-column")
      .find("a")
      .click({ force: true });
    cy.wait(5000);
    cy.get("#Published").check({ force: true });
    cy.get("button[name=save]").click({ force: true });
    cy.wait(5000);
    return cy.location("pathname").should("eql", "/Admin/Language/List").then(() => {
      affectedLangs.push(unpubLang[0]);
      if (neededLangs > 1) {
        cy.allowLoad();
        publishLanguage(unpubLang.slice(1), neededLangs - 1, affectedLangs);
      } else {
        return affectedLangs;
      }
    });
  };
  const fetchLanguageNames = (tableRows) => {
    if (tableRows.length > 0) {
      const langNames = [] as string[];
      tableRows.each((index, row) => {
        langNames.push(row.cells[0].innerText);
      });
      return langNames;
    } else {
      return [];
    }
  };
  cy.visit("/");
  cy.login();
  cy.visit("/Admin/Language/List");
  cy.allowLoad();
  return cy.get("#languages-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      if ($rows.length === 1) {
        expect($rows.length).to.be.greaterThan(1, "No additional languages available. Cannot run language-functionality tests.");
      } else {
        const nonEnglishRows = $rows.filter((index, item) => {
          return !item.cells[0].innerText.includes("English");
        });
        if (nonEnglishRows.length < 2) {
          expect(nonEnglishRows.length).to.be.greaterThan(2, "Not enough additional languages available. Cannot run language-functionality tests.");
        } else {
          // Currently published rows
          const eligibleRows = nonEnglishRows.filter((index, item) => {
            return item.innerHTML.includes("true-icon");
          });
          const originalPublished = fetchLanguageNames(eligibleRows);
          if (eligibleRows.length >= 2) {
            return originalPublished.slice(0, 2);
          } else {
            const ineligibleRows = nonEnglishRows.filter((index, item) => {
              return !item.innerHTML.includes("true-icon");
            });
            const originalUnpublished = fetchLanguageNames(ineligibleRows);
            Cypress.env("publishedLangs", originalPublished);
            Cypress.env("unpublishedLangs", originalUnpublished);
            const countToPublish = 2 - eligibleRows.length;
            publishLanguage(originalUnpublished.slice(0), countToPublish, []).then((newlyPublished) => {
              return originalPublished.concat(newlyPublished);
            });
          }
        }
      }
    });
});

Cypress.Commands.add("storeLanguageProperties", (languageNames: string[]) => {
  cy.visit("/");
  cy.login();
  cy.visit("/Admin/Language/List");
  cy.allowLoad();
  const languageProperties = [] as { name: string, currency: string, displayOrder: string }[];
  cy.wrap(languageNames).each((lang, index, langNames) => {
    const langFilter = (index, item) => {
      return item.cells[0].innerText === lang;
    };
    cy.findTableItem("#languages-grid", "#languages-grid_next", langFilter).then((row) => {
      cy.wrap(row).find(".button-column").find("a").click({ force: true });
      cy.wait(5000)
      cy.location("pathname").should("include", "/Admin/Language/Edit").then(() => {
        var langObject = { name: lang, currency: "", displayOrder: "" };
        langObject.currency = Cypress.$("#DefaultCurrencyId").prop("selectedOptions")[0].innerText;
        langObject.displayOrder = Cypress.$("#DisplayOrder").val();
        languageProperties.push(langObject);
        cy.get(".content-header").find("small").find("a").click({ force: true });
        cy.wait(5000);
        cy.location("pathname").should("eql", "/Admin/Language/List");
        cy.allowLoad();
      });
    });
  }).then(() => {
    Cypress.env("langsProperties", languageProperties);
  });
});

Cypress.Commands.add("setShippingOrigin", () => {
  cy.visit("/Admin/Setting/Shipping");  // TODO: Set up user navigation for this?
  cy.allowLoad();
  return cy.get("#product-shipping-origin").scrollIntoView().then(() => {
    var saveNeeded = false;
    // Set shipping address to a public park in Atlanta
    if (Cypress.$("#ShippingOriginAddress_CountryId > option:selected").text() !== "United States") {
      cy.get("#ShippingOriginAddress_CountryId").select("United States", { force: true });
      saveNeeded = true;
    }
    if (Cypress.$("#ShippingOriginAddress_StateProvinceId > option:selected").text() !== "Georgia") {
      cy.get("#ShippingOriginAddress_StateProvinceId").select("Georgia", { force: true });
      saveNeeded = true;
    }
    if (Cypress.$("#ShippingOriginAddress_City").val() !== "Atlanta") {
      cy.get("#ShippingOriginAddress_City").clear({ force: true }).type("Atlanta", { force: true });
      saveNeeded = true;
    }
    if (Cypress.$("#ShippingOriginAddress_Address1").val() !== "180 Central Ave SW") {
      cy.get("#ShippingOriginAddress_Address1").clear({ force: true }).type("180 Central Ave SW", { force: true });
      saveNeeded = true;
    }
    if (Cypress.$("#ShippingOriginAddress_ZipPostalCode").val() !== "30303") {
      cy.get("#ShippingOriginAddress_ZipPostalCode").clear({ force: true }).type("30303", { force: true });
      saveNeeded = true;
    }
    if (saveNeeded) {
      cy.get("button[name=save]").click();
    }
  });
});

// Checks that there are shipping providers
Cypress.Commands.add("checkAvailableShippers", (providerName?: string) => {
  Cypress.log({
    displayName: "checkAvailableShippers",
    message: "Checking # of shipping providers"
  });
  const fetchProviderNames = (tableRows) => {
    if (tableRows.length > 0) {
      const provNames = [] as string[];
      tableRows.each((index, row) => {
        provNames.push(row.cells[0].innerText);
      });
      return provNames;
    } else {
      return [];
    }
  };

  cy.visit("/");
  cy.login();
  cy.goToShippingProviders().then(() => {
    const existingRecord = Cypress.env("shipProperties");
    if (existingRecord) {
      const providerNames = [] as string[];
      existingRecord.forEach((item) => {
        providerNames.push(item.name);
      });
      return providerNames;
    } else {
      return cy.get("#shippingproviders-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          if (providerName) {
            const providerPresent = $rows.filter((index, item) => {
              return item.cells[0].innerText.includes(providerName);
            });
            if (providerPresent.length === 0) {
              expect(providerPresent.length).to.be.greaterThan(0, `Shipping Provider "${providerName}" must be present for these tests.`);
            } else {
              const names = fetchProviderNames($rows);
              return cy.storeShipperProperties(names).then(() => {
                return names;
              });
            }
          } else {
            if ($rows.length === 1 || $rows.length === 0) {
              expect($rows.length).to.be.greaterThan(1, "No additional shipping providers available. Cannot run shipping tests.");
            } else {
              const names = fetchProviderNames($rows);
              return cy.storeShipperProperties(names).then(() => {
                return names;
              });
            }
          }
        });
    }
  });

});

// Stores original shipping provider properties
Cypress.Commands.add("storeShipperProperties", (providerNames: string[]) => {
  const shipperProperties = [] as { name: string, displayOrder: string, isActive: boolean }[];
  cy.wrap(providerNames).each((prov: string, index, provNames) => {
    const shipFilter = (index, item) => {
      return item.cells[0].innerText === prov;
    };
    cy.findTableItem("#shippingproviders-grid", "#shippingproviders-grid_next", shipFilter).then((row) => {
      var shipObject = { name: prov, displayOrder: "", isActive: false };
      cy.wrap(row).find("td[data-columnname=DisplayOrder]").invoke("text").then((text) => {
        shipObject.displayOrder = text;
        cy.wrap(row).find("td[data-columnname=IsActive]").find("i").invoke("hasClass", "true-icon").then((htmlVal) => {
          shipObject.isActive = htmlVal;
          shipperProperties.push(shipObject);
        });
      });
    });
  }).then(() => {
    Cypress.env("shipProperties", shipperProperties);
  });
});

// Creates an array of the original config values for a single provider and returns that array.
Cypress.Commands.add("saveProviderConfiguration", (providerName) => {
  Cypress.log({ name: "saveProviderConfiguration", message: providerName });
  return cy.goToShippingProviders().then(() => {
    var providerConfig = [];
    cy.allowLoad();
    cy.findShippingProvider(providerName).clickRowBtn("Configure");
    cy.allowLoad();
    cy.wait(1000);
    cy.get(".card-body").get(".form-group:visible").then(($els) => {
      const inputRows = $els.filter((index, el) => {
        return !el.innerHTML.includes('name="save"');
      });
      const getTypeAndValue = (input) => {
        var type = input.prop("type");
        var value;
        if (type === "checkbox") {
          value = input.prop("checked")
        } else if (type === "text") {
          value = input.val();
        }
        return { inputType: type, inputValue: value };
      };
      inputRows.each((index, row) => {
        if (row.innerHTML.includes("k-widget")) {
          var numericalInput = Cypress.$(row).find("input[id]");
          var intendedResult = getTypeAndValue(numericalInput);
          providerConfig.push(intendedResult);
        } else {
          var inputs = Cypress.$(row).find("input");
          if (inputs.length === 0) {
            var select = Cypress.$(row).find("select");
            providerConfig.push({ inputType: "select", inputValue: select.val() });
          } else if (inputs.length === 1) {
            providerConfig.push(getTypeAndValue(inputs));
          } else {
            var configGroup = [];
            inputs.each((index, input) => {
              configGroup.push(getTypeAndValue(Cypress.$(input)));
            });
            providerConfig.push({ inputType: "group", inputValue: configGroup });
          }
        }
      });
    }).then(() => {
      cy.clickBack();
      return cy.wrap(providerConfig);
    })
  });
});

// Resets languages to the publicity and properties they had before the tests ran
Cypress.Commands.add("resetLanguages", () => {
  Cypress.log({
    displayName: "resetLanguages",
    message: "Resetting languages to original publicities"
  });
  const checkTableRows = (langNames: string[], expectPublished: boolean) => {
    if (langNames.length > 0) {
      langNames.forEach((lang) => {
        if (expectPublished) {
          cy.publishLanguage(lang);
        } else {
          cy.unpublishLanguage(lang);
        }
      });
    }
  };
  cy.visit("/");
  cy.correctLanguage();
  cy.login();
  cy.wait(5000);
  cy.visit("/Admin/Language/List");
  cy.allowLoad();
  const publishedLangs = Cypress.env("publishedLangs");
  if (publishedLangs) {
    checkTableRows(publishedLangs, true);
  }
  const unpublishedLangs = Cypress.env("unpublishedLangs");
  if (unpublishedLangs) {
    checkTableRows(unpublishedLangs, false);
  }

  const languagePropertyValues = Cypress.env("langsProperties");
  if (languagePropertyValues) {
    cy.wrap(languagePropertyValues).each((lang, index, langValues) => {
      const langFilter = (index, item) => {
        return item.cells[0].innerText === lang.name;
      };
      cy.findTableItem("#languages-grid", "#languages-grid_next", langFilter).then(($row) => {
        if ($row) {
          cy.wrap($row).find(".button-column").find("a").click({ force: true });
          cy.wait(5000);
          cy.location("pathname").should("include", "/Admin/Language/Edit").then(() => {
            const selected = Cypress.$("#DefaultCurrencyId").prop("selectedOptions");
            const currentValue = selected[0].innerText;
            if (currentValue !== lang.currency) {
              cy.get("#DefaultCurrencyId").select(lang.currency);
            }
            const currentDisplay = Cypress.$("#DisplayOrder").val();
            if (currentDisplay !== lang.displayOrder) {
              cy.get("#DisplayOrder").siblings(".k-input").clear();
              cy.get("#DisplayOrder").type(lang.displayOrder);
            }
            cy.get("button[name=save]").click({ force: true });
            cy.wait(5000);
            cy.location("pathname").should("eql", "/Admin/Language/List");
            cy.allowLoad();
          });
        }
      });
    });
  }
});

// Resets shipping providers to the properties they had before the tests ran
Cypress.Commands.add("resetShippingProviders", () => {
  Cypress.log({
    displayName: "resetShippingProviders",
    message: "Resetting provider properties"
  });
  const checkTableRows = (providers: { name: string, displayOrder: string, isActive: boolean }[]) => {
    if (providers.length > 0) {
      providers.forEach((prov) => {
        cy.changeProviderProps(prov.name, prov.isActive, prov.displayOrder);
      });
    }
  };
  cy.visit("/");
  cy.login();
  cy.goToShippingProviders().then(() => {
    cy.wait(10);
    cy.allowLoad();
    const originalProviderProperties = Cypress.env("shipProperties");
    if (originalProviderProperties) {
      checkTableRows(originalProviderProperties)
    }
  });
});

// Sets a single shipping provider back to its original configuration with the provided array
Cypress.Commands.add("resetProviderConfig", (providerName: string, providerConfig) => {
  Cypress.log({ name: "resetProviderConfig", message: providerName });
  cy.goToShippingProviders();
  cy.wait(1000);
  cy.allowLoad().then(() => {
    cy.wait(2000);
    cy.findShippingProvider(providerName).clickRowBtn("Configure", { force: true });
    cy.allowLoad();
    var valueChanged = false;
    const checkAndCorrect = (input, configType, configValue) => {
      if (configType === "text") {
        if (input.val() !== configValue) {
          cy.wrap(input).clear({ force: true }).type(configValue, { force: true });
          valueChanged = true;
        }
      } else if (configType === "checkbox") {
        if (input.prop("checked") !== configValue) {
          cy.wrap(input).toggle();
          valueChanged = true;
        }
      } else if (configType === "select") {
        if (input.val() !== configValue) {
          cy.wrap(input).select(configValue);
        }
      }
    };
    cy.wrap(providerConfig).each((config, index) => {
      cy.wait(100);
      cy.get(".card-body").get(".form-group:visible").eq(index).then((formRow) => {
        Cypress.log({ displayName: " ", message: config.inputValue });
        if (config.inputType !== "group") {
          if (formRow[0].innerHTML.includes("k-widget")) {
            const input = formRow.find("input[id]");
            checkAndCorrect(input, config.inputType, config.inputValue);
          } else if (config.inputType === "select") {
            const input = formRow.find("select");
            checkAndCorrect(input, config.inputType, config.inputValue);
          } else {
            const input = formRow.find("input");
            checkAndCorrect(input, config.inputType, config.inputValue);
          }
        } else {
          const inputs = formRow.find("input");
          config.inputValue.forEach((groupConfig, ind) => {
            checkAndCorrect(Cypress.$(inputs[ind]), groupConfig.inputType, groupConfig.inputValue);
          });
        }
      });
    }).then(() => {
      if (valueChanged) {
        cy.get("input[name=save]").click({ force: true });
        cy.allowLoad();
        cy.get(".content-header").find("small").find("a").click({ force: true });
      }
    });
  });
});

// Do not use as an actual command. Created as a command instead of a function so that the .then() would work properly
Cypress.Commands.add("fillInNames", ($tab, name: string) => {
  if ($tab && $tab.length > 0) {
    return cy.wrap($tab)
      .parent()
      .siblings()
      .then(($li) => {
        const eligibleTabs = $li.filter((index, item) => {
          return !item.innerText.includes("Standard") && !item.innerText.includes("English");
        });
        var tabCount = eligibleTabs.length;
        if (tabCount > 0) {
          var currentTab = $li.index(eligibleTabs[0]);
          const fillInTab = (tabIndex: number) => {
            var language = $li[tabIndex].innerText;
            cy.wrap($li[tabIndex]).find("a").click({ force: true });
            cy.wait(500);
            cy.get("#category-name-localized-standard-tab")
              .siblings()
              .eq(tabIndex)
              .find("input")
              .eq(0)
              .type(name + ` (${language})`, { force: true });
            if (tabIndex !== tabCount) {
              fillInTab(tabIndex + 1);
            }
          };
          fillInTab(currentTab);
        }
      });
  }
});

// Set up categories that tests depend on
Cypress.Commands.add("setupCategories", () => {
  Cypress.log({ displayName: "setupCategories", message: "Creating 2 Cypress categories" });
  const addCategory = (name: string, desc: string, displayOrder: string, seoName: string, getTrueSeo?: boolean) => {
    cy.get("a").contains("Add new").click({ force: true });
    cy.wait(5000);
    return cy.location("pathname").should("eql", "/Admin/Category/Create").then(() => {
      enableAdvancedSettings().then(() => {
        cy.wait(2000);
        // Fill in name and description
        cy.openPanel("#category-info").then(() => {
          cy.get("#Name").type(name, { force: true });
          cy.getIframeBody("#Description_ifr").find("p").type(desc, { force: true }).then(() => {
            var standardTab = Cypress.$("a[data-tab-name=category-name-localized-standard-tab]");
            cy.fillInNames(standardTab, name).then(() => {
              // Publish, menu, and display order
              cy.openPanel("#category-display").then(() => {
                if (Cypress.$("#Published").prop("checked") !== true) {
                  cy.get("#Published").check({ force: true });
                }
                if (Cypress.$("#ShowOnHomepage").prop("checked") !== true) {
                  cy.get("#ShowOnHomepage").check({ force: true });
                }
                if (Cypress.$("#IncludeInTopMenu").prop("checked") !== true) {
                  cy.get("#IncludeInTopMenu").check({ force: true });
                }
                cy.get("#DisplayOrder").clear({ force: true }).type(displayOrder, { force: true });

                // seo codes
                cy.openPanel("#category-seo").then(() => {
                  cy.get("#SeName").type(seoName, { force: true });
                  cy.get("#MetaTitle").type(seoName, { force: true });
                  if (getTrueSeo) {
                    cy.get("button[name=save-continue]").click({ force: true });
                    cy.wait(5000);
                    cy.get("#SeName").invoke("val").then((value: string) => {
                      mainCategorySeo = value;
                      cy.visit("/Admin/Category/List");
                      cy.wait(5000);
                      cy.location("pathname").should("eql", "/Admin/Category/List");
                    });
                  } else {
                    cy.get("button[name=save]").click({ force: true });
                    cy.wait(5000);
                    cy.location("pathname").should("eql", "/Admin/Category/List");
                  }
                });
              });
            });
          });
        });
      });
    });
  };
  cy.visit("/Admin/Category/List");
  cy.wait(5000);
  // Create our first category, "Cypress Trees"
  addCategory(mainCategory, "Cypress saplings to test with", "2", "cypress-trees", true).then(() => {
    // Create our second category, "Non-Cypress Flora"
    addCategory(secondCategory, "Plants that aren't Cypress Trees, but are still useful for testing", "3", "non-cypress-flora");
  });
});

// Set up products that tests depend on
Cypress.Commands.add("setupProducts", () => {
  Cypress.log({ displayName: "setupProducts", message: "Creating 3 Cypress products" });
  cy.intercept("/Admin/Product/Create").as("productCreation");
  const addProduct = (
    name: string,
    desc: string,
    fullDesc: string,
    category: string,
    price: string,
    seoName: string,
    pictureFile: string,
    pictureAlt: string
  ) => {
    cy.get("a").contains("Add new").click({ force: true });
    cy.wait(5000);
    cy.wait("@productCreation");
    return cy.location("pathname").should("eql", "/Admin/Product/Create").then(() => {
      enableAdvancedSettings().then(() => {
        cy.wait(2000);
        // Fill in name and description
        cy.openPanel("#product-info").then(() => {
          cy.get("#product-info")
            .find("#Name")
            .type(name, { force: true });
          cy.get("#product-info")
            .find("#ShortDescription")
            .type(desc, { force: true });
          cy.getIframeBody("#FullDescription_ifr").find("p").type(fullDesc, { force: true });
          // Add category
          cy.get("#SelectedCategoryIds").select(category, { force: true });
          // Make sure it's published
          if (Cypress.$("#Published").prop("checked") !== true) {
            cy.get("#Published").check({ force: true });
          }
          // Price
          cy.openPanel("#product-price").then(() => {
            cy.get("#Price").clear({ force: true }).type(price, { force: true });
            cy.get("#IsTaxExempt").check({ force: true });
            // seo Codes
            cy.openPanel("#product-seo").then(() => {
              cy.get("#product-seo")
                .find("#SeName")
                .type(seoName, { force: true });
              cy.get("#product-seo")
                .find("#MetaTitle")
                .type(seoName, { force: true });
              // Save and continute editing
              cy.get("button[name=save-continue]").click({ force: true });
              cy.wait(5000);
              // Add picture
              cy.openPanel("#product-pictures").then(() => {
                cy.get("#product-pictures").find("input[name=qqfile]").attachFile(pictureFile);
                cy.get("#AddPictureModel_OverrideAltAttribute").type(pictureAlt, { force: true });
                cy.get("#AddPictureModel_OverrideTitleAttribute").type(pictureAlt, { force: true });
                cy.wait(5000);
                cy.get("#addProductPicture").click({ force: true });
                cy.wait(5000);
                cy.get("button[name=save]").click({ force: true });
                cy.wait(5000);
                cy.location("pathname").should("eql", "/Admin/Product/List");
              });
            });
          });
        });
      });
    });
  };
  cy.visit("/Admin/Product/List");
  cy.wait(5000);
  // Create the first product
  addProduct(
    mainProductOne,
    "A Bald Cypress tree",
    "A Bald Cypress tree, native to the southeastern United States. This tree can grow in wet, dry, or swampy soil",
    mainCategory,
    "600",
    "bald-cypress",
    "ThreeBaldCypress.jpg",
    "a bald cypress tree"
  ).then(() => {
    // Create Second Product
    addProduct(
      mainProductTwo,
      "A Montezuma Cypress tree",
      "A Montezuma Cypress tree, native to Mexico and Guatemala. It prefers to grow along upland rivers, but can also grow in springs and marshes.",
      mainCategory,
      "750",
      "montezuma-cypress",
      "MontezumaCypress.jpg",
      "montezuma cypress tree"
    ).then(() => {
      // Create the third product
      addProduct(
        secondProduct,
        "Young Mountain Laurel Saplings",
        "Mountain Laurel produces beautiful cup-shaped flowers. Please note that the pollen and all parts of the plant contain a potent neurotoxin, and should not be consumed or fed to animals. This store is not liable for any injuries.",
        secondCategory,
        "340",
        "no-cypress-laurel",
        "MountainLaurel.jpg",
        "mountain laurel flowers"
      );
    });
  });
});

// Set up customers for campaigns
Cypress.Commands.add("setupCustomers", () => {
  Cypress.log({ displayName: "setupCustomers", message: "Creating 3 Cypress customers" });
  const addCustomer = (email: string, name: string, custRoles: string[]) => {
    const today = new Date();
    const customer = {
      email: `cypress.${email}${Cypress._.random(0, 1e9)}@ecommcypresstesting.com`,
      password: `Cypress${name}`,
      first: "Cypress",
      last: name,
      gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
      dob: today.toLocaleString(undefined, { dateStyle: "short" }),
      newsletter: ["Your store name"],
      roles: custRoles
    };
    return cy.addNewCustomer(customer).then(() => {
      cy.wait(5000);
      cy.location("pathname").should("eql", "/Admin/Customer/List").then(() => {
        return customer.email;
      });
    });
  };
  return cy.cleanupCustomers().then(() => {
    cy.visit("/Admin/Customer/List");
    cy.wait(5000);
    // Create admin user
    return addCustomer("admin", "Admin", ["Administrators", "Registered"]).then((adminEmail) => {
      const emails = [adminEmail];
      // Create registered user
      return addCustomer("registered", "User", ["Registered"]).then((regEmail) => {
        emails.push(regEmail);
        // Create guest user
        return addCustomer("guest", "Guest", ["Guests"]).then((guestEmail) => {
          emails.push(guestEmail);
          // Verify newsletter subscription?
          cy.visit("/Admin/NewsLetterSubscription/List");
          cy.allowLoad();
          cy.get("#SearchEmail").type("cypress", { force: true });
          cy.get("#search-subscriptions").click({ force: true });
          cy.allowLoad();
          cy.wrap(emails).each((email) => {
            cy.get("#newsletter-subscriptions-grid")
              .find("tbody")
              .find("tr")
              .should("include.text", email);
            cy.get("#newsletter-subscriptions-grid")
              .find("tbody")
              .find("tr")
              .contains(email)
              .parent()
              .then(($row) => {
                if (!$row[0].cells[1].innerHTML.includes('nop-value="true"')) {
                  cy.wrap($row[0].cells[3])
                    .find("a")
                    .eq(0)
                    .click({ force: true });
                  cy.wait(1000);
                  cy.wrap($row[0].cells[1])
                    .find("input")
                    .check({ force: true });
                  cy.wrap($row[0].cells[3])
                    .find("a")
                    .eq(1)
                    .click({ force: true });
                  cy.wait(8000);
                }
              });
          }).then((emails) => {
            return emails;
          });
        });
      });
    });
  });
});

// Check that discounts are enabled and then clear any existing cypress discounts
Cypress.Commands.add("setupDiscounts", () => {
  Cypress.log({ displayName: "setupDiscounts", message: "Check if discounts are enabled and clear old discounts" });
  cy.visit("/");
  cy.login();
  // Check to make sure that discounts are enabled. If they aren't, enable them and save an env variable so we can disable them again later
  cy.switchEnabledDiscounts().then(() => {
    cy.cleanupDiscounts();
  });
});

Cypress.Commands.add("fetchUserDetails", () => {
  const log = Cypress.log({
    name: "fetchUserDetails",
    message: "Fetching and storing user's first name, last name, and company"
  });
  cy.visit("/");
  cy.login();
  cy.wait(1000);
  cy.log("Fetching details");
  cy.wait(2000).then(() => {
    if (Cypress.$("#account-links").length > 0) {
      cy.get("#account-links").click({ force: true });
      cy.wait(1000);
      cy.get(".my-account-link").click({ force: true });
    } else if (Cypress.$("#header-links-opener").length > 0) {
      cy.get("#header-links-opener").click({ force: true });
      cy.wait(1000);
      cy.get(".header-links").find(".ico-account").click({ force: true });
    } else {
      cy.get(".ico-account").click({ force: true });
    }
  }).then(() => {
    cy.get("#FirstName").invoke("val").then((userFirstName) => {
      cy.get("#LastName").invoke("val").then((userLastName) => {
        cy.get("#Company").invoke("val").then((userCompany) => {
          Cypress.env("userDetails", { first: userFirstName, last: userLastName, company: userCompany });
        });
      });
    });
  })

});