/// <reference types="cypress" />

import { mainCategory, secondCategory, mainProductOne, mainProductTwo, secondProduct } from "../support/setupCommands";

// TEST COUNT: 22

// Log of all created discounts; discount name pushed upon creation. Used to clear them
const createdDiscounts: string[] = [];
// Returns the discount as a numerical percentage or a number
const parseDiscountAmount = (discount) => {
  if (discount.usePercentage) {
    return parseFloat(`0.${discount.amount}`);
  }
  return parseFloat(discount.amount);
};

const getDiscountRow = (discountName: string) => {
  const filter = (index, item) => {
    return item.cells[0].innerText === discountName;
  };
  return cy.findTableItem("#discounts-grid", "#discounts-grid_next", filter);
};

// Searches the table and clicks edit if it finds the discount
const editDiscount = (discountName: string, allowNoResult?: boolean) => {
  getDiscountRow(discountName).then((row) => {
    if (row) {
      cy.wrap(row).find("td").contains("Edit").click({ force: true });
      cy.wait(1000);
      cy.location("pathname").should("include", "Edit");
    } else if (!allowNoResult) {
      assert.exists(row, `Discount Table should contain row with discount "${discountName}"`);
    }
  });
};
// Calls editDiscount and if it makes it to the edit page, deletes the discount
const deleteDiscount = (discountName: string, preTestCleanUp?: boolean) => {
  editDiscount(discountName, preTestCleanUp);
  cy.location("pathname").then((loc) => {
    if (loc.includes("/Discount/Edit")) {
      cy.get("#discount-delete").click();
      cy.get("#discountmodel-Delete-delete-confirmation")
        .find("button")
        .contains("Delete")
        .click();
      cy.wait(500);
      if (!preTestCleanUp) {
        cy.get(".alert").should(
          "contain.text",
          "The discount has been deleted successfully."
        );
      }
    }
  });
};
// While editing a discount, adds a product or category. Pass in name of product/category, and "product"/"category"
const addProductOrCategory = (
  prodCatName: string,
  productOrCategory: string
) => {
  var buttonId = "";
  var gridId = "";
  var panelId = "";
  var searchId  = "";
  var searchButtonId = "";
  var nextButtonId = "";
  if (productOrCategory === "product") {
    panelId = "#discount-applied-to-products";
    buttonId = "#btnAddNewProduct";
    gridId = "#products-grid";
    searchId = "#SearchProductName";
    searchButtonId = "#search-products";
    nextButtonId = "#products-grid_next";
  } else if (productOrCategory === "category") {
    panelId = "#discount-applied-to-categories";
    buttonId = "#btnAddNewCategory";
    gridId = "#categories-grid";
    searchId = "#SearchCategoryName";
    searchButtonId = "#search-categories";
    nextButtonId = "#categories-grid_next";
  }
  cy.get(panelId).then((panel) => {
    if (panel.hasClass("collapsed-card")) {
      cy.wrap(panel).find(".toggle-icon").parent().click({ force: true });
      cy.get(panelId).should("not.contain.html", "collapsed-card");
    }
    cy.get(buttonId).then((button) => {
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
        cy.get(buttonId).click();
        cy.get("@popup").should("be.called");
        cy.allowLoad();
        cy.get(searchId).type(prodCatName);
        cy.get(searchButtonId).click({ force: true });
        cy.wait(100);
        cy.allowLoad();
        const rowFilter = (index, item) => {
          return item.cells[1].innerText === prodCatName;
        };
        cy.findTableItem(gridId, nextButtonId, rowFilter).then(($row) => {
          if ($row) {
            cy.wrap($row).find("td").find("input").check();
            cy.get("button[name=save]").click();
            cy.wait(500);
            cy.visit(current);
            cy.get("button[name=save]").click();
            cy.wait(500);
            cy.get(".alert").should(
              "contain.text",
              "The discount has been updated successfully."
            );
          } else {
            assert.exists($row, `Expected a row for ${prodCatName} in the ${productOrCategory} table`);
          }
        });
      });
    });
  });
};
// Returns the original price of a discounted product while on product page.
const getOriginalPrice = () => {
  return cy.get(".prices").then(($div) => {
    var cost = $div.find(".product-price > span");
    if ($div[0].innerHTML.includes("discounted-price")) {
      cost = $div.find(".non-discounted-price > span");
    }
    const price = parseFloat(cost.text().replace("$", ""));
    return price;
  });
};
// Clears the cart, then adds 3 products to cart, wrapping their original prices as productPrices. Goes to cart after
const addProductsToCart = () => {
  cy.goToPublic();
  cy.clearCart();
  cy.goToHome();
  cy.goToProduct(secondProduct, secondCategory);
  getOriginalPrice().then((altProductPrice) => {
    cy.get(".add-to-cart-button").addToCart({ force: true });
    cy.allowLoad();
    cy.goToHome();
    cy.goToProduct(mainProductOne, mainCategory);
    getOriginalPrice().then((firstProductPrice) => {
      cy.get(".add-to-cart-button").addToCart({ force: true });
      cy.allowLoad();
      cy.goToHome();
      cy.goToProduct(mainProductTwo, mainCategory);
      getOriginalPrice().then((secondProductPrice) => {
        cy.get(".add-to-cart-button").addToCart({ force: true });
        cy.allowLoad();
        cy.wrap({ altProductPrice, firstProductPrice, secondProductPrice }).as("productPrices");
        cy.goToCart();
      });
    });
  });
};
// Looks for a duplicate discount in the table and deletes it
const checkForDuplicate = (name: string) => {
  getDiscountRow(name).then((row) => {
    if (row) {
      cy.wrap(row).find("td").contains("Edit").click({ force: true });
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
    }
  });
};
// Flatly creates a discount after checking for duplicates and then pushes to the createdDiscounts array
const createDiscount = (discount) => {
  checkForDuplicate(discount.name);
  cy.addNewDiscount(discount);
  createdDiscounts.push(discount.name);
};
// Creates a new discount and adds 3 products to the cart. Gets prices and discount value and wraps them as returnValue
const createDiscountAndAddProduct = (discount) => {
  cy.goToDiscounts();
  checkForDuplicate(discount.name);
  cy.addNewDiscount(discount);
  createdDiscounts.push(discount.name);
  addProductsToCart();
  cy.get("@productPrices").then((prices) => {
    const { altProductPrice, firstProductPrice, secondProductPrice } = prices;
    const value = parseDiscountAmount(discount);
    const returnValue = { altProductPrice, firstProductPrice, secondProductPrice, value };
    cy.wrap(returnValue).as("returnValue");
  });
};
// Creates a new discount and then goes to the edit page. For when you need to add products/categories
const createDiscountAndEdit = (discount) => {
  cy.goToDiscounts();
  checkForDuplicate(discount.name);
  cy.addNewDiscount(discount);
  createdDiscounts.push(discount.name);
  editDiscount(discount.name);
};
// Run a search. Will clear the search if invalid searchType is passed in
const runDiscountSearch = (searchValue, searchType: string) => {
  switch(searchType) {
    case 'name':
      cy.get("#SearchDiscountName").type(searchValue);
      break;
    case "code":
      cy.get("#SearchDiscountCouponCode").type(searchValue);
      break;
    case "startString":
      const startDate = new Date(searchValue);
      cy.get("#SearchStartDate").type(startDate.toLocaleDateString());
      break;
    case "endString":
      const endDate = new Date(searchValue);
      cy.get("#SearchEndDate").type(endDate.toLocaleDateString());
      break;
    case "type":
      cy.get("#SearchDiscountTypeId").select(searchValue);
      break;
    default: 
    cy.get("#SearchDiscountName").clear();
    cy.get("#SearchDiscountCouponCode").clear();
    cy.get("#SearchStartDate").clear();
    cy.get("#SearchEndDate").clear();
    cy.get("#SearchDiscountTypeId").select('All');
  };
  cy.wait(1000);
  cy.get("#search-discounts").click();
  
};
// Verifies the subtotal or total of the cart when a single total/subtotal discount is applied.
const verifyCost = (
  discount: number,
  itemCosts: number[],
  totalOrSubTotal: string
) => {
  cy.goToCart();
  cy.revealCartTotal();
  var expectedSubTotal = 0;
  itemCosts.forEach((item) => {
    expectedSubTotal += item;
  });
  cy.checkoutAttributes().then((attributeCost) => {
    expectedSubTotal += attributeCost;
  
    const expectedDiscount =
      discount < 1 ? expectedSubTotal * discount : discount;
    const expectedTotal = expectedSubTotal - expectedDiscount;
    var discountLocation;
    if (totalOrSubTotal === "subtotal") {
      discountLocation = ".order-subtotal-discount";
    } else if (totalOrSubTotal === "total") {
      discountLocation = ".discount-total";
    }
    const currencyFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      currencyDisplay: "symbol",
    });
    const moneyPattern = /([a-z]|\s)/g;
    cy.get(".order-subtotal")
      .find(".value-summary")
      .invoke("text")
      .then(($subtotalText) => {
        const formattedText = $subtotalText.replace(moneyPattern, "");
        cy.wrap(formattedText).should("eql", currencyFormat.format(expectedSubTotal));
      });
    cy.get(`${discountLocation}`)
      .find(".value-summary")
      .invoke("text")
      .then(($discountText) => {
        const formattedText = $discountText.replace(moneyPattern, "");
        cy.wrap(formattedText).should("eql", `-${currencyFormat.format(expectedDiscount)}`);
      });
    cy.get(".order-total")
      .find(".value-summary")
      .invoke("text")
      .then(($totalText) => {
        const formattedText = $totalText.replace(moneyPattern, "");
        cy.wrap(formattedText).should("eql", currencyFormat.format(expectedTotal));
      });
  });
};
// Verifies the subtotal or total of the cart. To be used when a total/subtotal discount shouldn't apply, such as expiration
const verifyFailure = (
  discount: number,
  itemCosts: number[],
  totalOrSubTotal: string
) => {
  var expectedSubTotal = 0;
  itemCosts.forEach((item) => {
    expectedSubTotal += item;
  });
  cy.revealCartTotal().then(() => {
    cy.checkoutAttributes().then((attributeCost) => {
      expectedSubTotal += attributeCost;
      const expectedDiscount =
        discount < 1 ? expectedSubTotal * discount : discount;
      var discountLocation;
      if (totalOrSubTotal === "subtotal") {
        discountLocation = ".order-subtotal-discount";
      } else if (totalOrSubTotal === "total") {
        discountLocation = ".discount-total";
      }
      const currencyFormat = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        currencyDisplay: "symbol",
      });
      const moneyPattern = /([a-z]|\s)/g;
      cy.get(".order-subtotal")
        .find(".value-summary")
        .invoke("text")
        .then(($subtotalText) => {
          const formattedText = $subtotalText.replace(moneyPattern, "");
          cy.wrap(formattedText).should("eql", currencyFormat.format(expectedSubTotal));
        });
      cy.get(".order-total")
        .find(".value-summary")
        .invoke("text")
        .then(($totalText) => {
          const formattedText = $totalText.replace(moneyPattern, "");
          cy.wrap(formattedText).should("eql", currencyFormat.format(expectedSubTotal));
        });
      cy.get(".cart-total")
        .find("tbody")
        .should("not.contain.html", `${discountLocation}`)
        .and("not.contain.text", `-${currencyFormat.format(expectedDiscount)}`);
    });
  });
};
// Checks a product page for the discount display. Use expected to control whether it should be there or not
const checkProductForDiscount = (
  expected: boolean,
  discount?: number,
  percent?: boolean
) => {
  const shouldContain = expected ? "contain.html" : "not.contain.html";
  cy.get(".prices")
    .should(shouldContain, "non-discounted-price")
    .and(shouldContain, "discounted-price");
  if (expected && discount) {
    cy.get(".non-discounted-price")
      .find("span")
      .then(($span) => {
        const origPrice = parseFloat($span.text().replace("$", ""));
        const discountAmount = percent ? origPrice * discount : discount;
        const discountPrice = origPrice - discountAmount;
        cy.get(".discounted-price").find('span').eq(0).should(
          "contain.text",
          "Your price:"
        );
        cy.get(".discounted-price").find('span').eq(1).should(
          "contain.text",
          discountPrice.toLocaleString("en-US", {
            currency: "USD",
            style: "currency",
          })
        );
      });
  }
};
// Checks a category page for the discount display. Checks all products on page. Use expected to control whether it should be there or not
const checkCategoryForDiscounts = (
  expected: boolean,
  discount?: number,
  percent?: boolean
) => {
  cy.get(".item-grid")
    .find(".product-item")
    .each(($div, index, $list) => {
      const shouldContain = expected ? "contain.html" : "not.contain.html";
      cy.wrap($div).find(".prices").should(shouldContain, "old-price");
      if (expected && discount) {
        cy.wrap($div).find(".prices").should("contain.html", "old-price");
        cy.wrap($div)
          .find(".old-price")
          .then(($el) => {
            const cardPrice = parseFloat($el.text().replace("$", ""));
            const discountAmount = percent ? cardPrice * discount : discount;
            const discountedCardPrice = cardPrice - discountAmount;
            cy.wrap($div)
              .find(".actual-price")
              .should(
                "contain.text",
                discountedCardPrice.toLocaleString("en-US", {
                  currency: "USD",
                  style: "currency",
                })
              );
          });
      }
    });
};
// Checks a category page for a discount displaying on a specific product. Checks that other products do not have the discount
const checkProductInCategory = (
  productName: string,
  discount: number,
  percent: boolean
) => {
  cy.get(".item-grid")
    .find(".product-item")
    .each(($div, index, $list) => {
      if (!$div[0].innerText.includes(productName)) {
        cy.wrap($div).find(".prices").should("not.contain.html", "old-price");
      }
    })
    .then(($list) => {
      cy.wrap($list)
        .filter((index, item) => {
          return item.innerText.includes(productName);
        })
        .as("targetProduct");
      cy.get("@targetProduct")
        .find(".prices")
        .should("contain.html", "old-price");
      cy.get("@targetProduct")
        .find(".old-price")
        .then(($el) => {
          const cardPrice = parseFloat($el.text().replace("$", ""));
          const discountAmount = percent ? cardPrice * discount : discount;
          const discountedCardPrice = cardPrice - discountAmount;
          cy.get("@targetProduct")
            .find(".actual-price")
            .should(
              "have.text",
              discountedCardPrice.toLocaleString("en-US", {
                currency: "USD",
                style: "currency",
              })
            );
        });
    });
};
// Checks the unit price of a row in the cart. Should be called from within the row.
const checkUnitPrice = (price: number) => {
  cy.get(".product-unit-price").should(
    "have.text",
    price.toLocaleString("en-US", {
      currency: "USD",
      style: "currency",
    })
  );
};
// Checks the subtotal and discount presence of a row in the cart. Should be called from within the row. Returns the subtotal
const checkUnitSubtotal = (
  price: number,
  discount: number,
  fullPrice: boolean,
  inCheckout: boolean,
) => {
  const getValue = (value) => {
    const contain = fullPrice ? "not.contain.html" : "contain.html";
    const qty = parseInt(value);
    cy.get(".subtotal").should(contain, "discount");
    if (fullPrice) {
      cy.get(".subtotal").should("not.contain.text", "You save");
      const subtotal = price * qty;
      cy.get(".product-subtotal").should(
        "have.text",
        subtotal.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
        })
      );
      return cy.wrap(subtotal);
    } else {
      const savings = discount * qty;
      cy.get(".discount").should(
        "contain.text",
        `You save: ${savings.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
        })}`
      );
      const adjustedSubtotal = price * qty - savings;
      cy.get(".product-subtotal").should(
        "have.text",
        adjustedSubtotal.toLocaleString("en-US", {
          currency: "USD",
          style: "currency",
        })
      );
      return cy.wrap(adjustedSubtotal);
    }
  };
  if (inCheckout) {
    return cy
    .get('.product-quantity')
    .invoke("text")
    .then((value) => {
      return getValue(value);
    });
  } else {
    return cy
    .get(".qty-input")
    .invoke("val")
    .then((value) => {
      return getValue(value);
    });
  }
};
// Calls previous two functions from within the row that's passed in.
const checkCartRow = (
  tr: JQuery<HTMLElement>,
  price: number,
  discount: number,
  fullPrice: boolean
) => {
  var subtotal = 0;
  return cy.wrap(tr).within(($tr) => {
    const unitPrice = fullPrice ? price : price - discount;
    const inCheckout = $tr[0].innerHTML.includes("product-quantity");
    checkUnitPrice(unitPrice);
    checkUnitSubtotal(price, discount, fullPrice, inCheckout).then((sbValue: number) => {
      subtotal = sbValue;
    });
  }).then(() => {
    return subtotal;
  });
};
// Examines the cart to make sure discounts are applied correctly.
// Assumes that the mainCategory is discounted unless you pass in a product name
// Adds up each item after it validates them, then validates the cart subtotal.
const verifyCartAndSubtotal = (
  discount: number,
  prices: number[],
  options: { productName?: string; percent?: boolean }
) => {
  const { productName, percent } = options;
  const cypressProducts = [mainProductOne, mainProductTwo];
  cy.get(".cart").find("tbody").find("tr").should("have.length", 3);
  var cartSubtotal = 0;
  cy.get(".cart")
    .find("tbody")
    .find("tr")
    .each(($tr, index, list) => {
      const itemName = $tr.find(".product-name").text();
      var price = 0;
      switch (itemName) {
        case secondProduct:
          price = prices[0];
          break;
        case mainProductOne:
          price = prices[1];
          break;
        case mainProductTwo:
          price = prices[2];
          break;
      }
      const calcDiscount = percent ? price * discount : discount;
      var fullPrice = true;
      if (productName && itemName === productName) {
        fullPrice = false;
      } else if (!productName && cypressProducts.includes(itemName)) {
        fullPrice = false;
      }
      checkCartRow($tr, price, calcDiscount, fullPrice).then((itemSubtotal) => {
        cartSubtotal += itemSubtotal;
      });
    })
    .then(() => {
      cy.revealCartTotal().then(() => {
        cy.checkoutAttributes().then((attributeCost) => {
          cartSubtotal += attributeCost;
          cy.get(".order-subtotal")
            .find(".value-summary")
            .should(
              "have.text",
              cartSubtotal.toLocaleString("en-US", {
                currency: "USD",
                style: "currency",
              })
            );
        });
      });
    });
};
// Clears cart and deletes the discount if it's found, then goes to eComm public store home. Called in the beforeEach
const resetCartAndDiscount = (discountName: string) => {
  if (discountName.length > 0) {
    cy.clearCart();
    cy.goToDiscounts();
    deleteDiscount(discountName, true);
    cy.visit("/");
  }
};
// Dates to use for discounts
const today = new Date();
const twoDaysAhead = new Date(today.valueOf() + 172800000);
const twoDaysBehind = new Date(today.valueOf() - 172800000);
const fourDaysBehind = new Date(today.valueOf() - 345600000);
const monthDay = today.toLocaleString("en-US", {month: "2-digit", day: "2-digit"});

