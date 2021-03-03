Cypress.Commands.add("postGQL", (query: string) => {
    Cypress.log({
        name: "postGQL",
        consoleProps: () => {
            return {
                "URL used": Cypress.env('apiUrl') + '/graphql',
                "Headers": `"x-aptean-apim": ${Cypress.env('x-aptean-apim')} \n\t\t\t "x-aptean-tenant": ${Cypress.env('x-aptean-tenant')} \n\t\t\t "x-aptean-tenant-secret": ${Cypress.env('x-aptean-tenant-secret')}`, 
                "Query/Mutation Body": query,
            };
        },
    });
    return cy.request({
        method: 'POST',
        url: Cypress.env('apiUrl') + '/graphql',
        headers: {
          'x-aptean-apim': Cypress.env('x-aptean-apim'),
          'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
          'x-aptean-tenant-secret': Cypress.env('x-aptean-tenant-secret')
        },
        body: { query },
        failOnStatusCode: false,
        timeout: 120000,
        retryOnNetworkFailure: true,
      });
});

Cypress.Commands.add("postAndValidate", (gql: string) => {
    return cy.postGQL(gql).then((res) => {
        // should be 200 ok
        expect(res.isOkStatusCode).to.be.equal(true, "Expect statusCode to be 200 ok");
        // no errors
        assert.notExists(res.body.errors, "Expect no errors");
        // has data
        assert.exists(res.body.data, "Expect response to have data");
        
        return res;
    });
});

// Names of items that are used in the ecomm-sf cypress tests, and so shouldn't be deleted.
const storefrontItems = ["Cypress Trees", "Bald Cypress", "Montezuma Cypress"];

// Delete Cypress items
Cypress.Commands.add("deleteItemsByApi", (searchFor?: string) => {
    const searchBy = searchFor ? searchFor : "Cypress";
    const queryName = "discounts";
    const deleteName = "deleteDiscount";

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
                    var message = res.body.data[deleteName].message
                    if (code !== "SUCCESS") {
                        code = code + message;
                    }
                    Cypress.log({message: code});
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

    const checkNodes = (nodes, searchBy: string) => {
        nodes.forEach((node) => {
            var id = node.id;
            var name = node.name;
            if (name.includes(searchBy) && !storefrontItems.includes(name)) {
                performDelete(deleteName, id);
            }
        });
    };

    const query = `{
		${queryName}(searchString: "${searchBy}", orderBy: {direction: ASC, field: NAME}) {
			totalCount
			nodes {
				id
                name
			}
		}
    }`;
    return cy.postAndValidate(query).then((res) => {
        const totalCount = res.body.data[queryName].totalCount;
        if (totalCount > 25) {
            const newQuery = `{
                ${queryName}(first: ${totalCount}, searchString: "${searchBy}", orderBy: {direction: ASC, field: NAME}) {
                    totalCount
                    nodes {
                        id
                        name
                    }
                }
            }`;
            return cy.postAndValidate(newQuery).then((resp) => {
                const nodes = resp.body.data[queryName].nodes;
                checkNodes(nodes, searchBy);
            });
        } else if (totalCount > 0) {
            const nodes = res.body.data[queryName].nodes;
            checkNodes(nodes, searchBy);
        } else {
            Cypress.log({message: "No Cypress items found"});
            return false;
        }
    });
});