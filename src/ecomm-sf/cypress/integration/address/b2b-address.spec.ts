/// <reference types="cypress" />
// TEST COUNT: 10

import { toFormattedString } from "../../support/apiCommands";
import { codeMessageError } from "../../support/apiCommands";

var apiUrl = Cypress.env('apiUrl');
describe("Billing/Shipping Address", () => {
  var companyId = '';
  var addressId = '';
  var type = '';
  const queryName = "companies";
  const createMutName = "createCompany";
  const deleteMutName = "deleteCompany";
  const itemPath = 'company';
  const loginEmail = "cypress.tester@address.com";
  const loginPassword = "CypressAddress";
  const companyName = "Cypress Address Company";
  const companyKey = "cypressaddress";
  const companyInformation = {
    id: companyId,
    name: companyName,
    integrationKey: companyKey
  };
  const addressInformation = {
    id: addressId,
    type: type
  };

  const storeCompanyDetails = (providedId: string) => {
    companyId = providedId;
    companyInformation.id = companyId;
  };

  const storeAddressId = (providedId: string, addressType: string) => {
    addressId = providedId;
    type = addressType;
    addressInformation.id = addressId;
    addressInformation.type = type;
  };

  const createB2BCustomer = (companyName, companyKey) => {
    const extraQuery = "customers";
    cy.visit("/");
    cy.register(loginEmail, loginPassword).then((createdUser) => {
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
            cy.confirmUsingQuery(query, queryName, companyInformation.id, propNames, propValues, apiUrl);
          });
        });
      });
    });
  };

  const firstName = "Cypress", lastName = "Tester", email = "cypress.tester" + Cypress._.random(0, 1000000) + "@email.com";
  const line1 = "130", line2 = "6th street", city = "Steamboat Springs", region = "Colorado", postalCode = "80487", country = "US";
  const addressDetails = { line1: `${line1}`, line2: `${line2}`, city: `${city}`, region: `${region}`, postalCode: `${postalCode}`, country: `${country}` };
  const contactDetails = { firstName: `${firstName}`, lastName: `${lastName}`, email: `${email}`, address: addressDetails };
  const addressPath = `
      line1: "${line1}"
      line2: "${line2}"
      city: "${city}"
      region: "${region}"
      postalCode: "${postalCode}"
      country: "${country}"
  `;
  const contactPath = `
      firstName
      lastName
      email
      address {
          line1
          line2
          city
          region
          country
          postalCode
      }`;

  const createAddress = (
    addressType: string,
    addressDescription: string,
    companyId: string,
    companyInformation: {
      id: string,
      name: string,
      integrationKey: string
    },
  ) => {
    const mutation = `mutation {
        createAddress (input: { companyId: "${companyInformation.id}", addressType: ${addressType}
            description: "${addressDescription}"
            contactDetails: {
                firstName: "${firstName}", lastName: "${lastName}", email: "${email}"
                address: { ${addressPath} }
            }
        }) {
            ${codeMessageError}
            addressInfo {
                id
                addressType
                description
                contactDetails {
                    ${contactPath}
                }
                ${itemPath} {
                  id
                  name
                  integrationKey
                }
            }
        }
    }`;
    cy.postMutAndValidate(mutation, "createAddress", "addressInfo", apiUrl).then((res) => {
      addressId = res.body.data["createAddress"]["addressInfo"].id;
      storeAddressId(addressId, addressType);
      const propNames = ["company", "addressType", "description", "contactDetails"];
      const propValues = [companyInformation, addressType, addressDescription, contactDetails];
      cy.confirmMutationSuccess(res, "createAddress", "addressInfo", propNames, propValues).then(() => {
        const query = `{
                addresses(companyId: "${companyInformation.id}", ids: "${addressId}", orderBy: {direction: ASC, field: NAME}) {
                    nodes {
                        id
                        addressType
                        description
                        contactDetails {
                            ${contactPath}
                        }
                        ${itemPath} {
                          id
                          name
                          integrationKey
                        }
                    }
                }
            }`;
        cy.confirmUsingQuery(query, "addresses", addressId, propNames, propValues, apiUrl);
      });
    });
  };

  const fetchCustomerDetails = () => {
    cy.visit("/");
    return cy.wait(2000).then(() => {
      if (Cypress.$("#account-links").length > 0) {
        cy.get("#account-links").click({ force: true });
        cy.wait(1000);
        cy.get(".my-account-link").click({ force: true });
      } else if (Cypress.$("#header-links-opener").length > 0) {
        cy.get("#header-links-opener").click({ force: true });
        cy.wait(1000);
        cy.get(".header-links").find(".ico-account").click({ force: true });
      } else {
        cy.get(".ico-account").click({ force: true });
      }
    }).then(() => {
      return cy.get("#FirstName").invoke("val").then((userFirstName) => {
        return cy.get("#LastName").invoke("val").then((userLastName) => {
          return cy.get("#Company").invoke("val").then((userCompany) => {
            return cy.get("#StreetAddress").invoke("val").then((userAddress) => {
              return cy.get("#ZipPostalCode").invoke("val").then((userZipCode) => {
                return cy.get("#City").invoke("val").then((userCity) => {
                  return cy.wrap({
                    first: userFirstName,
                    last: userLastName,
                    company: userCompany,
                    address: userAddress,
                    zipCode: userZipCode,
                    city: userCity
                  });
                });
              });
            });
          });
        });
      });
    });
  }

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
    cy.deleteCypressItems(queryName, deleteMutName, undefined, "Cypress Address", apiUrl);
    cy.deleteCypressItems("customers", "deleteCustomer", undefined, "@address", apiUrl);
    createB2BCustomer(companyName, companyKey);
  });

  context("Billing address tests", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.get(".header-links").then(($el) => {
        if ($el.find(".ico-logout").length > 0) {
          cy.wrap($el).find(".ico-logout").click({ force: true });
        }
      });
      cy.login(loginEmail, loginPassword);
      cy.clearCart();
    });

    it("Billing address should be partially filled when there is no billing address for the company", () => {
      cy.clearCache();
      fetchCustomerDetails().then((customerDetails) => {
        const { first, last, city, address, zipCode } = customerDetails;
        cy.addToCartAndCheckout();
        cy.get(".checkout-data")
          .should("not.have.id", "#billing-address-select");
        cy.get("#BillingNewAddress_FirstName")
          .should("have.value", first);
        cy.get("#BillingNewAddress_LastName")
          .should("have.value", last);
        cy.get("#BillingNewAddress_Email")
          .should("have.value", loginEmail);
        cy.get("#BillingNewAddress_City")
          .should("have.value", city);
        cy.get("#BillingNewAddress_Address1")
          .should("have.value", address);
        cy.get("#BillingNewAddress_ZipPostalCode")
          .should("have.value", zipCode);
      });
    });

    it("New billing address entered during checkout should not be available in company address", () => {
      cy.addToCartAndCheckout();
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click({ force: true });
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("+15618448448", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.wait(5000);
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click({ force: true });
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
      cy.get(".details-link > a").should("be.visible").click({ force: true });
      cy.get(".order-number > strong").should("contain.text", "Order #");
      cy.visit("/en/customer/addresses");
      cy.get("h1").
        should("have.text", "My account - Companies");
      cy.get(".no-data")
        .should("be.visible");
      cy.visit("/Admin/Company/List");
      cy.get("#SearchCompanyName")
        .type(companyName);
      cy.get("#SearchIntegrationKey")
        .type(companyKey);
      cy.get("#search-companies")
        .click();
      cy.wait(5000);
      cy.get(".button-column > .btn")
        .click();
      cy.get("#Name")
        .should(
          "have.value", companyName
        );
      cy.get("#IntegrationKey")
        .should(
          "have.value", companyKey
        );
      cy.openPanel("#company-address").then(() => {
        cy.get("#company-addresses-grid")
          .find("tbody")
          .should("have.text", "No data available in table");
      });
    });

    it("Newly added billing address should not be present during next checkout", () => {
      cy.addToCartAndCheckout();
      cy.get("#ShipToSameAddress").then(($el) => {
        if (!($el.attr("checked"))) {
          cy.get("#ShipToSameAddress")
            .click({ force: true });
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("+15617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.wait(5000);
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click({ force: true });
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
      cy.get(".details-link > a").should("be.visible").click({ force: true });
      cy.get(".order-number > strong").should("contain.text", "Order #");
      fetchCustomerDetails().then((customerDetails) => {
        cy.goToProduct("Montezuma Cypress");
        cy.get(".add-to-cart-button")
          .click({ force: true });
        cy.get(".productAddedToCartWindowCheckout")
          .click();
        cy.location("pathname")
          .should("eq", "/en/cart");
        cy.get("#termsofservice")
          .click({ force: true });
        cy.get(".checkout-button")
          .click({ force: true });
        cy.wait(500);
        const { first, last, city, address, zipCode } = customerDetails;
        cy.get(".checkout-data")
          .should("not.have.id", "#billing-address-select");
        cy.get("#BillingNewAddress_FirstName")
          .should("have.value", first);
        cy.get("#BillingNewAddress_LastName")
          .should("have.value", last);
        cy.get("#BillingNewAddress_Email")
          .should("have.value", loginEmail);
        cy.get("#BillingNewAddress_City")
          .should("have.value", city);
        cy.get("#BillingNewAddress_Address1")
          .should("have.value", address);
        cy.get("#BillingNewAddress_ZipPostalCode")
          .should("have.value", zipCode);
      });
    });

    it("Newly added billing address from API should be populated in MyAccount Address section", () => {
      const cityStateZip = city + ", " + region + ", " + postalCode;
      const addressTypeBilling = `BILLING`;
      let addressDescription: (string) = "Billing address";
      cy.log(toFormattedString(companyInformation));
      createAddress(addressTypeBilling, addressDescription, companyInformation.id, companyInformation);
      cy.clearCache();
      cy.visit("/en/customer/addresses");
      cy.get("h1")
        .should("have.text", "My account - Companies");
      cy.get("#billingAddresses > .address-item > .title")
        .should("contain.text", "Billing Addresses");
      cy.get("#billingAddresses > .address-item > .info > .name")
        .should("contain.text", addressDescription)
      cy.get("#billingAddresses > .address-item > .info > .email")
        .should("contain.text", email);
      cy.get("#billingAddresses > .address-item > .info > .integration-key")
        .should("contain.text", companyKey);
      cy.get("#billingAddresses > .address-item > .info > .address1")
        .should("contain.text", line1);
      cy.get("#billingAddresses > .address-item > .info > .address2")
        .should("contain.text", line2);
      cy.get("#billingAddresses > .address-item > .info > .city-state-zip")
        .should("contain.text", cityStateZip);
      cy.get("#billingAddresses > .address-item > .info > .country")
        .should("contain.text", "United States");
      cy.addToCartAndCheckout();
      var billingaddress = firstName + " " + lastName + ", " + line1 + ", " + city + ", " + region + " " + postalCode + ", " + "United States";
      cy.get("#billing-address-select")
        .contains(billingaddress)
        .should("be.visible");
    });

    it("Delete a billing address from API and verify if it's not present under checkout billing address", () => {
      const mutationName = "deleteAddress";
      const mutation =
        `mutation {
              ${mutationName}(input: { id: "${addressInformation.id}" }) {
                  ${codeMessageError}
              }
          }`;
      cy.postMutAndValidate(mutation, mutationName, 'deleteMutation', apiUrl).then((res) => {
        //Create a shipping address to verify the billing address column is empty
        const addressTypeBilling = `SHIPPING`;
        let addressDescription: (string) = "Billing support address";
        cy.log(toFormattedString(companyInformation));
        createAddress(addressTypeBilling, addressDescription, companyInformation.id, companyInformation);
        cy.clearCache();
        cy.visit("/en/customer/addresses");
        cy.get("h1")
          .should("have.text", "My account - Companies");
        cy.get("#billingAddresses > .address-item > .title")
          .should("contain.text", "Billing Addresses");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .name");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .email");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .integration-key");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .address1");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .address2");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .city-state-zip");
        cy.get("#billingAddresses > .address-item")
          .should("not.have.class", ".info > .country");
        cy.deleteSpecialCypressItems("addresses", mutationName, companyInformation.id, "companyId", undefined, apiUrl);
      });
    });
  });

  context("Shipping address tests", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.get(".header-links").then(($el) => {
        if ($el.find(".ico-logout").length > 0) {
          cy.wrap($el).find(".ico-logout").click({ force: true });
        }
      });
      cy.login(loginEmail, loginPassword);
      cy.clearCart();
    });

    it("Shipping address should be partially filled when there is no shipping address for the company", () => {
      fetchCustomerDetails().then((customerDetails) => {
        const { first, last, city, address, zipCode } = customerDetails;
        cy.addToCartAndCheckout();
        cy.get("#ShipToSameAddress").then(($el) => {
          if ($el.attr("checked")) {
            cy.get("#ShipToSameAddress")
              .click({ force: true });
          };
        });
        cy.get("#BillingNewAddress_CountryId")
          .select("United States", { force: true });
        cy.get("#BillingNewAddress_StateProvinceId")
          .select("Florida", { force: true });
        cy.get("#BillingNewAddress_PhoneNumber")
          .type("+15618448448", { force: true });
        cy.get(".new-address-next-step-button")
          .eq(0).click({ force: true });
        cy.wait(5000);
        cy.get("#ShippingNewAddress_FirstName")
          .should("have.value", first);
        cy.get("#ShippingNewAddress_LastName")
          .should("have.value", last);
        cy.get("#ShippingNewAddress_Email")
          .should("have.value", loginEmail);
        cy.get("#ShippingNewAddress_City")
          .should("have.value", city);
        cy.get("#ShippingNewAddress_Address1")
          .should("have.value", address);
        cy.get("#ShippingNewAddress_ZipPostalCode")
          .should("have.value", zipCode);
      });
    });

    it("New shipping address entered during checkout should not be available in company address", () => {
      cy.addToCartAndCheckout();
      cy.get("#ShipToSameAddress").then(($el) => {
        if ($el.attr("checked")) {
          cy.get("#ShipToSameAddress")
            .click({ force: true });
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("+15618448448", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.wait(5000);
      cy.get("#ShippingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#ShippingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#ShippingNewAddress_PhoneNumber")
        .type("+15618448448", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(1).click({ force: true });
      cy.wait(5000);
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click({ force: true });
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
      cy.get(".details-link > a").should("be.visible").click({ force: true });
      cy.get(".order-number > strong").should("contain.text", "Order #");
      cy.visit("/en/customer/addresses");
      cy.get("h1").
        should("have.text", "My account - Companies");
      cy.get(".no-data")
        .should("be.visible");
      cy.visit("/Admin/Company/List");
      cy.get("#SearchCompanyName")
        .type(companyName);
      cy.get("#SearchIntegrationKey")
        .type(companyKey);
      cy.get("#search-companies")
        .click();
      cy.wait(5000);
      cy.get(".button-column > .btn")
        .click();
      cy.get("#Name")
        .should(
          "have.value", companyName
        );
      cy.get("#IntegrationKey")
        .should(
          "have.value", companyKey
        );
      cy.openPanel("#company-address").then(() => {
        cy.get("#company-addresses-grid")
          .find("tbody")
          .should("have.text", "No data available in table");
      });
    });

    it("Newly added shipping address should not be present during next checkout", () => {
      cy.addToCartAndCheckout();
      cy.get("#ShipToSameAddress").then(($el) => {
        if ($el.attr("checked")) {
          cy.get("#ShipToSameAddress")
            .click({ force: true });
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("+15618448448", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.wait(5000);
      cy.get("#ShippingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#ShippingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#ShippingNewAddress_PhoneNumber")
        .type("+15617997600", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(1).click({ force: true });
      cy.wait(5000);
      cy.get("#shippingoption_0")
        .click({ force: true });
      cy.get(".shipping-method-next-step-button")
        .click({ force: true });
      cy.get("#payment-method-block")
        .find("input[value='Aptean.Payments.BySavedSettings']")
        .should("be.visible")
        .click({ force: true });
      cy.get(".payment-method-next-step-button")
        .click({ force: true });
      payByCreditCard("6011111111111117", "07", "23", "123");
      cy.get("#submit-credit-card-button")
        .should("be.visible")
        .click({ force: true });
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
      cy.get(".details-link > a").should("be.visible").click({ force: true });
      cy.get(".order-number > strong").should("contain.text", "Order #");
      fetchCustomerDetails().then((customerDetails) => {
        cy.goToProduct("Montezuma Cypress");
        cy.get(".add-to-cart-button")
          .click({ force: true });
        cy.get(".productAddedToCartWindowCheckout")
          .click();
        cy.location("pathname")
          .should("eq", "/en/cart");
        cy.get("#termsofservice")
          .click({ force: true });
        cy.get(".checkout-button")
          .click({ force: true });
        cy.wait(500);
        const { first, last, city, address, zipCode } = customerDetails;
        cy.get("#ShipToSameAddress").then(($el) => {
          if ($el.attr("checked")) {
            cy.get("#ShipToSameAddress")
              .click({ force: true });
          };
        });
        cy.get("#BillingNewAddress_CountryId")
          .select("United States", { force: true });
        cy.get("#BillingNewAddress_StateProvinceId")
          .select("Florida", { force: true });
        cy.get("#BillingNewAddress_PhoneNumber")
          .type("+15618448448", { force: true });
        cy.get(".new-address-next-step-button")
          .eq(0).click({ force: true });
        cy.get("#ShippingNewAddress_FirstName")
          .should("have.value", first);
        cy.get("#ShippingNewAddress_LastName")
          .should("have.value", last);
        cy.get("#ShippingNewAddress_Email")
          .should("have.value", loginEmail);
        cy.get("#ShippingNewAddress_City")
          .should("have.value", city);
        cy.get("#ShippingNewAddress_Address1")
          .should("have.value", address);
        cy.get("#ShippingNewAddress_ZipPostalCode")
          .should("have.value", zipCode);
      });
    });

    it("Newly added shipping address from API should be populated in MyAccount Address section", () => {
      const cityStateZip = city + ", " + region + ", " + postalCode;
      const addressTypeBilling = `SHIPPING`;
      let addressDescription: (string) = "Shipping address";
      cy.log(toFormattedString(companyInformation));
      createAddress(addressTypeBilling, addressDescription, companyInformation.id, companyInformation);
      cy.clearCache();
      cy.visit("/en/customer/addresses");
      cy.get("h1")
        .should("have.text", "My account - Companies");
      cy.get("#shippingAddresses > .address-item > .title")
        .should("contain.text", "Shipping Addresses");
      cy.get("#shippingAddresses > .address-item > .info > .name")
        .should("contain.text", addressDescription)
      cy.get("#shippingAddresses > .address-item > .info > .email")
        .should("contain.text", email);
      cy.get("#shippingAddresses > .address-item > .info > .integration-key")
        .should("contain.text", companyKey);
      cy.get("#shippingAddresses > .address-item > .info > .address1")
        .should("contain.text", line1);
      cy.get("#shippingAddresses > .address-item > .info > .address2")
        .should("contain.text", line2);
      cy.get("#shippingAddresses > .address-item > .info > .city-state-zip")
        .should("contain.text", cityStateZip);
      cy.get("#shippingAddresses > .address-item > .info > .country")
        .should("contain.text", "United States");
      cy.addToCartAndCheckout();
      cy.get("#ShipToSameAddress").then(($el) => {
        if ($el.attr("checked")) {
          cy.get("#ShipToSameAddress")
            .click({ force: true });
        };
      });
      cy.get("#BillingNewAddress_CountryId")
        .select("United States", { force: true });
      cy.get("#BillingNewAddress_StateProvinceId")
        .select("Florida", { force: true });
      cy.get("#BillingNewAddress_PhoneNumber")
        .type("+15618448448", { force: true });
      cy.get(".new-address-next-step-button")
        .eq(0).click({ force: true });
      cy.wait(5000);
      var shippingAddress = firstName + " " + lastName + ", " + line1 + ", " + city + ", " + region + " " + postalCode + ", " + "United States";
      cy.get("#shipping-address-select")
        .contains(shippingAddress)
        .should("be.visible");
    });

    it("Delete a shipping address from API and verify if it's not present under checkout shipping address", () => {
      const mutationName = "deleteAddress";
      const mutation =
        `mutation {
              ${mutationName}(input: { id: "${addressInformation.id}" }) {
                  ${codeMessageError}
              }
          }`;
      cy.postMutAndValidate(mutation, mutationName, 'deleteMutation', apiUrl).then((res) => {
        //Create a shipping address to verify the billing address column is empty
        const addressTypeBilling = `BILLING`;
        let addressDescription: (string) = "Shipping support address";
        cy.log(toFormattedString(companyInformation));
        createAddress(addressTypeBilling, addressDescription, companyInformation.id, companyInformation);
        cy.clearCache();
        cy.visit("/en/customer/addresses");
        cy.visit("/en/customer/addresses");
        cy.get("h1")
          .should("have.text", "My account - Companies");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .name");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .email");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .integration-key");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .address1");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .address2");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .city-state-zip");
        cy.get("#shippingAddresses > .address-item")
          .should("not.have.class", ".info > .country");
        cy.deleteSpecialCypressItems("addresses", mutationName, companyInformation.id, "companyId", undefined, apiUrl);
      });
    });
  });
});