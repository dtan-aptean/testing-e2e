/// <reference types="cypress" />
const createdDiscounts: string[] = [];

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

const editDiscount = (discountName: string) => {
  cy.get("#discounts-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const row = $rows.filter((index, item) => {
        return item.cells[0].innerText === discountName;
      });
      if (row.length === 1) {
        cy.wrap(row).find("td").contains("Edit").click();
        cy.wait(500);
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
const productDiscount = {
  name: "Cypress Product Discount",
  discountType: "Assigned to products",
  usePercentage: true,
  amount: "30",
  useCode: true,
  code: "cypProDis",
  date: {
    startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
    endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
  },
  limitation: "N times only",
  nTimes: "2",
  maxDiscountQty: "5",
};
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

describe("Ecommerce", function () {
  context("Discounts", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
      if (createdDiscounts.length > 0) {
        resetCartAndDiscount(createdDiscounts[createdDiscounts.length - 1]);
      }
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
