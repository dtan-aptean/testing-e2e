/**
 * STOREFRONT COMMANDS: FOR USE WITH REFUND AND ORDER MUTATIONS
 */
// Get the currently visible top menu. Cypress may display the mobile or desktop top menu depending on screen size
const getVisibleMenu = () => {
    if (Cypress.$(".menu-toggle:visible").length === 0) {
        return cy.get(".top-menu.notmobile").then(cy.wrap);
    } else {
        cy.get(".menu-toggle").click();
        return cy.get(".top-menu.mobile").then(cy.wrap);
    }
};

// Go to the cart
const goToCart = () => {
    cy.get(".header-links").find(".ico-cart").click({ force: true });
    cy.wait(500);
};

// Log in to the storefront
Cypress.Commands.add("storefrontLogin", () => {
    Cypress.log({
        name: "storefrontLogin"
    });
    cy.get(".header-links").then(($el) => {
        if (!$el[0].innerText.includes('LOG OUT')) {
            cy.wrap($el).find(".ico-login").click();
            cy.wait(200);
            cy.get(".email").type(Cypress.env("storefrontLogin"));
            cy.get(".password").type(Cypress.env("storefrontPassword"));
            cy.get(".login-button").click({force: true});
            cy.wait(200);
        }
    });
});

// Go to the public storefront
Cypress.Commands.add("goToPublicHome", () => {
    Cypress.log({
        name: "goToPublicHome"
    });
    cy.location("pathname").then((path) => {
        if (path.includes("Admin")) {
            cy.get(".navbar-nav").find("li").eq(4).find("a").click({force: true});
            cy.wait(1000);
            cy.location("pathname").should("not.contain", "Admin");
        } else if (path.includes("en")) {
            getVisibleMenu()
                .find("li")
                .contains("Home page")
                .click({force: true});
            cy.wait(500); 
        }
    });
});

// Get to the orders page in the admin store
Cypress.Commands.add("getToOrders", () => {
    Cypress.log({
        displayName: " ",
        message: "getToOrders"
    });
    // Admin site has undefined Globalize, causes Cypress to autofail tests
    cy.on("uncaught:exception", (err, runnable) => {
        return false;
    });
    cy.get(".administration").click({ force: true });
    cy.wait(1000);
    cy.location("pathname").should("eq", "/Admin");
    cy.get(".sidebar-menu.tree").find("li").contains("Sales").click({force: true});
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Orders")
      .click({force: true});
    cy.wait(500);
});

Cypress.Commands.add("getIframeBody", (iFrameName) => {
    // get the iframe > document > body
    // and retry until the body element is not empty
    return (
      cy
        .get(iFrameName)
        .its("0.contentDocument.body")
        .should("not.be.empty")
        // wraps "body" DOM element to allow
        // chaining more Cypress commands, like ".find(...)"
        // https://on.cypress.io/wrap
        .then(cy.wrap)
    );
});