describe("Ecommerce", function () {
  before(() => {
    /**
     * TODO:
     * Create a setup command to ensure there is always a free shipping method available,
     * so that the shipping method doesn't add to the price and interfere with the tests
     */
    cy.setupDiscounts();
  });

  context("Discounts", () => {
    after(() => {
      cy.revertDiscounts();
    });

    beforeEach(() => {
      cy.visit("/");
      cy.login();
      cy.clearCart();
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
      cy.get("#discount-applied-to-products").should("not.be.visible");
      cy.get("#discount-applied-to-categories").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers").should(
        "not.be.visible"
      );
      // Products
      cy.get("#DiscountTypeId").select("Assigned to products");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products").should("be.visible");
      cy.get("#discount-applied-to-categories").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers").should(
        "not.be.visible"
      );
      // Categories
      cy.get("#DiscountTypeId").select("Assigned to categories");
      cy.get("#AppliedToSubCategories").should("be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products").should("not.be.visible");
      cy.get("#discount-applied-to-categories").should("be.visible");
      cy.get("#discount-applied-to-manufacturers").should(
        "not.be.visible"
      );
      // Manufacturers
      cy.get("#DiscountTypeId").select("Assigned to manufacturers");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("be.visible");
      cy.get("#discount-applied-to-products").should("not.be.visible");
      cy.get("#discount-applied-to-categories").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers").should("be.visible");
      // Shipping
      cy.get("#DiscountTypeId").select("Assigned to shipping");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("not.be.visible");
      cy.get("#discount-applied-to-products").should("not.be.visible");
      cy.get("#discount-applied-to-categories").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers").should(
        "not.be.visible"
      );
      // Order subtotal
      cy.get("#DiscountTypeId").select("Assigned to order subtotal");
      cy.get("#AppliedToSubCategories").should("not.be.visible");
      cy.get("#pnlMaximumDiscountedQuantity").should("not.be.visible");
      cy.get("#discount-applied-to-products").should("not.be.visible");
      cy.get("#discount-applied-to-categories").should("not.be.visible");
      cy.get("#discount-applied-to-manufacturers").should(
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
      const createdDiscount = {
        name: `Cypress created ${monthDay}`,
        discountType: "Assigned to order total",
        amount: "333",
        useCode: true,
        code: "cypCreDis",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      cy.addNewDiscount(createdDiscount);
      createdDiscounts.push(createdDiscount.name);
      cy.get(".alert").should(
        "contain.text",
        "The new discount has been added successfully."
      );
      cy.get("#discounts-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows.length).to.be.gte(1);
          const row = $rows.filter((index, item) => {
            return item.cells[0].innerText === createdDiscount.name;
          });
          expect(row.length).to.be.eq(1, "Table should have a row with the expected discount");
          const cells = row[0].cells;
          cy.wrap(cells[0]).should("have.text", createdDiscount.name);
          cy.wrap(cells[1]).should(
            "have.text",
            createdDiscount.discountType
          );
          cy.wrap(cells[2]).should(
            "have.text",
            `${createdDiscount.amount} USD`
          );
          cy.wrap(cells[3]).should(
            "have.text",
            `${new Date(createdDiscount.date.startDate).toLocaleString(
              undefined,
              {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }
            )} ${new Date(createdDiscount.date.startDate).toLocaleString(
              undefined,
              {
                hour: "2-digit", 
                minute: "2-digit", 
                second: "2-digit"
              }
            )}`
          );
          cy.wrap(cells[4]).should(
            "have.text",
            `${new Date(createdDiscount.date.endDate).toLocaleString(
              undefined,
              {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              }
            )} ${new Date(createdDiscount.date.endDate).toLocaleString(
              undefined,
              {
                hour: "2-digit", 
                minute: "2-digit", 
                second: "2-digit"
              }
            )}`
          );
          cy.wrap(cells[5]).should("have.text", "0");
        });
    });

    it("Deleting a discount display a success banner and updates the table", () => {
      cy.goToDiscounts();
      const deletedDiscount = {
        name: `Cypress deleting ${monthDay}`,
        discountType: "Assigned to order total",
        amount: "333",
        useCode: true,
        code: "cypDelDis",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      cy.addNewDiscount(deletedDiscount);
      createdDiscounts.push(deletedDiscount.name);
      getDiscountRow(deletedDiscount.name).then((row) => {
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

    it("A deleted discount cannot be used in the store", () => {
      cy.goToDiscounts();
      const deletedDiscount = {
        name: `Cypress deleted ${monthDay}`,
        discountType: "Assigned to order total",
        amount: "333",
        useCode: true,
        code: "cypDeleted",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      cy.addNewDiscount(deletedDiscount);
      createdDiscounts.push(deletedDiscount.name);
      deleteDiscount(deletedDiscount.name);
      cy.goToPublic();
      cy.goToProduct(mainProductOne);
      cy.get(".add-to-cart-button").addToCart();
      cy.goToCart();
      cy.get("#discountcouponcode").scrollIntoView().type(deletedDiscount.code, { force: true });
      cy.get("#applydiscountcouponcode").scrollIntoView().click({ force: true });
      cy.get(".coupon-box").should("contain.html", "message-failure");
      cy.get(".coupon-box")
        .find(".message-failure")
        .should("contain.text", "The coupon code cannot be found");
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
      getDiscountRow(newName).then((row) => {
        cy.wrap(row).should("exist");
        const cells = row[0].cells;
        cy.wrap(cells[0]).should("have.text", newName);
        cy.wrap(cells[1]).should("have.text", newType);
        cy.wrap(cells[2]).should("have.text", `${newAmount}%`);
        cy.wrap(cells[3]).should(
          "have.text",
          `${today.toLocaleString(
            undefined,
            {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }
          )} 12:00:00 AM`
        );
        cy.wrap(cells[4]).should(
          "have.text",
          `${twoDaysAhead.toLocaleString(
            undefined,
            {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            }
          )} 11:59:00 PM`
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
      createDiscountAndEdit(productDiscount);
      addProductOrCategory(mainProductOne, "product");
      editDiscount(productDiscount.name);
      cy.get("#products-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", mainProductOne);
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
      createDiscountAndEdit(categoryDiscount);
      addProductOrCategory(mainCategory, "category");
      editDiscount(categoryDiscount.name);
      cy.get("#categories-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", mainCategory);
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

    it("Searching discounts returns the correct discount", () => {
      const searchName = {
        name: "Cypress Search Name",
      };
      const searchCode = {
        name: "Cypress Search Code",
        useCode: true,
        code: "CypSearch",
      };
      const searchStart = {
        name: "Cypress Search Start",
        date: {
          startDate: `${today.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
      };
      const searchEnd = {
        name: "Cypress Search End",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${today.toLocaleDateString()} 11:59 PM`,
        },
      };
      const searchType = {
        name: "Cypress Search Type",
        discountType: "Assigned to shipping",
      };
      const searchableDiscounts = [searchName, searchCode, searchStart, searchEnd, searchType];
      function verifyTable(expected, notExpected?) {
        cy.get("#discounts-grid").find('tbody').find('tr').should("contain.text", expected.name);
        if (notExpected) {
          cy.get("#discounts-grid").find('tbody').find('tr').should("not.contain.text", notExpected.name);
        } else {
        searchableDiscounts.forEach((item) => {
          if (item.name !== expected.name) {
            cy.get("#discounts-grid").find('tbody').find('tr').should("not.contain.text", item.name);
          }
        });
      }
      };
      function verifyAndClear(discount, notExpected?) {
        verifyTable(discount, notExpected);
        runDiscountSearch("","");
      };
      cy.goToDiscounts();
      // Create the discounts
      searchableDiscounts.forEach((item) => {
        createDiscount(item);
      });
      // Run Searches
      runDiscountSearch(searchName.name, "name");
      verifyAndClear(searchName);
      runDiscountSearch(searchCode.code, "code");
      verifyAndClear(searchCode);
      runDiscountSearch(searchStart.date.startDate, "startString");
      verifyAndClear(searchStart, searchEnd);
      runDiscountSearch(searchEnd.date.endDate, "endString");
      verifyAndClear(searchEnd, searchStart);
      runDiscountSearch(searchType.discountType, "type")
      verifyAndClear(searchType);
      cy.wait(1000);
      // Delete them all
      searchableDiscounts.forEach((item) => {
        deleteDiscount(item.name);
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
        const { value, altProductPrice, firstProductPrice, secondProductPrice } = returnValue;
        verifyCost(value, [altProductPrice, firstProductPrice, secondProductPrice], "total");
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
        const { value, altProductPrice, firstProductPrice, secondProductPrice } = returnValue;
        verifyCost(value, [altProductPrice, firstProductPrice, secondProductPrice], "total");
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
        const { value, altProductPrice, firstProductPrice, secondProductPrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(inDateDiscount.code, { force: true });
        cy.get("#applydiscountcouponcode").click({ force: true });
        cy.get(".message-success").should(
          "contain.text",
          "The coupon code was applied"
        );
        verifyCost(value, [altProductPrice, firstProductPrice, secondProductPrice], "total");
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
        const { value, altProductPrice, firstProductPrice, secondProductPrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(expiredDiscount.code, { force: true });
        cy.get("#applydiscountcouponcode").click({ force: true });
        cy.get(".message-failure").should(
          "contain.text",
          "Sorry, this offer is expired"
        );
        verifyFailure(value, [altProductPrice, firstProductPrice, secondProductPrice], "total");
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
        const { value, altProductPrice, firstProductPrice, secondProductPrice } = returnValue;
        cy.goToCart();
        verifyFailure(value, [altProductPrice, firstProductPrice, secondProductPrice], "total");
      });
    });

    // TODO: ADJUST FOR THEMES: Prisma
    it("Product discounts display on the product's page", () => {
      const baldCypressDisplay = {
        name: "Bald Cypress Display",
        discountType: "Assigned to products",
        usePercentage: true,
        amount: "40",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
      };
      createDiscountAndEdit(baldCypressDisplay);
      addProductOrCategory(mainProductOne, "product");
      cy.goToPublic();
      cy.goToCategory(secondCategory);
      checkCategoryForDiscounts(false);
      cy.goToCategory(mainCategory);
      const discount = parseDiscountAmount(baldCypressDisplay);
      checkProductInCategory(mainProductOne, discount, true);
      cy.goToProduct(mainProductOne, mainCategory);
      checkProductForDiscount(true, discount, true);
      cy.goToProduct(mainProductTwo, mainCategory);
      checkProductForDiscount(false);
      cy.goToProduct(secondProduct, secondCategory);
      checkProductForDiscount(false);
    });

    // TODO: ADJUST FOR THEMES: Prisma
    it("Category discounts appear on the category page", () => {
      const treesDiscount = {
        name: "Cypress Trees Display",
        discountType: "Assigned to categories",
        usePercentage: true,
        amount: "40",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      cy.goToDiscounts();
      createDiscountAndEdit(treesDiscount);
      addProductOrCategory(mainCategory, "category");
      const discount = parseDiscountAmount(treesDiscount);
      cy.goToPublic();
      cy.goToCategory(secondCategory);
      checkCategoryForDiscounts(false);
      cy.goToProduct(secondProduct, secondCategory);
      checkProductForDiscount(false);
      cy.goToCategory(mainCategory);
      checkCategoryForDiscounts(true, discount, true);
      cy.goToProduct(mainProductOne, mainCategory);
      checkProductForDiscount(true, discount, true);
      cy.goToProduct(mainProductTwo, mainCategory);
      checkProductForDiscount(true, discount, true);
    });

    it("Product discounts are only applied to the correct product and the cart subtotal is correct", () => {
      const baldCypressDiscount = {
        name: "Bald Cypress Discount",
        discountType: "Assigned to products",
        usePercentage: true,
        amount: "30",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      createDiscountAndEdit(baldCypressDiscount);
      addProductOrCategory(mainProductOne, "product");
      const discount = parseDiscountAmount(baldCypressDiscount);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        verifyCartAndSubtotal(discount, Object.values(prices), {
          productName: mainProductOne,
          percent: true,
        });
      });
    });

    it("Category discounts are only applied to items in the correct category and the cart subtotal is correct", () => {
      const cypressTreesDiscount = {
        name: "Cypress Trees Discount",
        discountType: "Assigned to categories",
        usePercentage: true,
        amount: "30",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      createDiscountAndEdit(cypressTreesDiscount);
      addProductOrCategory(mainCategory, "category");
      addProductsToCart();
      const discount = parseDiscountAmount(cypressTreesDiscount);
      cy.get("@productPrices").then((prices) => {
        verifyCartAndSubtotal(discount, Object.values(prices), {
          percent: true,
        });
      });
    });

    it("Product discounts are successful throughout checkout", () => {
      const checkoutDiscount = {
        name: "Bald Cypress Checkout",
        discountType: "Assigned to products",
        usePercentage: true,
        amount: "28",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      createDiscountAndEdit(checkoutDiscount);
      addProductOrCategory(mainProductOne, "product");
      const discount = parseDiscountAmount(checkoutDiscount);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        cy.get("#termsofservice").click({ force: true });
        cy.get(".checkout-button").click({ force: true });
        cy.wait(500);
        cy.getToConfirmOrder();
        verifyCartAndSubtotal(discount,  Object.values(prices), {
          productName: mainProductOne,
          percent: true,
        });
        cy.server();
        cy.route('POST', '/checkout/OpcConfirmOrder/').as('receivedResponse');
        cy.get(".confirm-order-next-step-button").click();
        cy.wait('@receivedResponse');
        cy.goToDiscounts();
        getDiscountRow(checkoutDiscount.name).then((row) => {
          // check that times used updates
          cy.wrap(row).should("exist");
          cy.wrap(row).find("td").eq(5).should("have.text", "1");
        });
      });
    });

    it("Category discounts are successful throughout checkout", () => {
      const cypressCategoryCheckout = {
        name: "Cypress Trees Checkout",
        discountType: "Assigned to categories",
        usePercentage: true,
        amount: "41",
        date: {
          startDate: `${twoDaysBehind.toLocaleDateString()} 12:00 AM`,
          endDate: `${twoDaysAhead.toLocaleDateString()} 11:59 PM`,
        },
        limitation: "Unlimited",
        maxDiscountQty: "5",
      };
      createDiscountAndEdit(cypressCategoryCheckout);
      addProductOrCategory(mainCategory, "category");
      const discount = parseDiscountAmount(cypressCategoryCheckout);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        cy.get("#termsofservice").click({ force: true });
        cy.get(".checkout-button").click({ force: true });
        cy.wait(500);
        cy.getToConfirmOrder();
        cy.wait(1000);
        verifyCartAndSubtotal(discount,  Object.values(prices), {
          percent: true,
        });
        cy.server();
        cy.route('POST', '/checkout/OpcConfirmOrder/').as('receivedResponse');
        cy.get(".confirm-order-next-step-button").click();
        cy.wait('@receivedResponse');
        cy.goToDiscounts();
        getDiscountRow(cypressCategoryCheckout.name).then((row) => {
          // check that times used updates
          cy.wrap(row).should("exist");
          cy.wrap(row).find("td").eq(5).should("have.text", "1");
        });
      });
    });
  });
});
