/// <reference types="cypress" />

describe('Mutation: upsertPayoutSettings', () => {
  it('should pass if the mutation upsert the payment settings with token', () => {
    const gqlQuery = `mutation {
      upsertPayoutSettings(input: { token: "" }) {
        code
        message
        error
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPayoutSettings);
      assert.isNotNull(res.body.data.upsertPayoutSettings.code);
      assert.isNull(res.body.data.upsertPayoutSettings.error, res.body.data.upsertPayoutSettings.message);
      assert.equal(res.body.data.upsertPayoutSettings.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should fail if input argument is empty', () => {
    const gqlQuery = `mutation {
      upsertPayoutSettings(input: {}) {
        code
        message
        error
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // has data
      assert.notExists(res.body.data);

      // assertions
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `mutation {
      upsertPayoutSettings(input: { token: "" }) {
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it('should fail if no argument is provided', () => {
    const gqlQuery = `mutation {
      upsertPayoutSettings {
        code
        message
        error
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it('should pass if the mutation has at least one return type', () => {
    const gqlQuery = `mutation {
      upsertPayoutSettings(input: { token: "" }) {
        code
      }
    }`;

    cy.postGQL(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPayoutSettings);
      assert.exists(res.body.data.upsertPayoutSettings.code);
    });
  });
});
