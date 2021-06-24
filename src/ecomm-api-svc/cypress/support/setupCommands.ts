/**
 * Commands to delete all cypress items before a the tests run.
 * These commands will not fail the tests if an item cannot be deleted or a query fails.
 * Designed to avoid failure so that we can be sure the tests run.
 * Since API tests don't rely on existing items, it doesn't matter if the ENV isn't perfectly cleared beforehand
 */

import { codeMessageError } from "./mutationTests";

// Call the mutation to delete an item. Will not fail if the item isn't successfully deleted.
// Will log success or failure and include errors in the log
const performDelete = (deleteName: string, id: string, altUrl?: string) => {
    cy.wait(2000);
    var mutation = `mutation {
        ${deleteName}(input: {id: "${id}"}){
            ${codeMessageError}
        }
    }`;
    cy.postGQL(mutation, altUrl).then((res) => {
        if (res.isOkStatusCode) {
            if (res.body.data) {
                var code = res.body.data[deleteName].code;
                if (code !== "SUCCESS") {
                    code = code + ": " + res.body.data[deleteName].message + ".";
                    if (res.body.errors) {
                        res.body.errors.forEach((err) => {
                            code = code + "\n" + err.message;
                        });
                    }
                }
                Cypress.log({message: code, consoleProps: () => {return {"Status": code}}});
            } else if (res.body.errors) {
                res.body.errors.forEach((err) => {
                    Cypress.log({message: err.message});
                });
            }
        } else {
            Cypress.log({message: "Deletion failed"});
        }
    });
};

// Make sure each item is a Cypress item, and if it is, call command to delete it
const deleteItems = (nodes, deleteName: string, searchBy: string, infoName?: string, altUrl?: string) => {
    nodes.forEach((item) => {
        var id = item.id;
        if (infoName) {
            const nameArray = item[infoName].filter((nameItem) => {
				return nameItem.name.includes(searchBy) && nameItem.languageCode === "Standard";
            });
            if (nameArray.length > 0) {
                performDelete(deleteName, id, altUrl);
            }
        } else if (deleteName === "deletePaymentSettings") {
            var name = item.company.name;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        } else {
            var name = item.name;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        }
    });
};

const getNameField = (infoName?: string): string => {
    var nameField = "name";
    if (infoName) {
        nameField = `${infoName} {
            name
            languageCode
        }`;
    }
    return nameField;
};

// Searches for the cypress items and returns them.
// If the first query indicates there are more items, will query again for all items and return those all
const getNodes = (
    queryName: string, 
    searchBy: string,
    infoName?: string,
    additionalFields?: string,
    altUrl?: string
) => {
    const nameField = queryName === "paymentSettings" ? "" : getNameField(infoName);
    const queryBody = `searchString: "${searchBy}", orderBy: {direction: ASC, field: ${queryName === "paymentSettings" ? "COMPANY_NAME" : "NAME"}}) {
        totalCount
        nodes {
            id
            ${nameField}
            ${additionalFields ? additionalFields : ""}
        }
    }`;
    const query = `{
		${queryName}(${queryBody}
    }`;
    return cy.postNoFail(query, queryName, altUrl).then((res) => {
        if (res) {
            const totalCount = res.body.data[queryName].totalCount;
            if (totalCount > 25) {
                const newQuery = `{
                    ${queryName}(first: ${totalCount}, ${queryBody}
                }`;
                return cy.postNoFail(newQuery, queryName, altUrl).then((resp) => {
                    if (resp) {
                        const nodes = resp.body.data[queryName].nodes;
                        return cy.wrap(nodes);
                    }
                    return false;
                });
            } else if (totalCount > 0) {
                const nodes = res.body.data[queryName].nodes;
                return cy.wrap(nodes);
            } else {
                Cypress.log({message: "No Cypress items found"});
                return false;
            }
        }
        return false;
    });
};

