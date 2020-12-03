/// <reference types="cypress" />
// TEST COUNT: 5

describe("Ecommerce", function () {
  context("Campaigns", () => {
    const roles = [] as string[];
    // Roles currently in use
    // "cypress.ad@testenvironment.com", "cypress.reg@testenvironment.com", "cypress.gu@testenvironment.com"
    const createdCampaigns = [] as string[];
    // We need certain roles to exist for testing
    // Look for these roles, create them if the don't already exist, or edit them if there's something wrong with them
    before(() => {
      const names = [
        {
          first: "Cypress",
          last: "Admin"
        }, {
          first: "Cypress",
          last: "User"
        }, {
          first: "Cypress",
          last: "Guest"
        }
      ];
      const rolesToMake = [
        {
          email: `cypress.admin${Cypress._.random(0, 1e9)}@testenvironment.com`, 
          password: "CypressAdmin",
          first: "Cypress",
          last: "Admin",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "08/10/1990",
          role: "Administrators"
        },
        {
          email: `cypress.registered${Cypress._.random(0, 1e9)}@testenvironment.com`, 
          password: "CypressUser",
          first: "Cypress",
          last: "User",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "04/20/1990",
          role: "Registered"
        },
        {
          email: `cypress.guest${Cypress._.random(0, 1e9)}@testenvironment.com`, 
          password: "CypressGuest",
          first: "Cypress",
          last: "Guest",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "01/30/1990",
          role: "Guests"
        },
      ];
      cy.visit("/");
      cy.login();
      cy.goToCustomers();
      names.forEach((name, index) => {
        cy.searchForCustomer(name.first, name.last).then((customerRow) => {
          if (customerRow === null) {
            cy.addNewCustomer(rolesToMake[index]);
          } else {
            var valid = false;
            var neededRoles = [] as string[];
            var email = "";
            switch (index) {
              case 0:
                if (customerRow[0].cells[3].innerText === 'Administrators, Registered') {
                  valid = true;
                  email = customerRow[0].cells[1].innerText;
                } else {
                  neededRoles.push('Administrators');
                  neededRoles.push('Registered');
                }
                break;
              case 1:
                if (customerRow[0].cells[3].innerText === 'Registered') {
                  valid = true;
                  email = customerRow[0].cells[1].innerText;
                } else {
                  neededRoles.push('Registered');
                }
                break;
              case 2:
                if (customerRow[0].cells[3].innerText === 'Guests') {
                  valid = true;
                  cy.wrap(customerRow).find("td").contains("Edit").click();
                  cy.get('#Email').invoke('val').then((val) => {
                    email = val;
                    cy.get(".content-header").contains("back to customer list").click();
                  });
                } else {
                  neededRoles.push('Guests');
                  neededRoles.push('Registered');
                }
                break;
            }
            if (!valid) {
              cy.wrap(customerRow).find("td").contains("Edit").click();
              cy.get('#Email').invoke('val').then((val) => {
                email = val;
                cy.get('#SelectedCustomerRoleIds_taglist')
                  .find('.k-select')
                  .then(($els) => {
                    for(var i = 0; i < $els.length; i++) {
                      cy.wait(200);
                      cy.wrap($els[i]).click();
                    }
                    cy.get('#SelectedCustomerRoleIds').select(neededRoles, {force: true});
                    cy.get("button[name=save]").click();
                    cy.wait(500);
                    cy.get(".alert").should(
                      "contain.text",
                      "The customer has been updated successfully."
                    );
                  });
              });
            }
            if (email !== "") {
              roles.push(email);
            }
          }
        });
      });
    });
    
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    // Delete the campaigns we created
    afterEach(() => {
      if (createdCampaigns.length > 0) {
        cy.goToCampaigns();
        const removedCampaigns = [] as string[];
        for(var i = 0; i < createdCampaigns.length; i++) {
          cy.wait(1000);
          cy.deleteCampaign(createdCampaigns[i]).then(() => {
            removedCampaigns.push(createdCampaigns[i]);
          });
        }
        for (var f = 0; f < removedCampaigns.length; f++) {
          createdCampaigns.splice(createdCampaigns.indexOf(removedCampaigns[i]), 1);
        }
      }
    });

    it("Creating and deleting a campaign updates the table", () => {
      const campaignName = "Cypress Test Campaign";
      const today = new Date();
      const twoDaysAhead = new Date(today.valueOf() + 172800000);
      cy.goToCampaigns();
      cy.addNewCampaign(
        campaignName,
        "Cypress' test campaign",
        "A test campaign created by cypress",
        `${twoDaysAhead.toLocaleDateString()} 12:00 AM`,
        "All"
      );
      createdCampaigns.push(campaignName);
      cy.get("#campaigns-grid").should("contain.text", campaignName);
      cy.deleteCampaign(campaignName);
      cy.get("#campaigns-grid").should("not.contain.text", campaignName);
    });

    it.skip("Test emails can be sent out for campaigns", () => {
      const campaignName = "Cypress Test Campaign";
      const today = new Date();
      const twoDaysAhead = new Date(today.valueOf() + 172800000);
      cy.goToCampaigns();
      cy.addNewCampaign(
        campaignName,
        "Cypress' test campaign",
        "A test campaign created by cypress",
        `${twoDaysAhead.toLocaleDateString()} 12:00 AM`,
        "All"
      );
      cy.sendCampaignTest(campaignName);
      cy.wait(500);
      cy.get(".alert").should(
        "contain.text",
        "Email has been successfully sent"
      );
      cy.get(".content-header").contains("back to campaign list").click();
      cy.deleteCampaign(campaignName);
      // TODO: Reach out to endpoint and check that email is queued/sent
    });

    it("Campaigns for Admin users will only be sent to admins", () => {
      const campaignName = "Cypress Admin Campaign";
      const campaignSubject = "Cypress' Admin campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      cy.addNewCampaign(
        campaignName,
        campaignSubject,
        "A test campaign created by cypress for Admins",
        `${twoMinAhead.toLocaleDateString()} ${twoMinAhead.getUTCHours() > 12 ? twoMinAhead.getUTCHours() - 12: twoMinAhead.getUTCHours()}:${twoMinAhead.getUTCMinutes()} ${twoMinAhead.getUTCHours() > 12 ? "PM": "AM"}`,
        "Administrators"
      );
      createdCampaigns.push(campaignName);
      cy.sendMassCampaign(campaignName);
      cy.wait(500);
      cy.goToMessageQueue();
      cy.searchMessageQueue(campaignSubject).then((rows) => {
        cy.wrap(rows).should('not.contain.text', roles[1]).and('not.contain.text', roles[2]).and('contain.text', roles[0])
      });
    });

    it("Campaigns for registered users will only be sent to registered users", () => {
      const campaignName = "Cypress Registered Users Campaign";
      const campaignSubject = "Cypress' Reg User campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      cy.addNewCampaign(
        campaignName,
        campaignSubject,
        "A test campaign created by cypress for registered users",
        `${twoMinAhead.toLocaleDateString()} ${twoMinAhead.getUTCHours() > 12 ? twoMinAhead.getUTCHours() - 12: twoMinAhead.getUTCHours()}:${twoMinAhead.getUTCMinutes()} ${twoMinAhead.getUTCHours() > 12 ? "PM": "AM"}`,
        "Registered"
      );
      createdCampaigns.push(campaignName);
      cy.sendMassCampaign(campaignName);
      cy.wait(500);
      cy.goToMessageQueue();
      cy.searchMessageQueue(campaignSubject).then((rows) => {
        cy.wrap(rows).should('contain.text', roles[0]).and('contain.text', roles[1]).and('not.contain.text', roles[2])
      });
    });

    it.skip("Campaigns for guests will only be sent to guests", () => {
      const campaignName = "Cypress Guests Campaign";
      const campaignSubject = "Cypress' Guest campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      cy.addNewCampaign(
        campaignName,
        campaignSubject,
        "A test campaign created by cypress for guest",
        `${twoMinAhead.toLocaleDateString()} ${twoMinAhead.getUTCHours() > 12 ? twoMinAhead.getUTCHours() - 12: twoMinAhead.getUTCHours()}:${twoMinAhead.getUTCMinutes()} ${twoMinAhead.getUTCHours() > 12 ? "PM": "AM"}`,
        "Registered"
      );
      createdCampaigns.push(campaignName);
      cy.sendMassCampaign(campaignName);
      cy.wait(500);
      cy.goToMessageQueue();
      cy.searchMessageQueue(campaignSubject).then((rows) => {
        cy.wrap(rows).should('contain.text', roles[0]).and('contain.text', roles[1]).and('not.contain.text', roles[2])
      });
    });

    // TODO: Test to make sure message tokens are working.
  });
});
