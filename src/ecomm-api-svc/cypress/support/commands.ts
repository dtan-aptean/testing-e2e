// -- This will post GQL query --
Cypress.Commands.add('postGQL', query => {
    Cypress.log({
        name: "postGQL",
        consoleProps: () => {
            return {
                "Query/Mutation Body": query,
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
      //timeout: 5000,
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

// Test the standard mutation response for standard valid data
Cypress.Commands.add("validateMutationRes", (gqlMut: string, res, mutationName: string, dataPath: string) => {
    Cypress.log({
        name: "validateMutationRes",
        message: `Validate response for ${dataPath}`,
        consoleProps: () => {
            return {
                "GQL Mutation": gqlMut,
                "Response": res,
                "Item path": dataPath
            };
        },
    });

    // should be 200 ok
    expect(res.isOkStatusCode).to.be.equal(true);

    // Craft error message, so that we have good visibility on issues that cause us to fail
    var errorMessage = `No errors while executing mutation: \n${gqlMut}`;
    if (res.body.errors) {
        errorMessage = `One or more errors ocuured while executing mutation: \n${gqlMut}`;
        res.body.errors.forEach((item) => {
            errorMessage = errorMessage + " \n" + item.extensions.code + ". " + item.message;
        });
        errorMessage = errorMessage + "\n";
    }
    // shoule be no errors
    assert.notExists(res.body.errors, errorMessage);
    // has data
    assert.exists(res.body.data);
    // validate data types and values
    assert.isString(res.body.data[mutationName].code);
    expect(res.body.data[mutationName].code).not.to.eql("ERROR");
    assert.isString(res.body.data[mutationName].message);
    // TODO: Check that message matches (ex: code is success, message should confirm that with created or updated)
    assert.isNull(res.body.data[mutationName].error);
    assert.isObject(res.body.data[mutationName][dataPath]);
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

// Post mutation and validate
Cypress.Commands.add("postMutAndValidate", (gqlMut: string, mutationName: string, dataPath: string) => {
    Cypress.log({
        name: "postMutAndValidate",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation Body": gqlMut,
                "Mutation Name": mutationName,
                "Item path": dataPath
            };
        },
    });
    return cy.postGQL(gqlMut).then((res) => {
        cy.validateMutationRes(gqlMut, res, mutationName, dataPath).then(() => {
            return res;
        });
    });
});

// Post and confirm Deletion
Cypress.Commands.add("postAndConfirmDelete", (gqlMut: string, mutationName: string) => {
    Cypress.log({
        name: "postAndConfirmDelete",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation Body": gqlMut,
                "Mutation Name": mutationName
            };
        },
    });
    return cy.postGQL(gqlMut).then((res) => {
        // should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true);

        // Craft error message, so that we have good visibility on issues that cause us to fail
        var errorMessage = `No errors while executing mutation: \n${gqlMut}`;
        if (res.body.errors) {
            errorMessage = `One or more errors ocuured while executing mutation: \n${gqlMut}`;
            res.body.errors.forEach((item) => {
                errorMessage = errorMessage + " \n" + item.extensions.code + ". " + item.message;
            });
            errorMessage = errorMessage + "\n";
        }
        // shoule be no errors
        assert.notExists(res.body.errors, errorMessage);
        // has data
        assert.exists(res.body.data);
        // validate data types and values
        assert.isString(res.body.data[mutationName].code);
        expect(res.body.data[mutationName].code).not.to.eql("ERROR");
        assert.isString(res.body.data[mutationName].message);
        assert.isNull(res.body.data[mutationName].error);
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

// Tests the response for errors. Use when we expect it to fail
// For use with mutations that still return data and an okay status when erroring
Cypress.Commands.add("confirmMutationError", (res, mutationName: string, dataPath: string) => {
    Cypress.log({
        name: "confirmMutationError",
        message: `Confirm expected error are present`,
        consoleProps: () => {
            return {
                "Response": res,
            };
        },
    });
    // should have errors
    assert.exists(res.body.errors);
    // should have data
    assert.exists(res.body.data);
    // Check data for errors
    // validate data types and values
    assert.isString(res.body.data[mutationName].code);
    expect(res.body.data[mutationName].code).to.eql("ERROR");
    assert.isString(res.body.data[mutationName].message);
    expect(res.body.data[mutationName].message).to.include('Error');
    assert.notExists(res.body.data[mutationName][dataPath]);
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

Cypress.Commands.add("postAndConfirmMutationError", (gqlMutation: string, mutationName: string, dataPath: string) => {
    Cypress.log({
        name: "postAndConfirmMutationError",
        consoleProps: () => {
            return {
                "Mutation Body": gqlMutation,
                "Mutation Name": mutationName,
                "Data path": dataPath
            };
        },
    });
    return cy.postGQL(gqlMutation).then((res) => {
        cy.confirmMutationError(res, mutationName, dataPath).then(() => {
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

// Checks for customData property. If expectData and expectedData are included, will compare nodes' customData to the expectedData
Cypress.Commands.add("checkCustomData", (res, dataPath: string, expectData?: boolean, expectedData?) => {
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
        // Check that property exists
        expect(item).to.have.property('customData');
        // If we expect there to be custom data, check that it is there and matches
        if (expectData && expectedData) {
            expect(item.customData).to.be.eql(expectedData);
        }
    });
});

// Posts query and checks custom Data. Query body should have searchString for a specific item, and ask for id and customData
Cypress.Commands.add("postAndCheckCustom", (query: string, queryPath: string, id: string, customData) => {
    Cypress.log({
        name: "postAndCheckCustom",
        message: `Item's id: ${id}, query: ${queryPath}`,
        consoleProps: () => {
            return {
                "Query body": query,
                "Query name": queryPath,
                "Item's Id": id,
                "Custom Data": customData
            };
        },
    });
    cy.postGQL(query).then((res) => {
        // should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true);
        
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${query}`);

        // has data
        assert.exists(res.body.data);
        assert.isArray(res.body.data[queryPath].nodes);
        const nodes = res.body.data[queryPath].nodes;
        if (nodes.length === 1) {
            cy.checkCustomData(res, queryPath, true, customData);
        } else if (nodes.length > 1) {
            // Create a dummy object with the same structure as response for checkCustomData to look at
            const dummy = {body: {data: {}}};
            Object.defineProperty(dummy.body.data, queryPath, {value: {nodes: []}});
            // Look for the specific node we want
            const node = nodes.filter((item) => {
                return item.id === id;
            });
            if (node.length === 1) {
                // If found, push the node into our dummy object's nodes array
                dummy.body.data[queryPath].nodes.push(node[0]);
                // Pass our dummy object to checkCustomData in place of res
                cy.checkCustomData(dummy, queryPath, true, customData);
            }
        }
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

// Confirms the mutation data that you instruct it to. Checks descendents with the eql() which is a deep equal
Cypress.Commands.add("confirmMutationSuccess", (res, mutationName: string, dataPath: string, propNames: string[], values: []) => {
    Cypress.log({
        name: "confirmMutationSuccess",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation response": res,
                "Mutation name": mutationName,
                "Data path": dataPath,
                "Properties to check": propNames.toString(),
                "Expected Values": values.toString()
            };
        },
    });
    expect(propNames.length).to.be.eql(values.length, "Same number of properties and values given to function");
    var result = res.body.data[mutationName][dataPath];
    function matchObject (item, itemToMatch, parentProperty: string) {
        const props = Object.getOwnPropertyNames(itemToMatch);
        for (var p = 0; p < props.length; p++) {
            // For better documentation of the specific problem field if something isn't right
            const descendingPropName = `${parentProperty ? parentProperty + "." : ""}${props[p]}`; 
            if (itemToMatch[props[p]] && item[props[p]] === null) {
                assert.exists(item[props[p]], `${descendingPropName} should not be null`);
            }
            if (typeof itemToMatch[props[p]] === 'object') {
                matchObject(item[props[p]], itemToMatch[props[p]], descendingPropName);
            } else {
                expect(item[props[p]]).to.be.eql(itemToMatch[props[p]], `Verify ${descendingPropName}`);
            }
        }
    };
    function matchArray(resArray: [], matchArray: [], originalProperty: string) {
        expect(resArray.length).to.be.eql(matchArray.length, `Updated ${matchArray.length} items of ${originalProperty}`);
        for (var f = 0; f < matchArray.length; f++) {
            matchObject(resArray[f], matchArray[f], `${originalProperty}[${f}]`);
        }
    };
    for (var i = 0; i < propNames.length; i++) {
        if (values[i] && result[propNames[i]] === null) {
            assert.exists(result[propNames[i]], `${propNames[i]} should not be null`);
        }
        if (Array.isArray(values[i])) {
            matchArray(result[propNames[i]], values[i], propNames[i]);
        } else if (!!values[i] && typeof values[i] === 'object') {
            matchObject(result[propNames[i]], values[i], propNames[i]);
        } else {
            expect(result[propNames[i]]).to.be.eql(values[i], `Verifying ${propNames[i]}`);
        }
    }
});

// Queries for an item and if it doesn't find it, creates the item. Returns id of item
Cypress.Commands.add("searchOrCreate", (name: string, queryName: string, mutationName: string, mutationInput?: string) => {
    Cypress.log({
        name: "searchOrCreate",
        message: `"${name}", ${queryName}, ${mutationName}${mutationInput ? ", " + mutationInput : ""}`,
        consoleProps: () => {
            return {
                "searchString": name,
                "Query name": queryName,
                "Mutation Name": mutationName,
                "Extra input for Mutation": mutationInput
            };
        },
    });
    const searchQuery = `{
        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: TIMESTAMP}) {
            nodes {
                id
                name
            }
        }
    }`;
    return cy.postGQL(searchQuery).then((res) => {
        // should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true);
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${searchQuery}`);
        // has data
        assert.exists(res.body.data);
        // has nodes
        assert.isArray(res.body.data[queryName].nodes);
        const nodes = res.body.data[queryName].nodes;
        if (nodes.length === 1) {
            if (nodes[0].name === name) {
                return nodes[0].id;
            }
        } else if (nodes.length > 1) {
            const extraFiltered = nodes.filter((item) => {
                return item.name === name;
            });
            if (extraFiltered.length !== 0) {
                return extraFiltered[0].id;
            }
        }
        var dataPath = mutationName.replace("create", "");
        dataPath = dataPath.replace(dataPath.charAt(0), dataPath.charAt(0).toLowerCase());
        const input = mutationInput ? `{name: "${name}", ${mutationInput}}` : `{name: "${name}"}`;
        const creationMutation = `mutation {
            ${mutationName}(input: ${input}) {
                code
                message
                error
                ${dataPath} {
                    id
                    name
                }
            }
        }`;
        cy.postMutAndValidate(creationMutation, mutationName, dataPath).then((resp) => {
            expect(resp.body.data[mutationName][dataPath].name).to.be.eql(name);
            return resp.body.data[mutationName][dataPath].id;
        });
    });
});

// Create a new item, validate it, and return the id. Pass in the full input value as a string
// If you need more information than just the id, pass in the additional fields as a string and the entire new item will be returned
Cypress.Commands.add("createAndGetId", (mutationName: string, dataPath: string, input: string, additionalFields?: string) => {
    const mutation = `mutation {
        ${mutationName}(input: ${input}) {
            code
            message
            error
            ${dataPath} {
                id
                ${additionalFields ? additionalFields : ""}
            }
        }
    }`;
    return cy.postMutAndValidate(mutation, mutationName, dataPath).then((res) => {
        const id = res.body.data[mutationName][dataPath].id;
        if (additionalFields) {
            return res.body.data[mutationName][dataPath];
        } else {
            return id;
        }
    });
});

Cypress.Commands.add("turnArrayIntoInput", (givenArray) => {
    function valueToString(propertyNames: string[], index: number, parentObject?: object) {
        var itemAsString = '{ ';
        for (var i = 0; i < propertyNames.length; i++) {
            if (i !== 0) {
                itemAsString = itemAsString + ', ';
            }
            var parent = parentObject ? parentObject : givenArray[index];
            var value = parent[propertyNames[i]];
            if (typeof value === 'string') {
                value = `"${value}"`;
            } else if (typeof value === 'object') {
                var subProps = Object.getOwnPropertyNames(value);
                value = valueToString(subProps, index, value);
            }
            itemAsString = itemAsString + `${propertyNames[i]}: ${value}`;
        }
        itemAsString = itemAsString + ' }';
        return itemAsString;
    }
    var arrayAsString = '[';
    for (var i = 0; i < givenArray.length; i++) {
        if (i !== 0) {
            arrayAsString = arrayAsString + ", ";
        }
        var props = Object.getOwnPropertyNames(givenArray[i]);
        var currentItemAsString = valueToString(props, i);
        arrayAsString = arrayAsString + currentItemAsString;
    }
    arrayAsString = arrayAsString + "]";
    return arrayAsString;
});

// Confirms that a mutation has updated an item by querying for the item and matching the values to the array given
Cypress.Commands.add("confirmUsingQuery", (query: string, dataPath: string, itemId: string, propNames: string[], values: []) => {
    Cypress.log({
        name: "confirmUsingQuery",
        message: `query ${dataPath}, ${itemId}`,
        consoleProps: () => {
            return {
                "Query Body": query,
                "Query name": dataPath,
                "Id of item to verify": itemId,
                "Properties to check": propNames.toString(),
                "Expected Values": values.toString()
            };
        },
    });
    // Primarily used for filtering objects in an array, so it won't fail unless failOnNoMatch is passed
    // failOnNoMatch allows us to verify a regular object, instead of looking for specific objects that we expect in an array
    function matchObject(item, itemToMatch, failOnNoMatch?: boolean, parentPropName?: string) {
        var matchFound = false;
        const props = Object.getOwnPropertyNames(itemToMatch);
        for (var p = 0; p < props.length; p++) {
            var propMatches = false
            // For better documentation of the specific problem field if something isn't right
            const descendingPropName = `${parentPropName ? parentPropName + "." : ""}${props[p]}`;
            if (itemToMatch[props[p]] && item[props[p]] === null) {
                if (failOnNoMatch) {
                    assert.exists(item[props[p]], `${descendingPropName} Should not be null`);
                } else {
                    break;
                }
            }
            if (Array.isArray(itemToMatch[props[p]])) {
                // If the property value is an array, start the whole process over again to verify the array's items
                propMatches = matchArrayItems(item[props[p]], itemToMatch[props[p]], descendingPropName);
            } else if (typeof itemToMatch[props[p]] === 'object') {
                // If the property value is an object, verify the object's properties match
                propMatches = matchObject(item[props[p]], itemToMatch[props[p]], !!failOnNoMatch, descendingPropName);
            } else {
                if (failOnNoMatch) {
                    expect(item[props[p]]).to.be.eql(itemToMatch[props[p]], `Verify ${descendingPropName}`);
                }
                propMatches = item[props[p]] === itemToMatch[props[p]];
            }
            if (!propMatches) {
                break;
            }
            if (propMatches && p === props.length - 1) {
                matchFound = true;
            }
        }
        return matchFound;
    }
    // Searches through the array for the items we expect to be there
    // ex, if we updated 2 items, but the array has 4 items, it runs a filter looking for those items and fails if they aren't there
    // Returns a boolean to use with matchObject above
    function matchArrayItems(resArray: [], matchArray: [], originalProperty: string) {
        const matchingItems = resArray.filter((item) => {
            var itemMatches = false;
            for (var f = 0; f < matchArray.length; f++) {
                itemMatches = matchObject(item, matchArray[f], undefined, `${originalProperty}[${f}]`);
                if (itemMatches) {
                    break;
                }
            }
            return itemMatches;
        });
        expect(matchingItems.length).to.be.eql(matchArray.length, `Expecting ${matchArray.length} updated items in ${originalProperty}`);
        return matchingItems.length === matchArray.length;
    };
    
    return cy.postGQL(query).then((resp) => {
        expect(resp.isOkStatusCode).to.be.equal(true, "Status Code is 200");
        assert.notExists(resp.body.errors, "No errors");
        assert.exists(resp.body.data, "Data exists");
        assert.isArray(resp.body.data[dataPath].nodes, "Has Nodes array");

        const targetNode = resp.body.data[dataPath].nodes.filter((item) => {
            return item.id === itemId;
        });
        expect(targetNode.length).to.be.eql(1, "Specific item found in nodes");
        const node = targetNode[0];
        expect(propNames.length).to.be.eql(values.length, "Same number of properties and values passed in");
        for (var i = 0; i < propNames.length; i++) {
            if (values[i] && node[propNames[i]] === null) {
                assert.exists(node[propNames[i]], `${propNames[i]} should not be null`);
            }
            if (Array.isArray(values[i])) {
                matchArrayItems(node[propNames[i]], values[i], propNames[i]);
            } else if (!!values[i] && typeof values[i] === 'object') {
                matchObject(node[propNames[i]], values[i], true, propNames[i]);
            } else {
                expect(node[propNames[i]]).to.be.eql(values[i], `Verify ${propNames[i]}`);
            }
        }
    });
});