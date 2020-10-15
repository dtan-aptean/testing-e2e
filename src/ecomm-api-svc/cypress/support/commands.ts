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

// Checks for custom Data. TODO: Add functionality for use with mutations, ex: matching data
Cypress.Commands.add("checkCustomData", (res, dataPath) => {
    const nodesPath = res.body.data[dataPath].nodes;
    nodesPath.forEach((item) => {
        expect(item).to.have.property('customData');
        // Currently only checks for property
        // TODO: Add functionality for mutation use
    });
});

// Validates the values field for checkoutAttributes and productAttributes
Cypress.Commands.add("validateValues", (res, dataPath) => {
    if (res.body.data[dataPath].nodes.length > 0) {
        const nodesPath = res.body.data[dataPath].nodes;
        nodesPath.forEach((item) => {
            // has values field
            expect(item).to.have.property('values');
            assert.exists(item.values);
            // validate values as an array
            assert.isArray(item.values);
            expect(item.values.length).to.be.gte(1);
            item.values.forEach((val) => {
                expect(val).to.have.property('displayOrder');
                if (val.displayOrder !== null) {
                    expect(val.displayOrder).to.be.a('number');
                }
                expect(val).to.have.property('isPreselected');
                if (val.isPreselected !== null) {
                    expect(val.isPreselected).to.be.a('boolean');
                }
                expect(val).to.have.property('name');
                if (val.name !== null) {
                    expect(val.name).to.be.a('string');
                }
                expect(val).to.have.property('priceAdjustment');
                if (val.priceAdjustment !== null) {
                    expect(val.priceAdjustment).to.be.a('number');
                }
                expect(val).to.have.property('weightAdjustment');
                if (val.weightAdjustment !== null) {
                    expect(val.weightAdjustment).to.be.a('number');
                }
                if (dataPath === "productAttributes") {
                    expect(val).to.have.property('cost');
                    if (val.cost !== null) {
                        expect(val.cost).to.be.a('number');
                    }
                }
            });
        });    
    }
});