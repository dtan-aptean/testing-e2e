/// <reference types="cypress"/>
// TEST COUNT: 2

import { should } from "chai";

describe("Ecommerce Portal", function () {
  context("AdminPortal", () => {
    before(() => {
      cy.fixture("aptean-pay-plugin").then((data) => {
        this.PaymentFixture = data;
      });
    });

    beforeEach(() => {
      cy.visit("/").fromPublicStore_loginAsUser(
        this.PaymentFixture.users.admin
      );
    });

    afterEach(() => {
      cy.visit("/").fromPublicStore_logout();
    });

    it("Check payment plugin configuration", () => {
      cy.on("uncaught:exception", (err, runnable) => {
        return false;
      });

      cy.visit("/Admin/ApteanPay/Configure");

      cy.get("#PluginVersion").should("be.visible").should("be.disabled");
      cy.get("#AppEnvironment").should("be.visible").should("be.disabled");
      cy.get("#APIEndpoint").should("be.visible").should("be.disabled");
      cy.get("#APIM").should("be.visible").should("be.disabled");
      cy.get("#TenantId").should("be.visible").should("be.disabled");
    });

    // Skip this test;
    // Need to rewrite this test so that it doesn't look for specific order GUID
    it.skip("Search existing order from Quick order search", () => {
      cy.on("uncaught:exception", (err, runnable) => {
        return false;
      });

      cy.visit("/Admin/ApteanPay/QuickOrderSearch");

      cy.get("#orderGuid")
        .should("be.visible")
        .should("be.enabled")
        .type("e86762c6-aa23-4d8f-951c-531686c7cfad")
        .should("have.value", "e86762c6-aa23-4d8f-951c-531686c7cfad");

      cy.get("#go-to-order-by-number")
        .should("be.visible")
        .should("be.enabled")
        .click();

      cy.get(
        ":nth-child(3) > .panel-body > :nth-child(2) > .col-md-9 > .form-text-row"
      ).should("have.text", "e86762c6-aa23-4d8f-951c-531686c7cfad");
    });
  });
});
