/**
 * COMMANDS FOR QUERY PAGINATION TESTS
 */

/**
 * COMMANDS FOR ORDERBY TESTS
 */

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

// Verifies that changing orderBy direction changes the order of the nodes and edges
Cypress.Commands.add("verifyReverseOrder", (queryName: string, ascRes, descRes) => {
    Cypress.log({
        name: "verifyReverseOrder",
        message: queryName,
        consoleProps: () => {
            return {
                "Query name": queryName,
                "ASC query response": ascRes.body.data,
                "DESC query response": descRes.body.data
            };
        },
    });
    expect(descRes.body.data[queryName].totalCount).to.be.eql(ascRes.body.data[queryName].totalCount, "TotalCount should be the same");
    expect(descRes.body.data[queryName].nodes.length).to.be.eql(ascRes.body.data[queryName].nodes.length, "nodes length should be the same");
    expect(descRes.body.data[queryName].edges.length).to.be.eql(ascRes.body.data[queryName].edges.length, "edges length should be the same");
    const ascNodes = ascRes.body.data[queryName].nodes;
    const aNoReversed = ascNodes.slice(0).reverse();
    const descNodes = descRes.body.data[queryName].nodes;
    const dNoReversed = descNodes.slice(0).reverse();
    expect(descNodes).not.to.be.eql(ascNodes, "DESC nodes !== ASC nodes");
    for (var i = 0; i < descNodes.length; i++) {
        if (descNodes.length % 2 !== 0 && i !== Math.floor(descNodes.length /2 )) {
            expect(descNodes[i]).not.to.be.eql(ascNodes[i], `DESC nodes !== ASC nodes. index ${i}, id ${descNodes[i].id}`);
        }
        expect(descNodes[i]).to.be.eql(aNoReversed[i], `DESC nodes === ASC nodes. index ${i}, id ${descNodes[i].id}`);
        expect(ascNodes[i]).to.be.eql(dNoReversed[i], `ASC nodes === DESC nodes. index ${i}, id ${ascNodes[i].id}`);
    }
    const ascEdges = ascRes.body.data[queryName].edges;
    const aEdReversed = ascEdges.slice(0).reverse();
    const descEdges = descRes.body.data[queryName].edges;
    const dEdReversed = descEdges.slice(0).reverse();
    expect(descEdges).not.to.be.eql(ascEdges, "DESC edges !== ASC edges");
    for (var i = 0; i < descEdges.length; i++) {
        if (descEdges.length % 2 !== 0 && i !== Math.floor(descEdges.length /2 )) {
            expect(descEdges[i].node).not.to.be.eql(ascEdges[i].node, `DESC edges !== ASC edges. index ${i}, id ${descEdges[i].node.id}`);
        }
        expect(descEdges[i].node).to.be.eql(aEdReversed[i].node, `DESC edges === ASC edges. index ${i}, id ${descEdges[i].node.id}`);
        expect(ascEdges[i].node).to.be.eql(dEdReversed[i].node, `ASC edges === DESC edges. index ${i}, id ${descEdges[i].node.id}`);
    }
    const ascStartCursor = ascRes.body.data[queryName].pageInfo.startCursor;
    const ascStCurNode = ascEdges[0].node;
    const ascEndCursor = ascRes.body.data[queryName].pageInfo.endCursor;
    const ascEndCurNode = ascEdges[ascEdges.length - 1].node;
    const descStartCursor = descRes.body.data[queryName].pageInfo.startCursor;
    const descStCurNode = descEdges[0].node;
    const descEndCursor = descRes.body.data[queryName].pageInfo.endCursor;
    const descEndCurNode = descEdges[descEdges.length - 1].node;
    expect(descStartCursor).not.to.be.eql(ascStartCursor, "DESC pageInfo shouldn't have the same startCursor as ASC");
    expect(descStCurNode).not.to.be.eql(ascStCurNode, "Verifing the above with the matching nodes");
    expect(descEndCursor).not.to.be.eql(ascEndCursor, "DESC pageInfo shouldn't have the same endCursor as ASC");
    expect(descEndCurNode).not.to.be.eql(ascEndCurNode, "Verifing the above with the matching nodes");
    expect(descStCurNode).to.be.eql(ascEndCurNode, "DESC pageInfo's startCursor node should be ASC pageInfo's endCursor node");
    expect(descEndCurNode).to.be.eql(ascStCurNode, "DESC pageInfo's endCursor node should be ASC pageInfo's startCursor node");
});