Cypress.Commands.add("completeCheckout", (checkoutOptions?) => {
    Cypress.log({
        displayName: " ",
        message: "completeCheckout"
    });
    cy.get("#termsofservice").check({force: true});
    cy.get("#checkout").click({force: true});

    cy.server();
    cy.route("POST", "/checkout/OpcSaveBilling/").as('billingSaved');
    cy.route("POST", "/checkout/OpcSaveShippingMethod/").as('shippingSaved');
    cy.route("POST", "/checkout/OpcSavePaymentMethod/").as('paymentMethodSaved');
    cy.route("POST", "/checkout/OpcSavePaymentInfo/").as('paymentSaved');
    cy.route("POST", "/checkout/OpcConfirmOrder/").as('orderSubmitted');

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
        cy.get(".new-address-next-step-button").eq(0).click();
        cy.wait('@billingSaved');
        // Shipping method
        cy.get("#co-shipping-method-form").find("input[name=shippingoption]").then(($inputs) => {
            var shippingOption = checkoutOptions && checkoutOptions.shippingMethod ? checkoutOptions.shippingMethod : Cypress._.random(0, $inputs.length - 1);
            cy.get(`#shippingoption_${shippingOption}`).check();
            cy.get(".shipping-method-next-step-button").click();
            cy.wait('@shippingSaved');
            // Payment Method
            cy.wait(2000);
            cy.url().then((url) => {
                if (url.includes("#opc-payment_method")) {
                    
                    cy.get("#payment-method-block").find("#paymentmethod_0").check();
                    cy.get(".payment-method-next-step-button").click();
                    cy.wait('@paymentMethodSaved');
                }
                // Payment Information
                cy.get("#co-payment-info-form").then(($element) => {    
                    cy.wait(2000); // Allow iFrame to load
                    const iframe = $element.find("#credit-card-iframe");
                    if (iframe.length === 0) {
                        // Non iframe version
                        cy.get("#CreditCardType").select("Discover");
                        cy.get("#CardholderName").type("Cypress McTester")
                        cy.get("#CardNumber").type("6011111111111117");
                        cy.get("#ExpireMonth").select("03");
                        cy.get("#ExpireYear").select("2024");
                        cy.get("#CardCode").type("123"); 
                    } else {
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-cc-number").type("6011111111111117");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-expiration-month").type("03");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-expiration-year").type("24");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-cvv-number").type("123");
                        cy.get("#submit-credit-card-button").click();
                        cy.wait(2000); // Allow iFrame to finish sumbitting
                    }
                    
                    cy.get(".payment-info-next-step-button").click();
                    cy.wait('@paymentSaved');
                    // Confirm order
                    cy.get(".confirm-order-next-step-button")
                        .should("exist")
                        .and("be.visible");
                    cy.get(".confirm-order-next-step-button").click();
                    cy.wait('@orderSubmitted');
                });
            });
        });
    });
});

Cypress.Commands.add("clearCart", () => {
    Cypress.log({
        name: "clearCart"
    });
    goToCart();
    cy.get(".cart > tbody")
        .find("tr")
        .each(($tr, $i, $all) => {
            cy.wrap($tr).find("td").eq(0).find("input").check({ force: true });
        })
        .then(() => {
            cy.get(".update-cart-button").click({ force: true });
            cy.wait(500);
        });
});

// Ensure that we purchase more than ten of an item
Cypress.Commands.add("ensurePurchaseMultiple", () => {
    cy.get(".add-to-cart-panel").find('.qty-input').invoke('val').then((val) => {
        const qty = typeof val !== "number" ? parseInt(val) : val;
        if (qty < 10) {
            cy.get(".add-to-cart-panel").find('.qty-input').clear();
            const newQty = 10 * Cypress._.random(1, 5)
            cy.get(".add-to-cart-panel").find('.qty-input').type(newQty.toString());
        }
    });
});

// Product must belong to a category in the top menu
Cypress.Commands.add("addProduct", (categoryName: string, productName: string) => {
    Cypress.log({
        message: `category: ${categoryName}, product: ${productName}`
    });
    getVisibleMenu()
        .find("li")
        .contains(categoryName)
        .click({force: true});
    cy.wait(500);
    cy.contains(productName)
        .click({force: true});
    cy.wait(500); 
    cy.ensurePurchaseMultiple();
    cy.wait(500);
    cy.get(".add-to-cart-button")
        .click({force: true});
    cy.wait(200);
});

// Add the default cypress products to the cart
Cypress.Commands.add("addCypressProductsToCart", () => {
    Cypress.log({
        message: `Adding default Cypress products to cart`
    });
    const category = "Cypress Trees";
    cy.addProduct(category, "Bald Cypress").then(() => {
        cy.addProduct(category, "Montezuma Cypress").then(() => {
            goToCart();
        });
    });
});

