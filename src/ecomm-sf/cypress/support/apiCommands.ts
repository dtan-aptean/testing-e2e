export const codeMessageError = `code
    message
    errors {
        code
        message
        domain
        details {
            code
            message
            target
        }
    }
    error
`;
// Make sure each item is a Cypress item, and if it is, call command to delete it
const deleteItems = (nodes, deleteName: string, searchBy: string, infoName?: string, altUrl?: string, descendingName?: string) => {
    nodes.forEach((item) => {
        var id = item.id;
        if (infoName) {
            const nameArray = item[infoName].filter((nameItem) => {
                return nameItem.name.includes(searchBy) && nameItem.languageCode === "Standard";
            });
            if (nameArray.length > 0) {
                performDelete(deleteName, id, altUrl);
            }
        } else if (deleteName === "deletePaymentSettings") {
            var name = item.company.name;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        } else if (deleteName === "deleteCustomer") {
            var name = item.email;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        } else if (descendingName) {
            var levels = descendingName.split(".");
            var name = item;
            levels.forEach((nam) => {
                name = name[nam];
            });
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        } else {
            var name = item.name;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id, altUrl);
            }
        }
    });
};

const getNameField = (infoName?: string): string => {
    var nameField = "name";
    if (infoName) {
        nameField = `${infoName} {
            name
            languageCode
        }`;
    }
    return nameField;
};

// Searches for the cypress items and returns them.
// If the first query indicates there are more items, will query again for all items and return those all
const getNodes = (
    queryName: string,
    searchBy: string,
    infoName?: string,
    additionalFields?: string,
    altUrl?: string,
    additionalInput?: string
) => {
    var nameField;
    if (queryName === "paymentSettings" || queryName === "addresses") {
        nameField = "";
    } else if (queryName === "customers") {
        nameField = "email";
    } else {
        nameField = getNameField(infoName);
    }
    const queryBody = `${additionalInput ? additionalInput + ", " : ""}searchString: "${searchBy}", orderBy: {direction: ASC, field: ${queryName === "paymentSettings" ? "COMPANY_NAME" : "NAME"}}) {
        totalCount
        nodes {
            id
            ${nameField}
            ${additionalFields ? additionalFields : ""}
        }
    }`;
    const query = `{
		${queryName}(${queryBody}
    }`;
    return cy.postNoFail(query, queryName, altUrl).then((res) => {
        if (res) {
            const totalCount = res.body.data[queryName].totalCount;
            if (totalCount > 25) {
                const newQuery = `{
                    ${queryName}(first: ${totalCount}, ${queryBody}
                }`;
                return cy.postNoFail(newQuery, queryName, altUrl).then((resp) => {
                    if (resp) {
                        const nodes = resp.body.data[queryName].nodes;
                        return cy.wrap(nodes);
                    }
                    return false;
                });
            } else if (totalCount > 0) {
                const nodes = res.body.data[queryName].nodes;
                return cy.wrap(nodes);
            } else {
                Cypress.log({ message: "No Cypress items found" });
                return false;
            }
        }
        return false;
    });
};

// Command to delete all Cypress items. Will query for cypress items and delete them if found
// Include the searchString to check for Cypress items of a specific name
Cypress.Commands.add("deleteCypressItems", (
    queryName: string,
    deleteName: string,
    infoName?: string,
    searchString?: string,
    altUrl?: string
) => {
    const searchBy = searchString ? searchString : "Cypress";
    var extraField;
    if (queryName === "categories") {
        extraField = `parent {
            id
        }`;
    } else if (queryName === "paymentSettings") {
        extraField = `company {
            name
        }`;
    } else if (queryName === "customers") {
        extraField = `email`;
    }
    Cypress.log({ name: "deleteCypressItems", message: `Using ${queryName} to search for "${searchBy}"` });
    getNodes(queryName, searchBy, infoName, extraField, altUrl).then((nodes) => {
        if (nodes) {
            // If deleting categories, make sure to delete child categories before parents.
            if (queryName === "categories") {
                const childCats = nodes.filter((node) => {
                    return node.parent !== null;
                });
                if (childCats.length > 0) {
                    deleteItems(childCats, deleteName, searchBy, infoName, altUrl)
                }
                const parentCats = nodes.filter((node) => {
                    return node.parent === null;
                });
                if (parentCats.length > 0) {
                    deleteItems(parentCats, deleteName, searchBy, infoName, altUrl);
                }
            } else if (queryName === "paymentSettings") {
                const cypressPaymentSettings = nodes.filter((node) => {
                    return node.company.name.toLowerCase().includes("cypress");
                });
                if (cypressPaymentSettings.length > 0) {
                    deleteItems(cypressPaymentSettings, deleteName, searchBy, infoName, altUrl);
                } else {
                    Cypress.log({ message: "No Cypress items found" });
                }
            } else {
                deleteItems(nodes, deleteName, searchBy, infoName, altUrl);
            }
        }
    });
});

