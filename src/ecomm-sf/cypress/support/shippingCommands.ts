/**
 * Commands for shipping providers tests
 * Some commands take the place of tests, due to the tests being mostly identical between providers
 */

// TEST COMMANDS
// Tests that a provider's shipping methods are present in checkout
Cypress.Commands.add("methodsPresentCheckout", (providerName: string, domesticMethods: boolean) => {
  cy.providerSetup(providerName, domesticMethods).then(() => {
    cy.addToCartAndCheckout().then(() => {
      handleBillingAndShipping(domesticMethods);
      cy.wait(1000);
      cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
      const provDisName = getAcronym(providerName);
      cy.get(".method-list").find("li").should("exist").and("not.be.empty");
      cy.get(".method-list").should("contain.text", provDisName);
      cy.get(".method-list").find("li").each((el, index) => {
        // The only methods present belong to the provider
        expect(el.text()).to.include(provDisName);
        // All of these providers are domestic
        checkServiceLocation(el.text(), providerName, domesticMethods);
      });
    });
  });
});

// Tests that a provider's shipping methods are present on product page
Cypress.Commands.add("methodsPresentProductPage", (providerName: string, domesticMethods: boolean) => {
  cy.providerSetup(providerName, domesticMethods).then(() => {
    cy.openShippingPopup(domesticMethods).then(() => {
      const provDisName = getAcronym(providerName);
      cy.get(".no-shipping-options").should("not.exist");
      cy.get(".shipping-options-body")
        .find(".shipping-option")
        .should("exist")
        .and("not.be.empty");
      cy.get(".shipping-options-body").should("contain.text", provDisName);
      cy.get(".shipping-options-body")
        .find(".shipping-option")
        .each((el, index) => {
          // The only methods present belong to the provider
          expect(el.text()).to.include(provDisName);
          // All of these providers are domestic
          checkServiceLocation(el.text(), providerName, domesticMethods);
        });
    });
  });
});

// Tests that a configuring a provider with an additional charge will increase the prices in checkout
Cypress.Commands.add("providerChargeCheckout", (providerName: string, domesticMethods: boolean) => {
  cy.providerSetup(providerName, domesticMethods).then(() => {
    cy.addToCartAndCheckout().then(() => {
      handleBillingAndShipping(domesticMethods);
      cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
      getCheckoutMethodCosts().then((originalMethods) => {
        var additionalCharge = Cypress._.random(1, 10);
        addHandlingCharge(providerName, `${additionalCharge}`).then(() => {
          cy.goToCart();
          cy.get("#termsofservice").click();
          cy.get(".checkout-button").click();
          cy.wait(500).then(() => {
            handleBillingAndShipping(domesticMethods);
            cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
            getCheckoutMethodCosts().then((newMethods) => {
              compareMethodCosts(newMethods, originalMethods, additionalCharge);
            });
          });
        });
      });
    });
  });
});

Cypress.Commands.add("providerChargeProduct", (providerName: string, domesticMethods: boolean) => {
  cy.providerSetup(providerName, domesticMethods).then(() => {
    cy.openShippingPopup(domesticMethods).then(() => {
      cy.get(".no-shipping-options").should("not.exist");
      cy.get(".shipping-options-body")
        .find(".shipping-option")
        .should("exist")
        .and("not.be.empty");
      getProductMethodCosts().then((originalMethods) => {
        var additionalCharge = Cypress._.random(1, 10);
        addHandlingCharge(providerName, `${additionalCharge}`).then(() => {
          cy.openShippingPopup(domesticMethods).then(() => {
            cy.get(".no-shipping-options").should("not.exist");
            cy.get(".shipping-options-body")
              .find(".shipping-option")
              .should("exist")
              .and("not.be.empty");
            getProductMethodCosts().then((newMethods) => {
              compareMethodCosts(newMethods, originalMethods, additionalCharge);
            });
          });
        });
      });
    });
  });
});

