/// <reference types="cypress" />
// TEST COUNT: 9

const saveCustomer = () => {
  cy.get("button[name=save]").click();
  cy.wait(500);
  cy.get(".alert").should(
    "contain.text",
    "The customer has been updated successfully."
  );
};
// Verify that the customer is subscribed to the newsletter; if not, subscribe them and return true since we know the sub is now active
// If already subscribed, return false because we don't know if it's an active subscription
const verifyNewsletterSub = () => {
  var subbed = false;
  cy.get('#SelectedNewsletterSubscriptionStoreIds_taglist')
    .invoke('text')
    .then((text) => {
      if (!text.includes('Your store name')) {
        cy.get('#SelectedNewsletterSubscriptionStoreIds').select('Your store name', {force: true});
        subbed = true;
        saveCustomer();
      }
    });
  return subbed;
};
// Verify that the customer's newsletter subscription is active, and activate it if not
const verifyActiveSub = (email: string) => {
  cy.goToSubscribers();
  const subscriptionFilter = (index, item) => {
    return item.cells[0].innerText === email;
  };
  cy.findTableItem("#newsletter-subscriptions-grid", "#newsletter-subscriptions-grid", subscriptionFilter).then((row) => {
    if (!row[0].cells[1].innerHTML.includes('nop-value="true"')) {
      cy.wrap(row).find("td").contains("Edit").click({ force: true });
      cy.get('input[type=checkbox]').check({ force: true });
      cy.get('a').contains('Update').click({ force: true });
      cy.wait(200);
      cy.contains(email).parent().find('td').eq(1).should('contain.html', 'nop-value="true"');
    }
  });
};
// Select the messages in the message queue that were created by cypress and are to a certain email
const selectMessagesInQueue = (email: string) => {
  cy.get("#queuedEmails-grid")
    .find("tbody")
    .find("tr")
    .then(($rows) => {
      const rowsToCheck = $rows.filter((index, item) => {
        return item.cells[2].innerText.includes("Cypress") && item.cells[4].innerText === email;
      });
      if (rowsToCheck.length > 0) {
        for (var i = 0; i < rowsToCheck.length; i++) {
          cy.wrap(rowsToCheck[i]).find('input[type=checkbox]').check({force: true});
        }
      }
    });
};
// Retrieve a customer's current email, correct their roles if needed, and verify newsletter subscription
const verifyCustomer = (tableRow, needsEdit: boolean, roleArray: string[]) => {
  cy.wrap(tableRow).find("td").contains("Edit").click();
  return cy.get('#Email').invoke('val').then((val) => {
    assert.isString(val);
    assert.isNotEmpty(val);
    if (needsEdit) {
      cy.get('#SelectedCustomerRoleIds_taglist')
        .find('.k-select')
        .then(($els) => {
          for(var i = 0; i < $els.length; i++) {
            cy.wait(200);
            cy.wrap($els[i]).click();
          }
          cy.get('#SelectedCustomerRoleIds').select(roleArray, {force: true});
        });
    }
    const subbed = verifyNewsletterSub();
    if (!subbed && needsEdit) {
      saveCustomer();
    }
    return cy.wrap({email: val, subscribed: subbed});
  });
};
// Grab the message tokens from the allowed tokens when creating a campaign, separate them into an array, and return it
// Use incudeHeader to only grab tokens that include a certain value(s), or omit it to grab all
const getMessageTokensAsArray = (includeHeader?: string | string[]) => {
  cy.get("#allowedTokensShowHide").click();
  return cy.get("#pnlAllowedTokens").then(($div) => {
    var tokens = $div[0].innerText.split(", ");
    if (includeHeader) {
      var wantedTokens = [] as string[];
      tokens.forEach((token, i) => {
        if(!Array.isArray(includeHeader) && token.includes(includeHeader)){
          wantedTokens.push(token);
        } else if (Array.isArray(includeHeader)) {
          for (var f = 0; f < includeHeader.length; f++) {
            if (token.includes(includeHeader[f])) {
              wantedTokens.push(token);
            }
          }
        }
      });
      return wantedTokens;
    } else {
      return tokens;
    }
  });
};

