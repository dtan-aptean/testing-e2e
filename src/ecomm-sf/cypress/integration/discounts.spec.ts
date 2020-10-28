/// <reference types="cypress" />
// TEST COUNT: 22

// Log of all created discounts; discount name pushed upon creation. Used to clear them
const createdDiscounts: string[] = [];
const nonCypressProduct = "Ibanez";
const nonCypressCategory = "Guitars"; // Should be category that the above product is in
const cypressProductOne = "Bald Cypress";
const cypressProductTwo = "Montezuma Cypress";
const cypressCategory = "Cypress Trees"; // Should be category that above two products are in
// Returns the discount as a numerical percentage or a number
const parseDiscountAmount = (discount) => {
  if (discount.usePercentage) {
    return parseFloat(`0.${discount.amount}`);
  }
  return parseFloat(discount.amount);
};
// Searches a single page of the discounts table for the provided name and returns the row if found
const runFilter = (name: string) => {
  return cy
    .get("#discounts-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      if ($rows.length === 1 && $rows[0].innerText === "No data available in table") {
        return null;
      }
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
// Calls runFilter and pages through the pagination if runFilter doesn't find it
const findInTable = (name: string) => {
  return cy
    .get(".pagination")
    .find("li")
    .then(($li) => {
      if ($li.length === 2) {
        return null;
      }
      for (var i = 0; i < $li.length - 2; i++) {
        runFilter(name).then((el) => {
          if (el) {
            i = $li.length;
            return el;
          } else {
            if ($li.length - 2 > 1) {
              cy.get("#discounts-grid_next").find("a").click();
              cy.wait(1000);
            } else {
              return null;
            }
          }
        });
      }
    });
};
// Searches the table and clicks edit if it finds the discount
const editDiscount = (discountName: string) => {
  findInTable(discountName).then((row) => {
    if (row) {
      cy.wrap(row).find("td").contains("Edit").click({ force: true });
      cy.wait(500);
    }
  });
};
// Calls editDiscount and if it makes it to the edit page, deletes the discount
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
// While editing a discount, adds a product or category. Pass in name of product/category, and "product"/"category"
const addProductOrCategory = (
  prodCatName: string,
  productOrCategory: string
) => {
  var buttonId;
  var gridId;
  var panelId
  if (productOrCategory === "product") {
    panelId = "#discount-applied-to-products";
    buttonId = "#btnAddNewProduct";
    gridId = "#products-grid";
  } else if (productOrCategory === "category") {
    panelId = "#discount-applied-to-categories";
    buttonId = "#btnAddNewCategory";
    gridId = "#categories-grid";
  }
  cy.get(`${panelId}`).then((panel) => {
    if (!panel[0].innerHTML.includes("opened")) {
      cy.wrap(panel).click();
      cy.get(`${panelId}`).should("contain.html", "opened");
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
  cy.goToProduct(nonCypressProduct, nonCypressCategory);
  getOriginalPrice().then((guitarPrice) => {
    cy.get(".add-to-cart-button").click();
    cy.goToProduct(cypressProductOne, cypressCategory);
    getOriginalPrice().then((baldPrice) => {
      cy.get(".add-to-cart-button").click();
      cy.goToProduct(cypressProductTwo, cypressCategory);
      getOriginalPrice().then((montePrice) => {
        cy.get(".add-to-cart-button").click();
        cy.wrap({ guitarPrice, baldPrice, montePrice }).as("productPrices");
        cy.goToCart();
      });
    });
  });
};
// Looks for a duplicate discount in the table and deletes it
const checkForDuplicate = (name: string) => {
  findInTable(name).then((row) => {
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
    const { guitarPrice, baldPrice, montePrice } = prices;
    const value = parseDiscountAmount(discount);
    const returnValue = { guitarPrice, baldPrice, montePrice, value };
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
      getValue(value);
    });
  } else {
    return cy
    .get(".qty-input")
    .invoke("val")
    .then((value) => {
      getValue(value);
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
  return cy.wrap(tr).within(($tr) => {
    const unitPrice = fullPrice ? price : price - discount;
    const inCheckout = $tr[0].innerHTML.includes("product-quantity");
    checkUnitPrice(unitPrice);
    checkUnitSubtotal(price, discount, fullPrice, inCheckout);
  });
};
// Examines the cart to make sure discounts are applied correctly.
// Assumes that the category assigned to cypressCategory variable is discounted unless you pass in a product name
// Adds up each item after it validates them, then validates the cart subtotal.
const verifyCartAndSubtotal = (
  discount: number,
  prices: number[],
  options: { productName?: string; percent?: boolean }
) => {
  const { productName, percent } = options;
  const cypressProducts = [cypressProductOne, cypressProductTwo];
  cy.get(".cart").find("tbody").find("tr").should("have.length", 3);
  var cartSubtotal = 0;
  cy.get(".cart")
    .find("tbody")
    .find("tr")
    .each(($tr, index, list) => {
      const itemName = $tr.find(".product-name").text();
      var price = 0;
      switch (itemName) {
        case nonCypressProduct:
          price = prices[0];
          break;
        case cypressProductOne:
          price = prices[1];
          break;
        case cypressProductTwo:
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
};
// Clears cart and deletes the discount if it's found, then goes to eComm public store home.
// Called in the beforeEach and the last test
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
      cy.addNewDiscount(commonDiscount);
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
        cy.goToProduct(cypressProductOne);
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
      createDiscountAndEdit(productDiscount);
      addProductOrCategory(cypressProductOne, "product");
      editDiscount(productDiscount.name);
      cy.get("#products-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", cypressProductOne);
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
      addProductOrCategory(cypressCategory, "category");
      editDiscount(categoryDiscount.name);
      cy.get("#categories-grid")
        .find("tbody")
        .find("tr")
        .then(($rows) => {
          expect($rows).to.have.length(1);
          cy.wrap($rows[0].cells[0]).should("have.text", cypressCategory);
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
        const { value, guitarPrice, baldPrice, montePrice } = returnValue;
        verifyCost(value, [guitarPrice, baldPrice, montePrice], "total");
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
        const { value, guitarPrice, baldPrice, montePrice } = returnValue;
        verifyCost(value, [guitarPrice, baldPrice, montePrice], "total");
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
        const { value, guitarPrice, baldPrice, montePrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(inDateDiscount.code);
        cy.get("#applydiscountcouponcode").click();
        cy.get(".message-success").should(
          "contain.text",
          "The coupon code was applied"
        );
        verifyCost(value, [guitarPrice, baldPrice, montePrice], "total");
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
        const { value, guitarPrice, baldPrice, montePrice } = returnValue;
        cy.goToCart();
        cy.get("#discountcouponcode").type(expiredDiscount.code);
        cy.get("#applydiscountcouponcode").click();
        cy.get(".message-failure").should(
          "contain.text",
          "Sorry, this offer is expired"
        );
        verifyFailure(value, [guitarPrice, baldPrice, montePrice], "total");
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
        const { value, guitarPrice, baldPrice, montePrice } = returnValue;
        cy.goToCart();
        verifyFailure(value, [guitarPrice, baldPrice, montePrice], "total");
      });
    });

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
      addProductOrCategory(cypressProductOne, "product");
      cy.goToPublic();
      cy.goToCategory(nonCypressCategory);
      checkCategoryForDiscounts(false);
      cy.goToCategory(cypressCategory);
      const discount = parseDiscountAmount(baldCypressDisplay);
      checkProductInCategory(cypressProductOne, discount, true);
      cy.goToProduct(cypressProductOne, cypressCategory);
      checkProductForDiscount(true, discount, true);
      cy.goToProduct(cypressProductTwo, cypressCategory);
      checkProductForDiscount(false);
      cy.goToProduct(nonCypressProduct, nonCypressCategory);
      checkProductForDiscount(false);
    });

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
      addProductOrCategory(cypressCategory, "category");
      const discount = parseDiscountAmount(treesDiscount);
      cy.goToPublic();
      cy.goToCategory(nonCypressCategory);
      checkCategoryForDiscounts(false);
      cy.goToProduct(nonCypressProduct, nonCypressCategory);
      checkProductForDiscount(false);
      cy.goToCategory(cypressCategory);
      checkCategoryForDiscounts(true, discount, true);
      cy.goToProduct(cypressProductOne, cypressCategory);
      checkProductForDiscount(true, discount, true);
      cy.goToProduct(cypressProductTwo, cypressCategory);
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
      addProductOrCategory(cypressProductOne, "product");
      const discount = parseDiscountAmount(baldCypressDiscount);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        verifyCartAndSubtotal(discount, Object.values(prices), {
          productName: cypressProductOne,
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
      addProductOrCategory(cypressCategory, "category");
      addProductsToCart();
      const discount = parseDiscountAmount(cypressTreesDiscount);
      cy.get("@productPrices").then((prices) => {
        verifyCartAndSubtotal(discount, Object.values(prices), {
          percent: true,
        });
        // NOTE: needs to be called in the last test. Move this if a test is added!
        resetCartAndDiscount(cypressTreesDiscount.name);
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
      addProductOrCategory(cypressProductOne, "product");
      const discount = parseDiscountAmount(checkoutDiscount);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        cy.get("#termsofservice").click();
        cy.get(".checkout-button").click();
        cy.wait(500);
        cy.getToConfirmOrder();
        verifyCartAndSubtotal(discount,  Object.values(prices), {
          productName: cypressProductOne,
          percent: true,
        });
        cy.server();
        cy.route('POST', '/checkout/OpcConfirmOrder/').as('receivedResponse');
        cy.get(".confirm-order-next-step-button").click();
        cy.wait('@receivedResponse');
        cy.goToDiscounts();
        findInTable(checkoutDiscount.name).then((row) => {
          // check that times used updates
          cy.wrap(row).should("exist");
          cy.wrap(row).find("td").eq(5).should("have.text", "1");
        });
      });
    });

    it("Category discounts are successful throughout discounts", () => {
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
      addProductOrCategory(cypressCategory, "category");
      const discount = parseDiscountAmount(cypressCategoryCheckout);
      addProductsToCart();
      cy.get("@productPrices").then((prices) => {
        cy.get("#termsofservice").click();
        cy.get(".checkout-button").click();
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
        findInTable(cypressCategoryCheckout.name).then((row) => {
          // check that times used updates
          cy.wrap(row).should("exist");
          cy.wrap(row).find("td").eq(5).should("have.text", "1");
        });
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
            // TODO: If a test fails, this won't delete a discount, for some weird cypress reason.
            // It insists it can't find the ul that it can find if the tests pass.
            // Haven't managed to find a fix for that, added a failsafe to the last test, but keep working on it.
            deleteDiscount(discountName);
            cy.wait(1000);
          });
        });
    });
  });
});