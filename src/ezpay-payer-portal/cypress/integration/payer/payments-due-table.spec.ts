/// <reference types="cypress" />

describe("Payer Portal - Payments Due Table", function () {
  let merchantIndex = 0;
  let merchantLength = 0;
  let consolidated = false;
  let partial = false;
  before(() => {
    cy.login();
    cy.waitForRootPageLoading(1);
    cy.getMerchantIndex().then((resp) => {
      merchantIndex = resp.merchantIndex;
      merchantLength = resp.merchantLength;
      consolidated = resp.consolidatedPayment;
      partial = resp.partialPayment;
    });
  });

  context("Logged In", () => {
    beforeEach(() => {
      cy.visit("/");
      cy.wait(5000);
      if (merchantLength > 0) {
        cy.get("h6:contains(Balance Due)")
          .eq(merchantIndex)
          .parent()
          .parent()
          .within(() => {
            cy.get("button").click({ force: true });
          });
        cy.waitForRequestLoading(1);
      }
    });

    it("shows the payments due list", () => {
      cy.get("[id=payment-requests-tab]").should("be.visible").click();
      cy.get("[data-cy=payments-due-list").should("be.visible");
    });

    it("Creating the payment request add the data in recent payments table", () => {
      cy.createPaymentRequest(661).then((response) => {
        cy.visit("/");
        cy.waitForRootPageLoading(1);
        if (merchantLength > 0) {
          cy.get("h6:contains(Balance Due)")
            .eq(merchantIndex)
            .parent()
            .parent()
            .within(() => {
              cy.get("button").click({ force: true });
            });
          cy.waitForRequestLoading(1);
        }
        cy.get("[data-cy=payments-due-list").should("be.visible");
        cy.wait(3000);
        //confirming the payment request has been created
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(1)
          .should("contain", response.referenceNumber);
      });
    });

    it("Clicks on the refrence link and it opens payment details modal", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");
    });

    it("Close button closes the payment details modal", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //closes the payment details dialog
      cy.get("[data-cy=payment-details-close]")
        .should("be.visible")
        .should("be.enabled")
        .click();
      cy.get("[data-cy=payment-details-modal]").should("not.exist");
    });

    it('should have a working "Download Invoice" link', () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //checks the download invoice link
      cy.get("[data-cy=download-invoice]")
        .should("have.attr", "href")
        .then((href) => {
          cy.request("GET", href).then((response) => {
            cy.expect(response.status).to.eq(200);
          });
        });
    });

    it("Payment details dialog should have make payment button", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //make payment button should be visible and enabled
      cy.get("[data-cy=make-payment]")
        .should("be.visible")
        .should("be.enabled")
        .should("contain", "MAKE PAYMENT");
    });

    it("Unpaid Payment details dialog should not contain payment history", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      //contains payment history
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible")
        .should("not.contain", "Payment History");
    });

    it("Failed Payment should have button as retry payment", () => {
      cy.makePayment(merchantIndex, merchantLength, consolidated, partial, 1);
      cy.visit("/");
      cy.waitForRootPageLoading(1);
      if (merchantLength > 0) {
        cy.get("h6:contains(Balance Due)")
          .eq(merchantIndex)
          .parent()
          .parent()
          .within(() => {
            cy.get("button").click({ force: true });
          });
        cy.waitForRequestLoading(1);
      }
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);

      //checking button as retry payment
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("button")
        .should("contain", "RETRY PAYMENT");
    });

    it("Failed Payment deatils dialog should contain payment history", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      //contains payment history
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible")
        .should("contain", "Payment History");
    });

    it("Failed payment deatils dialog should have retry payment button", () => {
      cy.get("[data-cy=payments-due-list").should("be.visible");
      cy.wait(5000);
      //opening the payment details modal
      cy.get("table")
        .find("tr")
        .eq(1)
        .find("td")
        .eq(1)
        .within(() => cy.get('a[href="#"]').click());
      cy.get("[data-cy=payment-details-modal]")
        .should("exist")
        .should("be.visible");

      //retry payment button should be visible and enabled
      cy.get("[data-cy=make-payment]")
        .should("be.visible")
        .should("be.enabled")
        .should("contain", "RETRY PAYMENT");
    });

    it("If consolidated allowed should be able to select more then one payment request and other functionalities should work as expected", () => {
      if (consolidated === true) {
        cy.createPaymentRequest(1000).then((response) => {
          cy.visit("/");
          cy.waitForRootPageLoading(1);
          if (merchantLength > 0) {
            cy.get("h6:contains(Balance Due)")
              .eq(merchantIndex)
              .parent()
              .parent()
              .within(() => {
                cy.get("button").click({ force: true });
              });
            cy.waitForRequestLoading(1);
          }
          cy.get("[data-cy=payments-due-list").should("be.visible");
          cy.wait(3000);
          //confirming the payment request has been created
          cy.get("table")
            .find("tr")
            .eq(1)
            .find("td")
            .eq(1)
            .should("contain", response.referenceNumber);

          //selecting payment request change pay all button to pay selected and also shows hide unselected option
          cy.get("button:contains(PAY ALL)")
            .should("exist")
            .should("be.visible");
          cy.get("div:contains(Hide Unselected)").should("not.exist");

          cy.get("table")
            .find("tr")
            .eq(1)
            .find("button:contains(PAYMENT)")
            .click({ force: true });

          cy.get("table")
            .find("tr")
            .eq(1)
            .find("button:contains(PAYMENT)")
            .should("not.exist");

          cy.get("button:contains(PAY ALL)").should("not.exist");

          cy.get("button:contains(PAY SELECTED)")
            .should("exist")
            .should("be.visible");

          cy.get("div:contains(Hide Unselected)").should("exist");

          //can select using checkbox as well
          cy.get("table")
            .find("tr")
            .eq(2)
            .find("td")
            .eq(0)
            .find('[type="checkbox"]')
            .check();

          cy.get("table")
            .find("tr")
            .eq(2)
            .find("button:contains(PAYMENT)")
            .should("not.exist");

          //can unselect the row using checkbox
          cy.get("table")
            .find("tr")
            .eq(2)
            .find("td")
            .eq(0)
            .find('[type="checkbox"]')
            .uncheck();

          cy.get("table")
            .find("tr")
            .eq(2)
            .find("button:contains(PAYMENT)")
            .should("exist");

          //can unselect the row using cross button
          cy.get("table")
            .find("tr")
            .eq(2)
            .find("td")
            .eq(0)
            .find('[type="checkbox"]')
            .check();

          cy.get("table")
            .find("tr")
            .eq(2)
            .find("button:contains(PAYMENT)")
            .should("not.exist");

          cy.get("table")
            .find("tr")
            .eq(2)
            .find("button")
            .click({ force: true });

          cy.get("table")
            .find("tr")
            .eq(2)
            .find("button:contains(PAYMENT)")
            .should("exist");

          //pay selected should redirect to make-payment route
          cy.get("button:contains(PAY SELECTED)").click({ force: true });
          cy.wait(3000);
          cy.location().should((loc) => {
            expect(loc.pathname).to.eq("/make-payment");
          });
        });
      }
    });

    it("If partial allowed the payments due table should work as expected", () => {
      if (partial) {
        //should be able to select using make/retry payment button
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("button:contains(PAYMENT)")
          .click({ force: true });

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("button:contains(PAYMENT)")
          .should("not.exist");

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("[data-cy=amount-edit]")
          .should("exist")
          .should("be.visible");

        //can unselect using checkbox
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(0)
          .find('[type="checkbox"]')
          .uncheck();

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("[data-cy=amount-edit]")
          .should("not.exist");

        //can select using checkbox
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(0)
          .find('[type="checkbox"]')
          .check();

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("[data-cy=amount-edit]")
          .should("exist")
          .should("be.visible");

        //can unselect using close button
        cy.get("table").find("tr").eq(1).find("button").click({ force: true });

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("[data-cy=amount-edit]")
          .should("not.exist");

        //amount exceeding total due and no amount should make pay button diabled
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(0)
          .find('[type="checkbox"]')
          .check();

        cy.get("table").find("tr").eq(1).find('input[type="text"]').clear();
        cy.get("button:contains(PAY)").last().should("be.disabled");

        cy.get("table")
          .find("tr")
          .eq(1)
          .find('input[type="text"]')
          .type("1000");
        cy.get("button:contains(PAY)").last().should("be.disabled");

        //making amount in limit should enable the pay button
        cy.get("table")
          .find("tr")
          .eq(1)
          .find('input[type="text"]')
          .clear()
          .type("1");
        cy.get("button:contains(PAY)").last().should("be.enabled");

        //pay selected should redirect to make-payment route
        cy.get("button:contains(PAY)").last().click({ force: true });
        cy.wait(3000);
        cy.location().should((loc) => {
          expect(loc.pathname).to.eq("/make-payment");
        });
      }
    });

    it("Creating payment request with discount amount and discount end date should add data to discount end column", () => {
      const discountEndDate = new Date();
      discountEndDate.setDate(discountEndDate.getDate() + 3);
      cy.createPaymentRequestWithDiscount(
        2000,
        500,
        discountEndDate.toISOString()
      ).then((response) => {
        cy.visit("/");
        cy.waitForRootPageLoading(1);
        if (merchantLength > 0) {
          cy.get("h6:contains(Balance Due)")
            .eq(merchantIndex)
            .parent()
            .parent()
            .within(() => {
              cy.get("button").click({ force: true });
            });
          cy.waitForRequestLoading(1);
        }
        cy.get("[data-cy=payments-due-list").should("be.visible");
        cy.wait(3000);
        //confirming the payment request has been created
        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(2)
          .should("contain", discountEndDate.toLocaleDateString());

        cy.get("table")
          .find("tr")
          .eq(1)
          .find("td")
          .eq(6)
          .should("contain", "20.00")
          .should("contain", "15.00");
      });
    });

    it("Creating payment request with discount amount and discount end date should add data to discount end column in mobile view", () => {      
      cy.viewport('iphone-x');
      let amount = Math.trunc(Math.random() * 10000);
      let discount = Math.trunc(Math.random() * 500);
      let addDays = Math.trunc(Math.random() * 10);
      const discountEndDate = new Date();
      discountEndDate.setDate(discountEndDate.getDate() + addDays);
      cy.createPaymentRequestWithDiscount(
        amount,
        discount,
        discountEndDate.toISOString()
      ).then((response) => {
        cy.visit("/");
        cy.waitForRootPageLoading(1);
        if (merchantLength > 0) {
          cy.get("h6:contains(Balance Due)")
            .eq(merchantIndex)
            .parent()
            .parent()
            .within(() => {
              cy.get("button").click({ force: true });
            });
          cy.waitForRequestLoading(1);
        }

        cy.get("[data-cy=payments-due-list").should("be.visible");
        cy.wait(3000);
        //confirming the payment request has been created
        cy.get("table").find("> tbody > tr > td")
          .should("contain", "Discount Ends")
          .should("contain", `${discountEndDate.getMonth() + 1}/${discountEndDate.getDate()}`);

        cy.get("table").find("> tbody > tr > td")
          .should("contain", `${(amount / 100).toPrecision(2)}`)
          .should("contain", `${((amount - discount) / 100).toPrecision(2)}`);
      });
    });
  });
});
