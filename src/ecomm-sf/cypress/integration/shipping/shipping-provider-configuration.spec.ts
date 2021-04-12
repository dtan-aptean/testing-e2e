/// <reference types="cypress" />

const clickConfigure = (row) => {
  return cy.wrap(row).find("a").contains("Configure").click();
};

const clickBack = () => {
  return cy.get(".content-header").find("small").find("a").click();
};

const clickSave = () => {
  return cy.get("input[name=save]").click();
};

const getAcronym = (providerName: string) => {
  return providerName.replace(/\(.*\)/g, "").trim();
};

// Make sure all required configs are filled in for the provider and fill them in if not
const verifyRequiredConfigs = (providerName: string) => {
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
  }
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
                return clickSave().then(() => {
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
              return setChargeToZero().then(() => {
                if (valueChanged) {
                  return clickSave().then(() => {
                    cy.wait(1000);
                  });
                }
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
              return clickSave().then(() => {
                cy.wait(1000);
              });
            }
          });
        });
      });
    });
  }
};

const prepProvider = (providerName: string) => {
  return cy.findShippingProvider(providerName).then((row) => {
    clickConfigure(row).then(() => {
      cy.wait(1000);
      cy.location("pathname").should("contain", "Configure");

      return verifyRequiredConfigs(providerName);
    });
  });
};

// TODO: enable all carrier services
const enableCarrierServices = (providerName: string, domestic: boolean) => {
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
      if (domestic && !item.prop("checked")) {
        valueChanged = true;
        cy.wrap(item).check();
      } else if(!domestic && item.prop("checked")) {
        valueChanged = true;
        cy.wrap(item).uncheck();
      }
    }).then(() => {
      return cy.wrap(internationalInputs).each((item, index) => {
        if (domestic && item.prop("checked")) {
          valueChanged = true;
          cy.wrap(item).uncheck();
        } else if (!domestic && !item.prop("checked")) {
          valueChanged = true;
          cy.wrap(item).check();
        }
      }).then(() => {
        if (valueChanged) {
          return clickSave().then(() => {
            cy.wait(1000);
          });
        }
      })
    });
  });
};

const postConfigChange = (providerName: string) => {
  return clickBack().then(() => {
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
      })
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
};

const getToShipMethods = () => {
  cy.intercept("/checkout/OpcSaveBilling/").as("billingSaved");
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
  cy.wait("@billingSaved");
};

// Wait for the load symbol on a shipping page to finish.
const allowShippingLoad = (loadId?: string, loadTime?: number) => {
  var loadSymbol = loadId ? loadId : ".shipping-loading";
  if (Cypress.$(`${loadSymbol}:visible`).length === 0) {
    return cy.wait(0);
  }
  return cy.wait(2000).then(() => {
    allowShippingLoad(loadSymbol, loadTime ? loadTime + 2000 : 2000);
  });
};

const checkPopupAddress = () => {
  const checkSelect = (id: string, text: string) => {
    if (Cypress.$(`${id} > option:selected`).text() !== text) {
      cy.get(id).select(text);
      return allowShippingLoad(".shipping-options-loading");
    } else {
      return cy.wait(0);
    }
  }
  return checkSelect("#CountryId", "United States").then(() => {
    checkSelect("#StateProvinceId", "Georgia").then(() => {
      if (Cypress.$("#ZipPostalCode").val() !== "30022") {
        cy.get("#ZipPostalCode").clear().type("30022");
        return allowShippingLoad(".shipping-options-loading");
      } else {
        return cy.wait(0);
      }
    });
  });
};
// TODO: needed functions/commands
// Checking the required configs
// Resetting the configs
// 


