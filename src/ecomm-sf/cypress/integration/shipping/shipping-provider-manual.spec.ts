/// <reference types="cypress" />
// TEST COUNT: 19

var provider = "Manual (Fixed or By Weight and By Total)";
var createdMethods = [] as string[];

const openManual = () => {
  return cy.findShippingProvider(provider).clickRowBtn("Configure", { force: true }).then(() => {
    cy.wait(1000);
    cy.location("pathname").should("eql", "/Admin/FixedByWeightByTotal/Configure");
  });
};

const flipManualSwitch = (setting?: string) => {
  if (!setting) {
    return cy.get(".onoffswitch-switch").click();
  } else {
    return cy.get("#advanced-settings-mode").invoke("prop", "checked").then((checked) => {
      if ((checked && setting.toLowerCase() === "fixed rate") || (!checked && setting.toLowerCase() === "by weight")) {
        return cy.get(".onoffswitch-switch").click();
      } else {
        return;
      }
    });
  }
};

const openOfflineManagement = () => {
  cy.intercept({
    path: "/Admin/Shipping/Methods",   
  }).as("methodsPage");
  cy.get("#manage-shipping-methods-button").click({ force: true});
  cy.wait("@methodsPage");
  cy.wait(1000);
  cy.allowLoad();
  return cy.location("pathname").should("eql", "/Admin/Shipping/Methods");
};

const getTableTotal = (infoId: string) => {
  return cy.get(infoId).invoke("text").then((txt) => {
    const tableTotal = Number(txt.replace(/[0-9]+-[0-9]+ of /g, "").replace(" items", ""));
    return tableTotal;
  });
};

// Finds shipping method in the Method Management and Rate tables ONLY
const findMethod = (name: string, isMethodTable: boolean, passIfUnfound?: boolean) => {
  const id = isMethodTable ? "#shippingmethod-grid" : "#shipping-rate-grid";
  const searchPage = () => {
    return cy.get(id).then(($table) => {
      var tbody = $table.find("tbody");
      if (tbody.length === 0) {
        return cy.wait(1000).then(() => {
          return searchPage();
        });
      } else {
        var rows = tbody.find("tr");
        if (rows.length === 0) {
          return cy.wait(1000).then(() => {
            return searchPage();
          });
        } else {
          var targetRow = Cypress.$(`${id} > tbody > tr:contains('${name}')`);
          if (targetRow.length > 0) {
            return cy.wrap(targetRow[0]);
          } else if (targetRow.length === 0) {
            // If the item is not there, check the next page if available
            var allPagination = Cypress.$(`${id}_paginate`).find(".paginate_button.page-item");
            var currentPage = Cypress.$(`${id}_paginate`).find(".paginate_button.page-item.active");
            if (allPagination.index(currentPage) !== allPagination.length - 2) {
              cy.get(`${id}_next`).find("a").click({ force: true });
              return cy.allowLoad().then(() => {
                return searchPage();
              });
            } else {
              if (passIfUnfound) {
                return null;
              } else {
                cy.get(id).should("contain.text", name);
                return null;
              }
            }
          }
        }
      }
    });
  };
  return searchPage();
};

const confirmMethodAbsent = (isMethodTable: boolean, name: string, desc?: string) => {
  const id = isMethodTable ? "#shippingmethod-grid" : "#shipping-rate-grid";
  const searchPage = () => {
    return cy.get(id).should("not.contain.text", name).then(() => {
      if (isMethodTable) {
        cy.get(id).should("not.contain.text", desc);
      }
      // If the item is not there, check the next page if available
      var allPagination = Cypress.$(`${id}_paginate`).find(".paginate_button.page-item");
      var currentPage = Cypress.$(`${id}_paginate`).find(".paginate_button.page-item.active");
      if (allPagination.index(currentPage) !== allPagination.length - 2) {
        cy.get(`${id}_next`).find("a").click({ force: true });
        return cy.allowLoad().then(() => {
          return searchPage();
        });
      } else {
        if (allPagination.length > 3) {
          return cy.wrap(allPagination[1]).find("a").click({force: true}).then(() => {
            return cy.allowLoad();
          });
        } else {
          return;                      
        }
      }
    });
  };
  return searchPage();
};

