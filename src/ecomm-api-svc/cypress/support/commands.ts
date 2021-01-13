// Turns an array or object into a string to use as gql input or with a custom command's consoleProps logging functionality
export const toFormattedString = (item): string => {
    // Names of fields that are enum types and should not be wrapped in quotations.
    const enumTypes = ["discountType", "discountLimitationType", "manageInventoryMethod", "erpBackOrderMode"];
    function iterateThrough (propNames?: string[]) {
        var returnValue = '';
        for (var i = 0; i < (propNames ? propNames.length : item.length); i++) {
            if (i !== 0) {
                returnValue = returnValue + ', ';
            }
            var value = propNames ? item[propNames[i]]: item[i];
            if (typeof value === 'string') {
                var allowTransformation = true;
                if (propNames && enumTypes.includes(propNames[i])) {
                    allowTransformation = false;
                }
                if (allowTransformation && value.charAt(0) !== '"' && value.charAt(value.length - 1) !== '"') {
                    value = `"${value}"`;
                }
            } else if (typeof value === 'object') {
                // Arrays return as an object, so this will get both
                value = toFormattedString(value);
            }
            returnValue = returnValue + (propNames ? `${propNames[i]}: ${value}`: value);
        }
        return returnValue;
    };
    var itemAsString = '{ ';
    var props = undefined;
    if (item === null) {
        return "null";
    } else if (item === undefined) {
        return "undefined";
    } else if (Array.isArray(item)) {
        itemAsString = '[';
    } else if (typeof item === 'object') {
        props = Object.getOwnPropertyNames(item);
    }
    itemAsString = itemAsString + iterateThrough(props) + (props ? ' }' : ']');
    return itemAsString;
};

export const verifyStorefrontEnv = (env: string): boolean => {
    if (env.length === 0 || Cypress.env(env).length === 0) {
        return false;
    } else if (Cypress.env(env).startsWith("#") && Cypress.env(env).endsWith("#")) {
        return false;
    } else {
        // Check if base url and storefront url are mismatched
        if (env === "storefrontUrl") {
            if (Cypress.config("baseUrl").includes('dev') && Cypress.env(env).includes('tst')) {
                return false;
            } else if (Cypress.config("baseUrl").includes('tst') && Cypress.env(env).includes('dev')) {
                return false;
            }
        }
        return true;
    }
};