// Command to delete items that require special search input
Cypress.Commands.add("deleteSpecialCypressItems", (
    queryName: string,
    deleteName: string,
    specialInput: string,   // EX: a companyId or customerId
    specialInputName: string,   // What the special input is: if it's a companyId, pass in 'companyId'
    searchString?: string,
    altUrl?: string
) => {
    const searchBy = searchString ? searchString : "Cypress";
    var extraField;
    if (specialInputName === "customerId") {
        extraField = `customer {
            id
            email
            firstName
            lastName
        }`
    } else if (specialInputName === "companyId") {
        extraField = `company {
            id
            name
        }`
    }
    Cypress.log({name: "deleteSpecialCypressItems", message: `Using ${queryName} to search for "${searchBy}"`});
    const input = typeof specialInput === "string" ? `${specialInputName}: "${specialInput}"` : `${specialInputName}: ${specialInput}`;
    getNodes(queryName, searchBy, undefined, extraField, altUrl, input).then((nodes) => {
        if (nodes) {
            if (specialInputName === "customerId") {
                const validNodes = nodes.filter((node) => {
                    return node.customer.email.toLowerCase().includes("cypress") || node.customer.firstName.toLowerCase().includes("cypress") || node.customer.lastName.toLowerCase().includes("cypress");
                });
                if (validNodes.length > 0) {
                    deleteItems(validNodes, deleteName, searchBy, undefined, altUrl, "customer.email");
                } else {
                    Cypress.log({message: "No Cypress items found"});
                }
            } else if (specialInputName === "companyId") {
                const validNodes = nodes.filter((node) => {
                    return node.company.name.toLowerCase().includes("cypress");
                });
                if (validNodes.length > 0) {
                    deleteItems(validNodes, deleteName, searchBy, undefined, altUrl, "company.name");
                } else {
                    Cypress.log({message: "No Cypress items found"});
                }
            }
        }
    });
});

// Turns an array or object into a string to use as gql input or with a custom command's consoleProps logging functionality
export const toFormattedString = (item, isMessage?: boolean, indentation?: number): string => {
    // Names of fields that are enum types and should not be wrapped in quotations.
    const enumTypes = ["discountType", "discountLimitationType", "manageInventoryMethod", "backOrderMode", "action"];
    function addTabs(depthLevel: number) {
        var indent = '  ';
        for (var i = 1; i < depthLevel; i++) {
            indent = indent + '  ';
        }
        return indent;
    };
    function iterateThrough(propNames?: string[], descentLevel?: number) {
        var returnValue = descentLevel && isMessage ? addTabs(descentLevel) : '';
        for (var i = 0; i < (propNames ? propNames.length : item.length); i++) {
            if (i !== 0) {
                returnValue = returnValue + ', ' + (descentLevel && isMessage ? '\n' + addTabs(descentLevel) : '');
            }
            var value = propNames ? item[propNames[i]] : item[i];
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
                value = toFormattedString(value, isMessage, descentLevel);
            }
            returnValue = returnValue + (propNames ? `${propNames[i]}: ${value}` : value);
        }
        return returnValue;
    };
    var itemAsString = isMessage ? '{\n' : '{ ';
    var props = undefined;
    var descentLevel = undefined;
    if (item === null) {
        return "null";
    } else if (item === undefined) {
        return "undefined";
    } else if (Array.isArray(item)) {
        itemAsString = isMessage ? '[\n' : '[';
    } else if (typeof item === 'object') {
        props = Object.getOwnPropertyNames(item);
    }
    var closer = props ? '}' : ']';
    if (isMessage && !indentation) {
        descentLevel = 1;
        itemAsString = '\n' + itemAsString;
        closer = '\n' + closer;
    } else if (isMessage && indentation) {
        descentLevel = indentation + 1;
        closer = '\n' + addTabs(indentation) + closer;
    } else {
        closer = props ? ' ' + closer : closer;
    }
    itemAsString = itemAsString + iterateThrough(props, descentLevel) + closer;
    return itemAsString;
};

