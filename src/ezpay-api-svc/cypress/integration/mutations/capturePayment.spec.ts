/// <reference types="cypress" />

describe("Mutation: capturePayment", () => {
  it("should pass if the mutation captures a payment with all arguments", () => {
    cy.generatePaymentRequestAndPay(0, false).then((res) => {
      const paymentId = res.id;
      const amount = res.amount;
      cy.wait(120000); // Wait for the payment to be completed...

      const gqlQuery = `mutation {
        capturePayment(input: {
          paymentId: "${paymentId}"
          amounts: {
            amount: ${amount}
            currency: USD
          }
        })
        {
          code
          message
          error
          payment {
            status
          }
        }
      }
        `;

      cy.postGQL(gqlQuery).then((res) => {
        // should be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(true);

        // should have errors
        assert.notExists(
          res.body.errors,
          `One or more errors ocuured while executing query: ${gqlQuery}`
        );

        // has data
        assert.exists(res.body.data);

        // assertions
        assert.isNotNull(res.body.data.capturePayment);
        assert.isNotNull(res.body.data.capturePayment.code);
        assert.isNull(res.body.data.capturePayment.error);
        assert.equal(
          res.body.data.capturePayment.code,
          "SUCCESS",
          "Code is not SUCCESS"
        );
      });
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `mutation {
            capturePayment(input: {
              paymentId: "19455a21-94ef-48ee-9e97-6f27d99c470b"
              amounts: {
                amount: 424
                currency: USD
              }
            })
          }
            `;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if argument null is provided", () => {
    const gqlQuery = `mutation {
        capturePayment(input: null)
        {
          code
          message
          error
          payment {
            status
          }
        }
      }
        `;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should fail if no argument is provided", () => {
    const gqlQuery = `mutation {
        capturePayment
        {
          code
          message
          error
          payment {
            status
          }
        }
      }
        `;

    cy.postGQL(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });
});