// Add custom products to the cart. Passed in from placeOrder
Cypress.Commands.add("addSpecificProductsToCart", (productOptions: {firstCategory: string, firstProduct: string, secondCategory: string, secondProduct: string}) => {
    Cypress.log({
        message: "Adding specific products to cart"
    });
    cy.addProduct(productOptions.firstCategory, productOptions.firstProduct).then(() => {
        cy.addProduct(productOptions.secondCategory, productOptions.secondProduct).then(() => {
            goToCart();
        });
    });
});

Cypress.Commands.add("placeOrder", (checkoutOptions?, productOptions?: {firstCategory: string, firstProduct: string, secondCategory: string, secondProduct: string}) => {
    if (productOptions) {
        cy.addSpecificProductsToCart(productOptions);
    } else {
        cy.addCypressProductsToCart();
    }
    cy.location("pathname").should("include", "cart");
    cy.completeCheckout(checkoutOptions);
    cy.location("pathname").should("include", "checkout/completed/");
    return cy.get(".order-number").find('strong').invoke("text").then(($el) => {
        var orderNumber = $el.slice(0).replace("Order number: ", "");
        cy.get(".order-completed-continue-button").click({force: true});
        return cy.wrap(orderNumber);
    });
});

// Places an order and returns the order amount
Cypress.Commands.add("createOrderGetAmount", (doNotPayOrder?: boolean) => {
    Cypress.log({
        name: "createOrderGetAmount"
    });
    
    return cy.placeOrder().then((orderNumber: string)=> {
        cy.getToOrders();
        cy.location("pathname").should("include", "/Order/List");
        cy.get("#orders-grid")
            .contains(orderNumber)
            .parent()
            .find("a")
            .contains("View")
            .click({force: true});
        cy.wait(500);
        cy.location("pathname").should("include", `/Order/Edit/${orderNumber.split("-")[0]}`);
        return cy.contains("Order total")
            .parents(".form-group")
            .find('.form-text-row')
            .invoke("text")
            .then(($totalText) => {
                var orderTotal = Math.floor(Number($totalText.slice(0).replace("$", "").replace(",", "")) * 100);
                if (!doNotPayOrder) {
                    cy.get("#markorderaspaid").click({force: true});
                    cy.wait(100);
                    cy.get("#markorderaspaid-action-confirmation-submit-button").click({force: true});
                    cy.wait(500);
                }
                return cy.wrap({orderAmount: orderTotal});
            });
    }); 
});

Cypress.Commands.add("createOrderRetrieveId", (gqlUrl: string, doNotPayOrder?: boolean) => {
    const trueCountQuery = `{
        orders(orderBy: {direction: ASC, field: TIMESTAMP}) {
            totalCount
        }
    }`;
    return cy.postGQL(trueCountQuery, gqlUrl).then((re) => {
        const trueCount = re.body.data.orders.totalCount;
        const orderQuery = `{
            orders(${trueCount >= 25 ? "first: " + (trueCount + 1) + ", ": ""}orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
            }
        }`;
        return cy.postGQL(orderQuery, gqlUrl).then((res) => {
            const orgOrders =  res.body.data.orders.nodes;
            return cy.createOrderGetAmount(doNotPayOrder).then((orderInfo) => {
                const {orderAmount} = orderInfo;
                cy.wait(1000);
                return cy.postGQL(orderQuery, gqlUrl).then((resp) => {
                    const newOrders = resp.body.data.orders.nodes;
                    expect(newOrders.length).to.be.greaterThan(orgOrders.length, "Should be a new order");
                    const relevantOrder = newOrders.filter((order) => {
                        var notPresent = true;
                        for(var i = 0; i < orgOrders.length; i++) {
                            if (orgOrders[i].id === order.id) {
                                notPresent = false;
                                break;
                            }
                        }
                        return notPresent;
                    });
                    const trueId = relevantOrder[0].id;
                    return cy.wrap({orderId: trueId, orderAmount: orderAmount});
                });
            });
        });
    });
});

