/// <reference types="cypress" />

describe("Merchant portal", function () {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  });

  context("Manage Users", () => {
    beforeEach(() => {
      // navigate to manage users screen
      cy.visit("/");
      cy.wait(5000);
      cy.waitAfterLogIn(0, 5);
      cy.get("[data-cy=user-settings]").click();
      cy.get("[data-cy=manage-users]").click();
    });

    it("should pass if manage user screen loads currently", () => {
      cy.get("[data-cy=manage-users-header]").should("be.visible");
      cy.get("[data-cy=refresh]").should("be.visible").and("be.enabled");
      cy.get("[data-cy=add-new-user]").should("be.visible").and("be.enabled");
      cy.get("[data-cy=users-table]").should("be.visible");

      cy.get("[data-cy=users-table]>tbody")
        .find("tr")
        .should("have.length.at.least", 1);
    });

    it("should pass if able to add new user", () => {
      cy.get("[data-cy=refresh]").click();
      cy.wait(3000);
      cy.get("[data-cy=add-new-user]").click();
      cy.get("[data-cy=add-new-user-cancel]")
        .should("be.visible")
        .and("be.enabled");
      cy.get("[data-cy=add-new-user-save]").should("be.disabled");
      cy.get("[data-cy=role-information]").should("be.visible");
      cy.get("[data-cy=add-new-user-save]").should("be.disabled");

      // cancel should close the dialog
      cy.get("[data-cy=add-new-user-cancel]").click();
      cy.get("[data-cy=users-table]").should("be.visible");
      cy.get("[data-cy=add-new-user]").click();

      // validate if first name is mandatory
      cy.getInput("first-name").clear();
      cy.getInput("last-name").type("Doe").should("have.value", "Doe");
      cy.getInput("email")
        .type("john.doe@aptean.com")
        .should("have.value", "john.doe@aptean.com");
      cy.getSelect("role").select("EDITOR").should("have.value", "EDITOR");

      // validate if last name is mandatory
      cy.getInput("first-name").type("John").should("have.value", "John");
      cy.getInput("last-name").clear();
      cy.get("[data-cy=add-new-user-save]").should("be.disabled");

      // validate if email is mandatory
      cy.getInput("last-name").type("Doe").should("have.value", "Doe");
      cy.getInput("email").clear();
      cy.get("[data-cy=add-new-user-save]").should("be.disabled");

      // save new user
      cy.getInput("email")
        .type("john.doe@aptean.com")
        .should("have.value", "john.doe@aptean.com");
      cy.get("[data-cy=add-new-user-save]").should("be.enabled");
      cy.get("[data-cy=add-new-user-save]").click();

      // verify saved user in the table
      cy.get("[data-cy=users-table]").within(() => {
        cy.contains("John");
        cy.contains("Doe");
        cy.contains("john.doe@aptean.com");
        cy.contains("Editor");
      });

      // verify added record number in the table
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).should("have.length", 1);
    });

    it("should pass if able to edit an user", () => {
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).within(() => {
        cy.get("[data-cy=edit-row]").click();
      });

      // edit user details
      cy.getInput("first-name")
        .clear()
        .type("John 2")
        .should("have.value", "John 2");
      cy.getInput("last-name")
        .clear()
        .type("Doe 2")
        .should("have.value", "Doe 2");
      cy.getSelect("role").select("READER").should("have.value", "READER");
      cy.get("[data-cy=add-new-user-save]").click();

      // verify edited user details in the table
      cy.get("[data-cy=users-table]").within(() => {
        cy.contains("John 2");
        cy.contains("Doe 2");
        cy.contains("Reader");
      });

      // verify added record number in the table
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).should("have.length", 1);
    });

    it("should pass if able to delete an user", () => {
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).within(() => {
        cy.get("[data-cy=delete-row]").click();
      });

      // cancel should close the dialog
      cy.get("[data-cy=delete-user-dialog-header]").should("be.visible");
      cy.get("[data-cy=delete-user-cancel]").click();
      cy.get("[data-cy=delete-user-dialog-header]").should("not.exist");

      // delete user
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).within(() => {
        cy.get("[data-cy=delete-row]").click();
      });
      cy.get("[data-cy=delete-user-delete]").click();

      // verify record deletion in the table
      cy.get(
        "[data-cy=users-table]>tbody>tr:contains(john.doe@aptean.com)"
      ).should("not.exist");
    });
  });
});
