// -- This will post GQL query --
Cypress.Commands.add('postGQL', query => {
    Cypress.log({
        name: "postGQL",
        consoleProps: () => {
            return {
                "Query Body": query,
                "Headers": `"x-aptean-apim": ${Cypress.env('x-aptean-apim')} \n\t\t\t "x-aptean-tenant": ${Cypress.env('x-aptean-tenant')}`, 
            };
        },
    });
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
    Cypress.log({
        name: "validateQueryRes",
        message: `Validate response for ${dataPath}`,
        consoleProps: () => {
            return {
                "GQL Query": gqlQuery,
                "Response": res,
                "Query name / dataPath": dataPath
            };
        },
    });
    // should be 200 ok
    expect(res.isOkStatusCode).to.be.equal(true);
    
    // no errors
    assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

    // has data
    assert.exists(res.body.data);
    // validate data types
    assert.isArray(res.body.data[dataPath].edges);
    assert.isArray(res.body.data[dataPath].nodes);
    assert.isObject(res.body.data[dataPath].pageInfo);
    assert.isNotNaN(res.body.data[dataPath].totalCount);
    expect(res.body.data[dataPath].edges.length).to.be.eql(res.body.data[dataPath].nodes.length, "Expect edge length to equal nodes length");
});

// Post query and do standard validation
Cypress.Commands.add("postAndValidate", (gqlQuery: string, dataPath: string) => {
    Cypress.log({
        name: "postAndValidate",
        message: dataPath,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name / path": dataPath
            };
        },
    });
    return cy.postGQL(gqlQuery).then((res) => {
        cy.validateQueryRes(gqlQuery, res, dataPath).then(() => {
            return res;
        });
    });
});

// Tests the response for errors. Use when we expect it to fail
Cypress.Commands.add("confirmError", (res) => {
    Cypress.log({
        name: "confirmError",
        message: `Confirm expected error are present`,
        consoleProps: () => {
            return {
                "Response": res,
            };
        },
    });
    // should not be 200 ok
    expect(res.isOkStatusCode).to.be.equal(false);

    // should have errors
    assert.exists(res.body.errors);
  
    // no data
    assert.notExists(res.body.data);
});

// Post Query and confirm it has errors
Cypress.Commands.add("postAndConfirmError", (gqlQuery: string) => {
    Cypress.log({
        name: "postAndConfirmError",
        consoleProps: () => {
            return {
                "Query Body": gqlQuery
            };
        },
    });
    return cy.postGQL(gqlQuery).then((res) => {
        cy.confirmError(res).then(() => {
            return res;
        });
    });
});

// Tests the response for errors. Should specifically use when we omit the orderBy input
Cypress.Commands.add("confirmOrderByError", (res) => {
    Cypress.log({
        name: "confirmOrderByError",
        displayName: "confirmOBE",
        message: `Confirm orderBy error is present`,
        consoleProps: () => {
            return {
                "Response": res,
            };
        },
    });
    expect(res.isOkStatusCode).to.be.equal(false);
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

// Confirms that the number of nodes/edges matches the total count
Cypress.Commands.add("confirmCount", (res, dataPath: string) => {
    Cypress.log({
        name: "confirmCount",
        message: dataPath,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath
            };
        },
    });
    const totalCount = res.body.data[dataPath].totalCount;
    const nodeCount = res.body.data[dataPath].nodes.length;
    expect(nodeCount).to.be.eql(totalCount);
    const edgeCount = res.body.data[dataPath].edges.length;
    expect(edgeCount).to.be.eql(totalCount);
});

// Checks for custom Data. TODO: Add functionality for use with mutations, ex: matching data
Cypress.Commands.add("checkCustomData", (res, dataPath: string) => {
    Cypress.log({
        name: "checkCustomData",
        message: `Confirm ${dataPath} has customData property`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath
            };
        },
    });
    const nodesPath = res.body.data[dataPath].nodes;
    nodesPath.forEach((item) => {
        expect(item).to.have.property('customData');
        // Currently only checks for property
        // TODO: Add functionality for mutation use
    });
});

