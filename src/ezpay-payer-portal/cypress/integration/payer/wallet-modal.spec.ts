/// <reference types="cypress" />

describe("Payer Portal - Wallet Modal", () => {
  //function to select the credit card iframe
  const getIframeBody = () => {
    return cy
      .get("#cc_iframe_iframe")
      .its("0.contentDocument.body")
      .should("not.be.empty")
      .then(cy.wrap);
  };

  //function to add the credit card
  const addCreditCard = (length: number) => {
    //opening the modal
    cy.get("[data-cy=add-credit-card]").click();
    cy.get("[data-cy=payment-method-add]").should("exist").should("be.visible");

    //opening the add address modal

    //In case the default address is selected
    cy.get("[data-cy=payment-method-add]").then(($modal) => {
      if (!$modal.find("[data-cy=add-address]").length) {
        cy.get("[data-cy=address-list-icon]").click();
      }
    });
    cy.get("[data-cy=add-address]").click();
    cy.get("[data-cy=billing-address-modal]").should("be.visible");

    // Entering the address details
    cy.get("[data-cy=holder-name]").type("Test User");
    cy.get("[data-cy=email]").type("testuser@testusers.com");
    cy.get("[data-cy=street-address]").type("4324 somewhere st");
    cy.get("[data-cy=country]").find("select").select("US");
    cy.get("[data-cy=zipcode]").type("30022");
    cy.get("[data-cy=country-code]").type("1");
    cy.get("[data-cy=phone-number]").type("6784324574");
    cy.get("[data-cy=continue-to-payment]")
      .last()
      .should("be.enabled")
      .click({ force: true });

    cy.wait(2000);

    //Entering card details
    getIframeBody().find("#text-input-cc-number").type("4111111111111111");
    getIframeBody().find("#text-input-expiration-month").type("12");
    getIframeBody().find("#text-input-expiration-year").type("30");
    getIframeBody().find("#text-input-cvv-number").type("123");

    cy.get("[data-cy=continue-to-payment]").first().click({ force: true });
    cy.wait(20000);
    cy.get("[data-cy=menu-options]").should("have.length", length + 1);
  };

  before(() => {
    cy.login();
    cy.wait(5000);
  });

  context("Logged in", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
    });

    it("Add payment method modal functionality should work for add credit card option", () => {
      //opening the modal
      cy.get("[data-cy=add-credit-card]").click();
      cy.get("[data-cy=payment-method-add]")
        .should("exist")
        .should("be.visible");

      //opening the add address modal

      //In case the default address is selected
      cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if (!$modal.find("[data-cy=add-address]").length) {
          cy.get("[data-cy=address-list-icon]").click();
        }
      });
      cy.get("[data-cy=add-address]").click();
      cy.get("[data-cy=billing-address-modal]").should("be.visible");

      //returning to credit card details using back button
      cy.get("[data-cy=back]").click();
      cy.get("[data-cy=billing-address-modal]").should("not.be.visible");

      //cancel button should close the modal
      cy.get("[data-cy=cancel").click();
      cy.get("[data-cy=payment-method-add]").should("not.exist");
    });

    it("Add payment method modal functionality should work for add bank account option", () => {
      //opening the modal
      cy.get("[data-cy=add-bank-account]").click();
      cy.get("[data-cy=payment-method-add]")
        .should("exist")
        .should("be.visible");

      //opening the add address modal

      //In case the default address is selected
      cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if (!$modal.find("[data-cy=add-address]").length) {
          cy.get("[data-cy=address-list-icon]").click();
        }
      });
      cy.get("[data-cy=add-address]").click();
      cy.get("[data-cy=billing-address-modal]").should("be.visible");

      //returning to credit card details using back button
      cy.get("[data-cy=back]").click();
      cy.get("[data-cy=billing-address-modal]").should("not.be.visible");

      //cancel button should close the modal
      cy.get("[data-cy=cancel").click();
      cy.get("[data-cy=payment-method-add]").should("not.exist");
    });

    it("Adding address should add the data to address list", () => {
      //opening the modal
      cy.get("[data-cy=add-credit-card]").click();
      cy.get("[data-cy=payment-method-add]")
        .should("exist")
        .should("be.visible");

      //opening the add address modal

      //In case the default address is selected
      cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if (!$modal.find("[data-cy=add-address]").length) {
          cy.get("[data-cy=address-list-icon]").click();
        }
      });
      cy.get("[data-cy=add-address]").click();
      cy.get("[data-cy=billing-address-modal]").should("be.visible");

      //Entering the address details
      cy.get("[data-cy=holder-name]").type("Test User");
      cy.get("[data-cy=email]").type("testuser@testusers.com");
      cy.get("[data-cy=street-address]").type("4324 somewhere st");
      cy.get("[data-cy=country]").find("select").select("US");
      cy.get("[data-cy=zipcode]").type("30022");
      cy.get("[data-cy=country-code]").type("1");
      cy.get("[data-cy=phone-number]").type("6784324574");
      cy.get("[data-cy=continue-to-payment]")
        .last()
        .should("be.enabled")
        .click({ force: true });

      cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if (!$modal.find("[data-cy=add-address]").length) {
          cy.get("[data-cy=address-list-icon]").click();
        }
      });

      cy.get("[data-cy=address-details]")
        .last()
        .should("contain", "4324 somewhere st");
    });

    it("Adding a credit card should add the data to wallet", () => {
      cy.get("body").then(($body) => {
        if ($body.find("[data-cy=menu-options]").length) {
          addCreditCard($body.find("[data-cy=menu-options]").length);
        } else {
          addCreditCard(0);
        }
      });
    });

    it("Make default option should work", () => {
      cy.get("[data-cy=menu-options]").last().click({ force: true });
      cy.get("[data-cy=make-default]").last().click({ force: true });
      cy.wait(5000);
      cy.get("[data-cy=menu-options]").last().click({ force: true });
      cy.get("[data-cy=make-default]").should("not.be.visible");
    });

    it("When a payment method is set to default then add address list should be collapsed", () => {
      //opening the modal
      cy.get("[data-cy=add-credit-card]").click();
      cy.get("[data-cy=payment-method-add]")
        .should("exist")
        .should("be.visible");
      cy.get("[data-cy=add-address]").should("not.be.visible");
    });

    it("Delete option should work", () => {
      cy.get("[data-cy=menu-options")
        .its("length")
        .then((length) => {
          cy.get("[data-cy=menu-options]").last().click({ force: true });
          cy.get("[data-cy=delete-payment-method]")
            .last()
            .click({ force: true });
          cy.get("[data-cy=delete]").click();
          cy.wait(10000);
          cy.get("[data-cy=menu-options]").should("have.length", length - 1);
        });
    });
  });
});
