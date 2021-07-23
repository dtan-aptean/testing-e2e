/// <reference types="cypress" />
// TEST COUNT: 4

import { codeMessageError } from "../../support/apiCommands";

var apiUrl = Cypress.env('apiUrl');
describe("Payment Terms", () => {
  var companyId = '';
  var paymentId = '';
  const hasTerms = false;
  const immediateCapture = false;
  const queryName = "companies";
  const createMutName = "createCompany";
  const deleteMutName = "deleteCompany";
  const itemPath = 'company';
  const loginEmail = "cypress.tester@terms.com";
  const loginPassword = "CypressTerms";
  const companyName = "Cypress Terms Company";
  const companyKey = "cypressterms";
  var companyInformation = {
    id: companyId,
    name: companyName,
    integrationKey: companyKey
  };
  var paymentInformation = {
    id: paymentId,
    hasTerms: hasTerms,
    immediateCapture: immediateCapture
  };

  const storeCompanyDetails = (providedId: string) => {
    companyId = providedId;
    companyInformation.id = companyId;
  };

  const paymentSettingDetails = (providedId: string, hasTerms?: boolean, immediateCapture?: boolean) => {
    paymentId = providedId;
    paymentInformation.id = paymentId;
    hasTerms = hasTerms ? hasTerms : false;
    paymentInformation.hasTerms = hasTerms ? hasTerms : false;
    immediateCapture = immediateCapture ? immediateCapture : false;
    paymentInformation.immediateCapture = immediateCapture ? immediateCapture : false;
  };

  const createB2BCustomer = (companyName, companyKey) => {
    const extraQuery = "customers";
    cy.visit("/");
    return cy.register(loginEmail, loginPassword).then((createdUser) => {
      const { loginEmail, loginPassword } = createdUser;
      cy.log(loginEmail);
      cy.log(loginPassword);
      cy.get(".ico-logout").click({ force: true });
      cy.login();
      cy.visit("/Admin/Customer/List");
      cy.get("#SearchEmail").type(loginEmail);
      cy.get("#search-customers").click({ force: true });
      cy.wait(2000);
      cy.get(".button-column > .btn").click({ force: true });
      cy.get("#SelectedCustomerRoleIds_taglist").click({ force: true });
      cy.get("li").contains("Administrators").click({ force: true });
      cy.get("[name='save']").click();
      cy.get(".alert").should("be.visible");
      cy.get("a").contains("Logout").click({ force: true });
      cy.login(loginEmail, loginPassword);
      cy.visit("/Admin/Company/List");
      cy.get(".alert").should("contain.text", "You do not have permission to perform the selected operation");
      const gqlQuery = `{
                    ${extraQuery} (orderBy: { field: NAME, direction: ASC }
                        searchString: "${loginEmail}"
                    ) {
                        nodes {
                            id
                            email
                        }
                    }
                }`;
      cy.postAndValidate(gqlQuery, extraQuery, apiUrl).then((res) => {
        let dummyCustomerId = res.body.data[extraQuery].nodes;
        const customerIds = dummyCustomerId[0].id;
        const mutation = `mutation {
                        ${createMutName}(input: {
                            name: "${companyName}", integrationKey: "${companyKey}"
                            customerIds: "${customerIds}"
                        }) {
                            ${codeMessageError}
                            ${itemPath} {
                                id
                                name
                                integrationKey
                                customers {
                                    id
                                    email
                                }
                            }
                        }
                    }`;
        return cy.postMutAndValidate(mutation, createMutName, itemPath, apiUrl).then((res) => {
          companyId = res.body.data[createMutName][itemPath].id;
          storeCompanyDetails(res.body.data[createMutName][itemPath].id);
          const propNames = ["name", "integrationKey", "customers"];
          const propValues = [companyName, companyKey, dummyCustomerId];
          cy.confirmMutationSuccess(res, createMutName, itemPath, propNames, propValues).then(() => {
            const query = `{
                            ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                              nodes {
                                id
                                name
                                integrationKey
                                customers {
                                  id
                                  email
                                }
                              }
                            }
                          }`;
            cy.confirmUsingQuery(query, queryName, companyId, propNames, propValues, apiUrl);
          });
        });
      });
    });
  };

  const createPaymentSettings = (idToCreate: string) => {
    const extraCreate = "createPaymentSettings"
    const extraItemPath = "paymentSettings";
    const extraQuery = "paymentSettings";
    const companyDetails = { id: companyInformation.id, name: companyName, integrationKey: companyKey };
    const mutation = `mutation {
      ${extraCreate}(input: {
        companyId: "${idToCreate}"
    }) {
        ${codeMessageError}
        ${extraItemPath} {
          id
          company {
            id
            name
            integrationKey
            }
          }
        }
    }`;
    cy.postMutAndValidate(mutation, extraCreate, extraItemPath, apiUrl).then((res) => {
      paymentId = res.body.data[extraCreate][extraItemPath].id;
      paymentSettingDetails(res.body.data[extraCreate][extraItemPath].id);
      const propNames = ["company"];
      const propValues = [companyDetails];
      cy.confirmMutationSuccess(res, extraCreate, extraItemPath, propNames, propValues).then(() => {
        const query = `{
                        ${extraQuery}(ids: "${paymentId}",
                        orderBy: { direction: ASC, field: COMPANY_NAME }) {
                          nodes {
                            id
                            company {
                              id
                              name
                              integrationKey
                            }
                          }
                        }
                      }`;
        cy.confirmUsingQuery(query, extraQuery, paymentId, propNames, propValues, apiUrl);
      });
    });
  };

  const updatePaymentSettings = (pId: string, cId: string, terms: boolean, iCapture: boolean) => {
    const extraUpdate = "updatePaymentSettings"
    const extraItemPath = "paymentSettings";
    const extraQuery = "paymentSettings";
    const companyDetails = { id: companyInformation.id, name: companyName, integrationKey: companyKey };
    const mutation = `mutation {
      ${extraUpdate}(input: {
        id: "${pId}",
        companyId: "${cId}",
        hasTerms: ${terms},
        immediateCapture: ${iCapture}
    }) {
        ${codeMessageError}
        ${extraItemPath} {
          id
          hasTerms
          immediateCapture
          company {
            id
            name
            integrationKey
            }
          }
        }
    }`;
    cy.postMutAndValidate(mutation, extraUpdate, extraItemPath, apiUrl).then((res) => {
      paymentId = res.body.data[extraUpdate][extraItemPath].id;
      paymentSettingDetails(res.body.data[extraUpdate][extraItemPath].id);
      const propNames = ["hasTerms", "immediateCapture", "company"];
      const propValues = [terms, iCapture, companyDetails];
      cy.confirmMutationSuccess(res, extraUpdate, extraItemPath, propNames, propValues).then(() => {
        const query = `{
                        ${extraQuery}(ids: "${paymentId}",
                        orderBy: { direction: ASC, field: COMPANY_NAME }) {
                          nodes {
                            id
                            hasTerms
                            immediateCapture
                            company {
                              id
                              name
                              integrationKey
                            }
                          }
                        }
                      }`;
        cy.confirmUsingQuery(query, extraQuery, paymentId, propNames, propValues, apiUrl);
      });
    });
  };

  const payByCreditCard = (cardNo, cardMonth, cardYear, cardCVV) => {
    cy.getIframeBody("#credit-card-iframe_iframe")
      .find("#text-input-cc-number")
      .type(cardNo);
    cy.getIframeBody("#credit-card-iframe_iframe")
      .find("#text-input-expiration-month")
      .type(cardMonth)
      .should("have.value", cardMonth);
    cy.getIframeBody("#credit-card-iframe_iframe")
      .find("#text-input-expiration-year")
      .type(cardYear)
      .should("have.value", cardYear);
    cy.getIframeBody("#credit-card-iframe_iframe")
      .find("#text-input-cvv-number")
      .type(cardCVV)
      .should("have.value", cardCVV);
  }

  before(() => {
    cy.deleteCypressItems(queryName, deleteMutName, undefined, "Cypress Terms", apiUrl);
    cy.deleteCypressItems("customers", "deleteCustomer", undefined, "@terms", apiUrl);
    createB2BCustomer(companyName, companyKey).then(() => {
      createPaymentSettings(companyInformation.id);
    });
  });

  beforeEach(() => {
    cy.visit("/");
    cy.setTheme("Uptown");
    cy.get(".header-links").then(($el) => {
      if ($el.find(".ico-logout").length > 0) {
        cy.wrap($el).find(".ico-logout").click({ force: true });
      }
    });
    cy.login(loginEmail, loginPassword);
    cy.clearCart();
  });

  context("Payment Settings = 'true'", () => {
    it("When hasTerms = 'true', immediateCapture = 'false' and payment method = 'paymentTerms' payment info if bypassed", () => {
      updatePaymentSettings(paymentInformation.id, companyInformation.id, true, false);
      cy.clearCache();
      cy.visit("/");
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button")
        .click({ force: true });
      cy.get(".productAddedToCartWindowCheckout")
        .click();
      cy.location("pathname")
        .should("eq", "/en/cart");
      cy.get("#termsofservice")
        .click({ force: true });
      cy.get("#checkout")
        .click({ force: true });
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click();
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("5617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block").find("input[value='Aptean.Payments.ByTerms']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".confirm-order-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".section > .title > strong")
        .should(
          "contain.text",
          "Your order has been successfully processed!"
        );
      cy.get(".details-link > a")
        .should("be.visible")
        .click({ force: true });
      cy.get(".order-number > strong")
        .should("contain.text", "Order #");
    });

    it("When hasTerms = 'true', immediateCapture = 'false' and payment method = 'creditCard' payment info is not bypassed", () => {
      updatePaymentSettings(paymentInformation.id, companyInformation.id, true, false);
      cy.visit("/");
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button")
        .click({ force: true });
      cy.get(".productAddedToCartWindowCheckout")
        .click();
      cy.location("pathname")
        .should("eq", "/en/cart");
      cy.get("#termsofservice")
        .click({ force: true });
      cy.get("#checkout")
        .click({ force: true });
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click();
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("5617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block").find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click();
      cy.wait(10000)
        .get("#payment-success")
        .should(
          "contain.text",
          "Your payment information has been successfully received!"
        );
      cy.get(".payment-info-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".confirm-order-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".section > .title > strong")
        .should(
          "contain.text",
          "Your order has been successfully processed!"
        );
      cy.get(".details-link > a")
        .should("be.visible")
        .click({ force: true });
      cy.get(".order-number > strong")
        .should("contain.text", "Order #");
    });

    it("When hasTerms = 'false', immediateCapture = 'true' then payment method = 'paymentTerms' should not be available", () => {
      updatePaymentSettings(paymentInformation.id, companyInformation.id, false, true);
      cy.clearCache();
      cy.visit("/");
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button")
        .click({ force: true });
      cy.get(".productAddedToCartWindowCheckout")
        .click();
      cy.location("pathname")
        .should("eq", "/en/cart");
      cy.get("#termsofservice")
        .click({ force: true });
      cy.get("#checkout")
        .click({ force: true });
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click();
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("5617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input")
        .should("not.have.value", "Aptean.Payments.ByTerms");
      cy.get("#payment-method-block").find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click();
      cy.wait(10000)
        .get("#payment-success")
        .should(
          "contain.text",
          "Your payment information has been successfully received!"
        );
      cy.get(".payment-info-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".confirm-order-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".section > .title > strong")
        .should(
          "contain.text",
          "Your order has been successfully processed!"
        );
      cy.get(".details-link > a")
        .should("be.visible")
        .click({ force: true });
      cy.get(".order-number > strong")
        .should("contain.text", "Order #");
    });
  });

  context("Payment Terms = 'false'", () => {
    it("When Payment Setting is deleted payment method = 'paymentTerms' should not be available", () => {
      const extraDelete = "deletePaymentSettings"
      const mutation = `mutation {
        ${extraDelete}(input: {
          id: "${paymentInformation.id}"
      }) {
          ${codeMessageError}
          }
      }`;
      cy.postMutAndValidate(mutation, extraDelete, 'deleteMutation', apiUrl);
      cy.visit("/");
      cy.goToProduct("Bald Cypress");
      cy.get(".add-to-cart-button")
        .click({ force: true });
      cy.get(".productAddedToCartWindowCheckout")
        .click();
      cy.location("pathname")
        .should("eq", "/en/cart");
      cy.get("#termsofservice")
        .click({ force: true });
      cy.get("#checkout")
        .click({ force: true });
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click();
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("5617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input")
        .should("not.have.value", "Aptean.Payments.ByTerms");
      cy.get("#payment-method-block").find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click();
      cy.wait(10000)
        .get("#payment-success")
        .should(
          "contain.text",
          "Your payment information has been successfully received!"
        );
      cy.get(".payment-info-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".confirm-order-next-step-button")
        .should("be.visible")
        .click({ force: true });
      cy.get(".section > .title > strong")
        .should(
          "contain.text",
          "Your order has been successfully processed!"
        );
      cy.get(".details-link > a")
        .should("be.visible")
        .click({ force: true });
      cy.get(".order-number > strong")
        .should("contain.text", "Order #");
    });
  });
});