// Validates the values field for checkoutAttributes and productAttributes
Cypress.Commands.add("validateValues", (res, dataPath: string) => {
    Cypress.log({
        name: "validateValues",
        message: `validate values field for ${dataPath}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath
            };
        },
    });
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

// Gets the total count of the query and returns it, while wrapping the nodes 
Cypress.Commands.add("returnCount", (gqlQuery: string, dataPath: string) => {
    Cypress.log({
        name: "returnCount",
        message: `Get totalCount of ${dataPath}`,
        consoleProps: () => {
            return {
                "Query body": gqlQuery,
                "Query name / dataPath": dataPath
            };
        },
    });
    return cy.postAndValidate(gqlQuery, dataPath).then((res) => {
        cy.wrap(res.body.data[dataPath]).as('orgData');
        return cy.wrap(res.body.data[dataPath].totalCount);
    });
});

// Validates the nodes, edges, and pageInfo of a basic query using first OR last, and orderBy
// Compares it to a vanilla query using orderBy, so must call returnCount first
Cypress.Commands.add("verifyFirstOrLast", (res, dataPath: string, value: number, firstOrLast: string) => {
    Cypress.log({
        name: "verifyFirstOrLast",
        message: `${dataPath}, ${firstOrLast}: ${value}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "First or Last input": firstOrLast,
                "First/Last value": value
            };
        },
    });
    // Make the test fail if we aren't passed a usable value for firstOrLast
    cy.wrap(firstOrLast).should((fOL) => {
        assert.isString(fOL);
        if (fOL.toLowerCase() === "first") {
            expect(fOL.toLowerCase()).to.be.eql("first");
        } else {
            expect(fOL.toLowerCase()).to.be.eql("last");
        }
    });
    const nodes = res.body.data[dataPath].nodes;
    const edges = res.body.data[dataPath].edges;
    const pageInfo = res.body.data[dataPath].pageInfo;
    expect(nodes.length).to.be.eql(value);
    expect(edges.length).to.be.eql(value);
    cy.get('@orgData').then((orgRes) => {
        var orgEdges = orgRes.edges;
        var orgNodes = orgRes.nodes;
        expect(orgEdges.length).to.be.greaterThan(value);
        expect(orgNodes.length).to.be.greaterThan(value);
        var orgPageInfo = orgRes.pageInfo;
        if (firstOrLast.toLowerCase() === "first") {
            expect(pageInfo.startCursor).to.be.eql(orgPageInfo.startCursor);
            expect(pageInfo.endCursor).not.to.be.eql(orgPageInfo.endCursor);
            expect(pageInfo.endCursor).to.be.eql(orgEdges[value - 1].cursor);
            for(var i = 0; i < value; i++){
                expect(nodes[i].id).to.be.eql(orgNodes[i].id);
                expect(edges[i].cursor).to.be.eql(orgEdges[i].cursor);
                expect(edges[i].node.id).to.be.eql(orgEdges[i].node.id);
                expect(nodes[i].id).to.be.eql(orgEdges[i].node.id);
            }
        } else if (firstOrLast.toLowerCase() === "last") {
            var f = value + 1;
            if (value === orgRes.totalCount / 2){
                f = value;
            }
            expect(pageInfo.startCursor).not.to.be.eql(orgPageInfo.startCursor);
            expect(pageInfo.startCursor).to.be.eql(orgEdges[f].cursor);
            expect(pageInfo.endCursor).to.be.eql(orgPageInfo.endCursor);
            for(var i = 0; i < value; i++){
                expect(nodes[i].id).to.be.eql(orgNodes[f].id);
                expect(edges[i].cursor).to.be.eql(orgEdges[f].cursor);
                expect(edges[i].node.id).to.be.eql(orgEdges[f].node.id);
                expect(nodes[i].id).to.be.eql(orgEdges[f].node.id);
                f++;
            }
        } 
    });
});

