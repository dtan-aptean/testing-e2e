/// <reference types="cypress" />

describe("Payer Portal - Hamburger Menu", () => {
    //function to select the credit card iframe
    const getIframeBody = () => {
    return cy
        .get("#cc_iframe_iframe")
        .its("0.contentDocument.body")
        .should("not.be.empty")
        .then(cy.wrap);
    };

    //function to add the credit card
    const addCreditCard = (zipcode: string) => {
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
        cy.get("[data-cy=email]").type("testuser@testusers.com");
        cy.get("[data-cy=street-address]").type("4324 somewhere st");
        cy.get("[data-cy=country]").find("select").select("US");
        cy.get("[data-cy=zipcode]").type(zipcode);
        cy.get("[data-cy=phone-number]").type("6784324574");
        cy.get("[data-cy=continue-to-payment]")
        .last()
        .should("be.enabled")
        .click({ force: true });

        cy.wait(2000);

        //Entering card details
        cy.get("[data-cy=holder-name]").type("Test User");
        cy.wait(2000);
        getIframeBody().find("#text-input-cc-number").type("4111111111111111");
        getIframeBody().find("#text-input-expiration-month").type("12");
        getIframeBody().find("#text-input-expiration-year").type("30");
        getIframeBody().find("#text-input-cvv-number").type("123");

        cy.get("[data-cy=continue-to-payment]").first().click({ force: true });
    };

    //function to add bank account
    const addBankAccount = (length: number) => {
        //opening the modal
        cy.get("[data-cy=add-bank-account]").click();
        cy.get("[data-cy=payment-method-add]").should("exist").should("be.visible");

        //opening the add address modal

        //In case the default address is selected
        cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if ($modal.find("[data-cy=add-address]").length) {
            cy.get("[data-cy=add-address]").click();
            cy.get("[data-cy=billing-address-modal]").should("be.visible");

            // Entering the address details
            cy.get("[data-cy=email]").type("testuser@testusers.com");
            cy.get("[data-cy=street-address]").type("4324 somewhere st");
            cy.get("[data-cy=country]").find("select").select("US");
            cy.get("[data-cy=zipcode]").type("30022");
            cy.get("[data-cy=phone-number]").type("6784324574");
            cy.get("[data-cy=continue-to-payment]")
            .last()
            .should("be.enabled")
            .click({ force: true });

            cy.wait(2000);
        }
        });
        cy.get("[data-cy=account-holder-name]").type("Test User");
        cy.get("[data-cy=payment-routing]").type("021000021");
        cy.get("[data-cy=payment-account]").type("1234567");
        cy.get("[data-cy=continue-to-payment]").first().click({ force: true });
        cy.wait(20000);
        cy.get("[data-cy=menu-options]").should("have.length", length + 1);
    };

    before(() => {
        cy.login();
        cy.wait(10000);
    });

    context("Logged in", () => {
        beforeEach(() => {
            cy.visit("/");
            cy.wait(5000);
        });

        it('Pressing the menu icon should show the sign out button', () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get('[data-cy=sign-out]').should('be.visible');
        });

        it('Pressing the menu icon twice should make the sign out button hide', () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.wait(1000);
            cy.get('[data-cy=menu-icon]').click();
            cy.get('[data-cy=sign-out]').should('not.be.visible');
        });

        it("Add payment method modal functionality should work for add credit card option", () => {
            cy.get('[data-cy=menu-icon]').click();
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
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                if ($body.find("[data-cy=add-bank-account]").length) {
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
                }
            });
        });
    
        it("Adding address should add the data to address list", () => {
            cy.get('[data-cy=menu-icon]').click();
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
            cy.get("[data-cy=email]").type("testuser@testusers.com");
            cy.get("[data-cy=street-address]").type("4324 somewhere st");
            cy.get("[data-cy=country]").find("select").select("US");
            cy.get("[data-cy=zipcode]").type("30022");
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
    
        it("Adding a credit card with invalid zipcode should show the error message", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                const length = $body.find("[data-cy=menu-options]").length;
                addCreditCard("11111");
                cy.wait(10000);
                cy.get("div")
                .contains("Invalid postal code")
                .should("be.visible");
                cy.get("[data-cy=menu-options]").should("have.length", length);
            });
        });
    
        it("Adding a credit card should add the data to wallet", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                const length = $body.find("[data-cy=menu-options]").length;
                addCreditCard("30022");
                cy.wait(15000);
                cy.get("[data-cy=menu-options]").should("have.length", length + 1);
            });
        });
    
        it("Make default option should work", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                const length = $body.find("[data-cy=menu-options]").length;
                if (length > 1) {
                cy.get("[data-cy=menu-options]").last().click({ force: true });
                cy.get("[data-cy=make-default]").last().click({ force: true });
                }
                cy.wait(5000);
                cy.get("[data-cy=menu-options]").last().click({ force: true });
                cy.get("[data-cy=make-default]").should("not.exist");
            });
        });
    
        it("When a payment method is set to default then add address list should be collapsed", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                if ($body.find("[data-cy=add-credit-card]").length) {
                //opening the modal
                cy.get("[data-cy=add-credit-card]").click();
                } else if ($body.find("[data-cy=add-bank-account]").length) {
                cy.get("[data-cy=add-bank-account]").click();
                }
                cy.get("[data-cy=payment-method-add]")
                .should("exist")
                .should("be.visible");
                cy.get("[data-cy=add-address]").should("not.exist");
            });
        });
    
        it("Delete option should work", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("[data-cy=menu-options]")
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
    
        it("Adding a bank account should add data to wallet", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                if ($body.find("[data-cy=add-bank-account]").length) {
                addBankAccount($body.find("[data-cy=menu-options]").length);
                }
            });
        });
    
        it("Verify bank modal should open and close as expected", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                if (!$body.find("[data-cy=add-bank-account]").length) {
                cy.get("button").contains("VERIFY BANK").click();
                cy.get("div")
                    .contains("Verify Bank Account")
                    .should("be.visible")
                    .parent()
                    .within(() => {
                    cy.get("svg").click({ force: true });
                    });
                cy.get("div").contains("Verify Bank Account").should("not.exist");
                }
            });
        });
    
        it("Verify bank modal should close after filling amount and clicking verify button", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("body").then(($body) => {
                if (!$body.find("[data-cy=add-bank-account]").length) {
                //opening the modal
                cy.get("button").contains("VERIFY BANK").click();
                cy.get("div").contains("Verify Bank Account").should("be.visible");
                cy.get("[data-cy=continue-verify]").should("not.be.enabled");
        
                //entering the details
                cy.get("[data-cy=first-deposit]").type("0.99");
                cy.get("[data-cy=second-deposit]").type("0.99");
                cy.get("[data-cy=continue-verify]").should("be.enabled").click();
        
                cy.wait(5000);
                cy.get("div").contains("Verify Bank Account").should("not.exist");
                }
            });
        });
    
        it("Can delete bank account", () => {
            cy.get('[data-cy=menu-icon]').click();
            cy.get("[data-cy=menu-options]")
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

        
        it('can sign out', () => {
            cy.get('[data-cy=menu-icon]')
                .click();
            
            cy.get('[data-cy=sign-out]')
                .should('be.visible')
                .click();
        
            cy.wait(5000);
            cy.get('body').then(($body) => {
                assert.isNotOk($body.find('[data-cy=menu-icon]').length, "expect account button not to exist in DOM")
            });
        });
    });
});