/**
 * THE POST COMMAND USED BY ALL COMMANDS THAT MAKE API CALLS
 */

// This will post GQL query or mutation. Use altUrl to post the call to a different url than baseUrl
Cypress.Commands.add('postGQL', (query, altUrl?: string) => {
    Cypress.log({
        name: "postGQL",
        consoleProps: () => {
            return {
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl"),
                "Headers": `"x-aptean-apim": ${Cypress.env('x-aptean-apim')} \n\t\t\t "x-aptean-tenant": ${Cypress.env('x-aptean-tenant')} \n\t\t\t "x-aptean-tenant-secret": ${Cypress.env('x-aptean-tenant-secret')}`,
                "Query/Mutation Body": query,
            };
        },
    });
    if (altUrl) {
        if (altUrl.charAt(altUrl.length - 1) === "/") {
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

/**
 * COMMANDS FOR VALIDATING A RESPONSE'S BASIC TYPES AND LACK OF ERRORS
 */

// Tests the standard query response for standard valid data
Cypress.Commands.add('validateQueryRes', (gqlQuery: string, res, queryName: string) => {
    Cypress.log({
        name: "validateQueryRes",
        message: `Validate response for ${queryName}`,
        consoleProps: () => {
            return {
                "Query name": queryName,
                "Query Body": gqlQuery,
                "Response": res
            };
        },
    });
    // should be 200 ok
    expect(res.isOkStatusCode).to.be.equal(true, "Expect statusCode to be 200 ok");
    // no errors
    assert.notExists(res.body.errors, createErrorMessage(res, gqlQuery, "query"));
    // has data
    assert.exists(res.body.data, "Expect response to have data");
    // validate data types
    if (gqlQuery.includes("edges")) {
        assert.exists(res.body.data[queryName].edges, "edges exists");
        assert.isArray(res.body.data[queryName].edges, "edges is an array");
    }
    if (gqlQuery.includes("nodes")) {
        assert.exists(res.body.data[queryName].nodes, "nodes exists");
        assert.isArray(res.body.data[queryName].nodes, "nodes is an array");
    }
    if (gqlQuery.includes("pageInfo")) {
        assert.exists(res.body.data[queryName].pageInfo, "pageInfo exists");
        assert.isObject(res.body.data[queryName].pageInfo, "pageInfo is an object");
    }
    if (gqlQuery.includes("totalCount")) {
        assert.exists(res.body.data[queryName].totalCount, "totalCount exists");
        assert.isNotNaN(res.body.data[queryName].totalCount, "totalCount is not NaN");
    }
    if (gqlQuery.includes("edges") && gqlQuery.includes("nodes")) {
        expect(res.body.data[queryName].edges.length).to.be.eql(res.body.data[queryName].nodes.length, "Expect edge length to equal nodes length");
    }
});

// Test the standard mutation response for standard valid data
// When validating a delete mutation, pass in the itemPath as "deleteMutation" 
Cypress.Commands.add("validateMutationRes", (gqlMut: string, res, mutationName: string, itemPath: string) => {
    const successMessage = createMutResMessage(true, mutationName);
    Cypress.log({
        name: "validateMutationRes",
        message: `Validate response for ${mutationName}`,
        consoleProps: () => {
            return {
                "GQL Mutation": gqlMut,
                "Mutation name": mutationName,
                "Response item path": itemPath,
                "Expected success message": successMessage,
                "Response": res
            };
        },
    });

    // should be 200 ok
    expect(res.isOkStatusCode).to.be.equal(true, "Expect statusCode to be 200 ok");
    // shoule be no errors
    assert.notExists(res.body.errors, createErrorMessage(res, gqlMut, "mutation"));
    // has data
    assert.exists(res.body.data, "Expect response to have data");
    // Validate data types and values
    // Validate code
    assert.isString(res.body.data[mutationName].code, `Expect ${mutationName}.code to be a string`);
    expect(res.body.data[mutationName].code).not.to.eql("ERROR", `Expect ${mutationName}.code not be ERROR`);
    // Validate message
    assert.isString(res.body.data[mutationName].message, `Expect ${mutationName}.message to be a string`);
    expect(res.body.data[mutationName].message).to.eql(successMessage, `Expect ${mutationName}.message to be the correct success message`);
    // Validate error
    assert.isNull(res.body.data[mutationName].errors, `Expect ${mutationName}.errors to be null`);
    // Delete mutations don't return an item.
    // To avoid asserting a non-existant item, delete commands pass in the itemPath as "deleteMutation" 
    if (itemPath !== "deleteMutation") {
        // Validate response object
        assert.exists(res.body.data[mutationName][itemPath], `Expect mutation to return a ${itemPath}`);
        assert.isObject(res.body.data[mutationName][itemPath], `Expect ${itemPath} to be an object`);
    }
});

/**
 * COMMANDS THAT WILL POST AND THEN CALL A VALIDATION OR ERROR COMMAND
 */

// Post query and do standard validation
Cypress.Commands.add("postAndValidate", (gqlQuery: string, queryName: string, altUrl?: string) => {
    Cypress.log({
        name: "postAndValidate",
        message: queryName,
        consoleProps: () => {
            return {
                "Query Body": gqlQuery,
                "Query name": queryName,
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        },
    });
    return cy.postGQL(gqlQuery, altUrl).then((res) => {
        Cypress.log({ message: `Duration: ${res.duration}ms (${res.duration / 1000}s)` });
        cy.validateQueryRes(gqlQuery, res, queryName).then(() => {
            return res;
        });
    });
});

// Post mutation and validate
// When validating a delete mutation, pass in the itemPath as "deleteMutation" 
Cypress.Commands.add("postMutAndValidate", (gqlMut: string, mutationName: string, itemPath: string, altUrl?: string) => {
    Cypress.log({
        name: "postMutAndValidate",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation Body": gqlMut,
                "Mutation Name": mutationName,
                "Response item path": itemPath,
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        },
    });
    return cy.postGQL(gqlMut, altUrl).then((res) => {
        Cypress.log({ message: `Duration: ${res.duration}ms (${res.duration / 1000}s)` });
        cy.validateMutationRes(gqlMut, res, mutationName, itemPath).then(() => {
            return res;
        });
    });
});

/**
 * COMMANDS FOR VERIFYING THAT A CREATE/UPDATE MUTATION SUCCESSFULLY CREATED/UPDATED AN ITEM WITH THE EXPECTED VALUES
 * TODO: Consolidate the helper functions. 
 *      matchObject, matchArrayItems, and compareExpectedToResults are nearly identical to functions inside confirmMutationSuccess.
 *      Need to consolidate these, then send them up top with the other helper functions (queryByProductId also uses these, so they need to be up top)
 */

// Helper functions for these commands
const verifySeoData = (seo, expectedSeo, itemInfo) => {
    expectedSeo.forEach((seoItem, index) => {
        var currSeo = seo[index];
        const props = Object.getOwnPropertyNames(seoItem);
        for (var i = 0; i < props.length; i++) {
            if (props[i] === "searchEngineFriendlyPageName") {
                if (expectedSeo.searchEngineFriendlyPageName === "") {
                    expect(currSeo[props[i]]).to.include(itemInfo[index].name.toLowerCase().replace(' ', '-'), `Verify seoData[${index}].${props[i]}`);
                } else {
                    expect(currSeo[props[i]]).to.include(seoItem[props[i]].toLowerCase().replace(' ', '-'), `Verify seoData[${index}].${props[i]}`);
                }
            } else {
                expect(currSeo[props[i]]).to.be.eql(seoItem[props[i]], `Verify seoData[${index}].${props[i]}`);
            }
        }
    });
};

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
        } else if (typeof itemToMatch[props[p]] === 'object' && itemToMatch[props[p]] !== null) {
            // If the property value is an object, verify the object's properties match
            propMatches = matchObject(item[props[p]], itemToMatch[props[p]], !!failOnNoMatch, descendingPropName);
        } else {
            if (failOnNoMatch && props[p] === "id") {
                expect(item[props[p]].toUpperCase()).to.be.eql(itemToMatch[props[p]].toUpperCase(), `Verify ${descendingPropName}`);
            } else if (failOnNoMatch) {
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
        if (propertyNames[i] === "seoData") {
            var infoIndex = propertyNames.indexOf(propertyNames.find((name) => {
                return name.includes("Info");
            }));
            verifySeoData(subject[propertyNames[i]], expectedValues[i], expectedValues[infoIndex]);
        } else if (propertyNames[i] === "id") {
            expect(subject[propertyNames[i]].toUpperCase()).to.be.eql(expectedValues[i].toUpperCase(), `Verify ${propertyNames[i]}`);
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
};

// Confirms the mutation data that you instruct it to. Checks descendents with the eql() which is a deep equal
Cypress.Commands.add("confirmMutationSuccess", (res, mutationName: string, itemPath: string, propNames: string[], values: []) => {
    Cypress.log({
        name: "confirmMutationSuccess",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation response": res.body.data[mutationName][itemPath],
                "Mutation name": mutationName,
                "Response item path": itemPath,
                "Properties to check": toFormattedString(propNames, true),
                "Expected Values": toFormattedString(values, true)
            };
        },
    });
    expect(propNames.length).to.be.eql(values.length, "Same number of properties and values given to function");
    var result = res.body.data[mutationName][itemPath];
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
    function matchObject(item, itemToMatch, parentProperty: string) {
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
            } else if (itemToMatch[props[p]] !== null && typeof itemToMatch[props[p]] === 'object') {
                matchObject(item[props[p]], itemToMatch[props[p]], descendingPropName);
            } else if (props[p] === "id") {
                expect(item[props[p]].toUpperCase()).to.be.eql(itemToMatch[props[p]].toUpperCase(), `Verify ${descendingPropName}`);
            } else {
                expect(item[props[p]]).to.be.eql(itemToMatch[props[p]], `Verify ${descendingPropName}`);
            }
        }
    };
    function matchArray(resArray: [], matchArray: [], originalProperty: string) {
        expect(resArray.length).to.be.gte(matchArray.length, `Response array should have at least ${matchArray.length} items`);
        for (var f = 0; f < matchArray.length; f++) {
            if (resArray.length > matchArray.length) {
                searchArray(resArray, matchArray, `${originalProperty}[${f}]`);
            } else {
                matchObject(resArray[f], matchArray[f], `${originalProperty}[${f}]`);
            }
        }
    };
    for (var i = 0; i < propNames.length; i++) {
        if (propNames[i] === "seoData") {
            var infoIndex = propNames.indexOf(propNames.find((name) => {
                return name.includes("Info");
            }));
            verifySeoData(result[propNames[i]], values[i], values[infoIndex]);
        } else if (propNames[i] === "id") {
            expect(result[propNames[i]].toUpperCase()).to.be.eql(values[i].toUpperCase(), `Verifying ${propNames[i]}`);
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

// Confirms that a mutation has updated an item by querying for the item and matching the values to the array given
Cypress.Commands.add("confirmUsingQuery", (query: string, queryName: string, itemId: string, propNames: string[], values: [], altUrl?: string) => {
    Cypress.log({
        name: "confirmUsingQuery",
        message: `querying ${queryName} for ${itemId}`,
        consoleProps: () => {
            return {
                "Query Body": query,
                "Query name": queryName,
                "Id of item to verify": itemId,
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl"),
                "Properties to check": toFormattedString(propNames, true),
                "Expected Values": toFormattedString(values, true)
            };
        },
    });

    return cy.postAndValidate(query, queryName, altUrl).then((resp) => {
        const targetNode = resp.body.data[queryName].nodes.filter((item) => {
            const id = queryName === "refunds" ? item.order.id : item.id;
            return id.toUpperCase() === itemId.toUpperCase();
        });
        expect(targetNode.length).to.be.eql(1, "Specific item found in nodes");
        const node = targetNode[0];
        expect(propNames.length).to.be.eql(values.length, "Same number of properties and values passed in");
        compareExpectedToResults(node, propNames, values);
    });
});

// Crafts an error message to use when a response has unexpected errors, so that we have good visibility on issues that cause us to fail
const createErrorMessage = (res, gqlBody: string, queryOrMut: string): string => {
    var errorMessage = `No errors while executing ${queryOrMut}: \n${gqlBody}`;
    if (res.body.errors) {
        errorMessage = `One or more errors ocuured while executing ${queryOrMut}: \n${gqlBody}`;
        res.body.errors.forEach((item) => {
            errorMessage = errorMessage + " \n" + item.extensions.code + ". " + item.message;
        });
        errorMessage = errorMessage + "\n";
    }
    return errorMessage;
};

// Create the generic message we expect to see back for most successful mutations, and some unsuccessful mutation
export const createMutResMessage = (isSuccess: boolean, mutationName: string): string => {
    const transformFeature = (str: string): string => {
        while (str.search(/[A-Z]/g) !== -1) {
            str = str.replace(str.charAt(str.search(/[A-Z]/g)), " " + str.charAt(str.search(/[A-Z]/g)).toLowerCase());
        }
        return str;
    };
    var mutationFeature = mutationName.substring(6).replace(mutationName.charAt(6), mutationName.charAt(6).toLowerCase());
    var mutation = isSuccess ? `${mutationName.substring(0, 6)}d` : `Error ${mutationName.substring(0, 5)}ing`;
    var message = "";
    switch (mutationFeature) {
        case "category":
            message = "categories";
            break;
        case "inventory":
            message = "product quantity";
            break;
        default:
            message = (mutationFeature === "customerRole" || mutationFeature === "manufacturer") ? `${transformFeature(mutationFeature)}s` : transformFeature(mutationFeature);
    };
    return isSuccess ? `${message} ${mutation}` : `${mutation}${mutationName.includes("delete") ? " the" : ""} ${message}`;
};

// Call the mutation to delete an item. Will not fail if the item isn't successfully deleted.
// Will log success or failure and include errors in the log
const performDelete = (deleteName: string, id: string, altUrl?: string) => {
    cy.wait(2000);
    var mutation = `mutation {
        ${deleteName}(input: {id: "${id}"}){
            ${codeMessageError}
        }
    }`;
    cy.postGQL(mutation, altUrl).then((res) => {
        if (res.isOkStatusCode) {
            if (res.body.data) {
                var code = res.body.data[deleteName].code;
                if (code !== "SUCCESS") {
                    code = code + ": " + res.body.data[deleteName].message + ".";
                    if (res.body.errors) {
                        res.body.errors.forEach((err) => {
                            code = code + "\n" + err.message;
                        });
                    }
                }
                Cypress.log({ message: code, consoleProps: () => { return { "Status": code } } });
            } else if (res.body.errors) {
                res.body.errors.forEach((err) => {
                    Cypress.log({ message: err.message });
                });
            }
        } else {
            Cypress.log({ message: "Deletion failed" });
        }
    });
};

// Posts a query but does not fail if it's not successful, unlike postAndValidate
Cypress.Commands.add("postNoFail", (gqlQuery: string, queryName: string, altUrl?: string) => {
    Cypress.log({
        name: "postNoFail",
        message: queryName,
        consoleProps: () => {
            return {
                "Query name": queryName,
                "Query body": gqlQuery
            };
        },
    });
    return cy.postGQL(gqlQuery, altUrl).then((res) => {
        Cypress.log({ name: "postNoFail", message: `Duration: ${res.duration}ms (${res.duration / 1000}s)` });
        if (res.isOkStatusCode) {
            if (!res.body.errors) {
                if (res.body.data) {
                    return res;
                }
            }
        }
        Cypress.log({ name: "postNoFail", message: `Querying ${queryName} failed` });
        return false;
    });
});