// Verifies that the pageInfo matches the cursors
Cypress.Commands.add("verifyPageInfo", (res, dataPath: string, expectNext?: boolean, expectPrevious?: boolean) => {
    Cypress.log({
        name: "verifyPageInfo",
        message: `${dataPath}, expectNext: ${expectNext}, expectPrevious: ${expectPrevious}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "hasNextPage expected to be": expectNext,
                "hasPreviousPage expected to be": expectPrevious
            };
        },
    });
    const pageInfo = res.body.data[dataPath].pageInfo;
    const edges = res.body.data[dataPath].edges;
    if (expectNext === false) {
        expect(pageInfo.hasNextPage).to.be.false;
    } else if (expectNext === true) {
        expect(pageInfo.hasNextPage).to.be.true;
    }
    if (expectPrevious === false) {
        expect(pageInfo.hasPreviousPage).to.be.false;
    } else if (expectPrevious === true) {
        expect(pageInfo.hasPreviousPage).to.be.true;
    }
    expect(pageInfo.startCursor).to.be.eql(edges[0].cursor);
    expect(pageInfo.endCursor).to.be.eql(edges[edges.length-1].cursor);
});

// Runs the query and grabs a random node to take the name from. Query body should look for name
Cypress.Commands.add('returnRandomName', (gqlQuery: string, dataPath: string) => {
    Cypress.log({
        name: "returnRandomName",
        message: dataPath,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name / dataPath": dataPath
            };
        },
    });
    return cy.postAndValidate(gqlQuery, dataPath).then((res) => {
        var randomIndex = 0;
        const totalCount = res.body.data[dataPath].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[dataPath].nodes[randomIndex];
        const duplicateArray = res.body.data[dataPath].nodes.filter((val) => {
            return val.name === randomNode.name;
        });
        if (duplicateArray.length > 1) {
            const uniqueArray = res.body.data[dataPath].nodes.filter((val) => {
                return val.name !== randomNode.name;
            });
            randomIndex = 0;
            if (uniqueArray.length > 1) {
                randomIndex = Cypress._.random(0, uniqueArray.length - 1);
            }
            randomNode = uniqueArray[randomIndex];
        }
        return cy.wrap(randomNode.name);
    });
});

// Validates that a query with searchString returned the node with the correct name or nodes that contain the string
Cypress.Commands.add("validateNameSearch", (res, dataPath: string, searchValue: string, fullName: boolean) => {
    Cypress.log({
        name: "validateNameSearch",
        message: `${dataPath}, searchString: ${searchValue}, fullName: ${fullName}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "searchString": searchValue,
                "fullName": fullName
            };
        },
    });
    const totalCount = res.body.data[dataPath].totalCount;
    const nodes = res.body.data[dataPath].nodes;
    const edges = res.body.data[dataPath].edges;
    if (fullName) {
        expect(totalCount).to.be.eql(1);
        expect(nodes.length).to.be.eql(1);
        expect(edges.length).to.be.eql(1);
        expect(nodes[0].name).to.be.eql(searchValue);
        expect(edges[0].node.name).to.be.eql(searchValue);
    } else {
        expect(totalCount).to.be.eql(nodes.length);
        expect(totalCount).to.be.eql(edges.length);
        for (var i = 0; i < nodes.length; i++) {
            expect(nodes[i].name).to.include(searchValue, `Node[${i}]`);
            expect(edges[i].node.name).to.include(searchValue, `Edge[${i}]`);
        }
    }
});

// Grabs a random cursor and returns it while wrapping the data.
// laterHalf controls which half of the edges array the cursor is taken from
Cypress.Commands.add("returnRandomCursor", (gqlQuery: string, dataPath: string, laterHalf: boolean) => {
    Cypress.log({
        name: "returnRandomCursor",
        message: dataPath,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name / dataPath": dataPath
            };
        },
    });
    return cy.postAndValidate(gqlQuery, dataPath).then((res) => {
        var randomIndex = 0;
        const totalCount = res.body.data[dataPath].totalCount;
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with"); // If there's only one item, we can't do any pagination
        if (totalCount > 2) {
            const lowerBound = laterHalf ? Math.ceil((totalCount - 1) / 2) : 0;
            const upperBound = laterHalf ? totalCount - 1 : Math.floor((totalCount - 1) / 2);
            Cypress.log({message: `Indices ${lowerBound}, ${upperBound}`});
            randomIndex = Cypress._.random(lowerBound, upperBound);
        } else if (totalCount === 2) {
            randomIndex = laterHalf ? 1 : 0;
        }
        Cypress.log({message: `Random Index ${randomIndex}`});
        const randomEdge = res.body.data[dataPath].edges[randomIndex];
        cy.wrap(res.body.data[dataPath]).as('orgData');
        cy.wrap(res.body.data[dataPath].totalCount).as('orgCount');
        cy.wrap(randomIndex).as('cursorIndex');
        return cy.wrap(randomEdge.cursor);
    });
});

// Confirm that the new query respose does not contain the before/after cursor and returned fewer items than the original
Cypress.Commands.add('confirmCursorEffects', (newData, data, cursorIndex: number) => {
    Cypress.log({
        name: "confirmCursorEffects",
        message: cursorIndex,
        consoleProps: () => {
            return {
                "New query": newData,
                "Original query": data,
                "Cursor index": cursorIndex
            };
        },
    });

    const { edges, nodes, totalCount } = newData;
    const orgCount = data.totalCount;
    expect(totalCount).to.be.lessThan(orgCount);
    const orgEdges = data.edges;
    expect(edges).not.to.deep.include(orgEdges[cursorIndex]);
    const orgNodes = data.nodes;
    expect(nodes).not.to.deep.include(orgNodes[cursorIndex]);
});