/** 
 * COMMANDS FOR FIRST/LAST TESTS
 */

// Confirms that the number of nodes/edges matches the total count
Cypress.Commands.add("confirmCount", (res, queryName: string) => {
    Cypress.log({
        name: "confirmCount",
        message: queryName,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName
            };
        },
    });
    const totalCount = res.body.data[queryName].totalCount;
    const nodeCount = res.body.data[queryName].nodes.length;
    const edgeCount = res.body.data[queryName].edges.length;
    if (totalCount > 25) {
        expect(nodeCount).to.be.eql(25);
        expect(edgeCount).to.be.eql(25);
    } else {
        expect(nodeCount).to.be.eql(totalCount);
        expect(edgeCount).to.be.eql(totalCount);
    }
    return totalCount > 25;
});

// Gets the total count of the query and returns it, while wrapping the nodes 
Cypress.Commands.add("returnCount", (gqlQuery: string, queryName: string) => {
    Cypress.log({
        name: "returnCount",
        message: `Get totalCount of ${queryName}`,
        consoleProps: () => {
            return {
                "Query body": gqlQuery,
                "Query name": queryName
            };
        },
    });
    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        cy.wrap(res.body.data[queryName]).as('orgData');
        const count = res.body.data[queryName].nodes.length;
        return cy.wrap(count);
    });
});

// Validates the nodes, edges, and pageInfo of a basic query using first OR last, and orderBy
// Compares it to a vanilla query using orderBy, so must call returnCount first
Cypress.Commands.add("verifyFirstOrLast", (res, queryName: string, value: number, firstOrLast: string) => {
    Cypress.log({
        name: "verifyFirstOrLast",
        message: `${queryName}, ${firstOrLast}: ${value}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
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
    const nodes = res.body.data[queryName].nodes;
    const edges = res.body.data[queryName].edges;
    const pageInfo = res.body.data[queryName].pageInfo;
    expect(nodes.length).to.be.eql(value);
    expect(edges.length).to.be.eql(value);
    cy.get('@orgData').then((orgRes) => {
        var orgEdges = orgRes.edges;
        var orgNodes = orgRes.nodes;
        expect(orgEdges.length).to.be.greaterThan(value);
        expect(orgNodes.length).to.be.greaterThan(value);
        var orgPageInfo = orgRes.pageInfo;
        var idFormat = queryName === "refunds" ? "id" : "order.id";
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

/**
 * COMMANDS FOR STARTDATE/ENDDATE TESTS
 */

// Runs the query and grabs the createdDate from a random node, as long as the created date starts with 20 (aka was created in the 2000s)
Cypress.Commands.add('returnRandomDate', (gqlQuery: string, queryName: string, getLowerStart?: boolean, after?: string) => {
    Cypress.log({
        name: "returnRandomName",
        message: `${queryName}${after ? ". Return date after: " + after : ""}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName,
                "Date chosen from lower half": !!getLowerStart,
                "Date to use as lower limit": after ? after : "not provided"
            };
        },
    });

    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        const { nodes } = res.body.data[queryName];
        assert.isNotEmpty(nodes, "Query returned nodes");
        const validValues = nodes.filter((node) => {
            return node.createdDate.startsWith("20");
        });
        assert.isNotEmpty(validValues, "There are existing valid items");
        validValues.sort(function(a, b){
            const dateA = new Date(a.createdDate);
            const dateB = new Date(b.createdDate);
            var returnVal;
            if (dateA < dateB) {
                returnVal = -1;
            } else if (dateA > dateB) {
                returnVal = 1;
            } else {
                returnVal = 0;
            }
            return returnVal;
        });
        var upperLimit = getLowerStart ? Math.floor((validValues.length - 1) / 2) : validValues.length - 1;
        var afterValues;
        if (after) {
            const afterDate = new Date(after);
            afterValues = validValues.filter((node) => {
                const createdDate = new Date(node.createdDate);
                return createdDate > afterDate;
            });
            assert.isNotEmpty(afterValues, `There are items with a date after ${after}`);
            upperLimit = afterValues.length - 1;
        }
        const randomIndex = Cypress._.random(0, upperLimit);
        const randomNode = after && afterValues ? afterValues[randomIndex] : validValues[randomIndex];
        const randomDate = randomNode.createdDate;
        return cy.wrap(randomDate);
    });
});

