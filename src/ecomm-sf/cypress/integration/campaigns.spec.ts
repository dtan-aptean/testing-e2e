/// <reference types="cypress" />
// TEST COUNT: 2

describe("Ecommerce", function () {
  context("Campaigns", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.login();
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

    // Further tests blocked by inability to test receiving an email
    // TODO: Test for sending campaign to Admin

    // TODO: Test for sending campaign to registered user

    // TODO: Test for sending campaign to guest

    // TODO: Test to make sure message tokens are working.
  });
});
