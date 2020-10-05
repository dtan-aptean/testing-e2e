/// <reference types="cypress" />
const createdDiscounts: string[] = [];

const runFilter = (name: string) => {
  return cy
    .get("#discounts-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === name;
      });
      if (row.length === 1) {
        return row;
      } else {
        return null;
      }
    });
};

const findInTable = (name: string) => {
  return cy
    .get("ul.pagination")
    .find("li")
    .then(($li) => {
      for (var i = 0; i < $li.length - 2; i++) {
        runFilter(name).then((el) => {
          if (el) {
            i = $li.length;
            return el;
          } else {
            if ($li.length - 2 > 1) {
              cy.get("#discounts-grid_next").find("a").click();
              cy.wait(1000);
            }
          }
        });
      }
    });
};

const editDiscount = (discountName: string) => {
  findInTable(discountName).then((row) => {
    if (row) {
      cy.wrap(row).find("td").contains("Edit").click();
      cy.wait(500);
    }
  });
};

const deleteDiscount = (discountName: string) => {
  editDiscount(discountName);
  cy.location("pathname").then((loc) => {
    if (loc.includes("/Discount/Edit")) {
      cy.get("#discount-delete").click();
      cy.get("#discountmodel-Delete-delete-confirmation")
        .find("button")
        .contains("Delete")
        .click();
      cy.wait(200);
      cy.get(".alert").should(
        "contain.text",
        "The discount has been deleted successfully."
      );
    }
  });
};

const addProductOrCategory = (
  prodCatName: string,
  productOrCategory: string
) => {
  var buttonId;
  var gridId;
  if (productOrCategory === "product") {
    buttonId = "#btnAddNewProduct";
    gridId = "#products-grid";
  } else if (productOrCategory === "category") {
    buttonId = "#btnAddNewCategory";
    gridId = "#categories-grid";
  }
  cy.get(`${buttonId}`).then((button) => {
    const url = button.attr("onclick")?.split('"')[1];
    cy.location("pathname").then((loc) => {
      const current = loc;
      cy.window().then((win) => {
        // Replace window.open(url, target)-function with our own arrow function
        cy.stub(win, "open", (url) => {
          // change window location to be same as the popup url
          win.location.href = Cypress.config().baseUrl + url;
        }).as("popup"); // alias it with popup, so we can wait refer it with @popup
      });
      cy.get(`${buttonId}`).click();
      cy.get("@popup").should("be.called");
      cy.get(`${gridId}`)
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          const row = $rows.filter((index, item) => {
            return item.cells[1].innerText === prodCatName;
          });
          cy.wrap(row).find("td").find("input").check();
          cy.get("button[name=save]").click();
          cy.wait(500);
          cy.visit(current);
          cy.get("button[name=save]").click();
          cy.wait(500);
          cy.get(".alert").should(
            "contain.text",
            "The discount has been updated successfully."
          );
        });
    });
  });
};

const createDiscountAndAddProduct = (discount) => {
  cy.goToDiscounts();
  cy.addNewDiscount(discount);
  createdDiscounts.push(discount.name);
  cy.goToPublic();
  cy.goToProduct("Ibanez", "Guitars");
  cy.get(".product-price").then(($div) => {
    const guitarPrice = parseFloat($div.text().replace("$", ""));
    cy.get(".add-to-cart-button").click();
    cy.goToProduct("Bald Cypress", "Cypress Trees");
    cy.get(".product-price").then(($el) => {
      const treePrice = parseFloat($el.text().replace("$", ""));
      var valueToFloat = discount.amount;
      if (discount.usePercentage) {
        valueToFloat = `0.${valueToFloat}`;
      }
      const value = parseFloat(valueToFloat);
      cy.get(".add-to-cart-button").click();
      const returnValue = { guitarPrice, treePrice, value };
      cy.wrap(returnValue).as("returnValue");
    });
  });
};