const createMethod = (name: string, desc: string, order: string) => {
  return openOfflineManagement().then(() => {
    cy.intercept({
      path: "/Admin/Shipping/CreateMethod",   
    }).as("createMethod");
    cy.contains("Add new").click();
    cy.wait("@createMethod");
    cy.get("#Name").type(name);
    cy.get("#Description").type(desc);
    cy.get("#DisplayOrder").clear({force: true}).type(order, {force: true});
    cy.intercept({
      path: "/Admin/Shipping/Methods",   
    }).as("methodsPage");
    cy.clickSave();
    createdMethods.push(name);
    cy.wait("@methodsPage");
    cy.wait(1000);
    cy.allowLoad();
  });
};

const editMethod = (name: string, newName: string, newDesc: string, newOrder: string) => {
  return findMethod(name, true).then((row) => {
    cy.wrap(row).clickRowBtn("Edit");
    cy.get("#Name").clear().type(newName);
    cy.get("#Description").clear().type(newDesc);
    cy.get("#DisplayOrder").clear({force: true}).type(`${newOrder}`, {force: true});
    cy.get("[name=save-continue]").click();
    cy.wait(500);
    cy.get("#Name").invoke("val").should("eql", newName);
    cy.get("#Description").invoke("val").should("eql", newDesc);
    cy.get("#DisplayOrder").invoke("val").should("eql", `${newOrder}`);
    cy.intercept({
      path: "/Admin/Shipping/Methods",   
    }).as("methodsPage");
    cy.clickSave();
    createdMethods[createdMethods.length - 1] = newName;
    cy.wait("@methodsPage");
  });
};

const deleteMethod = (name: string, passIfUnfound?: boolean) => {
  return openOfflineManagement().then(() => {
    findMethod(name, true, passIfUnfound).then((row) => {
      if (row) {
        cy.wrap(row).clickRowBtn("Edit");
        cy.get("#method-delete").click();
        cy.get("#shippingmethodmodel-DeleteMethod-delete-confirmation").find("button[type=submit]").click();
      }
    });
  });
};

const deleteAllCypress = () => {
  const iterateThrough = () => {
    return findMethod("Cypress", true, true).then((row) => {
      if (row) {
        cy.wrap(row).clickRowBtn("Edit");
        cy.wait(1000);
        cy.get("#method-delete").click();
        cy.get("#shippingmethodmodel-DeleteMethod-delete-confirmation").find("button[type=submit]").click();
        return cy.wait(500).then(() => {
          return iterateThrough();
        });
      } else {
        return;
      }
    });
  };
  return openOfflineManagement().then(() => {
    return iterateThrough();
  });
};

const verifyProductPopup = (
  name: string, 
  rate: string, 
  delivery: string,
  oldName?: string,
  oldRate?: string, 
  oldDelivery?: string,
) => {
  return cy.openShippingPopup(true).then(() => {
    cy.get(".no-shipping-options").should("not.exist");
    cy.get(".shipping-options-body")
      .find(".shipping-option")
      .should("exist")
      .and("not.be.empty");
    if (oldName) {
      cy.get(".shipping-options-body").should("not.contain.text", oldName);
    }
    cy.get(".shipping-options-body").should("contain.text", name);
    cy.get(`.estimate-shipping-row-item.shipping-item:contains('${name}')`).as("methodRow");
    cy.get("@methodRow").should(($row) => {
      // Using a function so we can have custom error message
      expect($row).to.have.length(1, `Created method '${name}' should only be displayed once`);
    });
    cy.get("@methodRow")
      .siblings(".estimate-shipping-row-item.shipping-item")
      .eq(0)
      .should(($tr) => {
        if (oldDelivery) {
          expect($tr).to.not.have.text(oldDelivery);
        }
        expect($tr).to.have.text(delivery);
      });
    cy.get("@methodRow")
      .siblings(".estimate-shipping-row-item.shipping-item")
      .eq(1)
      .should(($tr) => {
        if (oldRate) {
          expect($tr).to.not.have.text(oldRate);
        }
        expect($tr).to.have.text(rate);
      });
    cy.get(".mfp-close").click();
  });
};

