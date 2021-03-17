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
      cy.setupProducts();
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

// Delete any Cypress discounts, products, and categories
Cypress.Commands.add("cleanupEnvironment", () => {
  const cleanupCatalog = (isCategory: boolean) => {
    return cy.get(".pagination").invoke('children').then(($li) => {
      if ($li.length === 2) {
        return;
      } else {
        cy.get(isCategory ? "#categories-grid" : "#products-grid")
          .find("tbody")
          .find("tr")
          .each(($row) => {
            const text = $row[0].innerText.toLowerCase();
            expect(text).to.include("cypress");
            // TODO: Condense this if / else statement. Goal is to avoid deleting parent/children categories so this doesn't cause issues
            if (isCategory) {
              if (!$row.text().includes("parent") && !$row.text().includes(">>")) {
                cy.wrap($row).find("input").check({force: true});   
              }
            } else {
              cy.wrap($row).find("input").check({force: true});              
            }
          }).then(() => {
            cy.get("#delete-selected").click({force: true})
            cy.get("#delete-selected-action-confirmation-submit-button").click({force: true});
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
    cy.get(inputId).type("Cypress", {force: true});
    cy.get(buttonId).click({force: true});
    cy.allowLoad();
    return cleanupCatalog(isCategory);
  };

  cy.visit("/");
  cy.login();
  // Remove any items from cart
  cy.clearCart();
  // Clean up discounts
  cy.cleanupDiscounts().then(() => {
    Cypress.log({displayName: "cleanupProducts", message: "Deleting Cypress products"});
    // Clean up products
    cy.visit("/Admin/Product/List");
    cy.allowLoad();
    searchCatalog(false).then(() => {
      Cypress.log({displayName: "cleanupCategories", message: "Deleting Cypress categories"});
      cy.visit("/Admin/Category/List");
      cy.allowLoad();
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
    .click({force: true});
  cy.wait(5000);
  cy.wait("@editPageLoaded");
  cy.get(`#${deleteId}-delete`).click({force: true});
  cy.get(`#${deleteId}model-Delete-delete-confirmation`)
    .find("button[type=submit]")
    .click({force: true});
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
  Cypress.log({displayName: "cleanupDiscounts", message: "Deleting Cypress discounts"});
  const cleanupDiscounts = () => {
    cy.get("#SearchDiscountName").type("Cypress", {force: true});
    cy.get("#search-discounts").click({force: true});
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
  Cypress.log({displayName: "cleanupCustomers", message: "Deleting Cypress customers"});
  const cleanupCustomers = () => {
    cy.get('#SelectedCustomerRoleIds_taglist').within(() => {
      if(Cypress.$("span[title=delete]").length > 0) {
        cy.get("span[title=delete]").click({force: true});
      }
    });
    cy.get("#SearchFirstName").clear({force: true}).type("Cypress", {force: true});
    cy.get("#search-customers").click({force: true});
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
  Cypress.log({displayName: "cleanupCampaigns", message: "Deleting Cypress campaigns"});
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
  Cypress.log({displayName: "cleanupMessageQueue", message: "Deleting queued Cypress messages"});
  const cleanupEmails = () => {
    cy.get("#queuedEmails-grid").find("tbody").find("tr").then(($rows) => {
      var cypressEmails = $rows.filter((index, item) => {
        return item.cells[2].innerText.includes("cypress") || item.cells[2].innerText.includes("Cypress");
      });
      if (cypressEmails.length > 0) {
        cy.wrap(cypressEmails).each(($row, index, $list) => {
          const subject = $row[0].cells[2].innerText;
          if (subject.includes("Cypress") || subject.includes("cypress")) {
            cy.wrap($row).find("input[name=checkbox_queuedemails]").check({force: true});
          }
        }).then(() => {
          const boxes = Cypress.$("input[name=checkbox_queuedemails]");
          const checkedBoxes = boxes.filter((index, $box) => {return $box.checked === true});
          if (checkedBoxes.length > 0) {
            cy.get("#delete-selected").click({force: true});
            cy.wait(200);
            cy.get("#delete-selected-action-confirmation-submit-button").click({force: true});
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
  cy.get("#SearchStartDate").type(today.toLocaleString(undefined, {dateStyle: "short"}), {force: true});
  cy.get("#search-queuedemails").click({force: true});
  cy.allowLoad();
  cleanupEmails();
});

const enableAdvancedSettings = () => {
  return cy.get("body").then(($el) => {
    if ($el.hasClass("basic-settings-mode")) {
      cy.get("#advanced-settings-mode").click({force: true});
      cy.wait(500);
    }
  });
};
  
const openPanel = (panelId: string) => {
  return cy.get(panelId).find(".panel-heading").eq(0).then(($el) => {
    if (!$el.hasClass("opened")) {
      cy.wrap($el).click({force: true});
      cy.wait(500);
    }
  });
};

Cypress.Commands.add("switchEnabledDiscounts", (disableDiscounts: boolean) => {
  Cypress.log({displayName: "switchEnabledDiscounts", message: "Verifying that discounts are enabled"});
  cy.visit("/Admin/Setting/Catalog");
  enableAdvancedSettings().then(() => {
    openPanel("#catalogsettings-performance").then(() => {
      if (disableDiscounts) {
        Cypress.log({displayName: "switchEnabledDiscounts", message: "Disabling discounts"});
        // Disable the discounts, as part of post-test clean up.
        if (Cypress.$("#IgnoreDiscounts").prop("checked") !== true) {
          cy.get("#IgnoreDiscounts").check({force: true});
          cy.get("button[name=save]").click({force: true});
          cy.wait(10000);
        }
      } else {
        // Check that discounts aren't disabled, as that would interfere with our tests
        // If they are disabled, enabled them and save an env variable so that post-test clean up will disable them again once we're done
        if (Cypress.$("#IgnoreDiscounts").prop("checked") === true) {
          cy.get("#IgnoreDiscounts").uncheck({force: true});
          cy.get("button[name=save]").click({force: true});
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
      .click({force: true});
    cy.wait(5000);
    cy.get("#Published").check({force: true});
    cy.get("button[name=save]").click({force: true});
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
  const languageProperties = [] as {name: string, currency: string, displayOrder: string}[];
  cy.wrap(languageNames).each((lang, index, langNames) => {
    const langFilter = (index, item) => {
      return item.cells[0].innerText === lang;
    };
    cy.findTableItem("#languages-grid","#languages-grid_next", langFilter).then((row) => {
      cy.wrap(row).find(".button-column").find("a").click({force: true});
      cy.wait(5000)
      cy.location("pathname").should("include", "/Admin/Language/Edit").then(() => {
        var langObject = {name: lang, currency: "", displayOrder: ""};
        langObject.currency = Cypress.$("#DefaultCurrencyId").prop("selectedOptions")[0].innerText;
        langObject.displayOrder = Cypress.$("#DisplayOrder").val();
        languageProperties.push(langObject);
        cy.get(".content-header").find("small").find("a").click({force: true});
        cy.wait(5000);
        cy.location("pathname").should("eql", "/Admin/Language/List");
        cy.allowLoad();
      });
    });
  }).then(() => {
    Cypress.env("langsProperties", languageProperties);
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
          cy.wrap($row).find(".button-column").find("a").click({force: true});
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
            cy.get("button[name=save]").click({force: true});
            cy.wait(5000);
            cy.location("pathname").should("eql", "/Admin/Language/List");
            cy.allowLoad();
          });
        }
      });
    });
  }
});

// Set up categories that tests depend on
Cypress.Commands.add("setupCategories", () => {
  Cypress.log({displayName: "setupCategories", message: "Creating 2 Cypress categories"});
  const addCategory = (name: string, desc: string, displayOrder: string, seoName: string, getTrueSeo?: boolean) => {
    cy.get("a").contains("Add new").click({force: true});
    cy.wait(5000);
    return cy.location("pathname").should("eql", "/Admin/Category/Create").then(() => {
      enableAdvancedSettings().then(() => {
        cy.wait(2000);
        // Fill in name and description
        openPanel("#category-info").then(() => {
          cy.get("#category-info")
            .find("#category-name-localized-standard-tab")
            .find("#Name")
            .type(name, {force: true});
          cy.getIframeBody("#Description_ifr").find("p").type(desc, {force: true});
          
          cy.get("#selected-tab-name-category-name-localized")
            .siblings("ul")
            .invoke("children")
            .then(($li) => {
              const eligibleTabs = $li.filter((index, item) => {
                return !item.innerText.includes("Standard") && !item.innerText.includes("English");
              });
              var tabCount = eligibleTabs.length;
              if (tabCount > 0) {
                var currentTab = $li.index(eligibleTabs[0]);
                 const fillInTab = (tabIndex: number) => {
                  var language = $li[tabIndex].innerText;
                  cy.wrap($li[tabIndex]).find("a").click({force: true});
                  cy.wait(500);
                  cy.get("#category-name-localized-standard-tab")
                    .siblings()
                    .eq(tabIndex - 1)
                    .find("input")
                    .eq(0)
                    .type(name + ` (${language})`, {force: true});
                  if (tabIndex !== tabCount + 1) {
                    fillInTab(tabIndex + 1);
                  }
                };
                fillInTab(currentTab);
              }

            // Publish, menu, and display order
            openPanel("#category-display").then(() => {
              if (Cypress.$("#Published").prop("checked") !== true) {
                cy.get("#Published").check({force: true});
              }
              if (Cypress.$("#IncludeInTopMenu").prop("checked") !== true) {
                cy.get("#IncludeInTopMenu").check({force: true});
              }
              cy.get("#DisplayOrder").clear({force: true}).type(displayOrder, {force: true});

              // seo codes
              openPanel("#category-seo").then(() => {
                cy.get("#SeName").type(seoName, {force: true});
                cy.get("#MetaTitle").type(seoName, {force: true});
                if (getTrueSeo) {
                  cy.get("button[name=save-continue]").click({force: true});
                  cy.wait(5000);
                  cy.get("#SeName").invoke("val").then((value: string) => {
                    mainCategorySeo = value;
                    cy.visit("/Admin/Category/List");
                    cy.wait(5000);
                    cy.location("pathname").should("eql", "/Admin/Category/List");
                  });
                } else {
                  cy.get("button[name=save]").click({force: true});
                  cy.wait(5000);
                  cy.location("pathname").should("eql", "/Admin/Category/List");
                }
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
  Cypress.log({displayName: "setupProducts", message: "Creating 3 Cypress products"});
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
    cy.get("a").contains("Add new").click({force: true});
    cy.wait(5000);
    cy.wait("@productCreation");
    return cy.location("pathname").should("eql", "/Admin/Product/Create").then(() => {
      enableAdvancedSettings().then(() => {
        cy.wait(2000);
        // Fill in name and description
        openPanel("#product-info").then(() => {
          cy.get("#product-info")
            .find("#product-info-localized-standard-tab")
            .find("#Name")
            .type(name, {force: true});
          cy.get("#product-info")
            .find("#product-info-localized-standard-tab")
            .find("#ShortDescription")
            .type(desc, {force: true});
          cy.getIframeBody("#FullDescription_ifr").find("p").type(fullDesc, {force: true});
          // Add category
          cy.get("#SelectedCategoryIds").select(category, {force: true});
          // Make sure it's published
          if (Cypress.$("#Published").prop("checked") !== true) {
            cy.get("#Published").check({force: true});
          }
          // Price
          openPanel("#product-price").then(() => {
            cy.get("#Price").clear({force: true}).type(price, {force: true});
            // seo Codes
            openPanel("#product-seo").then(() => {
              cy.get("#product-seo")
                .find("#product-seo-localized-standard-tab")
                .find("#SeName")
                .type(seoName, {force: true});
              cy.get("#product-seo")
                .find("#product-seo-localized-standard-tab")
                .find("#MetaTitle")
                .type(seoName, {force: true});
              // Save and continute editing
              cy.get("button[name=save-continue]").click({force: true});
              cy.wait(5000);
              // Add picture
              openPanel("#product-pictures").then(() => {
                cy.get("#product-pictures").find("input[name=qqfile]").attachFile(pictureFile);
                cy.get("#AddPictureModel_OverrideAltAttribute").type(pictureAlt, {force: true});
                cy.get("#AddPictureModel_OverrideTitleAttribute").type(pictureAlt, {force: true});
                cy.wait(5000);
                cy.get("#addProductPicture").click({force: true});
                cy.wait(5000);
                cy.get("button[name=save]").click({force: true});
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
  Cypress.log({displayName: "setupCustomers", message: "Creating 3 Cypress customers"});
  const addCustomer = (email: string, name: string, custRoles: string[]) => {
    const today = new Date();
    const customer = {
        email: `cypress.${email}${Cypress._.random(0, 1e9)}@ecommcypresstesting.com`,
        password: `Cypress${name}`,
        first: "Cypress",
        last: name,
        gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
        dob: today.toLocaleString(undefined, {dateStyle: "short"}),
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
          cy.get("#SearchEmail").type("cypress", {force: true});
          cy.get("#search-subscriptions").click({force: true});
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
                    .click({force: true});
                  cy.wait(1000);
                  cy.wrap($row[0].cells[1])
                    .find("input")
                    .check({force: true});
                  cy.wrap($row[0].cells[3])
                    .find("a")
                    .eq(1)
                    .click({force: true});
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
  Cypress.log({displayName: "setupDiscounts", message: "Check if discounts are enabled and clear old discounts"});
  cy.visit("/");
  cy.login();
  // Check to make sure that discounts are enabled. If they aren't, enable them and save an env variable so we can disable them again later
  cy.switchEnabledDiscounts().then(() => {
    cy.cleanupDiscounts();
  });
});