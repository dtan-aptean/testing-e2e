/**
 * HELPER FUNCTIONS
 */

import { codeMessageError } from "./mutationTests";
import { defaultField } from "./queryTests";

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
            Cypress.log({ message: "Setting Storefront Url to dev url" });
            Cypress.env(envName, "https://dev.apteanecommerce.com/");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({ message: "Setting Storefront Url to tst url" });
            Cypress.env(envName, "https://tst.apteanecommerce.com/");
        } else {
            Cypress.log({ message: "Storefront Url can't be fixed: forcing failure" });
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else if (envName === "storefrontLogin") {
        if (Cypress.config("baseUrl").includes('dev')) {
            Cypress.log({ message: "Setting Storefront username to dev user" });
            Cypress.env(envName, "bhargava.deshpande@aptean.com");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({ message: "Setting Storefront username to tst user" });
            Cypress.env(envName, "cypress.tester@testenvironment.com");
        } else {
            Cypress.log({ message: "Storefront username can't be fixed: forcing failure" });
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else if (envName === "storefrontPassword") {
        if (Cypress.config("baseUrl").includes('dev')) {
            Cypress.log({ message: "Setting Storefront password to dev pass" });
            Cypress.env(envName, "admin");
        } else if (Cypress.config("baseUrl").includes('tst')) {
            Cypress.log({ message: "Setting Storefront password to tst pass" });
            Cypress.env(envName, "CypressTester1");
        } else {
            Cypress.log({ message: "Storefront password can't be fixed: forcing failure" });
            expect(Cypress.env(envName)).to.not.eql(Cypress.env(envName), `Please fill in env value ${envName} with valid value`);
        }
    } else {
        Cypress.log({ message: "Invalid env name given: forcing failure" });
        expect(["storefrontUrl", "storefrontLogin", "storefrontPassword"]).to.include(envName, "Please use one of the valid storefront env names");
    }
};
// Runs through storefront env values and calls above functions to either set them (if possible) or fail the test
export const confirmStorefrontEnvValues = () => {
    const storefrontNames = ["storefrontUrl", "storefrontLogin", "storefrontPassword"];
    storefrontNames.forEach((sfName) => {
        if (!verifyStorefrontEnv(sfName)) {
            setAltStorefrontEnv(sfName);
        }
    });
};

// Given a name, will create an array that mimics the array that endpoints like categories use to store their name
// Given a name, infoName, and an id, will create an object that mimics a basic response node for one of these endpoints
export const createInfoDummy = (name: string, infoName?: string, id?: string) => {
    const infoDummy = [{
        name: name,
        languageCode: "Standard"
    }];
    if (id && infoName) {
        const dummy = {
            id: id
        };
        dummy[infoName] = infoDummy;
        return dummy;
    }
    return infoDummy;
};

// An interface used by most files. Used for creating and deleting extra items created for testing purposes
// EX, a product mutation test creates a vendor and stores the vendor's information in an item of this type
export interface SupplementalItemRecord {
    itemId: string;
    itemName: string;
    deleteName: string;
    queryName: string;
};

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

// Check if the provided item has an infoName field, and if so, return it.
// Can check object for infoField, will compare a string to a query/mutation name
const getInfoName = (item): string | null => {
    const infoNames = ["categoryInfo", "manufacturerInfo", "productInfo", "vendorInfo"];
    const infoQueries = ["categories", "manufacturers", "products", "vendors"];
    const infoMuts = ["Category", "Manufacturer", "Product", "Vendor"];
    var name = null;
    if (typeof item === "string") {
        var index = infoQueries.indexOf(item);
        if (index === -1) {
            infoMuts.forEach((mut, mutIndex) => {
                if (item.includes(mut)) {
                    index = mutIndex;
                }
            });
        }
        name = index !== -1 ? infoNames[index] : null;
    } else if (typeof item === "object" && !Array.isArray(item)) {
        for (var f = 0; f < infoNames.length; f++) {
            if (item[infoNames[f]]) {
                name = infoNames[f];
                break;
            }
        }
    }
    return name;
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
 * COMMANDS FOR VALIDATING THAT A RESPONSE HAS THE ERRORS WE EXPECT IT TO
 */
// Tests the response for errors. Can be used for queries and mutations. Use when we expect it to fail. Add expect200 when we expect to get a 200 status code
Cypress.Commands.add("confirmError", (res, expect200?: boolean) => {
    Cypress.log({
        name: "confirmError",
        message: `Confirm expected errors.${expect200 ? " Expecting 200 status code" : ""}`,
        consoleProps: () => {
            return {
                "Response": res,
                "Expected a 200 status code": !!expect200
            };
        },
    });
    if (expect200) {
        // Should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true, "Status code should be 200");
    } else {
        // should not be 200 ok
        expect(res.isOkStatusCode).to.be.equal(false, "Status code should not be 200");
        // Usually expecting a 400 error
        expect(res.status).to.be.equal(400, "Status code should be 400");
    }
    // should have errors
    assert.exists(res.body.errors, "Errors should be present");
    // no data
    assert.notExists(res.body.data, "Response data should not exist");
});

// Tests the response for errors. Use when we expect it to fail
// For use with mutations that still return data and an okay status when erroring
Cypress.Commands.add("confirmMutationError", (res, mutationName: string, itemPath?: string) => {
    const failureMessage = createMutResMessage(false, mutationName);
    Cypress.log({
        name: "confirmMutationError",
        message: `Confirm expected errors for ${mutationName}`,
        consoleProps: () => {
            return {
                "Mutation Name": mutationName,
                "Expected failure message": failureMessage,
                "Response item path": itemPath ? itemPath : "Response item not expected",
                "Response": res,
            };
        },
    });
    // Check data for errors
    // should have errors
    assert.exists(res.body.data[mutationName].errors, "Errors should be present");
    // should have data
    assert.exists(res.body.data, "Response data should exist");
    // Validate data types and values
    // Validate code
    assert.isString(res.body.data[mutationName].code, `Expect ${mutationName}.code to be a string`);
    expect(res.body.data[mutationName].code).to.eql("ERROR", `Expect ${mutationName}.code to be ERROR`);
    // Validate message
    assert.isString(res.body.data[mutationName].message, `Expect ${mutationName}.message to be a string`);
    expect(res.body.data[mutationName].message).to.eql(failureMessage, `Expect ${mutationName}.message to be the correct failure message`);
    // Validate response item
    if (itemPath) {
        // Since delete mutations don't have an item returned, itemPath is optional
        assert.notExists(res.body.data[mutationName][itemPath], `Expect mutation not to return a ${itemPath}`);
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

// Post query or mutation and confirm it has errors. Add expect200 when we expect to get a 200 status code
Cypress.Commands.add("postAndConfirmError", (gqlBody: string, expect200?: boolean, altUrl?: string) => {
    Cypress.log({
        name: "postAndConfirmError",
        message: `${expect200 ? "expect200" + expect200 : ""}`,
        consoleProps: () => {
            return {
                "Query or Mutation Body": gqlBody,
                "expect200": expect200 ? expect200 : "Not provided",
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        },
    });
    return cy.postGQL(gqlBody, altUrl).then((res) => {
        Cypress.log({ message: `Duration: ${res.duration}ms (${res.duration / 1000}s)` });
        cy.confirmError(res, expect200).then(() => {
            return res;
        });
    });
});

Cypress.Commands.add("postAndConfirmMutationError", (gqlMutation: string, mutationName: string, itemPath?: string, altUrl?: string) => {
    Cypress.log({
        name: "postAndConfirmMutationError",
        message: mutationName,
        consoleProps: () => {
            return {
                "Mutation Body": gqlMutation,
                "Mutation Name": mutationName,
                "Response item path": itemPath ? itemPath : "Not provided",
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        },
    });
    return cy.postGQL(gqlMutation, altUrl).then((res) => {
        Cypress.log({ message: `Duration: ${res.duration}ms (${res.duration / 1000}s)` });
        cy.confirmMutationError(res, mutationName, itemPath).then(() => {
            return res;
        });
    });
});

/**
 * COMMANDS FOR CHECKING RESULTS OF QUERYING WITH PRODUCTID INPUT
 */

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
                "Expected Items": toFormattedString(expectedItems, true),
                "Full query": query
            };
        },
    });
    return cy.postAndValidate(query, queryName).then((res) => {
        var returnedItems = res.body.data[queryName].nodes;
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

/**
 * COMMANDS FOR CHECKING CUSTOM DATA
 */

// Checks for customData property. If expectData and expectedData are included, will compare nodes' customData to the expectedData
Cypress.Commands.add("checkCustomData", (res, queryName: string, expectData?: boolean, expectedData?) => {
    Cypress.log({
        name: "checkCustomData",
        message: `Confirm ${queryName} has customData property`,
        consoleProps: () => {
            return {
                "Response": res,
                "Query name": queryName
            };
        },
    });
    const nodesPath = res.body.data[queryName].nodes;
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
Cypress.Commands.add("postAndCheckCustom", (query: string, queryName: string, id: string, customData, altUrl?: string) => {
    Cypress.log({
        name: "postAndCheckCustom",
        message: `Item's id: ${id}, query: ${queryName}`,
        consoleProps: () => {
            return {
                "Query body": query,
                "Query name": queryName,
                "Item's Id": id,
                "Custom Data": customData
            };
        },
    });
    cy.postAndValidate(query, queryName, altUrl).then((res) => {
        const nodes = res.body.data[queryName].nodes;
        if (nodes.length === 1) {
            cy.checkCustomData(res, queryName, true, customData);
        } else if (nodes.length > 1) {
            // Create a dummy object with the same structure as response for checkCustomData to look at
            const dummy = { body: { data: {} } };
            Object.defineProperty(dummy.body.data, queryName, { value: { nodes: [] } });
            // Look for the specific node we want
            const node = nodes.filter((item) => {
                return item.id.toUpperCase() === id.toUpperCase();
            });
            if (node.length === 1) {
                // If found, push the node into our dummy object's nodes array
                dummy.body.data[queryName].nodes.push(node[0]);
                // Pass our dummy object to checkCustomData in place of res
                cy.checkCustomData(dummy, queryName, true, customData);
            }
        }
    });
});

/**
 * COMMANDS FOR MAKING BASIC NEW ITEMS
 */

// Create a new item, validate it, and return the id. Pass in the full input value as a string
// If you need more information than just the id, pass in the additional fields as a string and the entire new item will be returned
Cypress.Commands.add("createAndGetId", (mutationName: string, itemPath: string, input: string, additionalFields?: string, altUrl?: string) => {
    Cypress.log({
        name: "createAndGetId",
        message: `Creating ${itemPath}. Additional fields: ${!!additionalFields}`,
        consoleProps: () => {
            return {
                "Mutation": mutationName,
                "Response item path": itemPath,
                "Input string": input,
                "Additional fields string": additionalFields ? additionalFields : "Not provided",
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        }
    });
    const refundIdFormat = `order {
        id
    }`;
    const mutation = `mutation {
        ${mutationName}(input: ${input}) {
            ${codeMessageError}
            ${itemPath} {
                ${itemPath === "refund" ? refundIdFormat : "id"}
                ${additionalFields ? additionalFields : ""}
            }
        }
    }`;
    return cy.postMutAndValidate(mutation, mutationName, itemPath, altUrl).then((res) => {
        const id = itemPath === "refund" ? res.body.data[mutationName][itemPath].order.id.toUpperCase() : res.body.data[mutationName][itemPath].id.toUpperCase();
        if (additionalFields) {
            return res.body.data[mutationName][itemPath];
        } else {
            return id;
        }
    });
});

Cypress.Commands.add("createAssociatedItems", (
    numberToMake: number,
    createName: string,
    itemPath: string,
    queryName: string,
    inputBase,
    additionalResFields?,
    altUrl?: string
) => {
    Cypress.log({
        name: "createAssociatedItems",
        message: `Creating ${numberToMake} items with ${createName}`,
        consoleProps: () => {
            return {
                "Number to make": numberToMake,
                "Create mutation": createName,
                "Query name": queryName,
                "Item path": itemPath,
                "Input base": toFormattedString(inputBase, true),
                "Additional response fields": additionalResFields ? additionalResFields : "Not provided",
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        }
    });

    const getNameBase = () => {
        const propNames = Object.getOwnPropertyNames(inputBase);
        if (propNames.includes("firstName") && propNames.includes("lastName") && propNames.includes("email")) {
            return { firstName: inputBase.firstName, lastName: inputBase.lastName, email: inputBase.email };
        } else if (propNames.includes("integrationKey")) {
            return { name: inputBase.name, intKey: inputBase.integrationKey };
        } else if (!propNames.includes("name")) {
            return "noName";
        } else {
            return inputBase.name;
        }
    };
    const incrementNameBase = (nameBase, i) => {
        if (typeof nameBase === "object" && nameBase.firstName && nameBase.lastName && nameBase.email) {
            return { firstName: `${nameBase.firstName} ${i}`, lastName: `${nameBase.lastName} ${i}`, email: `${nameBase.email} ${i}` };
        } else if (typeof nameBase === "object" && nameBase.intKey) {
            return { name: `${nameBase.name} ${i}`, intKey: `${nameBase}${Cypress._.random(10000, 100000)}` };
        } else if (nameBase === "noName") {
            return nameBase;
        } else {
            return `${nameBase} ${i}`
        }
    };
    const createInput = (input, newName, infoName: string | null) => {
        const retInput = JSON.parse(JSON.stringify(input));
        if (infoName) {
            retInput[infoName][0].name = newName;
        } else if (typeof newName === "object" && newName.firstName && newName.lastName && newName.email) {
            retInput.firstName = newName.firstName;
            retInput.lastName = newName.lastName;
            retInput.email = newName.email;
        } else if (typeof newName === "object" && newName.intKey) {
            retInput.name = newName.name;
            retInput.integrationKey = newName.intKey;
        } else if (newName === "noName") {
            return retInput;
        } else {
            retInput.name = newName;
        }
        return retInput;
    };
    const deleteName = createName.replace("create", "delete");
    const deletionIds = [] as SupplementalItemRecord[];
    const createdItems = [];
    const createdIds = [] as string[];
    const fullResBodies = [];
    var infoName = getInfoName(inputBase);
    var nameBase = infoName ? inputBase[infoName][0].name : getNameBase();
    const createAndPush = (item, name, altUrl) => {
        cy.createAndGetId(createName, itemPath, toFormattedString(item), additionalResFields, altUrl).then((returnedBody) => {
            const returnedId = additionalResFields ? returnedBody.id : returnedBody;
            createdIds.push(returnedId);
            item.id = returnedId;
            createdItems.push(item);
            var correctItemName = name;
            if (typeof name === "object" && name.firstName && name.lastName && name.email) {
                correctItemName = item.email; //    MAKE SURE THIS IS CORRECT
            } else if (typeof name === "object" && name.intKey) {
                correctItemName = name.name
            } else if (name === "noName") {
                correctItemName = "";
            }
            deletionIds.push({ itemId: returnedId, deleteName: deleteName, itemName: correctItemName, queryName: queryName });
            if (additionalResFields) {
                fullResBodies.push(returnedBody);
            }
        });
    };
    for (var i = 1; i <= numberToMake; i++) {
        var name = numberToMake !== 1 ? incrementNameBase(nameBase, i) : nameBase;
        var item = createInput(inputBase, name, infoName);
        cy.wait(4000);
        createAndPush(item, name, altUrl);
    };
    const resObject = { deletionIds: deletionIds, items: createdItems, itemIds: createdIds } as { deletionIds: SupplementalItemRecord[], items: any[], itemIds: string[], fullItems?: any[] };
    if (additionalResFields) {
        resObject.fullItems = fullResBodies;
    }
    return cy.wrap(resObject);
});

// Creates a parent and child category.
//Pass in names to create new categories, or a name and an id to create a child and attach it to an existing parent
Cypress.Commands.add("createParentAndChildCat", (
    newChildName: string,
    newParentName?: string,
    existingParent?: string
) => {
    const createChild = (parentId: string) => {
        const mutation = `mutation {
            createCategory(
                input: { 
                    parentCategoryId: "${parentId}"
                    categoryInfo: [{ name: "${newChildName}", languageCode: "Standard" }]
                }
            ) {
                ${codeMessageError}
                category {
                    id
                    categoryInfo {
                        name
                        languageCode
                    }
                    parent {
                        id
                        categoryInfo {
                            name
                            languageCode
                        }
                    }
                }
            }
        }`;
        return cy.postMutAndValidate(mutation, "createCategory", "category").then((res) => {
            const id = res.body.data.createCategory.category.id.toUpperCase();
            return cy.wrap({ parentId: parentId, childId: id, childRes: res });
        });
    };
    if (existingParent) {
        return createChild(existingParent);
    } else if (newParentName) {
        const parentCategory = { categoryInfo: [{ name: newParentName, languageCode: "Standard" }] };
        return cy.createAndGetId("createCategory", "category", toFormattedString(parentCategory)).then((parentId: string) => {
            return createChild(parentId);
        });
    } else {
        assert.exists(newParentName, "Command must receive either an existing category's id or a name to use for creating a new category");
    }
});

/**
 * COMMANDS FOR DELETING AN ITEM
 */
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
    } else if (queryName === "paymentSettings") {
        nameField = `company {
            name
        }`;
    }
    var searchQuery = `{
        ${queryName}(searchString: "${itemName}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            totalCount
            nodes {
                id
                ${nameField}
            }
        }
    }`;
    const checkSearchResults = (res) => {
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
            var validName = itemName !== "";
            if (infoName) {
                matchingItems = nodes.filter((item) => {
                    if (validName) {
                        var nameMatches = item[infoName].filter((infoItem) => {
                            return infoItem.name === itemName && infoItem.languageCode === "Standard";
                        });
                        return item.id.toUpperCase() === itemId.toUpperCase() && nameMatches.length > 0;
                    } else {
                        return item.id.toUpperCase() === itemId.toUpperCase();
                    }
                });
            } else {
                matchingItems = nodes.filter((item) => {
                    if (validName) {
                        return item.id.toUpperCase() === itemId.toUpperCase() && (queryName === "paymentSettings" ? item.company.name : item.name) === itemName;
                    } else {
                        return item.id.toUpperCase() === itemId.toUpperCase();
                    }
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
    };
    return cy.postAndValidate(searchQuery, queryName).then((res) => {
        const totalCount = res.body.data[queryName].totalCount;
        if (totalCount > 25) {
            var insertIndex = searchQuery.indexOf("searchString");
            searchQuery = searchQuery.slice(0, insertIndex) + `first: ${totalCount},` + searchQuery.slice(insertIndex);
            return cy.postAndValidate(searchQuery, queryName).then((resp) => {
                return checkSearchResults(resp);
            });
        } else {
            return checkSearchResults(res);
        }
    });
});

// Same as above but for items that don't have a name and instead works by the id field
Cypress.Commands.add("queryForDeletedById", (asTest: boolean, itemId: string, searchParameter: string, queryName: string, altUrl?: string) => {
    Cypress.log({
        name: "queryForDeletedById",
        message: `querying ${queryName} for deleted item "${itemId}"`,
        consoleProps: () => {
            return {
                "Used as a test": asTest,
                "Query Name": queryName,
                "Item's Id": itemId,
                "searchParameter": searchParameter,
                "Url used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        },
    });
    var idField = queryName === "refunds" ? "order { id }" : "id";
    const searchQuery = `{
        ${queryName}(${searchParameter}: "${itemId}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            nodes {
                ${idField}
            }
        }
    }`;
    return cy.postAndValidate(searchQuery, queryName, altUrl).then((res) => {
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
                return id.toUpperCase() === itemId.toUpperCase();
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

// Post and confirm deletion by querying for the item afterward
Cypress.Commands.add("postAndConfirmDelete", (
    gqlMut: string,
    mutationName: string,
    queryInformation: {
        queryName: string
        itemId: string,
        itemName?: string,
        infoName?: string,
        searchParameter?: string,
        asTest?: boolean
    },
    altUrl?: string
) => {
    Cypress.log({
        name: "postAndConfirmDelete",
        message: `delete ${mutationName.replace("delete", "")} with id "${queryInformation.itemId}"`,
        consoleProps: () => {
            return {
                "Mutation Body": gqlMut,
                "Mutation Name": mutationName,
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl"),
                "Query Information": queryInformation ? toFormattedString(queryInformation, true) : "No query information provided"
            };
        },
    });
    return cy.postMutAndValidate(gqlMut, mutationName, "deleteMutation", altUrl).then((res) => {
        // query for the deleted item to make sure it's gone
        const asTest = (queryInformation.asTest !== null && queryInformation.asTest !== undefined) ? queryInformation.asTest : true;
        if (queryInformation.itemName) {
            cy.queryForDeleted(asTest, queryInformation.itemName, queryInformation.itemId, queryInformation.queryName, queryInformation.infoName);
        } else {
            cy.queryForDeletedById(asTest, queryInformation.itemId, queryInformation.searchParameter, queryInformation.queryName, altUrl);
        }
    });
});

// Flat delete the the item, without querying for it afterwards
Cypress.Commands.add("deleteItem", (mutationName: string, id: string, altUrl?: string) => {
    Cypress.log({
        name: "deleteItem",
        message: `delete ${mutationName.replace("delete", "")} with id "${id}"`,
        consoleProps: () => {
            return {
                "Delete Mutation": mutationName,
                "Item's Id": id
            };
        },
    });
    var mutation = `mutation {
        ${mutationName}(input: { ${mutationName === "deleteRefund" ? "orderId" : "id"}: "${id}" }) {
            ${codeMessageError}
        }
    }`;
    return cy.postMutAndValidate(mutation, mutationName, "deleteMutation", altUrl);
});

// Queries for an item that may have already been deleted, then deletes it if found. To use in afterEach/after hooks for clean up
Cypress.Commands.add("safeDelete", (queryName: string, mutationName: string, itemId: string, itemName: string, infoName?: string) => {
    Cypress.log({
        name: "safeDelete",
        message: `Checking ${queryName} for item ${itemId}`,
        consoleProps: () => {
            return {
                "Query Name": queryName,
                "Delete Mutation Name": mutationName,
                "Item's Id": itemId,
                "Item's name": itemName
            };
        },
    });
    return cy.queryForDeleted(false, itemName, itemId, queryName, infoName).then((itemPresent: boolean) => {
        if (itemPresent) {
            return cy.deleteItem(mutationName, itemId);
        }
    });
});

// Safely delete supplemental items created for a test
Cypress.Commands.add("deleteSupplementalItems", (extraItems: SupplementalItemRecord[]) => {
    if (extraItems.length > 0) {
        Cypress.log({
            name: "deleteSupplementalItems",
            message: `Deleting ${extraItems.length} supplemental items created for testing`,
            consoleProps: () => {
                return {
                    "Number of supplemental items": extraItems.length,
                    "Supplemental Items": toFormattedString(extraItems, true)
                };
            },
        });
        for (var i = 0; i < extraItems.length; i++) {
            cy.wait(2000);
            cy.safeDelete(extraItems[i].queryName, extraItems[i].deleteName, extraItems[i].itemId, extraItems[i].itemName, getInfoName(extraItems[i].queryName));
        }
    }
});

/**
 * Deletes child categories, and only deletes the parent afterwards. Can pass in a single child or multiple
 * Prefers to delete by id, but attempts to prioritize parent deletion by deleting all possible children
 * If a childId is not known (ex, test failed before mut could return the id), it will find children by childName.
 * After finding children by name, it will delete all children whose parent's id matches parentId
 * If parentName but no parentId, it will delete all children whose parent's name matches parentName
 * If no parentName, it will delete all categories with a matching child name.
 */
Cypress.Commands.add("deleteParentAndChildCat", (children: { name: string, id: string } | { name: string, id: string }[], parentName: string, parentId: string) => {
    // Return if arguments are invalid
    if (Array.isArray(children)) {
        if (children.length === 0) {
            return;
        } else if (children.length === 1 && (children[0].id === "" && children[0].name === "")) {
            return;
        }
    } else if ((children.id === "" && children.name === "") && parentId === "") {
        return;
    }
    const queryName = "categories";
    const deleteName = "deleteCategory";
    const infoName = "categoryInfo";
    const makeInfoFilter = (name: string, parent?: boolean) => {
        return function infoFilter(item) {
            var infoArr = parent ? item.parent[infoName] : item[infoName];
            var nameMatches = infoArr.filter((infoItem) => {
                return infoItem.name === name && infoItem.languageCode === "Standard";
            });
            return nameMatches.length > 0;
        };
    };
    const deleteCats = (items) => {
        items.forEach((item) => {
            cy.wait(2000);
            cy.deleteItem(deleteName, item.id);
        });
    };
    const removeChild = (childId: string, childName: string) => {
        if (childId !== "") {
            cy.safeDelete(queryName, deleteName, childId, childName, infoName);
        } else if (childName !== "") {
            const query = `{
                ${queryName}(searchString: "${childName}", orderBy: {direction: ASC, field: NAME}) {
                    nodes {
                        id
                        categoryInfo {
                        name
                        languageCode
                        }
                        parent {
                            id
                            categoryInfo {
                                name
                                languageCode
                            }
                        }
                    }
                }
            }`;
            cy.postAndValidate(query, "categories").then((res) => {
                const cats = res.body.data.categories.nodes;
                if (cats.length > 0) {
                    const childFilter = makeInfoFilter(childName);
                    var childCats = cats.filter(childFilter);
                    if (parentId !== "" && childCats.length > 0) {
                        var child = childCats.filter((cat) => {
                            return cat.parent && cat.parent.id.toUpperCase() === parentId.toUpperCase();
                        });
                        deleteCats(child);
                    } else if (parentName !== "" && childCats.length > 0) {
                        const parentFilter = makeInfoFilter(parentName, true);
                        var children = childCats.filter((cat) => {
                            return cat.parent;
                        }).filter(parentFilter);
                        deleteCats(children);
                    } else {
                        deleteCats(childCats);
                    }
                }
            });
        }
    };

    Cypress.log({
        name: "deleteParentAndChildCat",
        message: `Deleting ${Array.isArray(children) ? children.length + " child categories" : `child category "${children.id !== "" ? children.id : children.name}"`}, then parent "${parentId}"`,
        consoleProps: () => {
            return {
                "Child categories": toFormattedString(children, true),
                "Parent category name": parentName,
                "Parent category id": parentId
            };
        },
    });

    if (Array.isArray(children)) {
        var idChildren = children.filter((kiddo) => {
            return kiddo.id !== "";
        });;
        var nameChildren = children.filter((kiddo) => {
            return kiddo.id === "" && kiddo.name !== "";
        });
        idChildren.forEach((idChild) => {
            cy.wait(2000);
            removeChild(idChild.id, idChild.name);
        });
        nameChildren.forEach((nameChild) => {
            cy.wait(2000);
            removeChild(nameChild.id, nameChild.name);
        });
    } else {
        removeChild(children.id, children.name);
    }

    if (parentId !== "") {
        cy.safeDelete(queryName, deleteName, parentId, parentName, infoName);
    }
    // We won't attempt to find a parent category by name in case it still has a child left.
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

Cypress.Commands.add("createAndGetMultipleIds", (NumberToMake: number, createName: string, itemPath: string, input: string, altUrl?: String) => {
    Cypress.log({
        name: "createAndGetMultipleIds",
        message: `Creating ${itemPath}`,
        consoleProps: () => {
            return {
                "Mutation": createName,
                "Response item path": itemPath,
                "Input string": input,
                "URL used": altUrl ? altUrl : Cypress.config("baseUrl")
            };
        }
    });
    const createdIds = [];
    const createAndPush = () => {
        cy.createAndGetId(createName, itemPath, input).then((returnedBody) => {
            const returnedId = returnedBody;
            createdIds.push(returnedId);
        });
    }
    for (var i = 0; i < NumberToMake; i++) {
        createAndPush(createName, itemPath, input);
    }
    return cy.wrap(createdIds);
});