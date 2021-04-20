/// <reference types="cypress" />

// Check that everything is displaying normally in default state
const checkDisplayState = (row) => {
  // Inputs are not present
  cy.wrap(row).find("td[data-columnname=DisplayOrder]").should("not.contain.html", "input");
  cy.wrap(row).find("td[data-columnname=IsActive]").should("not.contain.html", "input");
  // Edit button is visible
  cy.wrap(row).find("a").contains("Edit").should("be.visible");
  // Update and confirm buttons are not visible
  cy.wrap(row).find("a").contains("Edit").siblings().should("not.be.visible");
};

// Check that everything is displaying normally in the editing state
const checkEditState = (row) => {
  //Inputs are present and visible
  cy.wrap(row).find("td[data-columnname=DisplayOrder]").should("contain.html", "input");
  cy.wrap(row).find("td[data-columnname=DisplayOrder]").find("input").should("be.visible");
  cy.wrap(row).find("td[data-columnname=IsActive]").should("contain.html", "input");
  cy.wrap(row).find("td[data-columnname=IsActive]").find("input").should("be.visible");
  // Edit button is not visible
  cy.wrap(row).find("a").contains("Edit").should("not.be.visible");
  // Update and confirm buttons are visible
  cy.wrap(row).find("a").contains("Edit").siblings().should("be.visible");
};

// Verify that expected changes were saved
const verifyDisplayOrder = (row, correctValue: string, incorrectValue: string) => {
  cy.wrap(row)
    .find("td[data-columnname=DisplayOrder]")
    .invoke("text")
    .should("eq", correctValue)
    .and("not.eq", incorrectValue);
};

const verifyActiveStatus = (row, isActive: boolean) => {
  cy.wrap(row)
    .find("td[data-columnname=IsActive]")
    .find("i")
    .invoke("hasClass", "true-icon")
    .should("eq", isActive)
    .and("not.eq", !isActive);
};

const getOriginalProps = (providerName: string) => {
  return cy.findShippingProvider(providerName).then((row) => {
    cy.wrap(row).find("td[data-columnname=DisplayOrder]").invoke("text").then((displayOrder: string) => {
      cy.wrap(row).find("td[data-columnname=IsActive]").find("i").invoke("hasClass", "true-icon").then((isActive: boolean) => {
        return cy.wrap({active: isActive, order: displayOrder});
      });
    });
  });
};

const getRowIndex = (name: string) => {
  return cy.findShippingProvider(name).invoke("prop", "rowIndex");
};

describe("Ecommerce", function () {
  context("Shipping Provider Table", () => {
    var providerNames = [] as string[];
    before(() => {
      cy.checkAvailableShippers().then((providers: string[]) => {
        providerNames = providers;
      });
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.goToShippingProviders();
    });

    after(() => {
      cy.resetShippingProviders();
    });

    it("Clicking the 'Edit' button enables new inputs and buttons", () => {
      // TODO: Do all items instead of just the retrieved providers?
      providerNames.forEach((prov) => {
        cy.findShippingProvider(prov).then((row) => {
          checkDisplayState(row);
          cy.wrap(row).find("a").contains("Edit").click().then(() => {
            cy.wait(100);
            checkEditState(row);
          });
        });
      });
    });

    it("Clicking the 'Cancel' button hides inputs and buttons and new values are not saved", () => {
      providerNames.forEach((prov: string) => {
        getOriginalProps(prov).then((orgProps: {active: boolean, order: string}) => {
          cy.findShippingProvider(prov).clickRowBtn("Edit").then(() => {
              const tempOrder = orgProps.order + "1";
            cy.wrap(row).find("td[data-columnname=DisplayOrder]").find("input").replaceText(tempOrder);
            cy.wrap(row).find("td[data-columnname=IsActive]").find("input").toggle();
            cy.wrap(row).find("a").contains("Cancel").click();
            // Verify inputs and buttons are gone
            cy.findShippingProvider(prov).then((rowTwo) => {
              checkDisplayState(rowTwo);
              // Verify values of display order and is active
              verifyDisplayOrder(rowTwo, orgProps.order, tempOrder);
              verifyActiveStatus(rowTwo, orgProps.active);
            });
          });
        });
      });
    });

    it("Clicking the 'Update' button after editing both fields saves the values and hides the buttons and inputs", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      getOriginalProps(provider).then((originalProps: {active: boolean, order: string}) => {
        const newOrder = originalProps.order + originalProps.order;
        const newActive = !originalProps.active;
        cy.changeProviderProps(provider, newActive, newOrder).then(() => {
          cy.findShippingProvider(provider).then((row) => {
            // Verify that buttons and inputs are gone
            checkDisplayState(row);
            // Verify the new values were saved
            verifyDisplayOrder(row, newOrder, originalProps.order);
            verifyActiveStatus(row, newActive);
          });
        });
      });
    });

    it("Clicking the 'Update' button after editing only display order saves the value and hides the buttons and inputs", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      getOriginalProps(provider).then((originalProps: {active: boolean, order: string}) => {
        const newOrder = originalProps.order + originalProps.order;
        cy.changeProviderDisplay(provider, newOrder).then(() => {
          cy.findShippingProvider(provider).then((row) => {
            // Verify that buttons and inputs are gone
            checkDisplayState(row);
            // Verify the new values were saved
            verifyDisplayOrder(row, newOrder, originalProps.order);
            verifyActiveStatus(row, originalProps.active);
          });
        });
      });
    });

    it("Clicking the 'Update' button after editing only active status saves the value and hides the buttons and inputs", () => {
      const provider = providerNames[Cypress._.random(0, providerNames.length - 1)];
      getOriginalProps(provider).then((originalProps: {active: boolean, order: string}) => {
        const newActive = !originalProps.active;
        cy.changeProviderActivity(provider).then(() => {
          cy.findShippingProvider(provider).then((row) => {
            // Verify that buttons and inputs are gone
            checkDisplayState(row);
            // Verify the new values were saved
            verifyDisplayOrder(row, originalProps.order, "");
            verifyActiveStatus(row, newActive);
          });
        });
      });
    });

    it("Updating display order changes the order of items in the table", () => {
      const lastProvider = providerNames[providerNames.length - 1];
      const firstProvider = providerNames[0];
      getRowIndex(firstProvider).then((indexOneOrg: number) => {
        getRowIndex(lastProvider).then((indexTwoOrg: number) => {
          getOriginalProps(lastProvider).then((orgProps) => {
            var lastOrder = orgProps.order;
            var newOrder = Number(lastOrder) + 1;
            cy.changeProviderDisplay(firstProvider, newOrder.toString()).then(() => {
              getRowIndex(firstProvider).then((indexOne: number) => {
                expect(indexOne).to.be.greaterThan(indexOneOrg, "The provider should have a greater rowIndex than before");
                getRowIndex(lastProvider).then((indexTwo: number) => {
                  expect(indexTwo).to.be.lessThan(indexTwoOrg, "The provider should have a lesser rowIndex than before");
                  cy.changeProviderDisplay(firstProvider, lastOrder);
                });
              });
            });
          });
        });
      });
    });

    // TODO: Updating display order changes the order of items in checkout/product page? Belongs here or shipping-provider-configuration?

    // TODO: Updating Active status changes items shown in checkout/product page? Belongs here or shipping-provider-configuration?
  });
});