Cypress.Commands.add("createShippingOrderId", (
    gqlUrl: string, 
    checkoutOptions?,
    productOptions?: {
        firstCategory: string, 
        firstProduct: string,
        secondCategory: string,
        secondProduct: string
    }
) => {
    const today = new Date();
    const todayInput = today.toISOString();
    const query = `{
        orders(startDate: "${todayInput}", orderBy: {direction: ASC, field: TIMESTAMP}) {
            nodes {
                id
            }
        }
    }`;
    return cy.postGQL(query, gqlUrl).then((res) => {
        const orgOrders =  res.body.data.orders.nodes;
        return cy.placeOrder(checkoutOptions, productOptions).then((orderNumber: string) => {
            cy.wait(1000);
            return cy.postGQL(query, gqlUrl).then((resp) => {
                const newOrders = resp.body.data.orders.nodes;
                expect(newOrders.length).to.be.greaterThan(orgOrders.length, "Should be a new order");
                const relevantOrder = newOrders.filter((order) => {
                    var notPresent = true;
                    for(var i = 0; i < orgOrders.length; i++) {
                        if (orgOrders[i].id === order.id) {
                            notPresent = false;
                            break;
                        }
                    }
                    return notPresent;
                });
                const trueId = relevantOrder[0].id;
                return cy.wrap(trueId);
            });
        });
    });
});

Cypress.Commands.add("findCategoryInMenu", (categoryName: string) => {
    Cypress.log({
        name: "findCategoryInMenu",
        message: categoryName,
        consoleProps: () => {
            return {
                "Name of Category": categoryName
            };
        },
    });
    cy.visit("/");
    cy.wait(2000);
    cy.storefrontLogin().then(() => {
        getVisibleMenu().get('li').should('include.text', categoryName);
    });
});

const getTableRows = (tableId: string, filterFunction) => {
    return cy.get(tableId)
        .find("tbody")
        .find("tr")
        .then(($rows) => {
            const targetRows = $rows.filter(filterFunction);
            return targetRows;
        });
};

Cypress.Commands.add("getCountries", () => {
    Cypress.log({
        name: "getCountries"
    });
    const pullFromTable = () => {
        const countryFilter = (index, item) => {
            return item.cells[10].innerHTML.includes("true-icon") && item.cells[8].innerText !== "0";
        };
        return getTableRows("#countries-grid", countryFilter).then((targetRows) => {
            if (targetRows.length > 0) {
                const names = [] as string[];
                const isoCodes = [] as string[];
                targetRows.each((index, el) => {
                    names.push(el.cells[1].innerText);
                    isoCodes.push(el.cells[4].innerText);
                });
                expect(names.length).to.eql(isoCodes.length, "Should be same number of items");
                return cy.wrap({ countries: names, codes: isoCodes });
            }
        });
    };
    const pageThrough = (total: number, names: string[], isoCodes: string[]) => {
        return pullFromTable().then((contents) => {
            const { countries, codes } = contents;
            if (countries && codes) {     
                names = names.concat(countries);
                isoCodes = isoCodes.concat(codes);
            }
            return cy.get(".pagination").find('.active').then(($item) => {
                var currentPage = Number($item[0].innerText);
                if (currentPage < total) {
                    cy.get("#countries-grid_next").find("a").click({ force: true });
                    cy.wait(2000);
                    pageThrough(total, names, isoCodes);
                } else {
                    expect(names.length).to.eql(isoCodes.length, "Should be same number of items");
                    return cy.wrap({ countries: names, codes: isoCodes});
                }
            });
        });
    };
    cy.visit("/", {timeout: 120000});
    cy.wait(2000);
    return cy.storefrontLogin().then(() => {
        // Admin site has undefined Globalize, causes Cypress to autofail tests
        cy.on("uncaught:exception", (err, runnable) => {
            return false;
        });
        cy.visit('/Admin/Country/List');
        return cy.get(".pagination").invoke('children').then(($li) => {
            if ($li.length === 2) {
                // No items in table, nothing to edit
                expect($li.length).to.be.gt(0, "There needs to be items in the table");
            } else if ($li.length === 3) {
                // Table has one page
                return pullFromTable();
            } else if ($li.length > 3) {
                // Table has multiple pages to search.
                return pageThrough(Number($li[$li.length - 2].innerText), [], []);
            }
        });
    });
});

