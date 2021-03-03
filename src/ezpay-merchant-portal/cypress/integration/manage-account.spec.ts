/// <reference types="cypress" />

describe("Merchant portal", function () {
  const clickAddOrEditAccount = () => {
    cy.get("body").then(($body) => {
      cy.wait(3000);
      if ($body.find("[data-cy=add-account]").length) {
        cy.get("[data-cy=add-account]").click();
        cy.get("[data-cy=add-account]").should("not.exist");
      } else {
        cy.get('[aria-label="edit"]').eq(0).click();
      }
    });
  };

  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  });

  context("Manage Account", () => {
    beforeEach(() => {
      // navigate to manage account screen
      cy.visit("/");
      cy.get("[data-cy=user-settings]").click();
      cy.get("[data-cy=manage-account]").click();
    });

    it("should pass if able to add/edit an account", () => {
      cy.get("[data-cy=payout-settings-section]").should("be.visible");

      // click on add account
      clickAddOrEditAccount();

      cy.getSelect("account-type").should("be.visible");
      cy.getInput("routing-number").should("be.visible");
      cy.getInput("account-number").should("be.visible");
      cy.get("[data-cy=save]").should("be.visible").and("be.disabled");

      // click on cancel navigates back to add account
      cy.get("[data-cy=cancel]").click();
      cy.get("[data-cy=cancel]").should("not.exist");

      // validate if routing number is mandatory
      clickAddOrEditAccount();
      cy.getSelect("account-type").select("Savings");
      cy.getInput("routing-number").clear();
      cy.getInput("account-number").type("12345678");
      cy.get("[data-cy=save]").should("be.visible").and("be.disabled");
      cy.get("[data-cy=cancel]").click();

      // validate if account number is mandatory
      clickAddOrEditAccount();
      cy.getSelect("account-type").select("Savings");
      cy.getInput("routing-number").type("021000021");
      cy.getInput("account-number").clear();
      cy.get("[data-cy=save]").should("be.visible").and("be.disabled");
      cy.get("[data-cy=cancel]").click();

      // save account details
      clickAddOrEditAccount();
      cy.getSelect("account-type").select("Savings");
      cy.getInput("routing-number").type("021000021");
      cy.getInput("account-number").type("12345678");
      cy.get("[data-cy=save]").should("be.visible").and("be.enabled");
      cy.get("[data-cy=save]").click();
    });

    it("should pass if able to change the statement description", () => {
      const random = Cypress._.random(0, 1e10);

      cy.get("[data-cy=business-information-section]").should("be.visible");
      cy.get("[data-cy=edit-statement-description]")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=edit-statement-description]").click();
      cy.getInput("statement-description").should("be.visible");
      cy.get("[data-cy=cancel-statement-description]").click();

      cy.get("[data-cy=edit-statement-description]").click();
      cy.getInput("statement-description").clear();
      cy.get("[data-cy=save-statement-description]").should("be.disabled");
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.getInput("statement-description").type(random);
      cy.get("[data-cy=save-statement-description]").click();

      cy.contains(random);
    });

    it("should pass if able to manage the refund policy", () => {
      // validate edit refund policy
      const random = Cypress._.random(0, 1e10);
      cy.get("[data-cy=business-information-section]").should("be.visible");
      cy.get("[data-cy=edit-refund-policy]")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=edit-refund-policy]").click();
      cy.get("[data-cy=refund-policy]").find("textarea").should("be.visible");
      cy.get("[data-cy=cancel-refund-policy]").click();

      cy.get("[data-cy=edit-refund-policy]").click();
      cy.get("[data-cy=refund-policy]").find("textarea").clear();
      cy.get("[data-cy=save-refund-policy]").click();
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.get("[data-cy=refund-policy]")
        .find("textarea")
        .type(random.toString());
      cy.get("[data-cy=save-refund-policy]").click();

      cy.contains(random);

      // validate view refund policy
      cy.get("[data-cy=business-information-section]").should("be.visible");
      cy.get("[data-cy=view-full-policy]")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=view-full-policy]").click();
      cy.get("[data-cy=refund-policy-dialog]").should("be.visible");
      cy.get("[data-cy=close-refund-policy-dialog]").click();

      cy.get("[data-cy=view-full-policy]").click();
      cy.get("[data-cy=dialog-edit-refund-policy]").click();
      cy.get("[data-cy=refund-policy]").find("textarea").clear();
      cy.get("[data-cy=save-refund-policy]").click();
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.get("[data-cy=refund-policy]")
        .find("textarea")
        .type(random.toString());
      cy.get("[data-cy=save-refund-policy]").click();

      cy.contains(random);
    });

    it("should not be able to edit frequency if frequency is daily, and can edit otherwise", () => {
      //Get the value of frequency
      let frequency = undefined;
      cy.get("[data-cy=frequency-value]").then(($el) => {
        frequency = $el.text();

        if (frequency === "DAILY") {
          cy.get("[data-cy=frequency-edit-button]").should("not.exist");
        } else {
          let newFrequency = undefined;
          cy.get("[data-cy=frequency-edit-button]")
            .as("frequencyButton")
            .should("exist");
          cy.get("@frequencyButton").click();

          if (frequency === "MONTHLY") {
            newFrequency = "WEEKLY";
          } else {
            newFrequency = "MONTHLY";
          }
          cy.get('[type="radio"]').check(newFrequency);

          cy.get("[data-cy=frequency-save-button]").click();
          cy.get("[data-cy=frequency-value]").should(
            "contain.text",
            newFrequency
          );
        }
      });
    });

    it("should pass if able to edit the business url", () => {
      const url = "https://aptean.com/";
      const invalidUrl = "aptean";

      cy.get("[data-cy=business-url-edit")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=business-url-edit]").click();
      cy.getInput("business-url-input").should("be.visible");
      cy.get("[data-cy=business-url-cancel]").click();

      cy.get("[data-cy=business-url-edit]").click();
      cy.getInput("business-url-input").clear();
      cy.get("[data-cy=business-url-save]").should("be.disabled");
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.getInput("business-url-input").type(invalidUrl);
      cy.get("[data-cy=business-url-save]").should("be.disabled");
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.getInput("business-url-input").clear();
      cy.getInput("business-url-input").type(url);
      cy.get("[data-cy=business-url-save]").click();

      cy.contains(url);
    });

    it("should pass if able to edit the support email", () => {
      const email = "email@aptean.com";
      const invalidEmail = "email";

      cy.get("[data-cy=support-email-edit")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=support-email-edit]").click();
      cy.getInput("support-email-input").should("be.visible");
      cy.get("[data-cy=support-email-cancel]").click();

      cy.get("[data-cy=support-email-edit]").click();
      cy.getInput("support-email-input").clear();
      cy.get("[data-cy=support-email-save]").should("be.disabled");
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.getInput("support-email-input").type(invalidEmail);
      cy.get("[data-cy=support-email-save]").should("be.disabled");
      cy.get("[data-cy=error-message]").should("be.visible");

      cy.getInput("support-email-input").clear();
      cy.getInput("support-email-input").type(email);
      cy.get("[data-cy=support-email-save]").click();

      cy.contains(email);
    });
  });
});