Cypress.Commands.add("allMethodsCheckout", (providerName: string) => {
  const provDisName = getAcronym(providerName);
  cy.providerSetup(providerName, undefined, true).then(() => {
    cy.addToCartAndCheckout().then(() => {
      handleBillingAndShipping(true);
      cy.wait(1000);
      cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
      cy.get(".method-list").find("li").should("exist").and("not.be.empty");
      cy.get(".method-list").should("contain.text", provDisName);
      cy.get(".method-list").find("li").each((el, index) => {
        // The only methods present belong to the provider
        expect(el.text()).to.include(provDisName);
        // All of these providers are domestic
        checkServiceLocation(el.text(), providerName, true);
      }).then(() => {
        cy.get(".back-link:visible").find("a").click();
        cy.wait(500);
        handleBillingAndShipping(false);
        cy.wait(1000);
        cy.get("#shipping-methods-form").find(".message-error").should("not.exist");
        cy.get(".method-list").find("li").should("exist").and("not.be.empty");
        cy.get(".method-list").should("contain.text", provDisName);
        cy.get(".method-list").find("li").each((el, index) => {
          // The only methods present belong to the provider
          expect(el.text()).to.include(provDisName);
          // All of these providers are international
          checkServiceLocation(el.text(), providerName, false);
        });
      });
    });
  });
});

Cypress.Commands.add("allMethodsProduct", (providerName: string) => {
  const provDisName = getAcronym(providerName);
  cy.providerSetup(providerName, undefined, true).then(() => {
    cy.openShippingPopup(true).then(() => {
      cy.get(".no-shipping-options").should("not.exist");
      cy.get(".shipping-options-body")
        .find(".shipping-option")
        .should("exist")
        .and("not.be.empty");
      cy.get(".shipping-options-body").should("contain.text", provDisName);
      cy.get(".shipping-options-body")
        .find(".shipping-option")
        .each((el, index) => {
          // The only methods present belong to the provider
          expect(el.text()).to.include(provDisName);
          // All of these providers are domestic
          checkServiceLocation(el.text(), providerName, true);
        }).then(() => {
          cy.checkPopupAddress(false).then(() => {
            cy.get(".no-shipping-options").should("not.exist");
            cy.get(".shipping-options-body")
              .find(".shipping-option")
              .should("exist")
              .and("not.be.empty");
            cy.get(".shipping-options-body").should("contain.text", provDisName);
            cy.get(".shipping-options-body")
              .find(".shipping-option")
              .each((el, index) => {
                // The only methods present belong to the provider
                expect(el.text()).to.include(provDisName);
                // All of these providers are international
                checkServiceLocation(el.text(), providerName, false);
              });
          });
        });
    });
  });
});

// COMMANDS AND FUNCTIONS TO BE USED IN THE TESTS

// Gets the acronym used by UPS and USPS
const getAcronym = (providerName: string) => {
  return providerName.replace(/\(.*\)/g, "").trim();
};

// Looks at the shipping method name to see if it's an international or domestic method
const checkServiceLocation = (methodName: string, providerName: string, domesticMethods: boolean) => {
  var locationNames = [];
  switch (providerName) {
    case "UPS (United Parcel Service)":
      locationNames.push("Worldwide");
      break;
    case "FedEx":
      locationNames.push("International");
      break;
    case "USPS (US Postal Service)":
      locationNames.push("International");
      locationNames.push("Global");
      locationNames.push("GXG");
      break;
    default:
      break;
  }
  locationNames.forEach((val) => {
    if (domesticMethods) {
      expect(methodName).not.to.include(val);
    } else {
      expect(methodName).to.include(val);
    }
  });
};

const handleBillingAndShipping = (domesticMethods: boolean) => {
  if (domesticMethods) {
    return cy.fillOutBilling();
  } else {
    return cy.shipInternationally();
  }
};

// Adds a handling charge to a provider
const addHandlingCharge = (providerName: string, charge: string) => {
  cy.goToShippingProviders();
  return cy.findShippingProvider(providerName).clickRowBtn("Configure").then(() => {
    cy.wait(2000);
    cy.get("#AdditionalHandlingCharge").clear({ force: true }).type(charge, { force: true });
    cy.clickSave();
    return cy.goToPublic();
  });
};

// Gets the cost of the methods in the checkout
const getCheckoutMethodCosts = () => {
  const methods = [] as {name: string, cost: number}[];
  const costPattern = /\(\$\d+\.\d+.*\)/g;
  const moneyPattern = /[^0-9.]/g;
  return cy.get(".method-name").each((el, index) => {
    var text = el.find("label").text();
    var fullCost = text.match(costPattern);
    var methodName = text.replace(fullCost, "");
    var methodCost = fullCost?.toString().replace(moneyPattern, "");
    methods.push({ name: methodName, cost: Number(methodCost) });
  }).then(($el) => {
    return methods;
  });
};