// Create a campaign body input using tokens.
// Transforms a token into a readable string (ex: %Store.Name% -> Store Name) and pairs it with the token
const createTokensCampaignBody = (tokensArray: string[]): string => {
  var body = '<b>Cypress Testing Tokens</b><br>';
  tokensArray.forEach((token, i) => {
    var readableToken = token.replace(/%/g, "").replace(".", " ");
    if (!readableToken.includes("YouTube")) {
      var loc = readableToken.search(/[a-z][A-Z]/);
      while(loc !== -1) {
        readableToken = readableToken.slice(0, loc + 1) + " " + readableToken.slice(loc + 1);
        loc = readableToken.search(/[a-z][A-Z]/);
      }
    }
    body = body + readableToken + ": " + token + `${i < tokensArray.length - 1 ? "<br>" : ""}`;
  });
  return body;
};
// Uses the campaign body input to replace the tokens with the expected values, giving us the body of the queued email
const createExpectedTokensValue = (bodyInput: string, expectedArray): string => {
  var expectedBody = "";
  expectedBody = expectedBody.concat(bodyInput);
  expectedArray.forEach((exp) => {
    expectedBody = expectedBody.replace(exp.tokenName, exp.tokenValue);
  });
  return expectedBody;
};
// Go and retrieve the social media url values from the general settings page, and return them
const getSocialMediaValues = () => {
  cy.goToGeneralSettings();
  return cy.get("#StoreInformationSettings_FacebookLink").invoke("val").then((fbValue) => {
    const expectedValues = [{tokenName: "%Facebook.URL%", tokenValue: fbValue}];
    cy.get("#StoreInformationSettings_TwitterLink").invoke("val").then((twValue) => {
      expectedValues.push({tokenName: "%Twitter.URL%", tokenValue: twValue});
      cy.get("#StoreInformationSettings_YoutubeLink").invoke("val").then((ytValue) => {
        expectedValues.push({tokenName: "%YouTube.URL%", tokenValue: ytValue});
        return expectedValues;
      });
    });
  });
};

