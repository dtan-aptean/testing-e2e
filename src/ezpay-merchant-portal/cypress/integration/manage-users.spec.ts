/// <reference types="cypress" />

describe('Merchant portal', function() {
  context('Manage Users', () => {
    beforeEach(() => {
      // navigate to manage users screen
      cy.visit('/');
      cy.get('[data-cy=user-settings]').click();
      cy.get('[data-cy=manage-users]').click();
    });

    it('should pass if manage user screen loads currently', () => {
      cy.get('[data-cy=manage-users-header]').should('be.visible');
      cy.get('[data-cy=refresh]')
        .should('be.visible')
        .and('be.enabled');
      cy.get('[data-cy=add-new-user]')
        .should('be.visible')
        .and('be.enabled');
      cy.get('[data-cy=users-table]').should('be.visible');

      cy.get('[data-cy=users-table]>tbody')
        .find('tr')
        .should('have.length', 1);
    });

    it('should pass if able to add new user', () => {
      cy.get('[data-cy=refresh]').click();
      cy.get('[data-cy=add-new-user]').click();
      cy.get('[data-cy=add-new-user-cancel]')
        .should('be.visible')
        .and('be.enabled');
      cy.get('[data-cy=add-new-user-save]').should('be.disabled');
      cy.get('[data-cy=role-information]').should('be.visible');
      cy.get('[data-cy=add-new-user-save]').should('be.disabled');

      // cancel should close the dialog
      cy.get('[data-cy=add-new-user-cancel]').click();
      cy.get('[data-cy=users-table]').should('be.visible');
      cy.get('[data-cy=add-new-user]').click();

      // validate if first name is mandatory
      cy.getInput('first-name').clear();
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email')
        .type('john.doetesting@aptean.com')
        .should('have.value', 'john.doetesting@aptean.com');
      cy.getSelect('role')
        .select('EDITOR')
        .should('have.value', 'EDITOR');

      // validate if last name is mandatory
      cy.getInput('first-name')
        .type('John')
        .should('have.value', 'John');
      cy.getInput('last-name').clear();
      cy.get('[data-cy=add-new-user-save]').should('be.disabled');

      // validate if email is mandatory
      cy.getInput('last-name')
        .type('Doe')
        .should('have.value', 'Doe');
      cy.getInput('email').clear();
      cy.get('[data-cy=add-new-user-save]').should('be.disabled');

      // save new user
      cy.getInput('email')
        .type('john.doetesting@aptean.com')
        .should('have.value', 'john.doetesting@aptean.com');
      cy.get('[data-cy=add-new-user-save]').should('be.enabled');
      cy.get('[data-cy=add-new-user-save]').click();

      // verify saved user in the table
      cy.get('[data-cy=users-table]').within(() => {
        cy.contains('John');
        cy.contains('Doe');
        cy.contains('john.doetesting@aptean.com');
        cy.contains('Editor');
      });

      // verify number of records in the table
      cy.get('[data-cy=users-table]>tbody')
        .find('tr')
        .should('have.length', 2);
    });

    it('should pass if able to edit an user', () => {
      cy.get('[data-cy=users-table]>tbody>tr')
        .eq(1)
        .within(() => {
          cy.get('[data-cy=edit-row]').click();
        });

      // edit user details
      cy.getInput('first-name')
        .clear()
        .type('John 2')
        .should('have.value', 'John 2');
      cy.getInput('last-name')
        .clear()
        .type('Doe 2')
        .should('have.value', 'Doe 2');
      cy.getSelect('role')
        .select('READER')
        .should('have.value', 'READER');
      cy.get('[data-cy=add-new-user-save]').click();

      // verify edited user details in the table
      cy.get('[data-cy=users-table]').within(() => {
        cy.contains('John 2');
        cy.contains('Doe 2');
        cy.contains('Reader');
      });

      // verify number of records in the table
      cy.get('[data-cy=users-table]>tbody')
        .find('tr')
        .should('have.length', 2);
    });

    it('should pass if able to delete an user', () => {
      cy.get('[data-cy=users-table]>tbody>tr')
        .eq(1)
        .within(() => {
          cy.get('[data-cy=delete-row]').click();
        });

      // cancel should close the dialog
      cy.get('[data-cy=delete-user-dialog-header]').should('be.visible');
      cy.get('[data-cy=delete-user-cancel]').click();
      cy.get('[data-cy=delete-user-dialog-header]').should('not.be.visible');

      // delete user
      cy.get('[data-cy=users-table]>tbody>tr')
        .eq(1)
        .within(() => {
          cy.get('[data-cy=delete-row]').click();
        });
      cy.get('[data-cy=delete-user-delete]').click();

      // verify number of records in the table
      cy.get('[data-cy=users-table]>tbody')
        .find('tr')
        .should('have.length', 1);
    });
  });
});