// Verifies that the createdDate of all nodes is before the provided startDate and/or after the provided endDate
Cypress.Commands.add("verifyDateInput", (res, queryName: string, startDate?: string, endDate?: string) => {
    Cypress.log({
        name: "verifyDateInput",
        message: `${queryName}: ${startDate ? "startDate: " + startDate : ""}${startDate && endDate ? ", " : ""}${endDate ? "endDate: " + endDate : ""}`,
        consoleProps: () => {
            return {
                "Query name": queryName,
                "startDate": startDate ? startDate : "not used",
                "endDate": endDate ? endDate : "not used",
                "Query response": res.body.data
            };
        },
    });
    const { nodes } = res.body.data[queryName];
    const start = startDate ? new Date(startDate): null;
    const end = endDate ? new Date(endDate): null;
    nodes.forEach((node, index) => {
        const createdDate = new Date(node.createdDate);
        if (startDate && start) {
            expect(createdDate).to.be.gte(start, `Node[${index}].createdDate should be >= provided startDate`);
        }
        if (endDate && end) {
            expect(createdDate).to.be.lte(end, `Node[${index}].createdDate should be <= provided endDate`);
        }
    });
});

/**
 * COMMANDS FOR SEARCHSTRING/ID TESTS
 */

// Runs the query and grabs a random node to take the name from. Query body should look for name
Cypress.Commands.add('returnRandomName', (gqlQuery: string, queryName: string) => {
    Cypress.log({
        name: "returnRandomName",
        message: queryName,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName
            };
        },
    });
    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        var randomIndex = 0;
        var totalCount = res.body.data[queryName].totalCount > 25 ? 25 : res.body.data[queryName].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[queryName].nodes[randomIndex];
        const duplicateArray = res.body.data[queryName].nodes.filter((val) => {
            return val.name === randomNode.name;
        });
        if (duplicateArray.length > 1) {
            const uniqueArray = res.body.data[queryName].nodes.filter((val) => {
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
Cypress.Commands.add("validateNameSearch", (res, queryName: string, searchValue: string) => {
    Cypress.log({
        name: "validateNameSearch",
        message: `${queryName}, searchString: ${searchValue}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
                "searchString": searchValue
            };
        },
    });
    const totalCount = res.body.data[queryName].totalCount;
    const nodes = res.body.data[queryName].nodes;
    const edges = res.body.data[queryName].edges;
    expect(totalCount).to.be.gte(nodes.length);
    expect(totalCount).to.be.gte(edges.length);
    for (var i = 0; i < nodes.length; i++) {
        expect(nodes[i].name.toLowerCase()).to.include(searchValue.toLowerCase(), `Node[${i}]`);
        expect(edges[i].node.name.toLowerCase()).to.include(searchValue.toLowerCase(), `Edge[${i}]`);
    }
});

// For queries that have a info field instead of a name field.
// Runs the query and grabs a random node to take the name from. Query body should look for name
Cypress.Commands.add("returnRandomInfoName", (gqlQuery: string, queryName: string, infoName: string) => {
    Cypress.log({
        name: "returnRandomInfoName",
        message: `${queryName}, ${infoName}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName,
                "Info path": infoName
            };
        },
    });

    function runNameFilter(node) {
        var info = node[infoName].filter((val) => {
            return val.languageCode === "Standard" &&  val.name !== "";
        });
        if (info.length < 1) {
            info = node[infoName].filter((val) => {
                return val.name !== "";
            });
            expect(info.length).to.be.gte(1); // Need to have a name we can search with
        }
        info = info[0];
        return info;
    };

    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        var randomIndex = 0;
        const totalCount = res.body.data[queryName].totalCount > 25 ? 25 : res.body.data[queryName].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[queryName].nodes[randomIndex];
        var infoNode = runNameFilter(randomNode);
        const duplicateArray = res.body.data[queryName].nodes.filter((val) => {
            const infoArray = val[infoName].filter((item) => {
                return item.name === infoNode.name;
            });
            return infoArray.length > 0;
        });
        if (duplicateArray.length > 1) {
            const uniqueArray = res.body.data[queryName].nodes.filter((val) => {
                const infoArray = val[infoName].filter((item) => {
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

// For queries that have a info field instead of a name field.
// Validates that a query with searchString returned the node with the correct name or nodes that contain the string
Cypress.Commands.add("validateInfoNameSearch", (res, queryName: string, infoName: string, searchValue: string) => {
    Cypress.log({
        name: "validateInfoNameSearch",
        message: `${queryName}, ${infoName}, searchString: ${searchValue}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
                "Info name": infoName,
                "searchString": searchValue
            };
        },
    });
    const totalCount = res.body.data[queryName].totalCount;
    const nodes = res.body.data[queryName].nodes;
    const edges = res.body.data[queryName].edges;
    if (totalCount <= 25) {
        expect(totalCount).to.be.eql(nodes.length);
        expect(totalCount).to.be.eql(edges.length);
    }
    for (var i = 0; i < nodes.length; i++) {
        var infoArray = nodes[i][infoName].filter((val) => {
            return val.name.toLowerCase().includes(searchValue.toLowerCase());
        });
        expect(infoArray.length).to.be.gte(1, `Node[${i}]`);
        var edgeInfoArray = edges[i].node[infoName].filter((val) => {
            return  val.name.toLowerCase().includes(searchValue.toLowerCase());
        });
        expect(edgeInfoArray.length).to.be.gte(1, `Edge[${i}]`);
        expect(infoArray.length).to.be.eql(edgeInfoArray.length);
    }
});

// Runs the query and grabs a random node to take the id from. Pass in the id name for queries whose id field names aren't standard
Cypress.Commands.add('returnRandomId', (gqlQuery: string, queryName: string, idName?: string) => {
    Cypress.log({
        name: "returnRandomId",
        message: queryName + `${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        var randomIndex = 0;
        var totalCount = res.body.data[queryName].totalCount > 25 ? 25 : res.body.data[queryName].totalCount;
        if (totalCount > 1) {
            randomIndex = Cypress._.random(0, totalCount - 1);
        }
        var randomNode = res.body.data[queryName].nodes[randomIndex];
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

// Runs the query and grabs a random nodes to return multiple ids. Pass in the id name for queries whose id field names aren't standard 
Cypress.Commands.add('returnMultipleRandomIds', (numberOfIds:number, gqlQuery: string, queryName: string, idName?: string) => {
    Cypress.log({
        name: "returnMultipleRandomIds ",
        message: queryName + `${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
       cy.postAndValidate(gqlQuery, queryName).then((res) => {
     
        var totalCount = res.body.data[queryName].totalCount ;

        if (numberOfIds > 25 && totalCount>25) {
            var insertIndex = gqlQuery.indexOf("orderBy");
            gqlQuery = gqlQuery.slice(0, insertIndex) + `first: ${numberOfIds}, ` + gqlQuery.slice(insertIndex);
              cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                  totalCount=numberOfIds;
             return  returnIds(resp,totalCount,numberOfIds)
            });
        }
        else{
            totalCount = totalCount > 25? 25:res.body.data[queryName].totalCount;
            return  returnIds(res,totalCount,numberOfIds);
        }
    });
    function returnIds(res,totalCount:number,numberOfIds:number){
        var randomIndex = [];
        var quot=0, rem=0, c=0;
        if(totalCount>=numberOfIds)
        {
         quot = Math.floor(totalCount/numberOfIds);  
         rem = totalCount%numberOfIds;
         for(var i = 0;i < totalCount-rem;i+=quot)
         { 
             if(i==totalCount-quot-1)
             {
                randomIndex[c] = Cypress._.random(i,i+quot+rem-1);
                c++;
                
             }
             else{
             randomIndex[c] = Cypress._.random(i,i+quot-1);
             c++;
             }
         }
        }
        else{
            numberOfIds = totalCount;
            expect(numberOfIds).to.be.eql(totalCount,"Number Of iDs greater than totalCount hence returning only the ids available")
            quot = 1; 
            for(var i = 0;i < totalCount;i+=quot)
            { 
                   randomIndex[c]= Cypress._.random(i,i+quot-1);
                   c++;
            }
        }
        var randomNodes = []
        for(var i = 0;i < numberOfIds;i++){
         randomNodes[i] = res.body.data[queryName].nodes[randomIndex[i]];
        }
        var id=[];
        for(var i = 0;i < numberOfIds;i++){
        if (!idName) {
            id[i] = randomNodes[i].id;
        } else {
            if (idName.includes(".id")) {
                var split = idName.split(".");
                id[i] = randomNodes[i][split[0]][split[1]];
            } else {
                id[i] = randomNodes[i][idName];
            }
        }
    }
    return cy.wrap(id);
}

});


// For queries that search by id instead of name. Pass in the id name for queries whose id field names aren't standard
// Validates that a query with searchString returned the node with the correct id or nodes with ids that contain the string
Cypress.Commands.add("validateIdSearch", (res, queryName: string, searchValue: string, idName?: string) => {
    Cypress.log({
        name: "validateIdSearch",
        message: `${queryName}, searchString: ${searchValue}${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
                "searchString": searchValue,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    const totalCount = res.body.data[queryName].totalCount;
    const nodes = res.body.data[queryName].nodes;
    const edges = res.body.data[queryName].edges;
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

// For queries that search by id instead of name. 
Cypress.Commands.add("validateMultipleIdSearch", (res, queryName: string, idValue: [], idName?: string) => {
    Cypress.log({
        name: "validateMultipleIdSearch",
        message: `${queryName}, ids: ${idValue}${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
                "searchString": idValue,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    const totalCount = res.body.data[queryName].totalCount;
   var node,edge;
    const nodes = res.body.data[queryName].nodes;
    const edges = res.body.data[queryName].edges;
    expect(totalCount).to.be.eql(nodes.length);
    expect(totalCount).to.be.eql(edges.length);
    for (var i = 0; i < nodes.length; i++) {
    var targetNode;
      if(!idName){
        targetNode = nodes.filter((item) => {
            const id = item.id;
            return id === idValue[i];
        });
      
       }
        else {
           if (idName.includes(".id")) {
                var split = idName.split(".");
                targetNode = nodes.filter((item) => {
                    const id = item[split[0]][split[1]];
                    return id === idValue[i];
                });
               
            } else {
                targetNode = nodes.filter((item) => {
                    const id = item.idName;
                    return id === idValue[i];
                });
               
            }
        }
        expect(targetNode.length).to.be.eql(1, "Specific item found in nodes");
    }
});


/**
 * COMMANDS FOR BEFORE/AFTER TESTS
 */

// Grabs a random cursor and returns it while wrapping the data.
// laterHalf controls which half of the edges array the cursor is taken from
Cypress.Commands.add("returnRandomCursor", (gqlQuery: string, queryName: string, laterHalf: boolean) => {
    Cypress.log({
        name: "returnRandomCursor",
        message: queryName,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName
            };
        },
    });
    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        var randomIndex = 0;
        var totalCount = res.body.data[queryName].totalCount > 25 ? 25 : res.body.data[queryName].totalCount;
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
        const randomEdge = res.body.data[queryName].edges[randomIndex];
        cy.wrap(res.body.data[queryName]).as('orgData');
        cy.wrap(res.body.data[queryName].totalCount).as('orgCount');
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
Cypress.Commands.add("validateCursor", (res, queryName: string, beforeAfter: string, firstLast?: string, value?: number) => {
    Cypress.log({
        name: "validateCursor",
        message: `${queryName}, ${beforeAfter} ${firstLast ? ", " + firstLast + ", " : ""}${value ? value : ""}`,
        consoleProps: () => {
            return {
                "New query data": res,
                "Query name": queryName,
                "Cursor type": beforeAfter,
                "First or Last input": firstLast,
                "First or Last value": value
            };
        },
    });

    const edges = res.body.data[queryName].edges;
    const nodes = res.body.data[queryName].nodes;
    const totalCount = res.body.data[queryName].totalCount;
    const pageInfo = res.body.data[queryName].pageInfo;
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

/**
 * MISC QUERY COMMANDS
 */

// Validates the values field for checkoutAttributes and productAttributes
Cypress.Commands.add("validateValues", (res, queryName: string) => {
    Cypress.log({
        name: "validateValues",
        message: `validate values field for ${queryName}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName
            };
        },
    });
    if (res.body.data[queryName].nodes.length > 0) {
        const nodesPath = res.body.data[queryName].nodes;
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
                if (queryName === "productAttributes") {
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

// Verifies that the pageInfo matches the cursors
Cypress.Commands.add("verifyPageInfo", (res, queryName: string, expectNext?: boolean, expectPrevious?: boolean) => {
    Cypress.log({
        name: "verifyPageInfo",
        message: `${queryName}, expectNext: ${expectNext}, expectPrevious: ${expectPrevious}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName,
                "hasNextPage expected to be": expectNext,
                "hasPreviousPage expected to be": expectPrevious
            };
        },
    });
    const pageInfo = res.body.data[queryName].pageInfo;
    const edges = res.body.data[queryName].edges;
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

Cypress.Commands.add('returnMultipleIds', (idCount :number, gqlQuery: string, queryName: string, idName?: string) => {
    Cypress.log({
        name: "returnRandomId",
        message: queryName + `${idName ? ", " + idName : ""}`,
        consoleProps: () => {
            return {
                "ID count": idCount,
                "Query Body": gqlQuery,
                "Query name": queryName,
                "Name of id field": idName ? idName : "id"
            };
        },
    });
    return cy.postAndValidate(gqlQuery, queryName).then((res) => {
        var totalCount = res.body.data[queryName].totalCount;
        var ids = [];
        if(idCount <= 25){
            if(totalCount >= idCount){
                totalCount = idCount;
                for(let i = 0; i < idCount; i++){
                    ids[i] = res.body.data[queryName].nodes[i].id;
                }
            }
            else{
                cy.log("Only " + totalCount + " ids are found, validating with " + totalCount + " ids");
                for(let i = 0; i < totalCount; i++){
                    ids[i] = res.body.data[queryName].nodes[i].id;
                }
            }
        }
        else if (idCount > 25) {
            let insertIndex = gqlQuery.indexOf("orderBy");
            gqlQuery = gqlQuery.slice(0, insertIndex) + `first: ${idCount},` + gqlQuery.slice(insertIndex);
            return cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                totalCount = res.body.data[queryName].totalCount;
                if(totalCount >= idCount){
                    totalCount = idCount;
                    for(let i = 0; i < idCount; i++){
                        ids[i] = resp.body.data[queryName].nodes[i].id;
                    }
                }
                else{
                    cy.log("Only " + totalCount + " ids are found, validating with " + totalCount + " ids");
                    for(let i = 0; i < totalCount; i++){
                        ids[i] = resp.body.data[queryName].nodes[i].id;
                    }
                }
                cy.wrap(totalCount).as('totCount');
                return cy.wrap(ids);
            });
        }
        cy.wrap(totalCount).as('totCount');
        return cy.wrap(ids);
    });
});