// Command to delete all Cypress items. Will query for cypress items and delete them if found
// Include the searchString to check for Cypress items of a specific name
Cypress.Commands.add("deleteCypressItems", (
    queryName: string, 
    deleteName: string, 
    infoName?: string, 
    searchString?: string,
    altUrl?: string
) => {
    const searchBy = searchString ? searchString : "Cypress";
    var extraField;
    if (queryName === "categories") {
        extraField = `parent {
            id
        }`;
    } else if (queryName === "paymentSettings") {
        extraField = `company {
            name
        }`;
    }
    Cypress.log({name: "deleteCypressItems", message: `Using ${queryName} to search for "${searchBy}"`});
    getNodes(queryName, searchBy, infoName, extraField, altUrl).then((nodes) => {
        if (nodes) {
            // If deleting categories, make sure to delete child categories before parents.
            if (queryName === "categories") {
                const childCats = nodes.filter((node) => {
                    return node.parent !== null;
                });
                if (childCats.length > 0) {
                    deleteItems(childCats, deleteName, searchBy, infoName, altUrl)
                }
                const parentCats = nodes.filter((node) => {
                    return node.parent === null;
                });
                if (parentCats.length > 0) {
                    deleteItems(parentCats, deleteName, searchBy, infoName, altUrl);
                }
            } else if (queryName === "paymentSettings") {
                const cypressPaymentSettings = nodes.filter((node) => {
                    return node.company.name.toLowerCase().includes("cypress");
                });
                if (cypressPaymentSettings.length > 0) {
                    deleteItems(cypressPaymentSettings, deleteName, searchBy, infoName, altUrl);
                } else {
                    Cypress.log({message: "No Cypress items found"});
                }
            } else {
                deleteItems(nodes, deleteName, searchBy, infoName, altUrl);
            }
        }
    });
});

// Posts a query but does not fail if it's not successful, unlike postAndValidate
Cypress.Commands.add("postNoFail", (gqlQuery: string, queryName: string, altUrl?: string) => {
    Cypress.log({
        name: "postNoFail",
        message: queryName,
        consoleProps: () => {
            return {
                "Query name": queryName,
                "Query body": gqlQuery
            };
        },
    });
    return cy.postGQL(gqlQuery, altUrl).then((res) => {
        Cypress.log({name: "postNoFail", message: `Duration: ${res.duration}ms (${res.duration / 1000}s)`});
        if (res.isOkStatusCode) {
            if (!res.body.errors) {
                if (res.body.data) {
                    return res;
                }
            }
        }
        Cypress.log({name: "postNoFail", message: `Querying ${queryName} failed`});
        return false;
    });
});

// Names of the items created by the below function.
export const storefrontCategory = "Digital Cypress Flora";
export const storefrontProductOne = "Digital Saharan Cypress";
export const storefrontProductTwo = "Digital Guadalupe Cypress";

Cypress.Commands.add("openPanel", (panelId: string) => {
    return cy.get(panelId).then(($el) => {
        if ($el.hasClass("collapsed-card")) {
            cy.wrap($el).find(".card-header").find("button").click({force: true});
            cy.wait(500);
        }
    });
});

