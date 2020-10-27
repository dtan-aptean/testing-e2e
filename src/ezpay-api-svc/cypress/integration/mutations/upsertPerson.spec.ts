/// <reference types="cypress" />

describe('Mutation: upsertPerson', () => {
  let personId = '';

  afterEach(() => {
    // delete created person
    const gqlQuery = `mutation {
      deletePerson(input: { id: "${personId}" }) {
        code
        message
        error
      }
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
    });
  });

  it('should pass if the mutation create a person with only email argument', () => {
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          email: "John.Doe.One@aptean.com"
        }
      ) {
        code
        message
        error
        id
      }
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPerson);
      assert.isNotNull(res.body.data.upsertPerson.code);
      assert.isNotNull(res.body.data.upsertPerson.id);
      assert.isNull(res.body.data.upsertPerson.error, res.body.data.upsertPerson.message);
      assert.equal(res.body.data.upsertPerson.code, 'SUCCESS', 'Code is not SUCCESS');

      const {
        body: {
          data: {
            upsertPerson: { id },
          },
        },
      } = res;
      // assign id to delete it post test
      personId = id;
    });
  });

  it('should pass if the mutation create a person with all valid arguments', () => {
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          firstName:"John"
          lastName:"Doe"
          email: "John.Doe@aptean.com"
          role: ADMIN
          deleted: false
        }
      ) {
        code
        message
        error
        id
      }
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertPerson);
      assert.isNotNull(res.body.data.upsertPerson.code);
      assert.isNotNull(res.body.data.upsertPerson.id);
      assert.isNull(res.body.data.upsertPerson.error, res.body.data.upsertPerson.message);
      assert.equal(res.body.data.upsertPerson.code, 'SUCCESS', 'Code is not SUCCESS');

      const {
        body: {
          data: {
            upsertPerson: { id },
          },
        },
      } = res;
      // assign id to delete it post test
      personId = id;
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          email: "John.Doe.One@aptean.com"
        }
      ) {}
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
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
      upsertPerson(
        input: {
          email: "John.Doe.One@aptean.com"
        }
      ) {
        code
      }
    }`;

    cy.postGQLWithBearerToken(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPerson);
      assert.exists(res.body.data.upsertPerson.code);
    });
  });
});
