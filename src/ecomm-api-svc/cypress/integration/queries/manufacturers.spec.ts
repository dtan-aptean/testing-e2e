/// <reference types="cypress" />

import { toFormattedString } from "../../support/commands";

// TEST COUNT: 47
describe('Query: manufacturers', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "manufacturers";
    // Standard query body to use when we don't need special data but do need special input arguments
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    manufacturerInfo {
                        name
                    }
                }
            }
            nodes {
                id
                manufacturerInfo {
                    name
                }
            }
            pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
            totalCount`;
    // Standard query to use when we don't need any specialized data or input arguments        
    const standardQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
            ${standardQueryBody}
        }
    }`;
    // Name of the info field
    const infoPath = "manufacturerInfo";

    var trueTotal = null;
    // Items created for the productId test
    const createdItems = [] as {name: string, id: string}[];
    const createdProducts =  [] as {name: string, id: string}[];
    const deleteName = "deleteManufacturer";
    const createMutName = "createManufacturer";
    const createPath = "manufacturer";

    before(() => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            const { nodes, edges, totalCount } = res.body.data[queryName];
            expect(nodes.length).to.be.eql(edges.length);
            if (totalCount > nodes.length) {
                trueTotal = totalCount;
            }
        });
    });

    // Ensure deletion of the items we created for the productId test
    after(() => {
        if (createdProducts.length > 0) {
            createdItems.forEach((item) => {
                cy.wait(2000);
                cy.queryForDeleted(false, item.name, item.id, "products", "productInfo").then((itemPresent: boolean) => {
                    if (itemPresent) {
                        const mutation = `mutation {
                            deleteProduct(input: {id: "${item.id}"}){
                                code
                                message
                                error
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, "deleteProduct");
                    }
                });
            });
        }
        if (createdItems.length > 0) {
            createdItems.forEach((item) => {
                cy.wait(2000);
                cy.queryForDeleted(false, item.name, item.id, queryName, infoPath).then((itemPresent: boolean) => {
                    if (itemPresent) {
                        var mutation = `mutation {
                            ${deleteName}(input: {id: "${item.id}"}){
                                code
                                message
                                error
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, deleteName);
                    }
                });
            });
        }
    });

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, queryName);
    });

    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            ${queryName} {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            ${queryName}(orderBy: {field: NAME}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            ${queryName}(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);
    
            // no errors
            assert.notExists(res.body.errors, `One or more errors ocuured while executing query: ${gqlQuery}`);

            // has data
            assert.exists(res.body.data);
            // validate data types
            assert.isNotNaN(res.body.data[queryName].totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return up to 25 items", () => {
        cy.postAndValidate(standardQuery, queryName).then((res) => {
            cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
            });
        });
    });

    it("Query with orderBy direction: DESC, field: NAME will return items in a reverse order from direction: ASC", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
            const descQuery = `{
                ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: DESC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(descQuery, queryName).then((descRes) => {
                cy.verifyReverseOrder(queryName, ascRes, descRes);
            });
        });
    });

    it("Query with valid 'productId' input will return only the items connected with that productId", () => {
        const itemOneName = `Cypress productId ${queryName}1 test`;
        const itemOneInput = {manufacturerInfo: [{name: itemOneName, languageCode: "Standard"}]};
        cy.createAndGetId(createMutName, createPath, toFormattedString(itemOneInput)).then((idOne) => {
            createdItems.push({name: itemOneName, id: idOne});
            const itemOne = {id: idOne};
            itemOne[infoPath] = [{name: itemOneName}];
            const itemTwoName = `Cypress productId ${queryName}2 test`;
            const itemTwoInput = {manufacturerInfo: [{name: itemTwoName, languageCode: "Standard"}]};
            cy.createAndGetId(createMutName, createPath, toFormattedString(itemTwoInput)).then((idTwo) => {
                createdItems.push({name: itemTwoName, id: idTwo});
                const itemTwo = {id: idTwo};
                itemTwo[infoPath] = [{name: itemTwoName}];
                const productName = `Cypress ${queryName} ProductID`; 
                const productInput = {
                    productInfo: [{
                        name: productName,
                        languageCode: "Standard",
                    }],
                    manufacturerIds: [idOne, idTwo]
                };
                cy.createAndGetId("createProduct", "product", toFormattedString(productInput)).then((productId: string) => {
                    createdProducts.push({name: productName, id: productId});
                    const query = `{
                        ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(query, queryName).then((respo) => {
                        const { nodes, totalCount } = respo.body.data[queryName];
                        expect(totalCount).to.be.eql(2);
                        expect(nodes).to.deep.include(itemOne);
                        expect(nodes).to.deep.include(itemTwo);
                        // Now delete the product
                        const mutation = `mutation {
                            deleteProduct(input: {id: "${productId}"}){
                                code
                                message
                                error
                            }
                        }`;
                        cy.postAndConfirmDelete(mutation, "deleteProduct").then(() => {
                            const deleteOne = `mutation {
                                ${deleteName}(input: {id: "${idOne}"}){
                                    code
                                    message
                                    error
                                }
                            }`;
                            cy.postAndConfirmDelete(deleteOne, deleteName).then(() => {
                                const deleteTwo = `mutation {
                                    ${deleteName}(input: {id: "${idTwo}"}){
                                        code
                                        message
                                        error
                                    }
                                }`;
                                cy.postAndConfirmDelete(deleteTwo, deleteName);
                            });
                        });
                    });
                });
            });
        });
    });

    it("Query with invalid 'productId' input will return an error", () => {
        const query = `{
            ${queryName}(productId: true, orderBy: {direction: ASC, field: TIMESTAMP}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(query).then((res) => {
            expect(res.body.errors[0].message).to.have.string('ID cannot represent a non-string and non-integer value: true');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with 'productId' input that has no associated items will return an empty array", () => {
        const productName = `Cypress ${queryName} productId`;
        const productInput = {
            productInfo: [{
                name: productName,
                languageCode: "Standard",
            }],
            inventoryInformation: {
                minimumStockQuantity: Cypress._.random(1, 10),
            }
        };
        cy.createAndGetId("createProduct", "product", toFormattedString(productInput)).then((returnedId: string) => {
            createdProducts.push({name: productName, id: returnedId});
            const query = `{
                ${queryName}(productId: "${returnedId}", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(query, queryName).then((res) => {
                const { nodes, totalCount } = res.body.data[queryName];
                expect(totalCount).to.be.eql(0);
                expect(nodes.length).to.eql(0);
                // Now delete the product
                const mutation = `mutation {
                    deleteProduct(input: {id: "${returnedId}"}){
                        code
                        message
                        error
                    }
                }`;
                cy.postAndConfirmDelete(mutation, "deleteProduct");
            });
        });
    });

    it("Query using the 'productId' of a deleted product will return an error", () => {
        const itemOneName = `Cypress productId ${queryName}1 delete`;
        const itemOneInput = {manufacturerInfo: [{name: itemOneName, languageCode: "Standard"}]};
        cy.createAndGetId(createMutName, createPath, toFormattedString(itemOneInput)).then((idOne) => {
            createdItems.push({name: itemOneName, id: idOne});
            const itemOne = {id: idOne};
            itemOne[infoPath] = [{name: itemOneName}];
            const itemTwoName = `Cypress productId ${queryName}2 delete`;
            const itemTwoInput = {manufacturerInfo: [{name: itemTwoName, languageCode: "Standard"}]};
            cy.createAndGetId(createMutName, createPath, toFormattedString(itemTwoInput)).then((idTwo) => {
                createdItems.push({name: itemTwoName, id: idTwo});
                const itemTwo = {id: idTwo};
                itemTwo[infoPath] = [{name: itemTwoName}];
                const productName = `Cypress ${queryName} ProductID delete`; 
                const productInput = {
                    productInfo: [{
                        name: productName,
                        languageCode: "Standard",
                    }],
                    manufacturerIds: [idOne, idTwo]
                };
                cy.createAndGetId("createProduct", "product", toFormattedString(productInput)).then((productId: string) => {
                    createdProducts.push({name: productName, id: productId});
                    // Now delete the product
                    const mutation = `mutation {
                        deleteProduct(input: {id: "${productId}"}){
                            code
                            message
                            error
                        }
                    }`;
                    cy.postAndConfirmDelete(mutation, "deleteProduct").then(() => {
                        const query = `{
                            ${queryName}(productId: "${productId}", orderBy: {direction: ASC, field: NAME}) {
                                ${standardQueryBody}
                            }
                        }`;
                        cy.postAndConfirmError(query).then(() => {
                            const deleteOne = `mutation {
                                ${deleteName}(input: {id: "${idOne}"}){
                                    code
                                    message
                                    error
                                }
                            }`;
                            cy.postAndConfirmDelete(deleteOne, deleteName).then(() => {
                                const deleteTwo = `mutation {
                                    ${deleteName}(input: {id: "${idTwo}"}){
                                        code
                                        message
                                        error
                                    }
                                }`;
                                cy.postAndConfirmDelete(deleteTwo, deleteName);
                            });
                        });
                    });
                });
            });
        });
    });

    
    const createdDateQueryBody = `edges {
        cursor
        node {
            id
        }
    }
    nodes {
        id
        ${infoPath} {
            name
        }
        createdDate
    }
    pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
    }
    totalCount`;

    it("Query using valid 'startDate' input will return only items with a createdDate >= that startDate", () => {
        const firstInput = trueTotal ? "first: " + trueTotal + ", ": "";
        const query = `{
            ${queryName}(${firstInput}orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.returnRandomDate(query, queryName).then((randomDate) => {
            const startDateQuery = `{
                ${queryName}(${firstInput}startDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndValidate(startDateQuery, queryName).then((res) => {
                cy.verifyDateInput(res, queryName, randomDate);
            });
        });
    });

    it("Query using valid 'endDate' input will return only items with a createdDate <= that endDate", () => {
        const firstInput = trueTotal ? "first: " + trueTotal + ", ": "";
        const query = `{
            ${queryName}(${firstInput}orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.returnRandomDate(query, queryName).then((randomDate) => {
            const startDateQuery = `{
                ${queryName}(${firstInput}endDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndValidate(startDateQuery, queryName).then((res) => {
                cy.verifyDateInput(res, queryName, undefined, randomDate);
            });
        });
    });

    it("Query using valid 'startDate' and 'endDate' input will return only items that obey startDate <= createdDate <= endDate", () => {
        const firstInput = trueTotal ? "first: " + trueTotal + ", ": "";
        const query = `{
            ${queryName}(${firstInput}orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.returnRandomDate(query, queryName, true).then((startDate) => {
            cy.returnRandomDate(query, queryName, undefined, startDate).then((endDate) => {
                const startEndQuery = `{
                    ${queryName}(${firstInput}startDate: "${startDate}", endDate: "${endDate}", orderBy: {direction: ASC, field: NAME}) {
                        ${createdDateQueryBody}
                    }
                }`;
                cy.postAndValidate(startEndQuery, queryName).then((res) => {
                    cy.verifyDateInput(res, queryName, startDate, endDate);
                });
            });
        });
    });

    it("Query using an invalid 'startDate' input will return an error", () => {
        const query = `{
            ${queryName}(startDate: false, orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query using an invalid 'endDate' input will return an error", () => {
        const query = `{
            ${queryName}(endDate: false, orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query using invalid 'startDate' and 'endDate' inputs will return an error", () => {
        const query = `{
            ${queryName}(startDate: [], endDate: false, orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.postAndConfirmError(query);
    });

    it("Query using valid 'startDate' and invalid 'endDate' inputs will return an error", () => {
        const query = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.returnRandomDate(query, queryName).then((randomDate) => {
            const invalidQuery = `{
                ${queryName}(startDate: "${randomDate}", endDate: false, orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndConfirmError(invalidQuery);
        });
    });

    it("Query using invalid 'startDate' and valid 'endDate' inputs will return an error", () => {
        const query = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${createdDateQueryBody}
            }
        }`;
        cy.returnRandomDate(query, queryName).then((randomDate) => {
            const invalidQuery = `{
                ${queryName}(startDate: false, endDate: "${randomDate}", orderBy: {direction: ASC, field: NAME}) {
                    ${createdDateQueryBody}
                }
            }`;
            cy.postAndConfirmError(invalidQuery);
        });
    });

    it("Query with valid 'first' input argument will return only that amount of items", () => {
        cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const first = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(first: ${first}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, true, false);
                cy.verifyFirstOrLast(resp, queryName, first, "first");
            });
        });
    });

    it("Query with valid 'last' input argument will return only that amount of items", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const last = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(last: ${last}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, true, false);
                cy.verifyFirstOrLast(resp, queryName, last, "last");
            });
        });
    });

    it("Query with invalid 'first' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(first: "4", orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with invalid 'last' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(last: "5", orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with both 'first' and 'last' input arguments will fail", () => {
        const gqlQuery = `{
            ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery, true);
    });

    it("Query with a valid 'searchString' input argument will return the specific item", () => {
        cy.returnRandomInfoName(standardQuery, queryName, infoPath).then((name: string) => {
            const searchQuery = `{
                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, queryName).then((resp) => {
                cy.validateInfoNameSearch(resp, queryName, infoPath, name);
            });
        });
    });

    it("Query with a valid partial 'searchString' input argument will return all items containing the string", () => {
        cy.returnRandomInfoName(standardQuery, queryName, infoPath).then((name: string) => {
            // Get the first word if the name has multiple words. Otherwise, get a random segment of the name
            var newWordIndex = name.search(" ");
            var searchText = "";
            if (newWordIndex !== -1 && newWordIndex !== 0) {
                searchText = name.substring(0, newWordIndex);
            } else {
                const segmentIndex = Cypress._.random(name.length / 2, name.length - 1);
                searchText = name.substring(0, segmentIndex);
            }
            const searchQuery = `{
                ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(searchQuery, queryName).then((resp) => {
                cy.validateInfoNameSearch(resp, queryName, infoPath, searchText);
            });
        });
    });

    it("Query with an invalid 'searchString' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(searchString: 7, orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with a valid 'before' input argument will return all items before that value", () => {
        cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
            const beforeQuery = `{
                ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, false, true);
                cy.validateCursor(resp, queryName, "before");
            });
        });
    });
    
    it("Query with a valid 'after' input argument will return all items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            const afterQuery = `{
                ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(afterQuery, queryName).then((resp) => {
                const hasNextPage = resp.body.data[queryName].totalCount > resp.body.data[queryName].nodes.length;
                // Verify that the pageInfo's cursors match up with the edges array's cursors
                cy.verifyPageInfo(resp, queryName, hasNextPage, true);
                cy.validateCursor(resp, queryName, "after");
            });
        });
    });

    it("Query with invalid 'before' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(before: 123, orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });

    it("Query with invalid 'after' input argument will fail", () => {
        const gqlQuery = `{
            ${queryName}(after: true, orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
    
    it("Query with both 'before' and 'after' input arguments will fail", () => {
        const gqlQuery = `{
            ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            // should have errors
            assert.exists(res.body.errors);
  
            // no data
            assert.notExists(res.body.data);

            expect(res.body.errors[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
        });
    });

    it("Query with both 'before' and 'first' input arguments will return a specific amount of items before that value", () => {
        cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const first = index > 1 ? Math.floor(index / 2) : 1;
                Cypress.log({message: `first: ${first}`});
                const beforeQuery = `{
                    ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, queryName);
                    cy.validateCursor(resp, queryName, "before", "first", first);
                });
            });
        });
    });

    it("Query with both 'after' and 'first' input will arguments return a specific amount of items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const first = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `first: ${first}`});
                    const afterQuery = `{
                        ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, queryName).then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, queryName);
                        cy.validateCursor(resp, queryName, "after", "first", first);
                    });
                });
            });
        });
    });

    it("Query with both 'before' and 'last' input arguments will return a specific amount of items before that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                const last = index > 1 ? Math.floor(index / 2) : 1;
                Cypress.log({message: `last: ${last}`});
                const beforeQuery = `{
                    ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(beforeQuery, queryName).then((resp) => {
                    // Verify that the pageInfo's cursors match up with the edges array's cursors
                    cy.verifyPageInfo(resp, queryName);
                    cy.validateCursor(resp, queryName, "before", "last", last);
                });
            });
        });
    });

    it("Query with both 'after' and 'last' input will return a specific amount of items after that value", () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            cy.get('@cursorIndex').then((index: number) => {
                cy.get('@orgCount').then((count: number) => {
                    const diff = (count - 1) - index;
                    const last = diff >= 2 ? Math.floor(diff / 2): diff;
                    Cypress.log({message: `last: ${last}`});
                    const afterQuery = `{
                        ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: NAME}) {
                            ${standardQueryBody}
                        }
                    }`;
                    cy.postAndValidate(afterQuery, queryName).then((resp) => {
                        // Verify that the pageInfo's cursors match up with the edges array's cursors
                        cy.verifyPageInfo(resp, queryName);
                        cy.validateCursor(resp, queryName, "after", "last", last);
                    });
                });
            });
        });
    });

    it('Query with invalid "Before" input and valid "first" input will fail', () => {
        cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const first = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(before: 123, first: ${first}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with valid "Before" input and invalid "first" input will fail', () => {
        cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
            const gqlQuery = `{
                ${queryName}(before: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with invalid "After" input and valid "first" input will fail', () => {
        cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const first = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(after: 123, first: ${first}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with valid "After" input and invalid "first" input will fail', () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            const gqlQuery = `{
                ${queryName}(after: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with invalid "Before" input and valid "last" input will fail', () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const last = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(before: 123, last: ${last}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with valid "Before" input and invalid "last" input will fail', () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
            const gqlQuery = `{
                ${queryName}(before: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with invalid "After" input and valid "last" input will fail', () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
            // If there's only one item, we can't do any pagination
            expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
            // Get half the items, rounding down
            const last = Math.floor(totalCount / 2);
            const gqlQuery = `{
                ${queryName}(after: 123, last: ${last}, orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it('Query with valid "After" input and invalid "last" input will fail', () => {
        const trueTotalQuery = `{
            ${queryName}(${trueTotal ? "first: " + trueTotal + ", ": ""}orderBy: {direction: ASC, field: NAME}) {
                ${standardQueryBody}
            }
        }`;
        cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
            const gqlQuery = `{
                ${queryName}(after: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME}) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    customData
                }
                pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                }
                totalCount
            }
        }`;
        cy.postAndValidate(gqlQuery, queryName).then((res) => {
            cy.checkCustomData(res, queryName);
        });
    });
});