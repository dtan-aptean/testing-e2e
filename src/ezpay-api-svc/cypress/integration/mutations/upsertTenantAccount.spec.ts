/// <reference types="cypress" />

describe('Mutation: upsertTenantAccount', () => {
  it('should pass if the mutation upsert a tenant account with all arguments', () => {
    const gqlQuery = `mutation{
      upsertTenantAccount(input:{
        country:US,
        token:"",
        primaryAccountHolderEmail:"John.Doe@aptean.com",
        tosAcceptanceTime:"",
        tosAcceptanceUserAgent:"",
        accountName:"Joh Doe Test Account",
        accountDescription:"Description Long Text",
        statementDescription:"Statement Long Description",
        refundPolicy:"Refund policy of the John Doe merchant account"
      }){
        code
        message
        error
      }
    }`;

    cy.postGQLBearer(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertTenantAccount);
      assert.isNotNull(res.body.data.upsertTenantAccount.code);
      assert.isNull(res.body.data.upsertTenantAccount.error, res.body.data.upsertTenantAccount.message);
      assert.equal(res.body.data.upsertTenantAccount.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should pass if input argument is empty', () => {
    const gqlQuery = `mutation {
      upsertTenantAccount(
        input: {}
      ) {
        code
        message
        error
      }
    }`;

    cy.postGQLBearer(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // should have errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.upsertTenantAccount);
      assert.isNotNull(res.body.data.upsertTenantAccount.code);
      assert.isNull(res.body.data.upsertTenantAccount.error, res.body.data.upsertTenantAccount.message);
      assert.equal(res.body.data.upsertTenantAccount.code, 'SUCCESS', 'Code is not SUCCESS');
    });
  });

  it('should fail if no return type is provided', () => {
    const gqlQuery = `mutation {
      upsertTenantAccount(
        input: {}
      ) {}
    }`;

    cy.postGQLBearer(gqlQuery).then(res => {
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
      upsertTenantAccount {
        code
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
      upsertTenantAccount(
        input: {}
      ) {
        code
      }
    }`;

    cy.postGQLBearer(gqlQuery).then(res => {
      // should be 200 ok
      cy.expect(res.isOkStatusCode).to.be.equal(true);

      // no errors
      assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

      // has data
      assert.exists(res.body.data);
      assert.exists(res.body.data.upsertTenantAccount);
      assert.exists(res.body.data.upsertTenantAccount.code);
    });
  });
});
