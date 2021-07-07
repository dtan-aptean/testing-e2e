/// <reference types="cypress" />

describe('Checkout service: hosted page', () => {
    it("should pass if total payment section is displayed correctly",()=>{
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);

            // section should be visible
            let section = cy.get(".article-content").find(".section");
            section.should("be.visible");

            // merchant name should not be empty
            section.find(".text-sub-heading").should("not.have.text","");
            
            // summary total's text must be equal to 'Total'
            cy.get(".order-summary-total-text").should("have.text","Total");

            // amount should be like xx.xx
            cy.get(".order-summary-total-amount").should(($div) => {
                const amountText = $div.text();                  
                expect(amountText).to.match(/\d+\.\d{2}/);
                });

            // aptean logo must be visible
            cy.get(".order-summary-logo").should("be.visible");
        });        
    });

    it('should pass if cancels checkout correctly', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;
            const cancelUrl = res.body.data.createCheckoutSession.checkoutSession.cancelUrl;

            // cancel url should not be null
            assert.isNotNull(cancelUrl);

            // go to checkout page
            cy.visit(`/${sessionId}`);

            let cancelButton = cy.get("#cancel-payment");
            // cancel button should not be disabled
            cancelButton.should("not.be.disabled");

            // click the button
            cancelButton.click();

            // after button click browser must navigate to cancel url
            cy.url().should("equal", cancelUrl);

            // if you go back
            cy.go("back");

            // session must already be unusable
            cy.contains("body", "session is canceled");
        });
    });
});