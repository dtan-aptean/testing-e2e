/**
 * Commands to delete all cypress items before a the tests run.
 * These commands will not fail the tests if an item cannot be deleted or a query fails.
 * Designed to avoid failure so that we can be sure the tests run.
 * Since API tests don't rely on existing items, it doesn't matter if the ENV isn't perfectly cleared beforehand
 */

// Call the mutation to delete an item. Will not fail if the item isn't successfully deleted.
// Will log success or failure and include errors in the log
const performDelete = (deleteName: string, id: string) => {
    cy.wait(2000);
    var mutation = `mutation {
        ${deleteName}(input: {id: "${id}"}){
            code
            message
            error
        }
    }`;
    cy.postGQL(mutation).then((res) => {
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
                Cypress.log({message: code, consoleProps: () => {return {"Status": code}}});
            } else if (res.body.errors) {
                res.body.errors.forEach((err) => {
                    Cypress.log({message: err.message});
                });
            }
        } else {
            Cypress.log({message: "Deletion failed"});
        }
    });
};

// Make sure each item is a Cypress item, and if it is, call command to delete it
const deleteItems = (nodes, deleteName: string, searchBy: string, infoName?: string) => {
    nodes.forEach((item) => {
        var id = item.id;
        if (infoName) {
            const nameArray = item[infoName].filter((nameItem) => {
				return nameItem.name.includes(searchBy) && nameItem.languageCode === "Standard";
            });
            if (nameArray.length > 0) {
                performDelete(deleteName, id);
            }
        } else {
            var name = item.name;
            if (name.includes(searchBy)) {
                performDelete(deleteName, id);
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
    additionalFields?: string
) => {
    const nameField = getNameField(infoName);
    const queryBody = `searchString: "${searchBy}", orderBy: {direction: ASC, field: NAME}) {
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
    return cy.postNoFail(query, queryName).then((res) => {
        if (res) {
            const totalCount = res.body.data[queryName].totalCount;
            if (totalCount > 25) {
                const newQuery = `{
                    ${queryName}(first: ${totalCount}, ${queryBody}
                }`;
                return cy.postNoFail(newQuery, queryName).then((resp) => {
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
                Cypress.log({message: "No Cypress items found"});
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
    searchString?: string
) => {
    const searchBy = searchString ? searchString : "Cypress";
    const extraField = queryName === "categories" ? `parent {
        id
    }` : undefined;
    Cypress.log({name: "deleteCypressItems", message: `Using ${queryName} to search for "${searchBy}"`});
    getNodes(queryName, searchBy, infoName, extraField).then((nodes) => {
        if (nodes) {
            // If deleting categories, make sure to delete child categories before parents.
            if (queryName === "categories") {
                const childCats = nodes.filter((node) => {
                    return node.parent !== null;
                });
                if (childCats.length > 0) {
                    Cypress.log({message: "Deleting CHILD categories"});
                    deleteItems(childCats, deleteName, searchBy, infoName)
                }
                const parentCats = nodes.filter((node) => {
                    return node.parent === null;
                });
                if (parentCats.length > 0) {
                    Cypress.log({message: "Deleting PARENT categories"});
                    deleteItems(parentCats, deleteName, searchBy, infoName);
                }
            } else {
                deleteItems(nodes, deleteName, searchBy, infoName);
            }
        }
    });
});

// Posts a query but does not fail if it's not successful, unlike postAndValidate
Cypress.Commands.add("postNoFail", (gqlQuery: string, queryName: string) => {
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
    return cy.postGQL(gqlQuery).then((res) => {
        Cypress.log({name: "postNoFail", message: `Duration: ${res.duration}ms (${res.duration / 1000}s)`});
        if (res.isOkStatusCode) {
            if (!res.body.errors) {
                if (res.body.data) {
                    return res;
                }
            }
        }
        Cypress.log({name: "postNoFail", message: `Querying ${queryName} failed`});
        return false;
    });
});