const verifyCost = (
  discount: number,
  itemCosts: number[],
  totalOrSubTotal: string
) => {
  cy.goToCart();
  var expectedSubTotal = 0;
  itemCosts.forEach((item) => {
    expectedSubTotal += item;
  });
  const expectedDiscount =
    discount < 1 ? expectedSubTotal * discount : discount;
  const expectedTotal = expectedSubTotal - expectedDiscount;
  var discountLocation;
  if (totalOrSubTotal === "subtotal") {
    discountLocation = ".order-subtotal-discount";
  } else if (totalOrSubTotal === "total") {
    discountLocation = ".discount-total";
  }
  const currencyFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  });
  cy.get(".order-subtotal")
    .find(".value-summary")
    .should("have.text", currencyFormat.format(expectedSubTotal));
  cy.get(`${discountLocation}`)
    .find(".value-summary")
    .should("have.text", `-${currencyFormat.format(expectedDiscount)}`);
  cy.get(".order-total")
    .find(".value-summary")
    .should("have.text", currencyFormat.format(expectedTotal));
};

const verifyFailure = (
  discount: number,
  itemCosts: number[],
  totalOrSubTotal: string
) => {
  var expectedSubTotal = 0;
  itemCosts.forEach((item) => {
    expectedSubTotal += item;
  });
  const expectedDiscount =
    discount < 1 ? expectedSubTotal * discount : discount;
  var discountLocation;
  if (totalOrSubTotal === "subtotal") {
    discountLocation = ".order-subtotal-discount";
  } else if (totalOrSubTotal === "total") {
    discountLocation = ".discount-total";
  }
  const currencyFormat = new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
  });
  cy.get(".order-subtotal")
    .find(".value-summary")
    .should("have.text", currencyFormat.format(expectedSubTotal));
  cy.get(".order-total")
    .find(".value-summary")
    .should("have.text", currencyFormat.format(expectedSubTotal));
  cy.get(".cart-total")
    .find("tbody")
    .should("not.contain.html", `${discountLocation}`)
    .and("not.contain.text", `-${currencyFormat.format(expectedDiscount)}`);
};

const resetCartAndDiscount = (discountName: string) => {
  if (discountName.length > 0) {
    cy.clearCart();
    cy.goToDiscounts();
    deleteDiscount(discountName);
    cy.visit("/");
  }
};

// Dates to use for discounts
const today = new Date();
const twoDaysAhead = new Date(today.valueOf() + 172800000);
const twoDaysBehind = new Date(today.valueOf() - 172800000);
const fourDaysBehind = new Date(today.valueOf() - 345600000);
// Discount for use between multiple tests
const commonDiscount = {
  name: "Cypress common discount",
  discountType: "Assigned to order total",
  amount: "333",
  useCode: true,
  code: "cypComDis",
  date: {
    startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
    endDate: `${today.toLocaleDateString()} 11:59 PM`,
  },
  limitation: "Unlimited",
};