const getProductMethodCosts = () => {
  const methods = [] as {name: string, cost: number}[];
  const moneyPattern =  /[^0-9.]/g;
  return cy.get(".shipping-options-body")
    .find(".shipping-option")
    .each((el, index) => {
      var methodName = el.find(".shipping-item:eq(0)").text();
      var fullCost = el.find(".shipping-item:eq(2)").text();
      var methodCost = fullCost.replace(moneyPattern, "");
      methods.push({ name: methodName, cost: Number(methodCost) });
    }).then(() => {
      return methods;
    });
};

// Compares the cost of shipping methods
const compareMethodCosts = (newCosts: {name: string, cost: number}[], originalCosts: {name: string, cost: number}[], charge: number) => {
  expect(newCosts.length).to.eql(originalCosts.length, "There is the same amount of shipping methods available");
  newCosts.forEach((val) => {
    var orgMethod = originalCosts.find((org) => {
      return org.name === val.name;
    });
    assert.exists(orgMethod, `The "${val.name}" method is present before and after adding a charge`);
    var expectedCost = Number((orgMethod.cost + charge).toFixed(2));
    expect(val.cost).to.eql(expectedCost, `Original price $${orgMethod.cost} should have increased by ${charge}`);
  });
};
  

Cypress.Commands.add("clickSave", () => {
  return cy.get("input[name=save]").click();
});

Cypress.Commands.add("clickBack", () => {
  return cy.get(".content-header").find("small").find("a").click();
});

Cypress.Commands.add("providerSetup", (providerName: string, domesticMethods?: boolean, allMethods?: boolean) => {
  return cy.findShippingProvider(providerName).clickRowBtn("Configure").then(() => {
    cy.wait(1000);
    cy.location("pathname").should("contain", "Configure");
    cy.verifyRequiredConfigs(providerName).then(() => {
      cy.enableCarrierServices(providerName, domesticMethods, allMethods).then(() => {
        cy.postConfigChange(providerName).then(() => {
          return cy.goToPublic();
        });
      });
    });
  });
});