Cypress.Commands.add("getRegions", (countryNames: string[]) => {
    Cypress.log({
        name: "getRegions"
    });
    const runFilter = (name: string) => {
        const filterFn = (index, item) => {
            return item.cells[1].innerText === name;
        };
        return getTableRows("#countries-grid", filterFn).then((targetRows) => {
            if (targetRows.length > 0) {
                return targetRows;
            } else {
                return null;
            }
        });
    };
    const pullFromPage = () => {
        const filterFn = (index, item) => {
            return item.cells[2].innerHTML.includes("true-icon");
        };
        return getTableRows("#states-grid", filterFn).then((targetRows) => {
            if (targetRows.length > 0) {
                const names = [] as string[];
                targetRows.each((index, el) => {
                    names.push(el.cells[0].innerText);
                });
                return cy.wrap(names);
            }
        });
    }
    const pullStates = (totalPages: number, regionNames) => {
        return pullFromPage().then((regions) => {
            if (regions) {
                regionNames = regionNames.concat(regions);
            }
            return cy.get("#states-grid_paginate").find(".pagination").find('.active').then(($item) => {
                var currentPage = Number($item[0].innerText);
                if (currentPage < totalPages) {
                    cy.get("#states-grid_next").find("a").click();
                    cy.wait(2000);
                    pullStates(totalPages, regionNames);
                } else {
                    return cy.wrap(regionNames);
                }
            });
        });
    };
    const findCountry = (total: number, countryIndex: number, regions) => {
        const returnOrRestart = () => {
            if (countryIndex === countryNames.length - 1) {
                return cy.wrap(regions);
            } else {
                const newIndex = countryIndex + 1;
                cy.visit('/Admin/Country/List');
                cy.wait(2000);
                findCountry(total, newIndex, regions);
            }
        };
        return runFilter(countryNames[countryIndex]).then((row) => {
            if (row) {
                // If we encounter the country, we open it and retrieve the regions
                cy.wrap(row).find("td").contains("Edit").click({ force: true });
                cy.wait(1000);
                return cy.get("#states-grid_paginate").find(".pagination").invoke('children').then(($li) => {
                    return pullStates(Number($li[$li.length - 2].innerText), []).then((regionNames) => {
                        regions.push(regionNames);
                        // Call function to either return the collected regions or start looking for the next country
                        returnOrRestart();
                    });
                });
            } else {
                // If country is not on this page, go to the next page and look again
                return cy.get(".pagination").find('.active').then(($item) => {
                    var currentPage = Number($item[0].innerText);
                    if (currentPage < total) {
                        cy.get("#countries-grid_next").find("a").click();
                        cy.wait(2000);
                        findCountry(total, countryIndex, regions);
                    } else {
                        // Call function to either return the collected regions or start looking for the next country
                        returnOrRestart();
                    }
                });
            }
        });
    };
    cy.visit("/");
    cy.wait(2000);
    return cy.storefrontLogin().then(() => {
        // Admin site has undefined Globalize, causes Cypress to autofail tests
        cy.on("uncaught:exception", (err, runnable) => {
            return false;
        });
        cy.visit('/Admin/Country/List');
        return cy.get(".pagination").invoke('children').then(($li) => {
            if ($li.length === 2) {
                // No items in table, nothing to edit
                expect($li.length).to.be.gt(0, "There needs to be items in the table");
            } else {
                return findCountry(Number($li[$li.length - 2].innerText), 0, []);
            }
        });
    });
});

Cypress.Commands.add("getCountriesAndRegions", () => {
    Cypress.log({
        name: "getCountriesAndRegions"
    });
    return cy.getCountries().then((countryContents) => {
        return cy.getRegions(countryContents.countries).then((regionsList) => {
            cy.wrap({countries: countryContents.countries, codes: countryContents.codes, regions: regionsList});
        });
    });
});