describe("Ecommerce", function () {
  context("Shipping Provider Configuration", () => {
    var providerNames = [] as string[];
    before(() => {
      cy.checkAvailableShippers().then((providers) => {
        providerNames = providers;
      });
      // TODO
      // Set shipping origin
      // Maybe reset configs
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.clearCart();
      cy.goToShippingProviders();
    });

    after(() => {
      // TODO
      // Set original configurations back
    });

    it("Clicking the 'Configure' button sends the user to a page specific to the provider", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");
          cy.contains(`Configure - ${provider}`).should("exist").and("be.visible");
          
          // TODO: Check the fields for containing the provider names?
        });
      });
    });

    it("Clicking the 'Back to list' button sends the user back to the shipping provider list", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          clickBack().then(() => {
            cy.wait(1000);
            cy.location("pathname").should("eql", "/Admin/Shipping/Providers");
          });
        });
      });
    });

    it("Clicking the 'Back to list' button after changes have been made does not save those changes", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          cy.get(".content").find("input[type=checkbox]").eq(0).then(($el) => {
            const orgVal = $el.prop("checked");
            cy.wrap($el).toggle();
            cy.get("#AdditionalHandlingCharge").then(($inp) => {
              const orgCharge = $inp.val();
              cy.wrap($inp).clear({ force: true }).type("5.00", { force: true });
              clickBack().then(() => {
                cy.allowLoad();
                cy.findShippingProvider(provider).then((rowTwo) => {
                  clickConfigure(rowTwo).then(() => {
                    cy.wait(1000);
                    cy.get(".content")
                      .find("input[type=checkbox]")
                      .eq(0)
                      .invoke("prop", "checked")
                      .should("eql", orgVal)
                      .and("not.eql", !orgVal);
                    cy.get("#AdditionalHandlingCharge")
                      .should("have.value", orgCharge)
                      .and("not.have.value", "5.00");
                  });
                });
              });
            });
          });
        });
      });
    });

    it("Clicking the 'Save' button after changes have been made will save those changes", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      cy.findShippingProvider(provider).then((row) => {
        clickConfigure(row).then(() => {
          cy.wait(1000);
          cy.location("pathname").should("contain", "Configure");

          cy.get(".content").find("input[type=checkbox]").eq(0).then(($el) => {
            const orgVal = $el.prop("checked");
            cy.wrap($el).toggle();
            cy.get("#AdditionalHandlingCharge").then(($inp) => {
              const orgCharge = $inp.val();
              cy.wrap($inp).clear({ force: true }).type("5.00", { force: true });
              clickSave().then(() => {
                cy.allowLoad();
                cy.get(".alert")
                  .should("exist")
                  .and("be.visible")
                  .and("contain.text", "The plugin has been updated successfully");
                cy.wait(1000);
                cy.get(".content")
                  .find("input[type=checkbox]")
                  .eq(0)
                  .invoke("prop", "checked")
                  .should("eql", !orgVal)
                  .and("not.eql", orgVal);
                cy.get("#AdditionalHandlingCharge")
                  .should("have.value", "5")
                  .and("not.have.value", orgCharge);
              });
            });
          });
        });
      });
    });

    context("Subsection: Domestic Provider in Checkout", () => {
      // USPS name: CheckedCarrierServicesDomestic (domestic)
      // USPS name: CheckedCarrierServicesInternational (international)
      // FedEx name: CheckedCarrierServices (checkbox checked)
      // UPS name: CarrierServices (empty checkbox)
      it("UPS methods will show in checkout when properly configured with domestic carrier services", () => {
        const provider = "UPS (United Parcel Service)";
        prepProvider(provider).then(() => {
          enableCarrierServices(provider, true).then(() => {
            postConfigChange(provider);
            cy.addToCartAndCheckout().then(() => {
              getToShipMethods();
              cy.wait(2000);
              const provDisName = getAcronym(provider);
              cy.get(".method-list").find("li").should("exist").and("not.be.empty");
              cy.get(".method-list").should("contain.text", provDisName);
              cy.get(".method-list").find("li").each((el, index) => {
                // The only methods present belong to the provider
                expect(el.text()).to.include(provDisName);
                // All of these providers are domestic
                expect(el.text()).not.to.include("International");
              });
            });
          });
        });
      });

      it("FedEx methods will show in checkout when properly configured with domestic carrier services", () => {
        const provider = "FedEx";
        prepProvider(provider).then(() => {
          enableCarrierServices(provider, true).then(() => {
            postConfigChange(provider);
            cy.goToPublic();
            cy.addToCartAndCheckout().then(() => {
              getToShipMethods();
              cy.wait(2000);
              const provDisName = getAcronym(provider);
              cy.get(".method-list").find("li").should("exist").and("not.be.empty");
              cy.get(".method-list").should("contain.text", provDisName);
              cy.get(".method-list").find("li").each((el, index) => {
                // The only methods present belong to the provider
                expect(el.text()).to.include(provDisName);
                // All of these providers are domestic
                expect(el.text()).not.to.include("International");
              });
            });
          });
        });
      });

      it("USPS methods will show in checkout when properly configured with domestic carrier services", () => {
        const provider = "USPS (US Postal Service)";
        prepProvider(provider).then(() => {
          enableCarrierServices(provider, true).then(() => {
            postConfigChange(provider);
            cy.goToPublic();
            cy.addToCartAndCheckout().then(() => {
              getToShipMethods();
              cy.wait(1000);
              const provDisName = getAcronym(provider);
              cy.get(".method-list").find("li").should("exist").and("not.be.empty");
              cy.get(".method-list").should("contain.text", provDisName);
              cy.get(".method-list").find("li").each((el, index) => {
                // The only methods present belong to the provider
                expect(el.text()).to.include(provDisName);
                // All of these providers are domestic
                expect(el.text()).not.to.include("International");
                expect(el.text()).not.to.include("Global");
                expect(el.text()).not.to.include("GXG");
              });
            });
          });
        });
      });
    });

    context.only("Subsection: Domestic Provider on Product Page", () => {
      //it("UPS methods will show on product page when properly configured with domestic carrier services", () => {});

      it("FedEx methods will show on product page when properly configured with domestic carrier services", () => {
        const provider = "FedEx";
        prepProvider(provider).then(() => {
          enableCarrierServices(provider, true).then(() => {
            postConfigChange(provider);
            cy.goToPublic();
            cy.goToProduct("Bald Cypress");
            cy.get(".product-estimate-shipping").scrollIntoView().then(() => {
              allowShippingLoad().then(() => {
                cy.get(".shipping-address").click();
                cy.wait(500);
                cy.get(".estimate-shipping-popup").should("exist").and("be.visible");
                checkPopupAddress().then(() => {
                  const provDisName = getAcronym(provider);
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
                      expect(el.text()).not.to.include("International");
                    });
                });
              });
            });
          });
        });
      });

      it("USPS methods will show on product page when properly configured with domestic carrier services", () => {
        const provider = "USPS (US Postal Service)";
        prepProvider(provider).then(() => {
          enableCarrierServices(provider, true).then(() => {
            postConfigChange(provider);
            cy.goToPublic();
            cy.goToProduct("Bald Cypress");
            cy.get(".product-estimate-shipping").scrollIntoView().then(() => {
              allowShippingLoad().then(() => {
                cy.get(".shipping-address").click();
                cy.wait(500);
                cy.get(".estimate-shipping-popup").should("exist").and("be.visible");
                checkPopupAddress().then(() => {
                  const provDisName = getAcronym(provider);
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
                      expect(el.text()).not.to.include("International");
                      expect(el.text()).not.to.include("Global");
                      expect(el.text()).not.to.include("GXG");
                    });
                });
              });
            });
          });
        });
      });
    });
    // Additional handling charge
    // Domestic carrier services
    // Additional handling + item shipping
    // Different delivery available for different sized items?

  });
});