describe("Ecommerce", function () {
  context("Discounts", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
      if (createdDiscounts.length > 0) {
        resetCartAndDiscount(createdDiscounts[createdDiscounts.length - 1]);
      }
    });

    it("Changing the discount type changes the display of some fields", () => {
      cy.goToDiscounts();
      cy.get(".content-header").find("a").contains("Add new").click();
      // Starting State
      cy.get("#DiscountTypeId").select("Assigned to order total");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("not.be.visible");
      cy.get("#discount-applied-to-products-panel").should("not.be.visible");
      cy.get("#discount-applied-to-categories-panel").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should(
        "not.be.visible"
      );
      // Products
      cy.get("#DiscountTypeId").select("Assigned to products");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products-panel").should("be.visible");
      cy.get("#discount-applied-to-categories-panel").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should(
        "not.be.visible"
      );
      // Categories
      cy.get("#DiscountTypeId").select("Assigned to categories");
      cy.get("#AppliedToSubCategories").should("be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products-panel").should("not.be.visible");
      cy.get("#discount-applied-to-categories-panel").should("be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should(
        "not.be.visible"
      );
      // Manufacturers
      cy.get("#DiscountTypeId").select("Assigned to manufacturers");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products-panel").should("not.be.visible");
      cy.get("#discount-applied-to-categories-panel").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should("be.visible");
      // Shipping
      cy.get("#DiscountTypeId").select("Assigned to shipping");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("not.be.visible");
      cy.get("#discount-applied-to-products-panel").should("not.be.visible");
      cy.get("#discount-applied-to-categories-panel").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should(
        "not.be.visible"
      );
      // Order subtotal
      cy.get("#DiscountTypeId").select("Assigned to order subtotal");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("not.be.visible");
      cy.get("#discount-applied-to-products-panel").should("not.be.visible");
      cy.get("#discount-applied-to-categories-panel").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers-panel").should(
        "not.be.visible"
      );
    });

    it("Percentage and coupon code checkboxes control the visibility of some fields.", () => {
      cy.goToDiscounts();
      cy.get(".content-header").find("a").contains("Add new").click();
      // Starting state
      cy.get("#pnlDiscountPercentage").should("not.be.visible");
      cy.get("#pnlMaximumDiscountAmount").should("not.be.visible");
      cy.get("#pnlDiscountAmount").should("be.visible");
      cy.get("#pnlCouponCode").should("not.be.visible");
      // Check percentage
      cy.get("#UsePercentage").check();
      cy.get("#pnlDiscountPercentage").should("be.visible");
      cy.get("#pnlMaximumDiscountAmount").should("be.visible");
      cy.get("#pnlDiscountAmount").should("not.be.visible");
      cy.get("#pnlCouponCode").should("not.be.visible");
      // Check coupon code
      cy.get("#RequiresCouponCode").check();
      cy.get("#pnlDiscountPercentage").should("be.visible");
      cy.get("#pnlMaximumDiscountAmount").should("be.visible");
      cy.get("#pnlDiscountAmount").should("not.be.visible");
      cy.get("#pnlCouponCode").should("be.visible");
      // Uncheck percentage
      cy.get("#UsePercentage").uncheck();
      cy.get("#pnlDiscountPercentage").should("not.be.visible");
      cy.get("#pnlMaximumDiscountAmount").should("not.be.visible");
      cy.get("#pnlDiscountAmount").should("be.visible");
      cy.get("#pnlCouponCode").should("be.visible");
      // Uncheck coupon code
      cy.get("#RequiresCouponCode").uncheck();
      cy.get("#pnlDiscountPercentage").should("not.be.visible");
      cy.get("#pnlMaximumDiscountAmount").should("not.be.visible");
      cy.get("#pnlDiscountAmount").should("be.visible");
      cy.get("#pnlCouponCode").should("not.be.visible");
    });

    it("Discount limitation dropdown controls the visibility of another field", () => {
      cy.goToDiscounts();
      cy.get(".content-header").find("a").contains("Add new").click();
      // Starting state
      cy.get("#DiscountLimitationId").select("Unlimited");
      cy.get("#pnlLimitationTimes").should("not.be.visible");
      // N times only
      cy.get("#DiscountLimitationId").select("N times only");
      cy.get("#pnlLimitationTimes").should("be.visible");
      // N times per customer
      cy.get("#DiscountLimitationId").select("N times per customer");
      cy.get("#pnlLimitationTimes").should("be.visible");
      // Back to unlimited
      cy.get("#DiscountLimitationId").select("Unlimited");
      cy.get("#pnlLimitationTimes").should("not.be.visible");
    });

    it("Required fields validate when creating a new discount", () => {
      // TODO: WIP, figure out what else validates
      cy.goToDiscounts();
      cy.get(".content-header").find("a").contains("Add new").click();
      cy.get("button[name=save]").click();
      cy.get(".validation-summary-errors")
        .should("be.visible")
        .and("have.text", "Please provide a name.");
      cy.get("#Name-error")
        .should("be.visible")
        .and("contain.text", "Please provide a name.");
      cy.get("#Name").type("Cypress Validation Testing");
      cy.get("#Name-error").should("not.exist");
    });

    it("Creating a new discount displays a success banner and updates the table", () => {
      cy.goToDiscounts();
      cy.get("#discounts-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          const originalTableLength = $rows.length;
          cy.addNewDiscount(commonDiscount);
          cy.get(".alert").should(
            "contain.text",
            "The new discount has been added successfully."
          );
          cy.get("#discounts-grid")
            .find("tbody")
            .find("tr")
            .then(($newRows) => {
              expect($newRows.length).to.be.eq(originalTableLength + 1);
              const row = $newRows.filter((index, item) => {
                return item.cells[0].innerText === commonDiscount.name;
              });
              expect(row.length).to.be.eq(1);
              const cells = row[0].cells;
              cy.wrap(cells[0]).should("have.text", commonDiscount.name);
              cy.wrap(cells[1]).should(
                "have.text",
                commonDiscount.discountType
              );
              cy.wrap(cells[2]).should(
                "have.text",
                `${commonDiscount.amount} USD`
              );
              cy.wrap(cells[3]).should(
                "have.text",
                `${new Date(commonDiscount.date.startDate).toLocaleString(
                  undefined,
                  {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  }
                )} 00:00:00`
              );
              cy.wrap(cells[4]).should(
                "have.text",
                `${new Date(commonDiscount.date.endDate).toLocaleString(
                  undefined,
                  {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  }
                )} 23:59:00`
              );
              cy.wrap(cells[5]).should("have.text", "0");
            });
        });
    });

    it("Deleting a discount display a success banner and updates the table", () => {
      cy.goToDiscounts();
      findInTable(commonDiscount.name).then((el) => {
        if (!el) {
          cy.addNewDiscount(commonDiscount);
        } else {
          cy.wrap(el).should("exist").and("contain.text", commonDiscount.name);
        }
        createdDiscounts.push(commonDiscount.name);
        findInTable(commonDiscount.name).then((row) => {
          cy.wrap(row).find("td").contains("Edit").click();
          cy.wait(500);
          cy.get("#discount-delete").click();
          cy.get("#discountmodel-Delete-delete-confirmation")
            .find("button")
            .contains("Delete")
            .click();
          cy.wait(200);
          cy.get(".alert").should(
            "contain.text",
            "The discount has been deleted successfully."
          );
        });
      });
    });

    it("A deleted discount cannot be used in the store", () => {
      cy.goToDiscounts();
      findInTable(commonDiscount.name).then((el) => {
        if (el) {
          deleteDiscount(commonDiscount.name);
        }
        cy.goToPublic();
        cy.goToProduct("Bald Cypress");
        cy.get(".add-to-cart-button").click();
        cy.goToCart();
        cy.get("#discountcouponcode").type(commonDiscount.code);
        cy.get("#applydiscountcouponcode").click();
        cy.get(".coupon-box").should("contain.html", "message-failure");
        cy.get(".coupon-box")
          .find(".message-failure")
          .should("contain.text", "The coupon code cannot be found");
      });
    });

    it("Editing a discount displays a success banner and updates the table", () => {
      const editedDiscount = {
        name: "Cypress edit discount",
        discountType: "Assigned to order total",
        amount: "123",
        useCode: true,
        code: "cypComDis",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      cy.goToDiscounts();
      cy.addNewDiscount(editedDiscount);
      createdDiscounts.push(editedDiscount.name);
      editDiscount(editedDiscount.name);
      const newName = "Cypress edited discount";
      const newType = "Assigned to shipping";
      const newAmount = "25";
      cy.get("#Name").clear({ force: true }).type(newName, { force: true });
      cy.get("#DiscountTypeId").select(newType);
      cy.get("#UsePercentage").check();
      cy.get("#DiscountPercentage")
        .clear({ force: true })
        .type(newAmount, { force: true });
      cy.get("#StartDateUtc")
        .clear({ force: true })
        .type(`${today.toLocaleDateString()} 12:00 AM`, { force: true });
      cy.get("#EndDateUtc")
        .clear({ force: true })
        .type(`${twoDaysAhead.toLocaleDateString()} 11:59 PM`, { force: true });
      cy.get("button[name=save]").click();
      cy.wait(500);
      cy.get(".alert").should(
        "contain.text",
        "The discount has been updated successfully."
      );
      createdDiscounts.push(newName);
      findInTable(newName).then((row) => {
        cy.wrap(row).should("exist");
        const cells = row[0].cells;
        cy.wrap(cells[0]).should("have.text", newName);
        cy.wrap(cells[1]).should("have.text", newType);
        cy.wrap(cells[2]).should("have.text", `${newAmount}%`);
        cy.wrap(cells[3]).should(
          "have.text",
          `${today.toLocaleString(undefined, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })} 00:00:00`
        );
        cy.wrap(cells[4]).should(
          "have.text",
          `${twoDaysAhead.toLocaleString(undefined, {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          })} 23:59:00`
        );
      });
    });

    it("Product are added and removed successfuly when editing a discount", () => {
      const productDiscount = {
        name: "Cypress Product Discount",
        discountType: "Assigned to products",
        usePercentage: true,
        amount: "30",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      cy.goToDiscounts();
      cy.addNewDiscount(productDiscount);
      createdDiscounts.push(productDiscount.name);
      editDiscount(productDiscount.name);
      addProductOrCategory("Bald Cypress", "product");
      editDiscount(productDiscount.name);
      cy.get("#products-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", "Bald Cypress");
          cy.wrap($rows[0].cells[2]).click();
          cy.get("#products-grid").should(
            "contain.text",
            "No data available in table"
          );
          cy.get("button[name=save]").click();
          cy.wait(500);
          cy.get(".alert").should(
            "contain.text",
            "The discount has been updated successfully."
          );
        });
    });

    it("Categories are added and removed successfuly when editing a discount", () => {
      const categoryDiscount = {
        name: "Cypress Category Discount",
        discountType: "Assigned to categories",
        usePercentage: true,
        amount: "40",
        useCode: true,
        code: "cypCatDis",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      cy.goToDiscounts();
      cy.addNewDiscount(categoryDiscount);
      createdDiscounts.push(categoryDiscount.name);
      editDiscount(categoryDiscount.name);
      addProductOrCategory("Cypress Trees", "category");
      editDiscount(categoryDiscount.name);
      cy.get("#categories-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", "Cypress Trees");
          cy.wrap($rows[0].cells[2]).click();
          cy.get("#categories-grid").should(
            "contain.text",
            "No data available in table"
          );
          cy.get("button[name=save]").click();
          cy.wait(500);
          cy.get(".alert").should(
            "contain.text",
            "The discount has been updated successfully."
          );
        });
    });

    it("Percentage discount is applied correctly", () => {
      const percentageDiscount = {
        name: "Cypress Percentage Discount",
        discountType: "Assigned to order total",
        usePercentage: true,
        amount: "15",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndAddProduct(percentageDiscount);
      cy.get("@returnValue").then((returnValue) => {
        const { value, guitarPrice, treePrice } = returnValue;
        verifyCost(value, [guitarPrice, treePrice], "total");
      });
    });

    it("Discounts with a set value are applied correctly", () => {
      const valueDiscount = {
        name: "Cypress Value Discount",
        discountType: "Assigned to order total",
        amount: "120",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndAddProduct(valueDiscount);
      cy.get("@returnValue").then((returnValue) => {
        const { value, guitarPrice, treePrice } = returnValue;
        verifyCost(value, [guitarPrice, treePrice], "total");
      });
    });

    it("Unexpired discounts can be used", () => {
      const inDateDiscount = {
        name: "Cypress Unexpired Discount",
        discountType: "Assigned to order total",
        amount: "200",
        useCode: true,
        code: "cypUnExpDis",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndAddProduct(inDateDiscount);
      cy.get("@returnValue").then((returnValue) => {
        const { value, guitarPrice, treePrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(inDateDiscount.code);
        cy.get("#applydiscountcouponcode").click();
        cy.get(".message-success").should(
          "contain.text",
          "The coupon code was applied"
        );
        verifyCost(value, [guitarPrice, treePrice], "total");
      });
    });

    it("Expired discounts cannot be applied", () => {
      const expiredDiscount = {
        name: "Cypress Expired Discount",
        discountType: "Assigned to order total",
        amount: "500",
        useCode: true,
        code: "cypExpDis",
        date: {
          startDate: `${fourDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysBehind.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndAddProduct(expiredDiscount);
      cy.get("@returnValue").then((returnValue) => {
        const { value, guitarPrice, treePrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(expiredDiscount.code);
        cy.get("#applydiscountcouponcode").click();
        cy.get(".message-failure").should(
          "contain.text",
          "Sorry, this offer is expired"
        );
        verifyFailure(value, [guitarPrice, treePrice], "total");
      });
    });

    it("Expired discounts are not automatically applied", () => {
      const codelessExpiredDiscount = {
        name: "Cypress auto-Expired Discount",
        discountType: "Assigned to order total",
        amount: "800",
        date: {
          startDate: `${fourDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysBehind.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndAddProduct(codelessExpiredDiscount);
      cy.get("@returnValue").then((returnValue) => {
        const { value, guitarPrice, treePrice } = returnValue;
        cy.goToCart();
        verifyFailure(value, [guitarPrice, treePrice], "total");
      });
    });

    // Delete all the discounts afterwards
    after(() => {
      cy.visit("/");
      cy.get(".header-links")
        .find("ul")
        .then(($ul) => {
          if ($ul[0].innerHTML.includes("ico-login")) {
            cy.login();
          }
          cy.wait(1000);
          cy.clearCart();
          cy.wait(1000);
          cy.goToDiscounts();
          // All but the last discount should have been deleted before each test
          // But just in case, we'll run through the array of created discounts and make sure
          createdDiscounts.forEach((discountName) => {
            deleteDiscount(discountName);
            cy.wait(1000);
          });
        });
    });
  });
});