const verifyCheckout = (
  name: string,
  desc: string,
  rate: string, 
  oldName?: string,
  oldDesc?: string,
  oldRate?: string, 
) => {
  cy.fillOutBilling();
  cy.wait(1000);
  cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
  cy.get(".method-list").find("li").should("exist").and("not.be.empty");
  if (oldName) {
    cy.get(".method-list").should("not.contain.text", oldName);
  }
  cy.get(".method-list").should("contain.text", name);
  if (oldDesc) {
    cy.get(".method-list").should("not.contain.text", oldDesc);
  }
  cy.get(".method-list").should("contain.text", desc);
  cy.get(`label:contains('${name}')`).as("methodLabel");
  cy.get("@methodLabel").should(($label) => {
    // Using a function so we can have custom error message
    expect($label).to.have.length(1, `Created method '${name}' should only be displayed once`);
  });
  cy.get("@methodLabel").should(($div) => {
    if (oldName || oldRate) {
      var nVal = oldName ? oldName : name;
      var rVal = oldRate ? oldRate : rate;
      expect($div.text()).not.to.eql(`${nVal} (${rVal})`, "Old values should not be displayed");
    }
    expect($div).to.have.text(`${name} (${rate})`);
  });
  cy.get("@methodLabel").parents(".method-name").siblings(".method-description").should(($div) => {
    // Using a function to access the text content and trim it
    if (oldDesc) {
      expect($div.text().trim()).not.to.eql(oldDesc, "Old description should not be displayed");
    }
    expect($div.text().trim()).to.eql(desc, "Method description on display should match input description");
  });
  cy.get("@methodLabel").siblings("input").check();
  cy.get(".shipping-method-next-step-button").click();
  cy.wait(2000);
  return cy.filloutPayment().then(() => {
    cy.intercept("POST", "/checkout/OpcConfirmOrder/").as('orderSubmitted');
    cy.get(".shipping-method-info")
      .find(".shipping-method")
      .find(".value")
      .should(($span) => {
        // Using a function to access the text content and trim it
        expect($span.text().trim()).to.eql(name, "Shipping method should display correctly when chosen");
      });
    cy.get(".selected-shipping-method").should("have.text", `(${name})`);
    cy.get(".shipping-cost").find(".value-summary").should("have.text", rate);
  });
};

const verifyMethodInPublic = (name: string, desc: string, rate: string, delivery: string) => {
  cy.goToPublic();
  return verifyProductPopup(name, rate, delivery).then(() => {
    cy.get(".add-to-cart-button").click();
    cy.allowLoad();
    cy.goToCart();
    cy.get("#termsofservice").check();
    cy.get("#checkout").click();
    return verifyCheckout(name, desc, rate);
  });
};

const hookFunction = () => {
  cy.visit("/");
  cy.login();
  cy.clearCart();
  return cy.goToShippingProviders();
};

