/// <reference types="cypress" />
// @ts-check

describe("Query: AccountBalance", () => {
  it("should pass if the wepay balance is the same as in our tenant account", () => {
    cy.getWePayAccount(Cypress.env("wepay-account-id")).then((res) => {
      const balanceObject =
        res.balances.currencies.USD ?? res.balances.currencies.CAD;
      const {
        balance,
        incoming_pending,
        outgoing_pending,
        reserve,
      } = balanceObject;

      const gqlQuery = `
      query {
        account {
          balances{
            currentBalance {
              amount
              currency
            }
            incomingPendingBalance {
              amount
              currency
            }
            outgoingPendingBalance {
              amount
              currency
            }
            currentReserve {
              amount
              currency
            }
          }
        }
      }`;

      cy.postGQL(gqlQuery).then((res) => {
        const {
          currentBalance,
          currentReserve,
          incomingPendingBalance,
          outgoingPendingBalance,
        } = res.body.data.account.balances;

        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // no errors
        assert.notExists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // should be equal to all balances retrieved from wepay
        assert.equal(currentBalance.amount, balance);
        assert.equal(incomingPendingBalance.amount, incoming_pending);
        assert.equal(outgoingPendingBalance.amount, outgoing_pending);
        assert.equal(currentReserve.amount, reserve);

        // has data
        assert.exists(res.body.data);
      });
    });
  });
});