describe("Ecommerce", function () {
  context("Campaigns", () => {
    const customerEmails = [] as string[]; // All emails used
    var adminEmail = "";
    const registeredEmails = [] as string[];
    var guestEmail = "";
    const createdCampaigns = [] as string[];
    var queuedMessages = false;
    // Add a new campaign and push the campaign name. Intended to make sure created campaigns get logged and deleted
    const createAndPush = (name: string, subject: string, body: string, date: Date, role: string) => {
      cy.addNewCampaign(name, subject, body, `${date.toLocaleDateString()} ${date.getHours() > 12 ? date.getHours() - 12: date.getHours()}:${date.getMinutes()} ${date.getHours() >= 12 ? "PM": "AM"}`, role);
      createdCampaigns.push(name);
    };
    // Convience function to trim out a lot of repeating code
    const sendMassAndConfirmQueue = (campaignName: string, campaignSubject: string) => {
      cy.sendMassCampaign(campaignName);
      cy.wait(500);
      cy.goToMessageQueue();
      return cy.searchMessageQueue(campaignSubject).then((rows) => {
        queuedMessages = true;
        return rows;
      });
    };

    // Look for these roles needed for testing, create them if the don't already exist, or edit them if there's something wrong with them
    before(() => {
      // roleData emails may not match what is already in system
      // Therefore, we have to grab the email from the existing customer, which we find by first and last name.
      // If we have to create a new user, the included random numbers should ensure the email is unique every time
      const roleData = [
        {
          email: `cypress.admin${Cypress._.random(0, 1e9)}@testenvironment.com`, 
          password: "CypressAdmin",
          first: "Cypress",
          last: "Admin",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "08/10/1990",
          newsletter: ["Your store name"],
          roles: ["Administrators","Registered"]
        },
        {
          email: `cypress.registered${Cypress._.random(0, 1e9)}@testenvironment.com`, 
          password: "CypressUser",
          first: "Cypress",
          last: "User",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "04/20/1990",
          newsletter: ["Your store name"],
          roles: ["Registered"]
        },
        {
          email: `cypress.guest${Cypress._.random(0, 1e9)}@testenvironment.com`,
          password: "CypressGuest",
          first: "Cypress",
          last: "Guest",
          gender: Cypress._.random(0, 1) === 1 ? "Female" : "Male",
          dob: "01/30/1990",
          newsletter: ["Your store name"],
          roles: ["Guests"]
        },
      ];
      cy.visit("/");
      cy.login();
      cy.goToCustomers();
      roleData.forEach((customer, index) => {
        cy.searchForCustomer(customer.first, customer.last).then((customerRow) => {
          if (customerRow === null) {
            cy.addNewCustomer(roleData[index]);
          } else {
            verifyCustomer(customerRow, customerRow[0].cells[3].innerText !== roleData[index].roles.join(', '), roleData[index].roles).then((returnVal) => {
              const { subscribed, email } = returnVal;
              if (!subscribed) {
                verifyActiveSub(email);
                cy.goToCustomers();
              }
              if (roleData[index].roles.includes('Registered')) {
                if (roleData[index].roles.includes('Administrators')) {
                  adminEmail = email;
                }
                registeredEmails.push(email);
              } else if (roleData[index].roles.includes('Guests')) {
                guestEmail = email;
              }
              customerEmails.push(email);
            });
          }
        });
      });
    });
    
    beforeEach(() => {
      cy.visit("/");
      cy.login();
    });

    // Delete the campaigns we created and delete the queued messages
    afterEach(() => {
      if (queuedMessages) {
        cy.goToMessageQueue();
        cy.wait(1000);
        customerEmails.forEach((email) => {
          selectMessagesInQueue(email);
        });
        cy.wait(500);
        cy.get("#delete-selected").click({force: true});
        cy.wait(200);
        cy.get("#delete-selected-action-confirmation-submit-button").click({force: true});
        queuedMessages = false;
      }
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
      const campaignName = "Cypress Campaign Test";
      const today = new Date();
      const twoDaysAhead = new Date(today.valueOf() + 172800000);
      cy.goToCampaigns();
      createAndPush(campaignName, "Cypress' test campaign", "A test campaign created by cypress", twoDaysAhead, "All");
      cy.deleteCampaign(campaignName, true);
    });

    it("Test emails can be sent out for campaigns", () => {
      const campaignName = "Cypress Test Campaign";
      const campaignSubject = "Cypress' test campaign";
      const today = new Date();
      const twoDaysAhead = new Date(today.valueOf() + 172800000);
      cy.goToCampaigns();
      createAndPush(campaignName, campaignSubject, "A test campaign created by cypress", twoDaysAhead, "All");
      cy.sendCampaignTest(campaignName, adminEmail);
      cy.wait(500);
      cy.get(".alert").should(
        "contain.text",
        "Email has been successfully sent"
      );
      cy.goToMessageQueue();
      cy.wait(500);
      cy.searchMessageQueue(campaignSubject).then((rows) => {
        queuedMessages = true;
        cy.wrap(rows).should('contain.text', adminEmail);
      });
    });

    it("Campaigns for Admin users will only be sent to admins", () => {
      const campaignName = "Cypress Admin Campaign";
      const campaignSubject = "Cypress' Admin campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      createAndPush(campaignName, campaignSubject, "A test campaign created by cypress for Admins", twoMinAhead, "Administrators");
      sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
        cy.wrap(rows).should('contain.text', adminEmail);
        const nonAdmin = registeredEmails.filter(value => value !== adminEmail);
        cy.wrap(rows).should('not.contain.text', nonAdmin[0]).and('not.contain.text', guestEmail);
      });
    });

    it("Campaigns for registered users will only be sent to registered users", () => {
      const campaignName = "Cypress Registered Users Campaign";
      const campaignSubject = "Cypress' Reg User campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      createAndPush(campaignName, campaignSubject,"A test campaign created by cypress for registered users", twoMinAhead, "Registered");
      sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
        cy.wrap(rows).should('not.contain.text', guestEmail);
        registeredEmails.forEach((reg) => {
          cy.wrap(rows).should('contain.text', reg);
        });
      });
    });

    it("Campaigns for guests will only be sent to guests", () => {
      const campaignName = "Cypress Guests Campaign";
      const campaignSubject = "Cypress' Guest campaign";
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      cy.goToCampaigns();
      createAndPush(campaignName, campaignSubject, "A test campaign created by cypress for guest", twoMinAhead, "Guests");
      sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
        cy.wrap(rows).should('contain.text', guestEmail);
        cy.wrap(rows).should('not.contain.text', adminEmail);
        registeredEmails.forEach((reg) => {
          cy.wrap(rows).should('not.contain.text', reg);
        });
      });
    });

    it("Message tokens used in a campaign subject will work properly", () => {
      cy.goToCampaigns();
      const campaignName = "Cypress Subject Tokens";
      const campaignSubject = "Cypress' ST Test ";
      const token = "%Store.Name%";
      const campaignSubjectFull = campaignSubject + token;
      const today = new Date();
      const twoMinAhead = new Date(today.valueOf() + 120000);
      createAndPush(campaignName, campaignSubjectFull, "Cypress testing message tokens in the subject line", twoMinAhead, "Administrators");
      const formatedToday = today.toLocaleString(undefined, {month: "2-digit", day: "2-digit", year: "numeric"});
      const altQueueFilter = (index, item) => {
        return item.cells[2].innerText.includes(campaignSubject) && item.cells[5].innerText.includes(formatedToday);
      };
      cy.sendMassCampaign(campaignName);
      cy.wait(500);
      cy.goToMessageQueue();
      cy.findTableItem("#queuedEmails-grid", "#queuedEmails-grid_next", altQueueFilter).then((rows) => {
        assert.exists(rows, "Expecting at least one email in the queue");
        queuedMessages = true;
        const expectedSubject = campaignSubject + "Your store name"; // TODO: Need to find where I can access dynamic values for this instead of hardcoding
        cy.wrap(rows).find('td').eq(2).should('not.include.text', token);
        cy.wrap(rows).find('td').eq(2).should('have.text', expectedSubject);
        cy.wrap(rows).find('td').contains('Edit').click();
        cy.wait(500);
        cy.get("#Subject").invoke("val").then((subjectVal) => {
          expect(subjectVal).to.not.include(token, "Message does not contain token");
          expect(subjectVal).to.be.eql(expectedSubject);
        });
      });
    });

    it("Store message tokens used in a campaign body will work properly", () => {
      cy.goToCampaigns();
      cy.get(".content-header").find("a").contains("Add new").click();
      getMessageTokensAsArray("Store").then((tokenArray) => {
        assert.isNotEmpty(tokenArray);
        const bodyInput = createTokensCampaignBody(tokenArray);
        const campaignName = "Cypress Store Tokens";
        const campaignSubject = "Cypress' Store Tokens Test";
        const today = new Date();
        const twoMinAhead = new Date(today.valueOf() + 120000);
        createAndPush(campaignName, campaignSubject, bodyInput, twoMinAhead, "Administrators");
        cy.editCampaign(campaignName, true);
        cy.get("#EmailAccountId").invoke("text").then((val) => {
          assert.isString(val);
          const storeEmail = val.slice(val.indexOf("(") + 1, val.indexOf(")"));
          const expectedValues = [
            {tokenName: "%Store.URL%", tokenValue: Cypress.config("baseUrl")}, 
            {tokenName: "%Store.Name%", tokenValue: "Your store name"}, // TODO: Need to find where I can access dynamic values for this instead of hardcoding
            {tokenName: "%Store.Email%", tokenValue: storeEmail}, 
            {tokenName: "%Store.CompanyName%", tokenValue: "Your company name"}, // TODO: Need to find where I can access dynamic values for this instead of hardcoding
            {tokenName: "%Store.CompanyAddress%", tokenValue: "your company country, state, zip, street, etc"}, // TODO: Need to find where I can access dynamic values for this instead of hardcoding
            {tokenName: "%Store.CompanyPhoneNumber%", tokenValue: "(123) 456-78901"}, // TODO: Need to find where I can access dynamic values for this instead of hardcoding
            {tokenName: "%Store.CompanyVat%", tokenValue: ""} // TODO: Need to find where I can access dynamic values for this instead of hardcoding
          ];
          const expectedBody = createExpectedTokensValue(bodyInput, expectedValues);
          sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
            cy.wrap(rows).should('contain.text', adminEmail);
            cy.wrap(rows).find('td').contains('Edit').click();
            cy.wait(500);
            cy.get("#Body").invoke("val").then((bodyVal) => {
              tokenArray.forEach((token) => {
                expect(bodyVal).to.not.include(token, "Message does not contain token");
              });
              expect(bodyVal).to.be.eql(expectedBody);
            });
          });
        });
      });
    });

    it("Social Media message tokens used in a campaign body will work properly", () => {
      cy.goToCampaigns();
      cy.get(".content-header").find("a").contains("Add new").click();
      getMessageTokensAsArray(["Facebook", "Twitter", "YouTube"]).then((tokenArray) => {
        assert.isNotEmpty(tokenArray);
        expect(tokenArray).to.have.length(3);
        const bodyInput = createTokensCampaignBody(tokenArray);
        // Get the values for facebook, twitter, and YouTube urls
        cy.goToGeneralSettings();
        getSocialMediaValues().then((tokenValues) => {
          const expectedBody = createExpectedTokensValue(bodyInput, tokenValues);
          const campaignName = "Cypress Social Tokens";
          const campaignSubject = "Cypress' Social Tokens Test";
          const today = new Date();
          const twoMinAhead = new Date(today.valueOf() + 120000);
          cy.goToCampaigns();
          createAndPush(campaignName, campaignSubject, bodyInput, twoMinAhead, "Administrators");
          sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
            cy.wrap(rows).should('contain.text', adminEmail);
            cy.wrap(rows).find('td').contains('Edit').click();
            cy.wait(500);
            cy.get("#Body").invoke("val").then((bodyVal) => {
              tokenArray.forEach((token) => {
                expect(bodyVal).to.not.include(token, "Message does not contain token");
              });
              expect(bodyVal).to.be.eql(expectedBody);
            });
          });
        });
      });
    });

    it("Newsletter tokens used in a campaign body will work properly", () => {
      cy.goToCampaigns();
      cy.get(".content-header").find("a").contains("Add new").click();
      getMessageTokensAsArray("NewsLetter").then((tokenArray) => {
        assert.isNotEmpty(tokenArray);
        const bodyInput = createTokensCampaignBody(tokenArray);
        const expectedValues = [
          {tokenName: "%NewsLetterSubscription.Email%", tokenValue: adminEmail},
          {tokenName: "%NewsLetterSubscription.ActivationUrl%", tokenValue: `${Cypress.config("baseUrl")}en/newsletter/subscriptionactivation`},
          {tokenName: "%NewsLetterSubscription.DeactivationUrl%", tokenValue: `${Cypress.config("baseUrl")}en/newsletter/subscriptionactivation`}
        ];
        const expectedBody = createExpectedTokensValue(bodyInput, expectedValues);
        const splitExpected = expectedBody.split("<br>");
        splitExpected.shift(); // Get rid of the Cypress Testing Tokens entry
        const campaignName = "Cypress Newsletter Tokens";
        const campaignSubject = "Cypress' Newsletter Tokens Test";
        const today = new Date();
        const twoMinAhead = new Date(today.valueOf() + 120000);
        createAndPush(campaignName, campaignSubject, bodyInput, twoMinAhead, "Administrators");
        sendMassAndConfirmQueue(campaignName, campaignSubject).then((rows) => {
          expect(rows).to.have.length(1);
          cy.wrap(rows).should('contain.text', adminEmail);
          cy.wrap(rows).find('td').contains('Edit').click();
          cy.wait(500);
          cy.get("#Body").invoke("val").then((bodyVal) => {
            tokenArray.forEach((token) => {
              expect(bodyVal).to.not.include(token, "Message does not contain token");
            });
            const splitBody = bodyVal.split("<br>");
            splitBody.shift(); // Get rid of the Cypress Testing Tokens entry
            const splitFiltered = splitBody.filter((item) => {
              return item !== "";
            });
            splitFiltered.forEach((line, i) => {
              expect(line).to.include(splitExpected[i]);
            });
          });
        });
      });
    });
  });

  // Possible test: Only customers with active newsletter subscriptions receive emails.
});
