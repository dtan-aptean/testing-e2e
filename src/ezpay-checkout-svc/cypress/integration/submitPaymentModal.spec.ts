/// <reference types="cypress" />

describe('Checkout service: submit payment modal box', ()=>{
    it('should pass if submit button is active when form is filled and vice versa', () => {
        cy.createCheckoutSession().then((res) => {
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);

            // form data
            cy.document().then(doc=>{
                let name = doc.getElementById("name").value;
                let country = doc.getElementById("country").value;
                let zipCode = doc.getElementById("zip-code").value;
                let email = doc.getElementById("email").value;
                let countryCode = doc.getElementById("country-code").value;
                let phoneNumber = doc.getElementById("phone").value;

                let submitPaymentButton = cy.get('#submit-payment');
            submitPaymentButton.should( 
                (name && country && zipCode && email && countryCode && phoneNumber 
                    ? "not." 
                    : "") +
                "be.disabled");
            });            
        }); 
    });

    it('should pass if modal box is opened when submit payment is clicked', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);
            
            // fill card info
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cc-number").type("4111111111111111");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-month").type("12");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-year").type("30");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cvv-number").type("123");            

            let submitPaymentButton = cy.get("#submit-payment");
            
            // click the button
            submitPaymentButton.click();

            // modal box should be visible
            cy.get("#confirmationModal").should("be.visible");            
        }); 
    });

    it('should pass if in case of payment failure modal box closes', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            // go to checkout page
            cy.visit(`/${sessionId}`);
            
            // fill invalid card info
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cc-number").type("4111111111111114");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-month").type("12");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-year").type("30");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cvv-number").type("123");            

            let submitPaymentButton = cy.get("#submit-payment");
            
            // click the button
            submitPaymentButton.click();

            // modal box should not be visible
            cy.get("#confirmationModal").should("not.be.visible");     
            
            // error text should be visible
            cy.get("#error-message").should("be.visible").should("not.have.text","");
        }); 
    });

    it('should pass if in case of completed payment user is on success url', () => {
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;
            const successUrl = res.body.data.createCheckoutSession.checkoutSession.successUrl;

            // success url should not be null
            assert.isNotNull(successUrl);

            // go to checkout page
            cy.visit(`/${sessionId}`);
            
            // fill card info
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cc-number").type("4111111111111111");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-month").type("12");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-expiration-year").type("30");
            cy.getIframeBody('#credit-card-capture_iframe').find("#text-input-cvv-number").type("123");            

            let submitPaymentButton = cy.get("#submit-payment");
            
            // click the button
            submitPaymentButton.click();

            // modal box should be visible
            cy.get("#confirmationModal", {timeout: 10000}).should("be.visible");

            // click on confirm
            cy.get("#confirm-payment", {timeout: 20000}).click();

            // make sure we are on success url
            cy.url().should("equal", `${successUrl}?sessionId=${sessionId}`);
        }); 
    });
});