// Validate the response from a query using before. Can optionally validate first/last input as well.
Cypress.Commands.add("validateBeforeCursor", (newData, data, index, firstLast?: string, value?: number) => {
    Cypress.log({
        name: "validateBeforeCursor",
        message: `${index} ${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
        consoleProps: () => {
            return {
                "New query data": newData,
                "Old query data": data,
                "Cursor index": index,
                "First or Last input": firstLast,
                "First or Last value": value
            };
        },
    });

    const {edges, nodes, totalCount, pageInfo} = newData;
    expect(totalCount).to.be.eql(index);
    var includedStart = 0;
    var excludedStart = index;
    var sCursor = data.pageInfo.startCursor;
    var eCursor = data.pageInfo.endCursor;
    if ((firstLast === "first" || firstLast === "last") && value) {
        assert.isNotNaN(value);
        expect(nodes.length).to.be.eql(value);
        expect(edges.length).to.be.eql(value);
        if (firstLast === "first") {
            excludedStart = value;
            eCursor = data.edges[index - value].cursor;
        } else if (firstLast === "last") {
            includedStart = totalCount - value;
            sCursor = data.edges[includedStart].cursor;
        }
    }
    for (var i = includedStart; i < excludedStart; i++) {
        expect(nodes).to.deep.include(data.nodes[i]);
        expect(edges).to.deep.include(data.edges[i]);
    }
    for (var f = excludedStart; f < data.length; f++) {
        expect(nodes).not.to.deep.include(data.nodes[f]);
        expect(edges).not.to.deep.include(data.edges[f]);
    }
    if (firstLast === "last" && value) {
        for (var g = 0; g < includedStart; g++) {
            expect(nodes).not.to.deep.include(data.nodes[g]);
            expect(edges).not.to.deep.include(data.edges[g]);
        }
    }
    expect(pageInfo.startCursor).to.be.eql(sCursor);
    expect(pageInfo.endCursor).not.to.eql(eCursor);
});

// Validate the response from a query using after. Can optionally validate first/last input as well.
Cypress.Commands.add("validateAfterCursor", (newData, data, index, firstLast?: string, value?: number) => {
    Cypress.log({
        name: "validateAfterCursor",
        message: `${index} ${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
        consoleProps: () => {
            return {
                "New query data": newData,
                "Old query data": data,
                "Cursor index": index,
                "First or Last input": firstLast,
                "First or Last value": value
            };
        },
    });

    const {edges, nodes, totalCount, pageInfo} = newData;
    expect(totalCount).to.be.eql(data.totalCount - (index + 1));
    var includedStart = index + 1;
    var excludedAfter = data.length;
    var sCursor = data.pageInfo.startCursor;
    var eCursor = data.pageInfo.endCursor;
    if ((firstLast === "first" || firstLast === "last") && value) {
        assert.isNotNaN(value);
        expect(nodes.length).to.be.eql(value);
        expect(edges.length).to.be.eql(value);
        if (firstLast === "first") {
            excludedAfter = (index + 1) + value;
            eCursor = data.edges[index + value].cursor;
        } else if (firstLast === "last") {
            includedStart = index + value;
            sCursor = data.edges[includedStart].cursor;
        }
    }
    for (var i = includedStart; i < excludedAfter; i++) {
        expect(nodes).to.deep.include(data.nodes[i]);
        expect(edges).to.deep.include(data.edges[i]);
    }
    for(var f = 0; f < includedStart; f++) {
        expect(nodes).not.to.deep.include(data.nodes[f]);
        expect(edges).not.to.deep.include(data.edges[f]);
    }
    if (firstLast === "first" && value) {
        for (var g = excludedAfter; g < data.length; g++) {
            expect(nodes).not.to.deep.include(data.nodes[g]);
            expect(edges).not.to.deep.include(data.edges[g]);
        }
    }
    expect(pageInfo.startCursor).not.to.be.eql(sCursor);
    expect(pageInfo.endCursor).to.eql(eCursor);
});

// Should be called after returnRandomCursor
// Confirms that the cursor worked by calling confirmCursorEffects, then does specilized validation for before/after cursor
Cypress.Commands.add("validateCursor", (res, dataPath: string, beforeAfter: string, firstLast?: string, value?: number) => {
    Cypress.log({
        name: "validateCursor",
        message: `${dataPath}, ${beforeAfter} ${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
        consoleProps: () => {
            return {
                "New query data": res,
                "Query name / dataPath": dataPath,
                "Cursor type": beforeAfter,
                "First or Last input": firstLast,
                "First or Last value": value
            };
        },
    });

    const edges = res.body.data[dataPath].edges;
    const nodes = res.body.data[dataPath].nodes;
    const totalCount = res.body.data[dataPath].totalCount;
    const pageInfo = res.body.data[dataPath].pageInfo;
    cy.get('@cursorIndex').then((index: number) => {
        cy.get('@orgData').then((data) => {
            cy.confirmCursorEffects({edges, nodes, totalCount}, data, index).then(() => {
                if (beforeAfter === "before") {
                    cy.validateBeforeCursor({edges, nodes, totalCount, pageInfo}, data, index, firstLast, value);
                } else if (beforeAfter === "after") {
                    cy.validateAfterCursor({edges, nodes, totalCount, pageInfo}, data, index, firstLast, value);
                }
            });
        });
    });
});