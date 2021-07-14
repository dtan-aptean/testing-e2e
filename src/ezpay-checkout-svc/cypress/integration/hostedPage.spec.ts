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

    it('should pass if cancel button is available and directs to cancel url', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;
            const cancelUrl = res.body.data.createCheckoutSession.checkoutSession.cancelUrl;

            // go to checkout page
            cy.visit(`/${sessionId}`);

            let cancelButton = cy.get("#cancel-payment");
            // cancel button should be available
            cancelButton.should("exist");
            cancelButton.should("not.be.disabled");

            // click the button
            cancelButton.click();

            cy.wait(2000);

            // after button click browser must navigate to cancel url
            cy.url().should("equal", cancelUrl);
        });
    });

    it('should pass if a completed session is not processed', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);
            
            // fill card info
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cc-number").type("4111111111111111");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-month").type("12");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-year").type("30");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cvv-number").type("123");            

            // click the button
            cy.get("#submit-payment").click();

            // modal box should be visible
            cy.get("#confirmationModal", {timeout: 10000}).should("be.visible");

            // click on confirm
            cy.get("#confirm-payment", {timeout: 20000}).click();

            cy.wait(5000);

            // request completed session and receive 410 Gone
            cy.request({
                method: 'GET',
                url: `/${sessionId}`,
                failOnStatusCode: false,
                headers: { 'Content-Type': 'text/plain' }
            }).then(resp=>{
                expect(resp.status).to.eq(410);
            });            
        }); 
    });

    it('should pass if payment summary is on the page', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);
            
            cy.get(".article-content").should("be.visible");

            // iframe input should be visible
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cc-number").should("be.visible");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-month").should("be.visible");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-year").should("be.visible");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cvv-number").should("be.visible");       
            
            // contact information form should be visible
            cy.get("#name").should("be.visible");
            cy.get("#country").should("be.visible");
            cy.get("#zip-code").should("be.visible");
            cy.get("#email").should("be.visible");
            cy.get("#country-code").should("be.visible");
            cy.get("#phone").should("be.visible"); 
        }); 
    });
});