describe("Ecommerce", function () {
  context("Manual Shipping Provider Configuration", () => {
    before(() => {
      cy.prepForShipping(provider).then(() => {
        cy.disableOtherProviders(provider).then(() => {
          openManual().then(() => {
            deleteAllCypress();
          });
        });
      });
    });

    beforeEach(() => {
      hookFunction();
    });

    after(() => {
      cy.visit("/");
      cy.login();
      cy.clearCart();
      cy.resetShippingProviders().then(() => {
        openManual().then(() => {
          deleteAllCypress();
        });
      });
    });

    context("Subsection: Verifying Configure and Back button", () => {
      it("Clicking the 'Configure' button sends the user to the manual provider configuration page", () => {
        cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
          cy.wait(1000);
          cy.location("pathname").should("eql", "/Admin/FixedByWeightByTotal/Configure");
          cy.contains(`Configure - ${provider}`).should("exist").and("be.visible");
        });
      });
  
      it("Clicking the 'Back to list' button sends the user back to the shipping provider list", () => {
        cy.findShippingProvider(provider).clickRowBtn("Configure").then(() => {
          cy.wait(1000);
          cy.location("pathname").should("eql", "/Admin/FixedByWeightByTotal/Configure");
  
          cy.clickBack().then(() => {
            cy.wait(1000);
            cy.location("pathname").should("eql", "/Admin/Shipping/Providers");
          });
        });
      });
    });

    context("Subsection: Verifying Admin Buttons", () => {
      beforeEach(() => {
        openManual();
      });

      it("Clicking the Fixed vs By Weight toggle changes the contents of the page to new contents appropriate for the toggle setting", () => {
        cy.get("#advanced-settings-mode").invoke("prop", "checked").then((checked) => {
          var byWeightValues = checked ? "be.visible" : "not.be.visible";
          var fixedValues = checked ? "not.be.visible" : "be.visible";
          cy.get(".card-search").should("exist").and(byWeightValues);
          cy.get("#shipping-byweight-grid").should("exist").and(byWeightValues);
          cy.get("#shipping-rate-grid").should("exist").and(fixedValues);

          flipManualSwitch();

          cy.get(".card-search").should("exist").and(fixedValues);
          cy.get("#shipping-byweight-grid").should("exist").and(fixedValues);
          cy.get("#shipping-rate-grid").should("exist").and(byWeightValues);

          flipManualSwitch();

          cy.get(".card-search").should("exist").and(byWeightValues);
          cy.get("#shipping-byweight-grid").should("exist").and(byWeightValues);
          cy.get("#shipping-rate-grid").should("exist").and(fixedValues);
        });
      });

      it("Clicking the 'Manage shipping methods' button will bring the user to a new page where they can create new offline methods", () => {
        cy.intercept({
          path: "/Admin/Shipping/Methods",   
        }).as("methodsPage");
        cy.get("#manage-shipping-methods-button").should("exist").and("be.visible");
        cy.get("#manage-shipping-methods-button").click();
        cy.wait("@methodsPage");
        cy.location("pathname").should("eql", "/Admin/Shipping/Methods");
        cy.contains("Shipping methods").should("exist").and("be.visible");
        cy.get("#shippingmethod-grid").should("exist").and("be.visible");
        cy.contains("Add new").should("exist").and("be.visible");
      });

      it("Clicking the 'Shipping method restrictions' button will bring the user to a new page where they can restrict methods by country", () => {
        cy.intercept({
          path: "/Admin/Shipping/Restrictions",   
        }).as("restrictionsPage");
        cy.get("#manage-shipping-methods-button").siblings("a").should("exist").and("be.visible");
        cy.get("#manage-shipping-methods-button").siblings("a").click();
        cy.wait("@restrictionsPage");
        cy.location("pathname").should("eql", "/Admin/Shipping/Restrictions");
        cy.contains("Shipping method restrictions").should("exist").and("be.visible");
        cy.get("table").should("exist").and("be.visible");
        cy.get("[name=save]").should("exist").and("be.visible");

        cy.get("table > tbody > tr").then(($rows) => {
          const countryCount = $rows.length;
          cy.visit("/Admin/Country/List");
          cy.wait(1000);
          cy.allowLoad();
          cy.get("#countries-grid_info").invoke("text").then((txt) => {
            const tableTotal = Number(txt.replace(/[0-9]+-[0-9]+ of /g, "").replace(" items", ""));
            expect(countryCount).to.eql(tableTotal, "There should be the same number of countries in the restriction table as in the countries table");
          });
        });
      });

      it("Clicking the 'Add new' button on the offline method management page takes the user to a new page where they can add a new method", () => {
        openOfflineManagement().then(() => {
          cy.intercept({
            path: "/Admin/Shipping/CreateMethod",   
          }).as("createMethod");
          cy.contains("Add new").click();
          cy.wait("@createMethod");
          cy.location("pathname").should("eql", "/Admin/Shipping/CreateMethod");
          cy.contains("Add a new shipping method").should("exist").and("be.visible");
          cy.get("[name=save]").should("exist").and("be.visible");
          cy.get("[name=save-continue]").should("exist").and("be.visible");
          cy.get("#Name").should("exist").and("be.visible");
          cy.get("#Description").should("exist").and("be.visible");
          cy.get("#DisplayOrder").should("exist");
        });
      });

      it("Clicking the back to list button on the method creation page returns the user to the offline method management page and no new method is created", () => {
        openOfflineManagement().then(() => {
          cy.intercept({
            path: "/Admin/Shipping/CreateMethod",   
          }).as("createMethod");
          cy.contains("Add new").click();
          cy.wait("@createMethod");
          cy.get("#Name").type("Cypress Back");
          cy.get("#Description").type("A Cypress shipping method that shouldn't exist");
          cy.get("#DisplayOrder").clear({force: true}).type("1", {force: true});
          cy.intercept({
            path: "/Admin/Shipping/Methods",   
          }).as("methodsPage");
          cy.clickBack();
          cy.wait("@methodsPage");
          cy.location("pathname").should("eql", "/Admin/Shipping/Methods");
          cy.contains("Shipping methods").should("exist").and("be.visible");
          cy.get("#shippingmethod-grid").should("exist").and("be.visible");
          cy.contains("Add new").should("exist").and("be.visible");
          cy.get("#shippingmethod-grid").should("not.contain.text", "Cypress Back");
        });
      });
    });

    context("Subsection: Manual Methods (Admin Side)", () => {
      beforeEach(() => {
        openManual();
      });

      afterEach(() => {
        if (createdMethods.length > 0) {
          hookFunction().then(() => {
            openManual().then(() => {
              deleteMethod(createdMethods[0], true);
              createdMethods.shift();
            });
          });
        }
      });

      it("Creating a new offline shipping method is successful, and the method appears in the relevant admin tables", () => {
        var name = "Cypress Create Test";
        var desc = "Cypress testing creating an offline shipping test";
        var order = `${Cypress._.random(0, 10)}`;
        flipManualSwitch("Fixed Rate").then(() => {
          getTableTotal("#shipping-rate-grid_info").then((rateCount) => {
            openOfflineManagement().then(() => {
              cy.intercept({
                path: "/Admin/Shipping/CreateMethod",   
              }).as("createMethod");
              getTableTotal("#shippingmethod-grid_info").then((methodCount) => {
                if (methodCount > Number(order)) {
                  order = `${methodCount + 1}`;
                }
                cy.contains("Add new").click();
                cy.wait("@createMethod");
                cy.get("#Name").type(name);
                cy.get("#Description").type(desc);
                cy.get("#DisplayOrder").clear({force: true}).type(order, {force: true});
                cy.intercept({
                  path: "/Admin/Shipping/Methods",   
                }).as("methodsPage");
                cy.clickSave();
                createdMethods.push(name);
                cy.wait("@methodsPage");
                cy.wait(1000);
                cy.allowLoad();
                cy.refreshTable();
                getTableTotal("#shippingmethod-grid_info").then((newMethodCount) => {
                  expect(newMethodCount).to.be.greaterThan(methodCount, "The total items in the method management table has increased");
                  findMethod(name, true).then((row) => {
                    cy.wrap(row).find("td").eq(0).should("have.text", name);
                    cy.wrap(row).find("td").eq(1).should("have.text", desc);
                    cy.wrap(row).find("td").eq(2).should("have.text", order);

                    cy.goToShippingProviders();
                    openManual();
                    flipManualSwitch("Fixed Rate").then(() => {
                      cy.refreshTable();
                      getTableTotal("#shipping-rate-grid_info").then((newRateCount) => {
                        expect(newRateCount).to.be.greaterThan(rateCount, "The total items in the fixed rate table has increased");
                        findMethod(name, false).then((rowTwo) => {
                          cy.wrap(rowTwo).find("[data-columnname=ShippingMethodName]").should("have.text", name);
                          cy.wrap(rowTwo).find("[data-columnname=Rate]").should("have.text", "0");
                          cy.wrap(rowTwo).find("[data-columnname=TransitDays]").should("have.text", "");
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
      
      it("The 'Edit' button on an offline shipping method will take the user to a new page where they can edit the method", () => {
        var name = "Cypress Edit Button";
        var desc = "Cypress testing the edit button";
        var order = "0";
        createMethod(name, desc, order).then(() => {
          findMethod(name, true).then((row) => {
            cy.wrap(row).clickRowBtn("Edit");
            cy.location("pathname").should("include", "/Admin/Shipping/EditMethod/");
            cy.contains(`Edit shipping method details - ${name}`).should("exist").and("be.visible");
            cy.get("[name=save]").should("exist").and("be.visible");
            cy.get("[name=save-continue]").should("exist").and("be.visible");
            cy.get("#method-delete").should("exist").and("be.visible");
            cy.get("#Name").should("exist").and("be.visible");
            cy.get("#Name").invoke("val").should("eql", name);
            cy.get("#Description").should("exist").and("be.visible");
            cy.get("#Description").invoke("val").should("eql", desc);
            cy.get("#DisplayOrder").should("exist");
            cy.get("#DisplayOrder").invoke("val").should("eql", order);
          });
        });
      });

      it("Clicking the back to list button on the method editing page returns the user to the offline method management page and the method is unchanged", () => {
        var name = "Cypress Edit Exit";
        var newName = "Cypress Edit Abandoned";
        var desc = "Cypress testing abandoning the edit process";
        var newDesc = "Cypress testing after editing abandoned";
        var order = Cypress._.random(0, 10);
        var newOrder = Cypress._.random(order + 1, 20);
        createMethod(name, desc, `${order}`).then(() => {
          findMethod(name, true).then((row) => {
            cy.wrap(row).clickRowBtn("Edit");
            cy.get("#Name").clear().type(newName);
            cy.get("#Description").clear().type(newDesc);
            cy.get("#DisplayOrder").clear({force: true}).type(`${newOrder}`, {force: true});
            cy.intercept({
              path: "/Admin/Shipping/Methods",   
            }).as("methodsPage");
            cy.clickBack();
            cy.wait("@methodsPage");
            cy.location("pathname").should("eql", "/Admin/Shipping/Methods");
            cy.contains("Shipping methods").should("exist").and("be.visible");
            cy.get("#shippingmethod-grid").should("exist").and("be.visible");
            cy.contains("Add new").should("exist").and("be.visible").then(() => {
              confirmMethodAbsent(true, newName, newDesc).then(() => {
                findMethod(name, true).then((row) => {
                  cy.wrap(row).find("td").eq(0).should("have.text", name);
                  cy.wrap(row).find("td").eq(1).should("have.text", desc);
                  cy.wrap(row).find("td").eq(2).should("not.have.text", newOrder).and("have.text", order);
                });
              });
            });
          });
        });
      });

      it("Editing an existing offline shipping method is successful, and the method is updated in the relevant admin tables", () => {
        var name = "Cypress Orginal Method";
        var desc = "The original values for a cypress shipping method that will be edited";
        var order = Cypress._.random(0, 10);
        var newName = "Cypress Edited Method";
        var newDesc = "The new values for a cypress shipping method that was edited";
        var newOrder = Cypress._.random(order + 1, 20);
        createMethod(name, desc, `${order}`).then(() => {
          editMethod(name, newName, newDesc, `${newOrder}`).then(() => {
            cy.wait(1000);
            cy.allowLoad();
            confirmMethodAbsent(true, name, desc).then(() => {
              findMethod(newName, true).then((row) => {
                cy.wrap(row).find("td").eq(0).should("have.text", newName);
                cy.wrap(row).find("td").eq(1).should("have.text", newDesc);
                cy.wrap(row).find("td").eq(2).should("not.have.text", `${order}`).and("have.text", `${newOrder}`);
              });

              cy.goToShippingProviders();
              openManual();
              flipManualSwitch("Fixed Rate").then(() => {
                confirmMethodAbsent(false, name).then(() => {
                  findMethod(newName, false).then((rowTwo) => {
                    cy.wrap(rowTwo).find("[data-columnname=ShippingMethodName]").should("have.text", newName);
                  });
                });
              });
            });
          });
        });
      });

      it("Deleting an existing offline shipping method is successful, and the method no longer appears in the relevant admin tables", () => {
        var name = "Cypress Delete Test";
        var desc = "Cypress testing deleting an offline shipping test";
        var order = `${Cypress._.random(0, 10)}`;
        createMethod(name, desc, `${order}`).then(() => {
          findMethod(name, true).then((row) => {
            cy.wrap(row).clickRowBtn("Edit");
            cy.get("#method-delete").click();
            cy.get("#shippingmethodmodel-DeleteMethod-delete-confirmation")
              .should("exist")
              .and("be.visible");
            cy.get("#shippingmethodmodel-DeleteMethod-delete-confirmation")
              .find("button[type=submit]")
              .should("exist")
              .and("be.visible");
            cy.get("#shippingmethodmodel-DeleteMethod-delete-confirmation")
              .find("button[type=submit]")
              .click();
            cy.wait("@methodsPage").then(() => {
              confirmMethodAbsent(true, name, desc).then(() => {
                cy.goToShippingProviders();
                openManual();
                flipManualSwitch("Fixed Rate").then(() => {
                  confirmMethodAbsent(false, name);
                });
              });
            });
          });
        });
      });
    });

    context("Subsection: Manual Methods (Public Side)", () => {
      beforeEach(() => {
        openManual();
      });

      afterEach(() => {
        if (createdMethods.length > 0) {
          hookFunction().then(() => {
            openManual().then(() => {
              deleteMethod(createdMethods[0], true);
              createdMethods.shift();
            });
          });
        }
      });

      it("Creating a new offline shipping method is successful, and the method appears in the public store", () => {
        var name = "Cypress Shipping";
        var desc = "A Cypress shipping method where gondoliers in cypress-wood boats hand-deliver your package";
        var order = `${Cypress._.random(0, 10)}`;
        createMethod(name, desc, order).then(() => {
          verifyMethodInPublic(name, desc, "$0.00", "-").then(() => {
            cy.get(".confirm-order-next-step-button").click();
            cy.wait("@orderSubmitted");
          });
        });
      });

      it("Editing an existing offline shipping method is successful, and the new values appear in the public store", () => {
        var name = "Cypress Original Shipping";
        var desc = "The sellers strap your purchase to a cypress tree and ferry it down the river";
        var order = Cypress._.random(0, 10);
        var newName = "Cypress Improved Shipping";
        var newDesc = "New! Sellers will now ferry your purchase on a boat made of a cypress tree";
        var newOrder = Cypress._.random(order + 1, 20);
        createMethod(name, desc, `${order}`).then(() => {
          verifyMethodInPublic(name, desc, "$0.00", "-").then(() => {
            cy.goToShippingProviders();
            openManual().then(() => {
              openOfflineManagement().then(() => {
                editMethod(name, newName, newDesc, `${newOrder}`).then(() => {
                  cy.goToPublic();
                  verifyProductPopup(newName, "$0.00", "-", name).then(() => {
                    cy.goToCart();
                    cy.get("#termsofservice").check();
                    cy.get("#checkout").click();
                    verifyCheckout(newName, newDesc, "$0.00", name, desc).then(() => {
                      cy.get(".confirm-order-next-step-button").click();
                      cy.wait("@orderSubmitted");
                    });
                  });
                });
              });
            });
          });
        });
      });

      it("Deleting a new offline shipping method is successful, and the method no longer appears in the public store", () => {
        var name = "Cypress Shipping (Defunct)";
        var desc = "This shipping method is no longer available for use, and will be removed soon";
        var order = `${Cypress._.random(0, 10)}`;
        createMethod(name, desc, order).then(() => {
          verifyMethodInPublic(name, desc, "$0.00", "-").then(() => {
            cy.goToShippingProviders();
            openManual().then(() => {
              deleteMethod(name).then(() => {
                cy.goToPublic();
                cy.openShippingPopup(true).then(() => {
                  cy.get(".shipping-options-body").should("not.contain.text", name);
                  cy.get(".mfp-close").click();
                  cy.goToCart();
                  cy.get("#termsofservice").check();
                  cy.get("#checkout").click();
                  cy.fillOutBilling();
                  cy.wait(1000);
                  cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
                  cy.get(".method-list").should("not.contain.text", name);
                  cy.get(".method-list").should("not.contain.text", desc);
                });
              });
            });
          });
        });
      });
    });

    context("Subsection: Verifying Rate and Delivery", () => {
      beforeEach(() => {
        openManual();
      });

      afterEach(() => {
        if (createdMethods.length > 0) {
          hookFunction().then(() => {
            openManual().then(() => {
              deleteMethod(createdMethods[0], true);
              createdMethods.shift();
            });
          });
        }
      });

      it("Clicking the 'Edit' button on the Fixed Rate table reveals new inputs and buttons", () => {
        var name = "Cypress Fixed Rate Button";
        var order = `${Cypress._.random(0, 10)}`;
        createMethod(name, " ", order).then(() => {
          cy.goToShippingProviders();
          openManual();
          flipManualSwitch("Fixed Rate").then(() => {
            findMethod(name, false).then((row) => {
              // Buttons are not visible
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .find("input")
                .should("not.exist");
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .find("input")
                .should("not.exist");
              cy.wrap(row)
                .find("a[id*='buttonEdit']")
                .should("exist")
                .and("be.visible");
              cy.wrap(row)
                .find("a[id*='buttonConfirm']")
                .should("exist")
                .and("not.be.visible")
              cy.wrap(row)
                .find("a[id*='buttonCancel']")
                .should("exist")
                .and("not.be.visible");
              // Click edit button
              cy.wrap(row).clickRowBtn("Edit");
              // Inputs and buttons should be visible now
              cy.wrap(row)
              .find("td[data-columnname='Rate']")
              .find("input")
              .should("exist")
              .should("not.be.disabled")
              .and("be.visible");
            cy.wrap(row)
              .find("td[data-columnname='TransitDays']")
              .find("input")
              .should("exist")
              .should("not.be.disabled")
              .and("be.visible");
              cy.wrap(row)
              .find("a[id*='buttonEdit']")
              .should("exist")
              .and("not.be.visible");
            cy.wrap(row)
              .find("a[id*='buttonConfirm']")
              .should("exist")
              .should("not.be.disabled")
              .and("be.visible");
            cy.wrap(row)
              .find("a[id*='buttonCancel']")
              .should("exist")
              .should("not.be.disabled")
              .and("be.visible");
            });
          })
        });
      });

      it("Clicking the 'Cancel' button on the Fixed Rate table changes the available elements and no changes are saved", () => {
        var name = "Cypress Fixed Rate Cancel";
        var order = `${Cypress._.random(0, 10)}`;
        var rate =`${Cypress._.random(1, 10)}`;
        var transit = `${Cypress._.random(3, 7)}`;
        createMethod(name, " ", order).then(() => {
          cy.goToShippingProviders();
          openManual();
          flipManualSwitch("Fixed Rate").then(() => {
            findMethod(name, false).then((row) => {
              cy.wrap(row).clickRowBtn("Edit");
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .find("input")
                .clear()
                .type(rate);
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .type(transit);
              cy.wrap(row).clickRowBtn("Cancel");
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .find("input")
                .should("not.exist");
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .find("input")
                .should("not.exist");
              cy.wrap(row)
                .find("a[id*='buttonEdit']")
                .should("exist")
                .and("be.visible");
              cy.wrap(row)
                .find("a[id*='buttonConfirm']")
                .should("exist")
                .and("not.be.visible")
              cy.wrap(row)
                .find("a[id*='buttonCancel']")
                .should("exist")
                .and("not.be.visible");
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .should("not.have.text", rate);
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .should("not.have.text", transit);
            });
          });
        });
      });

      it("Clicking the 'Update' button on the Fixed Rate table changes the available element and saves the changes", () => {
        var name = "Cypress Fixed Rate Update";
        var order = `${Cypress._.random(0, 10)}`;
        var rate =`${Cypress._.random(1, 10)}`;
        var transit = `${Cypress._.random(3, 7)}`;
        createMethod(name, " ", order).then(() => {
          cy.goToShippingProviders();
          openManual();
          flipManualSwitch("Fixed Rate").then(() => {
            findMethod(name, false).then((row) => {
              cy.wrap(row).clickRowBtn("Edit");
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .find("input")
                .clear()
                .type(rate);
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .type(transit);
              cy.intercept({
                path: "/Admin/FixedByWeightByTotal/FixedShippingRateList",   
              }).as("rateList");
              cy.wrap(row).clickRowBtn("Update");
              cy.wait("@rateList");
              findMethod(name, false).then((newRow) => {
                cy.wrap(newRow)
                  .find("td[data-columnname='Rate']")
                  .find("input")
                  .should("not.exist");
                cy.wrap(newRow)
                  .find("td[data-columnname='TransitDays']")
                  .find("input")
                  .should("not.exist");
                cy.wrap(newRow)
                  .find("a[id*='buttonEdit']")
                  .should("exist")
                  .and("be.visible");
                cy.wrap(newRow)
                  .find("a[id*='buttonConfirm']")
                  .should("exist")
                  .and("not.be.visible")
                cy.wrap(newRow)
                  .find("a[id*='buttonCancel']")
                  .should("exist")
                  .and("not.be.visible");
                cy.wrap(newRow)
                  .find("td[data-columnname='Rate']")
                  .should("have.text", rate);
                cy.wrap(newRow)
                  .find("td[data-columnname='TransitDays']")
                  .should("have.text", transit);
              });
            });
          });
        });
      });

      it("Updating a offline method with a rate and transit time will show those values in the public store", () => {
        var name = "Cypress Premium Shipping";
        var desc = "An extremely fancy shipping method that costs money to use";
        var order = `${Cypress._.random(0, 10)}`;
        var rate = `${Cypress._.random(1, 10)}`;
        var transit = Cypress._.random(3, 7);
        var today = new Date();
        var expectedTransit = new Date(today.valueOf() + (transit * 86400000));
        createMethod(name, desc, order).then(() => {
          cy.goToShippingProviders();
          openManual();
          flipManualSwitch("Fixed Rate").then(() => {
            findMethod(name, false).then((row) => {
              cy.wrap(row).clickRowBtn("Edit");
              cy.wrap(row)
                .find("td[data-columnname='Rate']")
                .find("input")
                .clear()
                .type(rate);
              cy.wrap(row)
                .find("td[data-columnname='TransitDays']")
                .type(`${transit}`);
              cy.intercept({
                path: "/Admin/FixedByWeightByTotal/FixedShippingRateList",   
              }).as("rateList");
              cy.wrap(row).clickRowBtn("Update");
              cy.wait("@rateList").then(() => {
                verifyMethodInPublic(name, desc, `$${rate}.00`, expectedTransit.toLocaleDateString());
              });
            });
          });
        });
      });
    });

    // TODO: Testing Formula-based shipping methods
  });
});