const enableAdvancedSettings = () => {
    return cy.get("body").then(($el) => {
        if ($el.hasClass("basic-settings-mode")) {
            cy.get("#advanced-settings-mode").click({force: true});
            cy.wait(500);
        }
    });
};

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
                        cy.wrap($row).find("input").check({force: true});              
                    }).then(() => {
                        cy.get("#delete-selected").click({force: true})
                        cy.wait(500);
                        cy.get("#delete-selected-action-confirmation-submit-button").click({force: true});
                        cy.wait(1000);
                        cy.allowLoad();
                        cleanupCatalog(isCategory);
                    });
            }
        });
    };
  
    const searchCatalog = (itemName: string) => {
        if (Cypress.$("#delete-selected-action-confirmation:visible").length > 0) {
            cy.get("#delete-selected-action-confirmation").find(".close").click({ force: true });
            cy.wait(1000);
        }
        const isCategory = itemName === storefrontCategory;
        const inputId = isCategory ? "#SearchCategoryName" : "#SearchProductName";
        const buttonId = isCategory ? "#search-categories" : "#search-products";
        cy.get(inputId).type(itemName, {force: true});
        cy.get(buttonId).click({force: true});
        cy.allowLoad();
        return cleanupCatalog(isCategory);
    };
  
    Cypress.log({displayName: "cleanupProducts", message: "Deleting Cypress products"});
    // Clean up products
    cy.visit("/Admin/Product/List");
    cy.allowLoad();
    searchCatalog(storefrontProductOne).then(() => {
        cy.get("#SearchProductName").clear({force: true});
        searchCatalog(storefrontProductTwo).then(() => {
            Cypress.log({displayName: "cleanupCategories", message: "Deleting Cypress categories"});
            cy.visit("/Admin/Category/List");
            cy.allowLoad();
            searchCatalog(storefrontCategory);
        });
    });
});

Cypress.Commands.add("setupRequiredProducts", () => {
    cy.clearCart();
    // Admin site has undefined Globalize, causes Cypress to autofail tests
    cy.on("uncaught:exception", (err, runnable) => {
        return false;
    });
    cy.get(".administration").click({ force: true });
    cy.wait(1000);
    return cy.cleanupEnvironment().then(() => {      
        cy.visit("/Admin/Category/List");
        cy.wait(1000);
        cy.get("a").contains("Add new").click({force: true});
        cy.wait(5000);
        return enableAdvancedSettings().then(() => {
            cy.wait(2000);
            // Fill in name and description
            return cy.openPanel("#category-info").then(() => {
                cy.get("#Name").type(storefrontCategory, {force: true});
                return cy.openPanel("#category-display").then(() => {
                    if (Cypress.$("#Published").prop("checked") !== true) {
                        cy.get("#Published").check({force: true});
                    }
                    if (Cypress.$("#ShowOnHomepage").prop("checked") !== true) {
                        cy.get("#ShowOnHomepage").check({force: true});
                    }
                    if (Cypress.$("#IncludeInTopMenu").prop("checked") !== true) {
                        cy.get("#IncludeInTopMenu").check({force: true});
                    }
                    cy.get("button[name=save]").click({force: true});
                    cy.wait(5000);
                    cy.location("pathname").should("eql", "/Admin/Category/List");

                    cy.visit("/Admin/Product/List");
                    cy.allowLoad();

                    cy.intercept("/Admin/Product/Create").as("productCreation");
                    const createProduct = (productName: string, price: string) => {
                        cy.get("a").contains("Add new").click({force: true});
                        cy.wait(5000);
                        cy.wait("@productCreation");
                        return cy.location("pathname").should("eql", "/Admin/Product/Create").then(() => {
                            enableAdvancedSettings().then(() => {
                                cy.wait(2000);
                                // Fill in name and description
                                cy.openPanel("#product-info").then(() => {
                                    cy.get("#product-info")
                                        .find("#Name")
                                        .type(productName, {force: true});

                                    // Add category
                                    cy.get("#SelectedCategoryIds").select(storefrontCategory, {force: true});
                                    // Make sure it's published
                                    if (Cypress.$("#Published").prop("checked") !== true) {
                                        cy.get("#Published").check({force: true});
                                    }
                                    // Price
                                    cy.openPanel("#product-price").then(() => {
                                        cy.get("#Price").clear({force: true}).type(price, {force: true});
                                        cy.get("button[name=save]").click({force: true});
                                        cy.wait(5000);
                                        cy.location("pathname").should("eql", "/Admin/Product/List");
                                    });
                                });
                            });
                        });
                    };

                    return createProduct(storefrontProductOne, "500").then(() => {
                        return createProduct(storefrontProductTwo, "700").then(() => {
                            // Extra time to allow the store to process the deletion and recreation
                            return cy.wait(10000);
                        });
                    });
                });
            });
        });
    });
});
