/// <reference types="cypress" />

describe('Checkout service: hosted page', () => {
    it("should pass if total payment section is displayed correctly",()=>{
        cy.createCheckoutSession().then((res)=>{
            const sessionId = res.body.data.createCheckoutSession.checkoutSession.id;

            cy.visit(`/${sessionId}`);
            let section = cy.get(".article-content").find(".section");
            section.should("be.visible");

            section.find(".text-sub-heading").should("not.have.text","");
            
            cy.get(".order-summary-total-text").should("have.text","Total");
            cy.get(".order-summary-total-amount").should(($div) => {
                const amountText = $div.text();                  
                expect(amountText).to.match(/\d+\.\d{2}/);
                });

            cy.get(".order-summary-logo").should("be.visible");
        });        
    });
});