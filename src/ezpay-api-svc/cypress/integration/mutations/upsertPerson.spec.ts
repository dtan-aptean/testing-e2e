/// <reference types="cypress" />

describe("Mutation: upsertPerson", () => {
  it("should pass if the mutation create a person with only email argument", () => {
    let personEmail = makeEmail();
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          email: "${personEmail}"
        }
      ) {
        code
        message
        error
        id
      }
    }`;

    cy.postGQLBearer(gqlQuery).then((res) => {
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
      assert.isNotNull(res.body.data.upsertPerson);
      assert.isNotNull(res.body.data.upsertPerson.code);
      assert.isNotNull(res.body.data.upsertPerson.id);
      assert.isNull(
        res.body.data.upsertPerson.error,
        res.body.data.upsertPerson.message
      );
      assert.equal(
        res.body.data.upsertPerson.code,
        "SUCCESS",
        "Code is not SUCCESS"
      );

      const {
        body: {
          data: {
            upsertPerson: { id },
          },
        },
      } = res;

      // delete created person
      cy.deletePerson(id).then((res) => {
        cy.expect(res.isOkStatusCode).to.be.equal(true);
      });
    });
  });

  it("should pass if the mutation create a person with all valid arguments", () => {
    let personEmail = makeEmail();
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          firstName:"John"
          lastName:"Doe"
          email: "${personEmail}"
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

    cy.postGQLBearer(gqlQuery).then((res) => {
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
      assert.isNotNull(res.body.data.upsertPerson);
      assert.isNotNull(res.body.data.upsertPerson.code);
      assert.isNotNull(res.body.data.upsertPerson.id);
      assert.isNull(
        res.body.data.upsertPerson.error,
        res.body.data.upsertPerson.message
      );
      assert.equal(
        res.body.data.upsertPerson.code,
        "SUCCESS",
        "Code is not SUCCESS"
      );

      const {
        body: {
          data: {
            upsertPerson: { id },
          },
        },
      } = res;

      cy.deletePerson(id).then((res) => {
        cy.expect(res.isOkStatusCode).to.be.equal(true);
      });
    });
  });

  it("should fail if no return type is provided", () => {
    let personEmail = makeEmail();
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          email: "${personEmail}"
        }
      ) {}
    }`;

    cy.postGQLBearer(gqlQuery).then((res) => {
      // should not be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(false);

      // should have errors
      assert.exists(res.body.errors);

      // no data
      assert.notExists(res.body.data);
    });
  });

  it("should pass if the mutation has at least one return type", () => {
    let personEmail = makeEmail();
    const gqlQuery = `mutation {
      upsertPerson(
        input: {
          email: "${personEmail}"
        }
      ) {
        code
      }
    }`;

    cy.postGQLBearer(gqlQuery).then((res) => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(
        res.body.errors,
        `One or more errors ocuured while executing query: ${gqlQuery}`
      );

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertPerson);
      assert.exists(res.body.data.upsertPerson.code);
    });
  });
});

function makeEmail() {
  var strValues = "abcdefg12345";
  var strEmail = "";
  var strTmp;
  for (var i = 0; i < 10; i++) {
    strTmp = strValues.charAt(Math.round(strValues.length * Math.random()));
    strEmail = strEmail + strTmp;
  }
  strTmp = "";
  strEmail = strEmail + "@";
  for (var j = 0; j < 8; j++) {
    strTmp = strValues.charAt(Math.round(strValues.length * Math.random()));
    strEmail = strEmail + strTmp;
  }
  strEmail = strEmail + ".com";
  return strEmail;
}
