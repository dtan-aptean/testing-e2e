// -- This will post GQL query --
Cypress.Commands.add('postGQL', query => {
    return cy.request({
      method: 'POST',
      url: '/graphql',
      headers: {
        'x-aptean-apim': Cypress.env('x-aptean-apim'),
        'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
      },
      body: { query },
      failOnStatusCode: false,
      timeout: 5000,
      retryOnNetworkFailure: true,
    });
});

// Tests the standard query response for standard valid data
Cypress.Commands.add('validateQueryRes', (gqlQuery, res, dataPath: string) => {
    // should be 200 ok
    cy.expect(res.isOkStatusCode).to.be.equal(true);
    
    // no errors
    assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

    // has data
    assert.exists(res.body.data);
    // validate data types
    assert.isArray(res.body.data[dataPath].edges);
    assert.isArray(res.body.data[dataPath].nodes);
    assert.isObject(res.body.data[dataPath].pageInfo);
    assert.isNotNaN(res.body.data[dataPath].totalCount);
});

// Tests the response for errors. Use when we expect it to fail
Cypress.Commands.add("confirmError", (res) => {
    // should not be 200 ok
    cy.expect(res.isOkStatusCode).to.be.equal(false);

    // should have errors
    assert.exists(res.body.errors);
  
    // no data
    assert.notExists(res.body.data);
});

// Tests the response for errors. Should specifically use when we omit the orderBy input
Cypress.Commands.add("confirmOrderByError", (res) => {
    //debugger;
    cy.expect(res.isOkStatusCode).to.be.equal(false);
    // No data
    assert.notExists(res.body.data);
    // has errors
    assert.exists(res.body.errors);
    assert.isArray(res.body.errors);
    expect(res.body.errors.length).to.be.gte(1);
    if (res.body.errors.length === 1) {
        expect(res.body.errors[0]).to.have.nested.property('extensions.code', "GRAPHQL_VALIDATION_FAILED");
        const message = res.body.errors[0].message;
        expect(message).to.include("required");
        expect(message).to.include("orderBy");
    }
});

// Confirms that the number of nodes matches the total count
Cypress.Commands.add("confirmCount", (res, dataPath) => {
    // should be 200 ok
    cy.expect(res.isOkStatusCode).to.be.equal(true);
    // no errors
    assert.notExists(res.body.errors);
    // has data
    assert.exists(res.body.data);
    // Confirm count
    const totalCount = res.body.data[dataPath].totalCount;
    const nodeCount = res.body.data[dataPath].nodes.length;
    expect(nodeCount).to.be.eql(totalCount);
});