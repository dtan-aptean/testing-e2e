/// <reference types="cypress" />

describe('Mutation: deletePerson', () => {
  it('should pass if the mutation delete the person by Id provided', () => {
    const gqlQuery = `mutation {
      deletePerson(input: { id: "f86fa1dd-bde2-4d11-b059-f6b94ff2432d" }) {
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
      assert.isNotNull(res.body.data.deletePerson);
      assert.isNotNull(res.body.data.deletePerson.code);
      assert.isNull(res.body.data.deletePerson.error, res.body.data.deletePerson.message);
      assert.equal(res.body.data.deletePerson.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `mutation {
      deletePerson(input: { id: "f86fa1dd-bde2-4d11-b059-f6b94ff2432d" }) {
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
      deletePerson(input: { id: "f86fa1dd-bde2-4d11-b059-f6b94ff2432d" }) {
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
      assert.exists(res.body.data.deletePerson);
      assert.exists(res.body.data.deletePerson.code);
    });
  });
});