// Makes sure a provider has its required configurations filled out.
Cypress.Commands.add("verifyRequiredConfigs", (providerName: string) => {
  var valueChanged = false;
  const setChargeToZero = () => {
    // Must be forced because input is not visible
    return cy.get("#AdditionalHandlingCharge").invoke("val").then((val) => {
      if (Number(val) !== 0) {
        valueChanged = true;
        cy.get("#AdditionalHandlingCharge").clear({ force: true }).type("0", { force: true });
      }
    });
  };
  const verifyInput = (inputId: string, expectedVal: string) => {
    return cy.get(inputId).invoke("val").then((inputVal) => {
      if (inputVal !== expectedVal) {
        valueChanged = true;
        cy.get(inputId).clear({ force: true }).type(expectedVal, { force: true });
      }
    });
  };

  if (providerName === "UPS (United Parcel Service)") {
    // DO NOT YET HAVE THESE VALUES
    // TODO: FILL IN VALUES ONCE ACQUIRED
    const upsAccNo = "";
    const upsAccessKey = "";
    const upsUsername = "";
    const upsPassword = "";
    return verifyInput("#AccountNumber", upsAccNo).then(() => {
      verifyInput("#AccessKey" , upsAccessKey).then(() => {
        verifyInput("#Username", upsUsername).then(() => {
          verifyInput("#Password", upsPassword).then(() => {
            return setChargeToZero().then(() => {
              if (valueChanged) {
                return cy.clickSave().then(() => {
                  cy.wait(1000);
                });
              }
            });
          });
        });
      });
    });
  } else if (providerName === "FedEx") {
    const fedexUrl = "https://wsbeta.fedex.com:443/web-services";
    const fedexKey = "M6o2Bwct5tzuk5cv";
    const fedexPassword = "hCebGQYorsmH4g273a4fdMweA";
    const fedexAccNo = "510087640";
    const fedexMeterNo = "119207964";
    return verifyInput("#Url", fedexUrl).then(() => {
      verifyInput("#Key" , fedexKey).then(() => {
        verifyInput("#Password", fedexPassword).then(() => {
          verifyInput("#AccountNumber", fedexAccNo).then(() => {
            verifyInput("#MeterNumber", fedexMeterNo).then(() => {
              cy.get("#UseResidentialRates").invoke("prop", "checked").then((isChecked) => {
                if (isChecked) {
                  cy.get("#UseResidentialRates").uncheck();
                  valueChanged = true;
                }
                cy.get("#ApplyDiscounts").invoke("prop", "checked").then((checked) => {
                  if (checked) {
                    cy.get("#ApplyDiscounts").uncheck();
                    valueChanged = true;
                  }
                  return setChargeToZero().then(() => {
                    if (valueChanged) {
                      return cy.clickSave().then(() => {
                        cy.wait(1000);
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  } else if (providerName === "USPS (US Postal Service)") {
    const uspsUrl = "http://production.shippingapis.com/ShippingAPI.dll";
    const uspsUsername = "386APTEA0121";
    const uspsPassword = "896ST58HC192";
    return verifyInput("#Url", uspsUrl).then(() => {
      verifyInput("#Username", uspsUsername).then(() => {
        verifyInput("#Password", uspsPassword).then(() => {
          return setChargeToZero().then(() => {
            if (valueChanged) {
              return cy.clickSave().then(() => {
                cy.wait(1000);
              });
            }
          });
        });
      });
    });
  }
});

// Enabled the provider's domestic or international shipping methods, or both
Cypress.Commands.add("enableCarrierServices", (providerName: string, domestic?: boolean, all?: boolean) => {
  var valueChanged = false;
  return cy.get(".content").find("input[type=checkbox]").then(($ins) => {
    const domesticInputs = $ins.filter((index, item) => {
      if (providerName === "USPS (US Postal Service)") {
        return item.getAttribute("name").includes("CarrierServicesDomestic") && !item.value.includes("NONE");
      } else if (providerName === "UPS (United Parcel Service)") {
        return item.getAttribute("name").includes("CarrierServices") && !item.value.includes("Worldwide") ;
      } else if (providerName === "FedEx") {
        return item.getAttribute("name").includes("CarrierServices") && !item.value.includes("International");
      }
    });

    const internationalInputs = $ins.filter((index, item) => {
      if (providerName === "USPS (US Postal Service)") {
        return item.getAttribute("name").includes("CarrierServicesInternational") && !item.value.includes("NONE");
      } else if (providerName === "UPS (United Parcel Service)") {
        return item.getAttribute("name").includes("CarrierServices") && item.value.includes("Worldwide");
      } else if (providerName === "FedEx") {
        return item.getAttribute("name").includes("CarrierServices") && item.value.includes("International");
      }
    });

    return cy.wrap(domesticInputs).each((item, index) => {
      if (all && !item.prop("checked")) {
        valueChanged = true;
        cy.wrap(item).check();
      } else if (!all) {
        if (domestic && !item.prop("checked")) {
          valueChanged = true;
          cy.wrap(item).check();
        } else if(!domestic && item.prop("checked")) {
          valueChanged = true;
          cy.wrap(item).uncheck();
        }
      }
    }).then(() => {
      return cy.wrap(internationalInputs).each((item, index) => {
        if (all && !item.prop("checked")) {
          valueChanged = true;
          cy.wrap(item).check();
        } else if (!all) {
          if (domestic && item.prop("checked")) {
            valueChanged = true;
            cy.wrap(item).uncheck();
          } else if (!domestic && !item.prop("checked")) {
            valueChanged = true;
            cy.wrap(item).check();
          }
        }
      }).then(() => {
        if (valueChanged) {
          return cy.clickSave().then(() => {
            cy.wait(1000);
          });
        }
      });
    });
  });
});

// Exits a provider configuration page via the back button and ensures all other providers are inactive
// TODO: rename to something more descriptive
Cypress.Commands.add("postConfigChange", (providerName: string) => {
  return cy.clickBack().then(() => {
    const findOtherProvider = () => {
      const filterProvider = (index, item) => {
        return item.cells[0].innerText !== providerName && item.cells[3].innerHTML.includes("true-icon");
      };
      return cy.findTableItem("#shippingproviders-grid", "#shippingproviders-grid_next", filterProvider).then((row) => {
        if (row) {
          cy.wrap(row[0]).clickRowBtn("Edit");
          cy.wrap(row[0]).find("td[data-columnname=IsActive]").find("input").toggle();
          cy.wrap(row[0]).clickRowBtn("Update");
          cy.allowLoad().then(() => {
            findOtherProvider();
          });
        } else {
          return;
        }
      });
    };
    cy.wait(2000);
    cy.wait("@shippingProviders"); // This intercept is set up in goToShippingProviders. If the command is removed later, will need to set up a new intercept
    cy.allowLoad().then(() => {
      findOtherProvider();
    });
  }).then(() => {
    cy.findShippingProvider(providerName).then((row) => {
      if (!row[0].cells[3].innerHTML.includes("true-icon")) {
        cy.wrap(row).clickRowBtn("Edit");
        cy.wrap(row).find("td[data-columnname=IsActive]").find("input").toggle();
        cy.wrap(row).clickRowBtn("Update");
        cy.allowLoad();
      }
    });
  });
});

// Opens the shipping popup on the product page.
Cypress.Commands.add("openShippingPopup", (domesticMethods: boolean) => {
  cy.goToProduct("Bald Cypress");
  return cy.get(".product-estimate-shipping").scrollIntoView().then(() => {
    return cy.allowShippingLoad().then(() => {
      cy.get(".open-estimate-shipping-popup").click();
      cy.wait(500);
      cy.get(".estimate-shipping-popup").should("exist").and("be.visible");
      return cy.checkPopupAddress(domesticMethods);
    });
  });
});

// Allows shipping method to load on product page
Cypress.Commands.add("allowShippingLoad", (loadId?: string) => {
  var loadSymbol = loadId ? loadId : ".shipping-loading";  
  const waitForLoad = (loadTime?: number) => {
    if (Cypress.$(`${loadSymbol}:visible`).length === 0) {
      return cy.wait(0, {log: false});
    }
    return cy.wait(2000).then(() => {
      waitForLoad(loadTime ? loadTime + 2000 : 2000);
    });
  };
  return waitForLoad();
});

// Corrects the popup address to what is needed
Cypress.Commands.add("checkPopupAddress", (domesticMethods: boolean) => {
  const checkSelect = (id: string, text: string) => {
    if (Cypress.$(`${id} > option:selected`).text() !== text) {
      cy.get(id).select(text);
      return cy.allowShippingLoad(".shipping-options-loading");
    } else {
      return cy.wait(0, {log: false});
    }
  };
  var country = domesticMethods ? "United States" : "United Kingdom";
  var province = domesticMethods ? "Georgia" : "Other";
  var code = domesticMethods ? "30022" : "W12 0DF";
  return checkSelect("#CountryId", country).then(() => {
    checkSelect("#StateProvinceId", province).then(() => {
      if (Cypress.$("#ZipPostalCode").val() !== code) {
        cy.get("#ZipPostalCode").clear().type(code);
        return cy.allowShippingLoad(".shipping-options-loading");
      } else {
        return cy.wait(0, {log: false});
      }
    });
  });
});

Cypress.Commands.add("shipInternationally", () => {
  // Address of Wormwood Scrubs, a public park in London, UK
  // Linford Christie Rd, White City, London W12 0DF, United Kingdom
  return cy.get("#ShipToSameAddress").invoke("prop", "checked").then((isChecked) => {
    if (isChecked) {
      cy.get("#ShipToSameAddress").toggle();
    }
    return cy.fillOutBilling().then(() => {
      cy.intercept("/checkout/OpcSaveShipping/").as("shippingSaved");
      const ukAddress = "Cypress McCousin, Linford Christie Rd, London W12 0DF, United Kingdom";
      if (Cypress.$("#shipping-address-select").text().includes(ukAddress)) {
        cy.get("#shipping-address-select").select(ukAddress);
      } else {
        cy.get("#shipping-address-select").select("New Address");
        cy.wait(50);
        if (Cypress.$("#ShippingNewAddress_FirstName").val() !== "Cypress") {
          cy.get("#ShippingNewAddress_FirstName").clear().type("Cypress");
        }
        if (Cypress.$("#ShippingNewAddress_LastName").val() !== "McCousin") {
          cy.get("#ShippingNewAddress_LastName").clear().type("McCousin");
        }
        if (Cypress.$("#ShippingNewAddress_Email").val() !== "McCousin") {
          cy.get("#ShippingNewAddress_Email").clear().type("cypress.cousin@uk.cypress.testenv.com");
        }
        if (Cypress.$("#ShippingNewAddress_Company").val() !== "") {
          cy.get("#ShippingNewAddress_Company").clear();
        }
        cy.get("#ShippingNewAddress_CountryId").select("United Kingdom");
        cy.get("#ShippingNewAddress_City").type("London")
        cy.get("#ShippingNewAddress_Address1").type("Linford Christie Rd");
        cy.get("#ShippingNewAddress_Address2").type("White City");
        cy.get("#ShippingNewAddress_ZipPostalCode").type("W12 0DF");
        cy.get("#ShippingNewAddress_PhoneNumber").type("5555555555");
      }
      cy.get(".new-address-next-step-button").eq(1).click();
      return cy.wait("@shippingSaved");
    });
  });
});