// Re assigns the given storefront env 
export const setAltStorefrontEnv = (envName: string) => {
    if (envName === "storefrontUrl") {
        if (Cypress.config("baseUrl").includes('dev')) {
            Cypress.log({message: "Setting Storefront Url to dev url"});
            Cypress.env(envName, "https://dev.apteanecommerce.com/");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({message: "Setting Storefront Url to tst url"});
            Cypress.env(envName, "https://tst.apteanecommerce.com/");
        } else {
            Cypress.log({message: "Storefront Url can't be fixed: forcing failure"});
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else if (envName === "storefrontLogin") {
        if (Cypress.config("baseUrl").includes('dev')) {
            Cypress.log({message: "Setting Storefront username to dev user"});
            Cypress.env(envName, "bhargava.deshpande@aptean.com");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({message: "Setting Storefront username to tst user"});
            Cypress.env(envName, "cypress.tester@testenvironment.com");
        } else {
            Cypress.log({message: "Storefront username can't be fixed: forcing failure"});
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else if (envName === "storefrontPassword") {
        if (Cypress.config("baseUrl").includes('dev')) {
            Cypress.log({message: "Setting Storefront password to dev pass"});
            Cypress.env(envName, "admin");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({message: "Setting Storefront password to tst pass"});
            Cypress.env(envName, "CypressTester1");
        } else {
            Cypress.log({message: "Storefront password can't be fixed: forcing failure"});
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else {
        Cypress.log({message: "Invalid env name given: forcing failure"});
        expect(["storefrontUrl", "storefrontLogin", "storefrontPassword"]).to.include(envName, "Please use one of the valid storefront env names");
    }
};
// Runs through storefront env values and calls above functions to either set them (if possible) or fail the test
export const confirmStorefrontEnvValues = () => {
    const storefrontNames = ["storefrontUrl", "storefrontLogin", "storefrontPassword"];
    storefrontNames.forEach((sfName) => {
        if (!verifyStorefrontEnv(sfName)){
            setAltStorefrontEnv(sfName);
        }
    });
};

// -- This will post GQL query --
Cypress.Commands.add('postGQL', (query, altUrl?: string) => {
    Cypress.log({
        name: "postGQL",
        consoleProps: () => {
            return {
                "Query/Mutation Body": query,
                "Headers": `"x-aptean-apim": ${Cypress.env('x-aptean-apim')} \n\t\t\t "x-aptean-tenant": ${Cypress.env('x-aptean-tenant')} \n\t\t\t "x-aptean-tenant-secret": ${Cypress.env('x-aptean-tenant-secret')}`, 
            };
        },
    });
    if (altUrl) {
        if (altUrl.charAt(altUrl.length -1 ) === "/") {
            altUrl = altUrl.slice(0, altUrl.length - 1)
        }
    }
    return cy.request({
      method: 'POST',
      url: altUrl ? altUrl + '/graphql' : '/graphql',
      headers: {
        'x-aptean-apim': Cypress.env('x-aptean-apim'),
        'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
        'x-aptean-tenant-secret': Cypress.env('x-aptean-tenant-secret')
      },
      body: { query },
      failOnStatusCode: false,
      timeout: Cypress.env('gqlTimeout'),
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
    
    var errorMessage = `No errors while executing query: \n${gqlQuery}`;
    if (res.body.errors) {
        errorMessage = `One or more errors ocuured while executing query: \n${gqlQuery}`;
        res.body.errors.forEach((item) => {
            errorMessage = errorMessage + " \n" + item.extensions.code + ". " + item.message;
        });
        errorMessage = errorMessage + "\n";
    }
    // no errors
    assert.notExists(res.body.errors, errorMessage);

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
Cypress.Commands.add("postMutAndValidate", (gqlMut: string, mutationName: string, dataPath: string, altUrl?: string) => {
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
    return cy.postGQL(gqlMut, altUrl).then((res) => {
        cy.validateMutationRes(gqlMut, res, mutationName, dataPath).then(() => {
            return res;
        });
    });
});

// Post and confirm Deletion
Cypress.Commands.add("postAndConfirmDelete", (gqlMut: string, mutationName: string, altUrl?: string) => {
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
    return cy.postGQL(gqlMut, altUrl).then((res) => {
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

// Tests the response for errors. Use when we expect it to fail. Add expect200 when we expect to get a 200 status code
Cypress.Commands.add("confirmError", (res, expect200?: boolean) => {
    Cypress.log({
        name: "confirmError",
        message: `Confirm expected errors. ${expect200? "Expecting 200 status code": ""}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Expected a 200 status code": !!expect200
            };
        },
    });
    if (expect200) {
        // Should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true);
    } else {
        // should not be 200 ok
        expect(res.isOkStatusCode).to.be.equal(false);
    }

    // should have errors
    assert.exists(res.body.errors);
  
    // no data
    assert.notExists(res.body.data);
});

// Tests the response for errors. Use when we expect it to fail
// For use with mutations that still return data and an okay status when erroring
Cypress.Commands.add("confirmMutationError", (res, mutationName: string, dataPath?: string) => {
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
    assert.exists(res.body.errors, "Errors should be present");
    // should have data
    assert.exists(res.body.data);
    // Check data for errors
    // validate data types and values
    assert.isString(res.body.data[mutationName].code);
    expect(res.body.data[mutationName].code).to.eql("ERROR");
    assert.isString(res.body.data[mutationName].message);
    expect(res.body.data[mutationName].message).to.include('Error');
    if (dataPath) {
        // Since delete mutations don't have an item returned, datapath is optional
        assert.notExists(res.body.data[mutationName][dataPath]);
    }
});

// Post Query and confirm it has errors. Add expect200 when we expect to get a 200 status code
Cypress.Commands.add("postAndConfirmError", (gqlQuery: string, expect200?: boolean, altUrl?: string) => {
    Cypress.log({
        name: "postAndConfirmError",
        message: `${expect200 ? "expect200" + expect200 : ""}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "expect200": expect200 ? expect200 : "Not provided"
            };
        },
    });
    return cy.postGQL(gqlQuery, altUrl).then((res) => {
        cy.confirmError(res, expect200).then(() => {
            return res;
        });
    });
});

Cypress.Commands.add("postAndConfirmMutationError", (gqlMutation: string, mutationName: string, dataPath?: string, altUrl?: string) => {
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
    return cy.postGQL(gqlMutation, altUrl).then((res) => {
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
    const edgeCount = res.body.data[dataPath].edges.length;
    if (totalCount > 25) {
        expect(nodeCount).to.be.eql(25);
        expect(edgeCount).to.be.eql(25);
    } else {
        expect(nodeCount).to.be.eql(totalCount);
        expect(edgeCount).to.be.eql(totalCount);
    }
    return totalCount > 25;
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
Cypress.Commands.add("postAndCheckCustom", (query: string, queryPath: string, id: string, customData, altUrl?: string) => {
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
    cy.postGQL(query, altUrl).then((res) => {
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
                expect(val).to.have.property('isPreSelected');
                if (val.isPreselected !== null) {
                    expect(val.isPreSelected).to.be.a('boolean');
                }
                expect(val).to.have.property('name');
                if (val.name !== null) {
                    expect(val.name).to.be.a('string');
                }
                expect(val).to.have.property('priceAdjustment');
                if (val.priceAdjustment !== null) {
                    expect(val.priceAdjustment).to.have.property('amount');
                    expect(val.priceAdjustment.amount).to.be.a('number');
                    expect(val.priceAdjustment).to.have.property('currency');
                    expect(val.priceAdjustment.currency).to.be.a('string');
                }
                expect(val).to.have.property('weightAdjustment');
                if (val.weightAdjustment !== null) {
                    expect(val.weightAdjustment).to.be.a('number');
                }
                if (dataPath === "productAttributes") {
                    expect(val).to.have.property('cost');
                    if (val.cost !== null) {
                        expect(val.cost).to.have.property('amount');
                        expect(val.cost.amount).to.be.a('number');
                        expect(val.cost).to.have.property('currency');
                        expect(val.cost.currency).to.be.a('string');
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
        const count = res.body.data[dataPath].nodes.length;
        return cy.wrap(count);
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
        var idFormat = dataPath === "refunds" ? "id" : "order.id";
        if (firstOrLast.toLowerCase() === "first") {
            expect(pageInfo.startCursor).to.be.eql(orgPageInfo.startCursor, 'Verify startCursor');
            expect(pageInfo.endCursor).not.to.be.eql(orgPageInfo.endCursor, 'Verify endCursor');
            expect(pageInfo.endCursor).to.be.eql(orgEdges[value - 1].cursor, 'Verify endCursor');
            for(var i = 0; i < value; i++){
                expect(nodes[i][idFormat]).to.be.eql(orgNodes[i][idFormat], 'Verifying included nodes');
                expect(edges[i].cursor).to.be.eql(orgEdges[i].cursor, 'Verifying included cursors');
                expect(edges[i].node[idFormat]).to.be.eql(orgEdges[i].node[idFormat], "Verifying edge's included nodes");
                expect(nodes[i][idFormat]).to.be.eql(orgEdges[i].node[idFormat], `Verifying node[${i}] matches original edge[${i}].node`);
            }
        } else if (firstOrLast.toLowerCase() === "last") {
            var f = value + 1;
            const totalLength = orgRes.totalCount > 25 ? orgNodes.length : orgRes.totalCount;
            if (value === totalLength / 2){
                f = value;
            }
            expect(pageInfo.startCursor).not.to.be.eql(orgPageInfo.startCursor, 'Verify startCursor');
            expect(pageInfo.startCursor).to.be.eql(orgEdges[f].cursor, 'Verify startCursor');
            expect(pageInfo.endCursor).to.be.eql(orgPageInfo.endCursor, 'Verify endCursor');
            for(var i = 0; i < value; i++){
                expect(nodes[i][idFormat]).to.be.eql(orgNodes[f][idFormat], 'Verifying included nodes');
                expect(edges[i].cursor).to.be.eql(orgEdges[f].cursor, 'Verifying included cursors');
                expect(edges[i].node[idFormat]).to.be.eql(orgEdges[f].node[idFormat], "Verifying edge's included nodes");
                expect(nodes[i][idFormat]).to.be.eql(orgEdges[f].node[idFormat], `Verifying node[${i}] matches original edge[${f}].node`);
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

// Verifies that changing orderBy direction changes the order of the nodes and edges
Cypress.Commands.add("verifyReverseOrder", (dataPath: string, ascRes, descRes) => {
    Cypress.log({
        name: "verifyReverseOrder",
        message: dataPath,
        consoleProps: () => {
            return {
                "Query name": dataPath,
                "ASC query response": ascRes.body.data,
                "DESC query response": descRes.body.data
            };
        },
    });
    expect(descRes.body.data[dataPath].totalCount).to.be.eql(ascRes.body.data[dataPath].totalCount, "TotalCount should be the same");
    expect(descRes.body.data[dataPath].nodes.length).to.be.eql(ascRes.body.data[dataPath].nodes.length, "nodes length should be the same");
    expect(descRes.body.data[dataPath].edges.length).to.be.eql(ascRes.body.data[dataPath].edges.length, "edges length should be the same");
    const ascNodes = ascRes.body.data[dataPath].nodes;
    const aNoReversed = ascNodes.slice(0).reverse();
    const descNodes = descRes.body.data[dataPath].nodes;
    const dNoReversed = descNodes.slice(0).reverse();
    expect(descNodes).not.to.be.eql(ascNodes, "DESC nodes !== ASC nodes");
    for (var i = 0; i < descNodes.length; i++) {
        if (descNodes.length % 2 !== 0 && i !== Math.floor(descNodes.length /2 )) {
            expect(descNodes[i]).not.to.be.eql(ascNodes[i], `DESC nodes !== ASC nodes. index ${i}, id ${descNodes[i].id}`);
        }
        expect(descNodes[i]).to.be.eql(aNoReversed[i], `DESC nodes === ASC nodes. index ${i}, id ${descNodes[i].id}`);
        expect(ascNodes[i]).to.be.eql(dNoReversed[i], `ASC nodes === DESC nodes. index ${i}, id ${ascNodes[i].id}`);
    }
    const ascEdges = ascRes.body.data[dataPath].edges;
    const aEdReversed = ascEdges.slice(0).reverse();
    const descEdges = descRes.body.data[dataPath].edges;
    const dEdReversed = descEdges.slice(0).reverse();
    expect(descEdges).not.to.be.eql(ascEdges, "DESC edges !== ASC edges");
    for (var i = 0; i < descEdges.length; i++) {
        if (descEdges.length % 2 !== 0 && i !== Math.floor(descEdges.length /2 )) {
            expect(descEdges[i].node).not.to.be.eql(ascEdges[i].node, `DESC edges !== ASC edges. index ${i}, id ${descEdges[i].node.id}`);
        }
        expect(descEdges[i].node).to.be.eql(aEdReversed[i].node, `DESC edges === ASC edges. index ${i}, id ${descEdges[i].node.id}`);
        expect(ascEdges[i].node).to.be.eql(dEdReversed[i].node, `ASC edges === DESC edges. index ${i}, id ${descEdges[i].node.id}`);
    }
    const ascStartCursor = ascRes.body.data[dataPath].pageInfo.startCursor;
    const ascStCurNode = ascEdges[0].node;
    const ascEndCursor = ascRes.body.data[dataPath].pageInfo.endCursor;
    const ascEndCurNode = ascEdges[ascEdges.length - 1].node;
    const descStartCursor = descRes.body.data[dataPath].pageInfo.startCursor;
    const descStCurNode = descEdges[0].node;
    const descEndCursor = descRes.body.data[dataPath].pageInfo.endCursor;
    const descEndCurNode = descEdges[descEdges.length - 1].node;
    expect(descStartCursor).not.to.be.eql(ascStartCursor, "DESC pageInfo shouldn't have the same startCursor as ASC");
    expect(descStCurNode).not.to.be.eql(ascStCurNode, "Verifing the above with the matching nodes");
    expect(descEndCursor).not.to.be.eql(ascEndCursor, "DESC pageInfo shouldn't have the same endCursor as ASC");
    expect(descEndCurNode).not.to.be.eql(ascEndCurNode, "Verifing the above with the matching nodes");
    expect(descStCurNode).to.be.eql(ascEndCurNode, "DESC pageInfo's startCursor node should be ASC pageInfo's endCursor node");
    expect(descEndCurNode).to.be.eql(ascStCurNode, "DESC pageInfo's endCursor node should be ASC pageInfo's startCursor node");
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
        var totalCount = res.body.data[dataPath].totalCount > 25 ? 25 : res.body.data[dataPath].totalCount;
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

// For queries that have a info field instead of a name field.
// Runs the query and grabs a random node to take the name from. Query body should look for name
Cypress.Commands.add("returnRandomInfoName", (gqlQuery: string, dataPath: string, infoPath: string) => {
    Cypress.log({
        name: "returnRandomInfoName",
        message: `${dataPath}, ${infoPath}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name / dataPath": dataPath,
                "Info path": infoPath
            };
        },
    });

    function runNameFilter(node) {
        var info = node[infoPath].filter((val) => {
            return val.languageCode === "Standard" &&  val.name !== "";
        });
        if (info.length < 1) {
            info = node[infoPath].filter((val) => {
                return val.name !== "";
            });
            expect(info.length).to.be.gte(1); // Need to have a name we can search with
        }
        info = info[0];
        return info;
    };

    return cy.postAndValidate(gqlQuery, dataPath).then((res) => {
        var randomIndex = 0;
        const totalCount = res.body.data[dataPath].totalCount > 25 ? 25 : res.body.data[dataPath].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[dataPath].nodes[randomIndex];
        var infoNode = runNameFilter(randomNode);
        const duplicateArray = res.body.data[dataPath].nodes.filter((val) => {
            const infoArray = val[infoPath].filter((item) => {
                return item.name === infoNode.name;
            });
            return infoArray.length > 0;
        });
        if (duplicateArray.length > 1) {
            const uniqueArray = res.body.data[dataPath].nodes.filter((val) => {
                const infoArray = val[infoPath].filter((item) => {
                    return item.name != infoNode.name && item.name != "";
                });
                return infoArray.length > 0;
            });
            randomIndex = 0;
            if (uniqueArray.length > 1) {
                randomIndex = Cypress._.random(0, uniqueArray.length - 1);
            }
            randomNode = uniqueArray[randomIndex];
            infoNode = runNameFilter(randomNode);
        }
        return cy.wrap(infoNode.name);
    });
});

// Runs the query and grabs a random node to take the id from. Pass in the id name for queries whose id field names aren't standard
Cypress.Commands.add('returnRandomId', (gqlQuery: string, dataPath: string, idName?: string) => {
    Cypress.log({
        name: "returnRandomId",
        message: dataPath + `${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name / dataPath": dataPath,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    return cy.postAndValidate(gqlQuery, dataPath).then((res) => {
        var randomIndex = 0;
        var totalCount = res.body.data[dataPath].totalCount > 25 ? 25 : res.body.data[dataPath].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[dataPath].nodes[randomIndex];
        var id;
        if (!idName) {
            id = randomNode.id;
        } else {
            if (idName.includes(".id")) {
                var split = idName.split(".");
                id = randomNode[split[0]][split[1]];
            } else {
                id = randomNode[idName];
            }
        }
        return cy.wrap(id);
    });
});

// Validates that a query with searchString returned the node with the correct name or nodes that contain the string
Cypress.Commands.add("validateNameSearch", (res, dataPath: string, searchValue: string) => {
    Cypress.log({
        name: "validateNameSearch",
        message: `${dataPath}, searchString: ${searchValue}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "searchString": searchValue
            };
        },
    });
    const totalCount = res.body.data[dataPath].totalCount;
    const nodes = res.body.data[dataPath].nodes;
    const edges = res.body.data[dataPath].edges;
    expect(totalCount).to.be.eql(nodes.length);
    expect(totalCount).to.be.eql(edges.length);
    for (var i = 0; i < nodes.length; i++) {
        expect(nodes[i].name.toLowerCase()).to.include(searchValue.toLowerCase(), `Node[${i}]`);
        expect(edges[i].node.name.toLowerCase()).to.include(searchValue.toLowerCase(), `Edge[${i}]`);
    }
});

// For queries that have a info field instead of a name field.
// Validates that a query with searchString returned the node with the correct name or nodes that contain the string
Cypress.Commands.add("validateInfoNameSearch", (res, dataPath: string, infoPath: string, searchValue: string) => {
    Cypress.log({
        name: "validateInfoNameSearch",
        message: `${dataPath}, ${infoPath}, searchString: ${searchValue}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "Info name": infoPath,
                "searchString": searchValue
            };
        },
    });
    const totalCount = res.body.data[dataPath].totalCount;
    const nodes = res.body.data[dataPath].nodes;
    const edges = res.body.data[dataPath].edges;
    expect(totalCount).to.be.eql(nodes.length);
    expect(totalCount).to.be.eql(edges.length);
    for (var i = 0; i < nodes.length; i++) {
        var infoArray = nodes[i][infoPath].filter((val) => {
            return val.name.includes(searchValue);
        });
        expect(infoArray.length).to.be.gte(1, `Node[${i}]`);
        var edgeInfoArray = edges[i].node[infoPath].filter((val) => {
            return  val.name.includes(searchValue);
        });
        expect(edgeInfoArray.length).to.be.gte(1, `Edge[${i}]`);
        expect(infoArray.length).to.be.eql(edgeInfoArray.length);
    }
});

// For queries that search by id instead of name. Pass in the id name for queries whose id field names aren't standard
// Validates that a query with searchString returned the node with the correct id or nodes with ids that contain the string
Cypress.Commands.add("validateIdSearch", (res, dataPath: string, searchValue: string, idName?: string) => {
    Cypress.log({
        name: "validateIdSearch",
        message: `${dataPath}, searchString: ${searchValue}${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name / dataPath": dataPath,
                "searchString": searchValue,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    const totalCount = res.body.data[dataPath].totalCount;
    const nodes = res.body.data[dataPath].nodes;
    const edges = res.body.data[dataPath].edges;
    expect(totalCount).to.be.eql(nodes.length);
    expect(totalCount).to.be.eql(edges.length);
    for (var i = 0; i < nodes.length; i++) {
        var node;
        var edge;
        if (!idName) {
            node = nodes[i].id;
            edge = edges[i].node.id;
        } else {
            if (idName.includes(".id")) {
                var split = idName.split(".");
                node = nodes[i][split[0]][split[1]];
                edge = edges[i].node[split[0]][split[1]];
            } else {
                node = nodes[i][idName];
                edge = edges[i].node[idName];
            }
        }
        expect(node.toLowerCase()).to.include(searchValue.toLowerCase(), `Node[${i}]`);
        expect(edge.toLowerCase()).to.include(searchValue.toLowerCase(), `Edge[${i}]`);
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
        var totalCount = res.body.data[dataPath].totalCount > 25 ? 25 : res.body.data[dataPath].totalCount;
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
        message: `${index}${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
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
    // Confirm expected total count
    expect(totalCount).to.be.eql(index, `Verify totalCount is ${index}`);
    // Confirm expected node/edge count
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
    if (nodes.length !== 1 && edges.length !== 1) {
        expect(pageInfo.startCursor).to.be.eql(sCursor);
        expect(pageInfo.endCursor).not.to.eql(eCursor);
    }
});

// Validate the response from a query using after. Can optionally validate first/last input as well.
Cypress.Commands.add("validateAfterCursor", (newData, data, index, firstLast?: string, value?: number) => {
    Cypress.log({
        name: "validateAfterCursor",
        message: `${index}${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
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
    expect(totalCount).to.be.eql(data.totalCount - (index + 1), `Verify totalCount is ${data.totalCount - (index + 1)}`);
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
    } else if (totalCount > nodes.length) {
        eCursor = data.edges[index + 25].cursor;
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
    if (nodes.length !== 1 && edges.length !== 1) {
        expect(pageInfo.startCursor).not.to.be.eql(sCursor);
        expect(pageInfo.endCursor).to.eql(eCursor);
    }
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

const verifySeoData = (seo, expectedSeo) => {
    expectedSeo.forEach((seoItem, index) => {
        var currSeo = seo[index];
        const props = Object.getOwnPropertyNames(seoItem);
        for (var i = 0; i < props.length; i++) {
            if (props[i] === "searchEngineFriendlyPageName" && seoItem[props[i]].length > 0) {
                expect(currSeo[props[i]]).to.include(seoItem[props[i]].toLowerCase().replace(' ', '-'), `Verify seoData[${index}].${props[i]}`);
            }  else {
                expect(currSeo[props[i]]).to.be.eql(seoItem[props[i]], `Verify seoData[${index}].${props[i]}`);
            }
        }
    });
};

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
                "Properties to check": toFormattedString(propNames),
                "Expected Values": toFormattedString(values)
            };
        },
    });
    expect(propNames.length).to.be.eql(values.length, "Same number of properties and values given to function");
    var result = res.body.data[mutationName][dataPath];
    function searchArray(resArray: [], matchArray: [], originalProperty: string) {
        const matchingItems = resArray.filter((item) => {
            var itemMatches = false;
            for (var f = 0; f < matchArray.length; f++) {
                const props = Object.getOwnPropertyNames(matchArray[f]);
                for (var p = 0; p < props.length; p++) {
                    var propMatches = item[props[p]] === matchArray[f][props[p]];
                    if (!propMatches) {
                        break;
                    }
                    if (propMatches && p === props.length - 1) {
                        itemMatches = true;
                    }
                }
                if (itemMatches) {
                    break;
                }
            }
            return itemMatches;
        });
        expect(matchingItems.length).to.be.eql(matchArray.length, `Expecting ${matchArray.length} updated items in ${originalProperty}`);
        return matchingItems.length === matchArray.length;
    };
    function matchObject (item, itemToMatch, parentProperty: string) {
        const props = Object.getOwnPropertyNames(itemToMatch);
        for (var p = 0; p < props.length; p++) {
            // For better documentation of the specific problem field if something isn't right
            const descendingPropName = `${parentProperty ? parentProperty + "." : ""}${props[p]}`; 
            expect(item).to.have.ownPropertyDescriptor(props[p], `The item should have a ${props[p]} property`);
            if (itemToMatch[props[p]] && item[props[p]] === null) {
                assert.exists(item[props[p]], `${descendingPropName} should not be null`);
            }
            if (props[p].includes("Info") && Array.isArray(itemToMatch[props[p]])) {
                if (item[props[p]].length > itemToMatch[props[p]].length) {
                    searchArray(item[props[p]], itemToMatch[props[p]], descendingPropName);
                } else {
                    matchArray(item[props[p]], itemToMatch[props[p]], descendingPropName);
                }
            } else if (typeof itemToMatch[props[p]] === 'object') {
                matchObject(item[props[p]], itemToMatch[props[p]], descendingPropName);
            } else {
                expect(item[props[p]]).to.be.eql(itemToMatch[props[p]], `Verify ${descendingPropName}`);
            }
        }
    };
    function matchArray(resArray: [], matchArray: [], originalProperty: string) {
        //expect(resArray.length).to.be.eql(matchArray.length, `Updated ${matchArray.length} items of ${originalProperty}`);
        for (var f = 0; f < matchArray.length; f++) {
            if (resArray.length > matchArray.length) {
                searchArray(resArray, matchArray, `${originalProperty}[${f}]`);
            } else {
                matchObject(resArray[f], matchArray[f], `${originalProperty}[${f}]`);
            }
        }
    };
    for (var i = 0; i < propNames.length; i++) {
        if (propNames[i] === "seoData"){
            verifySeoData(result[propNames[i]], values[i]);
        } else {
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
    }
});

// Queries for an item and if it doesn't find it, creates the item. Returns id of item
Cypress.Commands.add("searchOrCreate", (name: string, queryName: string, mutationName: string, mutationInput?: string, infoName?: string) => {
    Cypress.log({
        name: "searchOrCreate",
        message: `"${name}", ${queryName}, ${mutationName}${mutationInput ? ", " + mutationInput : ""}${infoName ? ", " + infoName : ""}`,
        consoleProps: () => {
            return {
                "searchString": name,
                "Query name": queryName,
                "Mutation Name": mutationName,
                "Extra input for Mutation": mutationInput,
                "Info Name": infoName ? infoName : "Not provided"
            };
        },
    });
    var nameField = "name";
    if (infoName) {
        nameField = `${infoName} {
            name
            languageCode
        }`;
    }
    const searchQuery = `{
        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
            nodes {
                id
                ${nameField}
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
            var nameSource = nodes[0].name;
            if (infoName) {
                nameSource = nodes[0][infoName].filter((item) => {
                    return item.languageCode === "Standard";
                })[0].name;
            }
            if (nameSource === name) {
                return nodes[0].id;
            }
        } else if (nodes.length > 1) {
            const extraFiltered = nodes.filter((item) => {
                if (infoName) {
                    var target = item[infoName].filter((subItem) => {
                        return subItem.languageCode === "Standard";
                    });
                    return target[0].name === name;
                } else {
                    return item.name === name;
                }
            });
            if (extraFiltered.length !== 0) {
                return extraFiltered[0].id;
            }
        }
        var dataPath = mutationName.replace("create", "");
        dataPath = dataPath.replace(dataPath.charAt(0), dataPath.charAt(0).toLowerCase());
        var nameInput = `name: "${name}"`;
        var inputHasNameAsInfo = false;
        var comboInput = '';
        if (mutationInput && infoName) {
            if (mutationInput.includes(infoName) && mutationInput.includes(name)) {
                inputHasNameAsInfo = true;
            } else {
                nameInput = `${infoName}: [{name: "${name}", languageCode: "Standard"}]`;
            }
        } else if (infoName) {
            nameInput = `${infoName}: [{name: "${name}", languageCode: "Standard"}]`;
        }
        comboInput = inputHasNameAsInfo ? `{${mutationInput}}` : `{${nameInput}, ${mutationInput}}`;
        const input = mutationInput ? comboInput : `{${nameInput}}`;
        const creationMutation = `mutation {
            ${mutationName}(input: ${input}) {
                code
                message
                error
                ${dataPath} {
                    id
                    ${nameField}
                }
            }
        }`;
        cy.postMutAndValidate(creationMutation, mutationName, dataPath).then((resp) => {
            if (infoName) {
                const infoItem = resp.body.data[mutationName][dataPath][infoName].filter((subItem) => {
                    return subItem.languageCode === "Standard";
                });
                expect(infoItem[0].name).to.be.eql(name);
            } else {
                expect(resp.body.data[mutationName][dataPath].name).to.be.eql(name);
            }
            return resp.body.data[mutationName][dataPath].id;
        });
    });
});

// Create a new item, validate it, and return the id. Pass in the full input value as a string
// If you need more information than just the id, pass in the additional fields as a string and the entire new item will be returned
Cypress.Commands.add("createAndGetId", (mutationName: string, dataPath: string, input: string, additionalFields?: string, altUrl?: string) => {
    Cypress.log({
        name: "createAndGetId",
        message: `Creating ${dataPath}. Additional fields: ${!!additionalFields}`,
        consoleProps: () => {
            return {
                "Mutation": mutationName,
                "Path": dataPath,
                "Input string": input,
                "Additional fields string": additionalFields ? additionalFields : "Not provided"
            };
        }
    });
    const refundIdFormat = `order {
        id
    }`;
    const mutation = `mutation {
        ${mutationName}(input: ${input}) {
            code
            message
            error
            ${dataPath} {
                ${dataPath === "refund" ? refundIdFormat: "id"}
                ${additionalFields ? additionalFields : ""}
            }
        }
    }`;
    return cy.postMutAndValidate(mutation, mutationName, dataPath, altUrl).then((res) => {
        const id = dataPath === "refund" ? res.body.data[mutationName][dataPath].order.id : res.body.data[mutationName][dataPath].id;
        if (additionalFields) {
            return res.body.data[mutationName][dataPath];
        } else {
            return id;
        }
    });
});

/**
 * Search for an item we expect to have been deleted. Can be used as part of a test, or for after/afterEach hooks performing clean up
 * If asTest = false, it acts more as filter and does not fail if item is found. Returns true/false value depending on item presence
 * If asTest = true, it acts as part of the test and fails if item is found. Returns query response.
 * Use infoName for things like categoryInfo, where the name is a descendant of an array
 */
Cypress.Commands.add("queryForDeleted", (asTest: boolean, itemName: string, itemId: string, queryName: string, infoName?: string) => {
    Cypress.log({
        name: "queryForDeleted",
        message: `querying ${queryName} for deleted item "${itemId}"`,
        consoleProps: () => {
            return {
                "Used as a test": asTest,
                "Query Name": queryName,
                "Item's name": itemName,
                "Item's Id": itemId,
                "Info name": infoName ? infoName : "Not provided"
            };
        },
    });

    var nameField = "name";
    if (infoName) {
        nameField = `${infoName} {
            name
            languageCode
        }`;
    }
    const searchQuery = `{
        ${queryName}(searchString: "${itemName}", orderBy: {direction: ASC, field: NAME}) {
            nodes {
                id
                ${nameField}
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
        var message = "Query did not return item, assumed successful deletion"
        if (nodes.length === 0) {
            if (!asTest) {
                return false;
            }
            assert.isEmpty(nodes, message);
            return res;
        } else {
            // Compare ids to make sure it's not there.
            var matchingItems;
            if (infoName) {
                matchingItems = nodes.filter((item) => {
                    var nameMatches = item[infoName].filter((infoItem) => {
                        return infoItem.name === itemName && infoItem.languageCode === "Standard";
                    });
                    return item.id === itemId && nameMatches.length > 0;
                });
            } else {
                matchingItems = nodes.filter((item) => {
                    return item.id === itemId && item.name === itemName;
                });
            }
            if (matchingItems.length > 0) {
                message = "Query returned item, deletion failed";
            }
            if (!asTest && matchingItems.length > 0) {
                return true;
            }
            assert.isEmpty(matchingItems, message);
            return false;
        }
    });
});

// Same as above but for items that don't have a name and instead works by the id field
Cypress.Commands.add("queryForDeletedById", (asTest: boolean, itemId: string, searchParameter: string, queryName: string, altUrl?: string) => {
    Cypress.log({
        name: "queryForDeleted",
        message: `querying ${queryName} for deleted item "${itemId}"`,
        consoleProps: () => {
            return {
                "Used as a test": asTest,
                "Query Name": queryName,
                "Item's Id": itemId,
                "searchParameter": searchParameter,
                "Url used": altUrl? altUrl : Cypress.config('baseUrl')
            };
        },
    });
    var idField = queryName === "refunds" ? "order { id }" : "id";
    const searchQuery = `{
        ${queryName}(${searchParameter}: "${itemId}", orderBy: {direction: ASC, field: TIMESTAMP}) {
            nodes {
                ${idField}
            }
        }
    }`;
    return cy.postGQL(searchQuery, altUrl).then((res) => {
        // should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true);
        // no errors
        assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${searchQuery}`);
        // has data
        assert.exists(res.body.data);
        // has nodes
        assert.isArray(res.body.data[queryName].nodes);
        const nodes = res.body.data[queryName].nodes;
        var message = "Query did not return item, assumed successful deletion"
        if (nodes.length === 0) {
            if (!asTest) {
                return false;
            }
            assert.isEmpty(nodes, message);
            return res;
        } else {
            // Compare ids to make sure it's not there.
            var matchingItems = nodes.filter((item) => {
                var id = queryName === "refunds" ? item.order.id : item.id;
                return id === itemId;
            });
            if (matchingItems.length > 0) {
                message = "Query returned item, deletion failed";
            }
            if (!asTest) {
                return true;
            }
            assert.isEmpty(matchingItems, message);
            return res;
        }
    });
});

/**
 * Functions used between multiple query commands. Commands that use these functions below them
 */

// Primarily used for filtering objects in an array, so it won't fail unless failOnNoMatch is passed
// failOnNoMatch allows us to verify a regular object, instead of looking for specific objects that we expect in an array
const matchObject = (item, itemToMatch, failOnNoMatch?: boolean, parentPropName?: string): boolean => {
    var matchFound = false;
    const props = Object.getOwnPropertyNames(itemToMatch);
    for (var p = 0; p < props.length; p++) {
        var propMatches = false
        // For better documentation of the specific problem field if something isn't right
        const descendingPropName = `${parentPropName ? parentPropName + "." : ""}${props[p]}`;
        if (failOnNoMatch) {
            expect(item).to.have.ownPropertyDescriptor(props[p], `The item should have a ${props[p]} property`);
        }
        if (itemToMatch[props[p]] && item[props[p]] === null) {
            if (failOnNoMatch) {
                assert.exists(item[props[p]], `${descendingPropName} Should not be null`);
            } else {
                break;
            }
        }
        if (Array.isArray(itemToMatch[props[p]])) {
            var useAsFilter = props[p].includes("Info");
            // If the property value is an array, start the whole process over again to verify the array's items
            propMatches = matchArrayItems(item[props[p]], itemToMatch[props[p]], descendingPropName, useAsFilter);
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
};
// Searches through the array for the items we expect to be there
// ex, if we updated 2 items, but the array has 4 items, it runs a filter looking for those items and fails if they aren't there
// Returns a boolean to use with matchObject above
const matchArrayItems = (resArray: [], matchArray: [], originalProperty: string, useAsFilter?: boolean): boolean => {
    if (!useAsFilter && matchArray.length === 0) {
        expect(resArray).to.be.eql(matchArray, `Expecting ${originalProperty} to be an empty array`);
    } else if (matchArray.length === resArray.length) {
        for (var i = 0; i < matchArray.length; i++) {
            matchObject(resArray[i], matchArray[i], true, `${originalProperty}[${i}]`);
        }
    } else {
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
        if (!useAsFilter) {
            expect(matchingItems.length).to.be.eql(matchArray.length, `Expecting ${matchArray.length} updated items in ${originalProperty}`);
        }
        return matchingItems.length === matchArray.length;
    }
};

// Function that iterates through array and calls above functions
const compareExpectedToResults = (subject, propertyNames: string[], expectedValues: []) => {
    for (var i = 0; i < propertyNames.length; i++) {
        if (propertyNames[i] === "seoData"){
            verifySeoData(subject[propertyNames[i]], expectedValues[i]);
        } else {
            if (expectedValues[i] && subject[propertyNames[i]] === null) {
                assert.exists(subject[propertyNames[i]], `${propertyNames[i]} should not be null`);
            }
            if (Array.isArray(expectedValues[i])) {
                matchArrayItems(subject[propertyNames[i]], expectedValues[i], propertyNames[i]);
            } else if (!!expectedValues[i] && typeof expectedValues[i] === 'object') {
                matchObject(subject[propertyNames[i]], expectedValues[i], true, propertyNames[i]);
            } else {
                expect(subject[propertyNames[i]]).to.be.eql(expectedValues[i], `Verify ${propertyNames[i]}`);
            }
        }
    }
}

/**
 * The commands that use these functions
 */

// Confirms that a mutation has updated an item by querying for the item and matching the values to the array given
Cypress.Commands.add("confirmUsingQuery", (query: string, dataPath: string, itemId: string, propNames: string[], values: [], altUrl?: string) => {
    Cypress.log({
        name: "confirmUsingQuery",
        message: `querying ${dataPath} for ${itemId}`,
        consoleProps: () => {
            return {
                "Query Body": query,
                "Query name": dataPath,
                "Id of item to verify": itemId,
                "Properties to check": toFormattedString(propNames),
                "Expected Values": toFormattedString(values)
            };
        },
    });
    
    return cy.postGQL(query, altUrl).then((resp) => {
        expect(resp.isOkStatusCode).to.be.equal(true, "Status Code is 200");
        assert.notExists(resp.body.errors, "No errors");
        assert.exists(resp.body.data, "Data exists");
        assert.isArray(resp.body.data[dataPath].nodes, "Has Nodes array");

        const targetNode = resp.body.data[dataPath].nodes.filter((item) => {
            const id = dataPath === "refunds" ? item.order.id : item.id;
            return id === itemId;
        });
        expect(targetNode.length).to.be.eql(1, "Specific item found in nodes");
        const node = targetNode[0];
        expect(propNames.length).to.be.eql(values.length, "Same number of properties and values passed in");
        compareExpectedToResults(node, propNames, values);
    });
});

// Command for verifying the ByProductId queries
Cypress.Commands.add('queryByProductId', (queryName: string, queryBody: string, productId: string, expectedItems: []) => {
    const query = `query {
        ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
            nodes {
                ${queryBody}                
            }
        }
    }`;
    Cypress.log({
        name: "queryByProductId",
        message: `${queryName} for product "${productId}"`,
        consoleProps: () => {
            return {
                "Query used": queryName,
                "Query Body": queryBody,
                "Id of Product": productId,
                "Expected Items": toFormattedString(expectedItems),
                "Full query": query
            };
        },
    });
    return cy.postGQL(query).then((res) => {
        // has data
        assert.exists(res.body.data);
        assert.exists(res.body.data[queryName]);
        assert.exists(res.body.data[queryName].nodes);
        var returnedItems = res.body.data[queryName].nodes;
        assert.isArray(returnedItems);
        // Begin comparisons
        expect(returnedItems.length).to.be.eql(expectedItems.length, `Expect ${expectedItems.length} returned item`);
        for (var i = 0; i < expectedItems.length; i++) {
            const currentItem = expectedItems[i];
            const properties = Object.getOwnPropertyNames(currentItem);
            const values = [];
            properties.forEach((prop) => {
                values.push(currentItem[prop]);
            });
            compareExpectedToResults(returnedItems[i], properties, values);
        }
        return res;
    });
});

// STOREFRONT STUFF: For creating orders to use for refunds
const getVisibleMenu = () => {
    if (Cypress.$(".menu-toggle:visible").length === 0) {
        return cy.get(".top-menu.notmobile").then(cy.wrap);
    } else {
        cy.get(".menu-toggle").click();
        return cy.get(".top-menu.mobile").then(cy.wrap);
    }
};

const goToCart = () => {
    cy.get(".header-links").find(".ico-cart").click({ force: true });
    cy.wait(500);
};

Cypress.Commands.add("goToPublicHome", () => {
    Cypress.log({
        name: "goToPublicHome"
    });
    cy.location("pathname").then((path) => {
        if (path.includes("Admin")) {
            cy.get(".navbar-nav").find("li").eq(4).find("a").click({force: true});
            cy.wait(1000);
            cy.location("pathname").should("not.contain", "Admin");
        } else if (path.includes("en")) {
            getVisibleMenu()
                .find("li")
                .contains("Home page")
                .click({force: true});
            cy.wait(500); 
        }
    });
});

Cypress.Commands.add("clearCart", () => {
    Cypress.log({
        name: "clearCart"
    });
    goToCart();
    cy.get(".cart > tbody")
        .find("tr")
        .each(($tr, $i, $all) => {
            cy.wrap($tr).find("td").eq(0).find("input").check({ force: true });
        })
        .then(() => {
            cy.get(".update-cart-button").click({ force: true });
            cy.wait(500);
        });
});

Cypress.Commands.add("storefrontLogin", () => {
    Cypress.log({
        name: "storefrontLogin"
    });
    cy.get(".header-links").then(($el) => {
        if (!$el[0].innerText.includes('LOG OUT')) {
            cy.wrap($el).find(".ico-login").click();
            cy.wait(200);
            cy.get(".email").type(Cypress.env("storefrontLogin"));
            cy.get(".password").type(Cypress.env("storefrontPassword"));
            cy.get(".login-button").click({force: true});
            cy.wait(200);
        }
    });
});

Cypress.Commands.add("addCypressProductToCart", () => {
    Cypress.log({
        displayName: " ",
        message: "addCypressProductToCart"
    });
    getVisibleMenu()
        .find("li")
        .contains("Cypress Trees")
        .click({force: true});
    cy.wait(500); 
    cy.get(".item-box")
        .eq(0)
        .find(".product-box-add-to-cart-button")
        .click({force: true});
    cy.wait(200);
    goToCart();
});

Cypress.Commands.add("addDevProductToCart", () => {
    Cypress.log({
        displayName: " ",
        message: "addDevProductToCart"
    });
    cy.contains("Chocolate Muffin BD 2")
        .click({force: true});
    cy.wait(500);
    cy.get(".add-to-cart-button")
        .click({force: true});
    cy.wait(200);
    goToCart();
});
Cypress.Commands.add("getIframeBody", (iFrameName) => {
    // get the iframe > document > body
    // and retry until the body element is not empty
    return (
      cy
        .get(iFrameName)
        .its("0.contentDocument.body")
        .should("not.be.empty")
        // wraps "body" DOM element to allow
        // chaining more Cypress commands, like ".find(...)"
        // https://on.cypress.io/wrap
        .then(cy.wrap)
    );
});
  
Cypress.Commands.add("completeCheckout", (checkoutOptions?) => {
    Cypress.log({
        displayName: " ",
        message: "completeCheckout"
    });
    cy.get("#termsofservice").check({force: true});
    cy.get("#checkout").click({force: true});

    cy.server();
    cy.route("POST", "/checkout/OpcSaveBilling/").as('billingSaved');
    cy.route("POST", "/checkout/OpcSaveShippingMethod/").as('shippingSaved');
    cy.route("POST", "/checkout/OpcSavePaymentMethod/").as('paymentMethodSaved');
    cy.route("POST", "/checkout/OpcSavePaymentInfo/").as('paymentSaved');
    cy.route("POST", "/checkout/OpcConfirmOrder/").as('orderSubmitted');

    cy.get("#co-billing-form").then(($el) => {
        const select = $el.find(".select-billing-address");
        if (select.length === 0) {
            // Inputting Aptean's address
            cy.get("#BillingNewAddress_CountryId").select("United States");
            cy.get("#BillingNewAddress_StateProvinceId").select("Georgia");
            cy.get("#BillingNewAddress_City").type("Alpharetta");
            cy.get("#BillingNewAddress_Address1").type("4325 Alexander Dr #100");
            cy.get("#BillingNewAddress_ZipPostalCode").type("30022");
            cy.get("#BillingNewAddress_PhoneNumber").type("5555555555");
            cy.get("#BillingNewAddress_FaxNumber").type("8888888888");
            cy.get(".field-validation-error").should("have.length", 0);
        }
        cy.get(".new-address-next-step-button").eq(0).click();
        cy.wait('@billingSaved');
        // Shipping method
        cy.get("#co-shipping-method-form").find("input[name=shippingoption]").then(($inputs) => {
            var shippingOption = checkoutOptions && checkoutOptions.shippingMethod ? checkoutOptions.shippingMethod : Cypress._.random(0, $inputs.length - 1);
            cy.get(`#shippingoption_${shippingOption}`).check();
            cy.get(".shipping-method-next-step-button").click();
            cy.wait('@shippingSaved');
            // Payment Method
            cy.wait(2000);
            cy.url().then((url) => {
                if (url.includes("#opc-payment_method")) {
                    
                    cy.get("#payment-method-block").find("#paymentmethod_0").check();
                    cy.get(".payment-method-next-step-button").click();
                    cy.wait('@paymentMethodSaved');
                }
                // Payment Information
                cy.get("#co-payment-info-form").then(($element) => {    
                    cy.wait(2000); // Allow iFrame to load
                    const iframe = $element.find("#credit-card-iframe");
                    if (iframe.length === 0) {
                        // Non iframe version
                        cy.get("#CreditCardType").select("Discover");
                        cy.get("#CardholderName").type("Cypress McTester")
                        cy.get("#CardNumber").type("6011111111111117");
                        cy.get("#ExpireMonth").select("03");
                        cy.get("#ExpireYear").select("2024");
                        cy.get("#CardCode").type("123"); 
                    } else {
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-cc-number").type("6011111111111117");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-expiration-month").type("03");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-expiration-year").type("24");
                        cy.getIframeBody("#credit-card-iframe_iframe").find("#text-input-cvv-number").type("123");
                        cy.get("#submit-credit-card-button").click();
                        cy.wait(2000); // Allow iFrame to finish sumbitting
                    }
                    
                    cy.get(".payment-info-next-step-button").click();
                    cy.wait('@paymentSaved');
                    // Confirm order
                    cy.get(".confirm-order-next-step-button")
                        .should("exist")
                        .and("be.visible");
                    cy.get(".confirm-order-next-step-button").click();
                    cy.wait('@orderSubmitted');
                });
            });
        });
    });
});

Cypress.Commands.add("getToOrders", () => {
    Cypress.log({
        displayName: " ",
        message: "getToOrders"
    });
    // Admin site has undefined Globalize, causes Cypress to autofail tests
    cy.on("uncaught:exception", (err, runnable) => {
        return false;
    });
    cy.get(".administration").click({ force: true });
    cy.wait(1000);
    cy.location("pathname").should("eq", "/Admin");
    cy.get(".sidebar-menu.tree").find("li").contains("Sales").click({force: true});
    cy.get(".sidebar-menu.tree")
      .find("li")
      .find(".treeview-menu")
      .find("li")
      .contains("Orders")
      .click({force: true});
    cy.wait(500);
});

Cypress.Commands.add("placeOrder", (checkoutOptions?) => {
    if (Cypress.config("baseUrl").includes("tst")) {
        cy.addCypressProductToCart();
    } else if (Cypress.config("baseUrl").includes("dev")) {
        cy.addDevProductToCart();
    }
    cy.location("pathname").should("include", "cart");
    cy.completeCheckout(checkoutOptions);
    cy.location("pathname").should("include", "checkout/completed/");
    return cy.get(".order-number").find('strong').invoke("text").then(($el) => {
        var orderNumber = $el.slice(0).replace("Order number: ", "");
        cy.get(".order-completed-continue-button").click({force: true});
        return cy.wrap(orderNumber);
    });
});

// Places an order and returns the order amount
Cypress.Commands.add("createOrderGetAmount", (doNotPayOrder?: boolean) => {
    Cypress.log({
        name: "createOrderGetAmount"
    });
    
    return cy.placeOrder().then((orderNumber: string)=> {
        cy.getToOrders();
        cy.location("pathname").should("include", "/Order/List");
        cy.get("#orders-grid")
            .contains(orderNumber)
            .parent()
            .find("a")
            .contains("View")
            .click({force: true});
        cy.wait(500);
        cy.location("pathname").should("include", `/Order/Edit/${orderNumber}`);
        return cy.contains("Order total")
            .parents(".form-group")
            .find('.form-text-row')
            .invoke("text")
            .then(($totalText) => {
                var orderTotal = Number($totalText.slice(0).replace("$", ""));
                orderTotal = orderTotal * 100;
                if (!doNotPayOrder) {
                    cy.get("#markorderaspaid").click({force: true});
                    cy.wait(100);
                    cy.get("#markorderaspaid-action-confirmation-submit-button").click({force: true});
                    cy.wait(500);
                }
                return cy.wrap({orderAmount: orderTotal});
            });
    }); 
});

Cypress.Commands.add("createOrderRetrieveId", (gqlUrl: string, doNotPayOrder?: boolean) => {
    const trueCountQuery = `{
        orders(orderBy: {direction: ASC, field: TIMESTAMP}) {
            totalCount
        }
    }`;
    return cy.postGQL(trueCountQuery, gqlUrl).then((re) => {
        const trueCount = re.body.data.orders.totalCount;
        const orderQuery = `{
            orders(${trueCount >= 25 ? "first: " + (trueCount + 1) + ", ": ""}orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
            }
        }`;
        return cy.postGQL(orderQuery, gqlUrl).then((res) => {
            const orgOrders =  res.body.data.orders.nodes;
            return cy.createOrderGetAmount(doNotPayOrder).then((orderInfo) => {
                const {orderAmount} = orderInfo;
                cy.wait(1000);
                return cy.postGQL(orderQuery, gqlUrl).then((resp) => {
                    const newOrders = resp.body.data.orders.nodes;
                    expect(newOrders.length).to.be.greaterThan(orgOrders.length, "Should be a new order");
                    const relevantOrder = newOrders.filter((order) => {
                        var notPresent = true;
                        for(var i = 0; i < orgOrders.length; i++) {
                            if (orgOrders[i].id === order.id) {
                                notPresent = false;
                                break;
                            }
                        }
                        return notPresent;
                    });
                    const trueId = relevantOrder[0].id;
                    return cy.wrap({orderId: trueId, orderAmount: orderAmount});
                });
            });
        });
    });
});

Cypress.Commands.add("createShippingOrderId", (gqlUrl: string, checkoutOptions?) => {
    const today = new Date();
    const todayInput = today.toISOString();
    const query = `{
        orders(startDate: "${todayInput}", orderBy: {direction: ASC, field: TIMESTAMP}) {
            nodes {
                id
            }
        }
    }`;
    return cy.postGQL(query, gqlUrl).then((res) => {
        const orgOrders =  res.body.data.orders.nodes;
        return cy.placeOrder(checkoutOptions).then((orderNumber: string) => {
            cy.wait(1000);
            return cy.postGQL(query, gqlUrl).then((resp) => {
                const newOrders = resp.body.data.orders.nodes;
                expect(newOrders.length).to.be.greaterThan(orgOrders.length, "Should be a new order");
                const relevantOrder = newOrders.filter((order) => {
                    var notPresent = true;
                    for(var i = 0; i < orgOrders.length; i++) {
                        if (orgOrders[i].id === order.id) {
                            notPresent = false;
                            break;
                        }
                    }
                    return notPresent;
                });
                const trueId = relevantOrder[0].id;
                return cy.wrap(trueId);
            });
        });
    });
});