/// <reference types="cypress" />
// TEST COUNT:103
import { toFormattedString } from "../../support/commands";

describe('Query: addresses', () => {
    // Query name to use with functions so there's no misspelling it and it's easy to change if the query name changes
    const queryName = "addresses";
    const deleteMutName = "deleteAddress"
    const deleteMutName1 = "deleteCompany"
    const deleteMutName2 = "deleteCustomer"

    // Standard query body to use when we don't need special data but do need special input arguments
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    contactDetails{
                        firstName
                    }
                }
            }
            nodes {
                id
                contactDetails{
                    firstName
                }
            }
            pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
            totalCount`;

    var deletionIds1 = [];
    var deletionIds2 = []

    const standardQueryForCompany, standardQueryForCustomer;

    var compId = "", custId = "";
    // Standard query to use when we don't need any specialized data or input arguments
    const updateCompanyId = (providedId: string) => {
        compId = providedId;
        standardQueryForCompany = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME} companyId: "${providedId}" ) {
                ${standardQueryBody}
            }
        }`;

    };

    const updateCustomerId = (providedId: string) => {
        custId = providedId;
        standardQueryForCustomer = `{
           ${queryName}(orderBy: {direction: ASC, field: NAME} customerId: "${providedId}") {
                edges {
                    cursor
                    node {
                        id
                        contactDetails{
                            firstName
                        }
                    }
                }
                nodes {
                    id
                    contactDetails{
                        firstName
                    }
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

    };

    const queryInformation = {
        companyId: "",
        customerId: ""
    };
    var trueTotalInput1 = "", trueTotalInput2 = "";
    var deleteItemsAfter = undefined as boolean | undefined;

    before(() => {
        deleteItemsAfter = Cypress.env("deleteItemsAfter");
        //  cy.deleteCypressItems(queryName, deleteMutName);

        const extraPath = "addressInfo";
        const extraCreate = "createAddress";
        const extraQuery = "addresses";

        var extraPath1 = "company";
        var extraCreate1 = "createCompany"
        const extraItemInput1 = `{name:"Cypress Address New Company" integrationKey: "${Math.random().toString(36).slice(2)}"}`

        var extraPath2 = "customer";
        var extraCreate2 = "createCustomer"
        const extraItemInput2 = `{firstName:"Cypress Address New Customer" lastName:"Test" email: "Cypress${Math.random().toString(36).slice(2)}Test@email.com"}`

        var numberToMake = 5;

        cy.createAndGetId(extraCreate1, extraPath1, extraItemInput1).then((returnedid) => {
            queryInformation.companyId = returnedid;
            updateCompanyId(returnedid)
            const extraItemInput = `{companyId: "${returnedid}",
            addressType:SHIPPING,
            contactDetails:{
              firstName:"Cypress",
              lastName:"Test",
              email:"cypressTest@email.com",
              phone:[{
                phoneType:FAX,
                phoneNumber:"7635688888",
                countryCode:US
              }
             ],
             address:{
              line1:"Wills Park Recreation center",
              line2:"11925 wills rd",
              city:"alpharetta",
              region:"Georgia",
              postalCode:"30009",
              country:"US"
            }
            }}`;
            cy.createAndGetMultipleIds(numberToMake, extraCreate, extraPath, extraItemInput).then((ids: []) => {
                deletionIds1 = ids;
                cy.postAndValidate(standardQueryForCompany, queryName).then((res) => {
                    const { nodes, edges, totalCount } = res.body.data[queryName];
                    expect(nodes.length).to.be.eql(edges.length);
                    expect(totalCount).to.be.eql(numberToMake);
                    if (totalCount > nodes.length) {
                        trueTotalInput1 = totalCount > 0 ? "first: " + totalCount + ", " : "";
                    }
                });

            })
        });

        cy.createAndGetId(extraCreate2, extraPath2, extraItemInput2).then((returnedid) => {
            queryInformation.customerId = returnedid;
            updateCustomerId(returnedid)
            const extraItemInput = `{customerId: "${returnedid}",
                 addressType:SHIPPING,
                 contactDetails:{
                 firstName:"Cypress",
                   lastName:"Test",
                   email:"cypressTest@email.com",
                   phone:[{
                     phoneType:FAX,
                     phoneNumber:"7635688888",
                     countryCode:US
                   }
                  ],
                  address:{
                   line1:"Wills Park Recreation center",
                   line2:"11925 wills rd",
                   city:"alpharetta",
                   region:"Georgia",
                   postalCode:"30009",
                   country:"US"
                 }
                 }}`;
            cy.createAndGetMultipleIds(numberToMake, extraCreate, extraPath, extraItemInput).then((ids: []) => {
                deletionIds2 = ids;
                cy.postAndValidate(standardQueryForCustomer, queryName).then((res) => {
                    const { nodes, edges, totalCount } = res.body.data[queryName];
                    expect(nodes.length).to.be.eql(edges.length);
                    expect(totalCount).to.be.eql(numberToMake);
                    if (totalCount > nodes.length) {
                        trueTotalInput2 = totalCount > 0 ? "first: " + totalCount + ", " : "";
                    }
                });
            });
        });
    });

    after(() => {
        if (!deleteItemsAfter) {
            return;
        }
        for (let i = 0; i < deletionIds1.length; i++) {
            cy.deleteItem(deleteMutName, deletionIds1[i]);
        }
        for (let i = 0; i < deletionIds2.length; i++) {
            cy.deleteItem(deleteMutName, deletionIds2[i]);
        }
        if (compId !== "") {
            cy.deleteItem(deleteMutName1, compId).then(() => {
                compId = "";
            });
        }
        if (custId !== "") {
            cy.deleteItem(deleteMutName2, custId).then(() => {
                custId = "";
            });
        }
    })

    context("Testing 'orderBy' input", () => {
        it('Query will fail if no return type is provided with Company Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it('Query will fail if no return type is provided with Customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query with valid 'orderBy' input argument with Company Id returns valid data types ", () => {
            cy.postAndValidate(standardQueryForCompany, queryName);
        });

        it("Query with valid 'orderBy' input argument with Customer Id returns valid data types", () => {
            cy.postAndValidate(standardQueryForCustomer, queryName);
        });

        it("Query will fail without 'orderBy' input argument with Company Id", () => {
            const gqlQuery = `{
                ${queryName} (companyId:"${queryInformation.companyId}"){
                    ${standardQueryBody}
                }
            }`;
            cy.postGQL(gqlQuery).then(res => {
                cy.confirmOrderByError(res);
            });
        });

        it("Query will fail without 'orderBy' input argument with Customer Id", () => {
            const gqlQuery = `{
                ${queryName}(customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postGQL(gqlQuery).then(res => {
                cy.confirmOrderByError(res);
            });
        });

        it('Query fails if the orderBy argument is null with Company Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: null companyId:"${queryInformation.companyId}" ) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it('Query fails if the orderBy argument is null with Customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: null customerId:"${queryInformation.customerId}" ) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(gqlQuery);
        });

        it("Query fails if 'orderBy' input argument only has field with Company Id", () => {
            const fieldQuery = `{
                ${queryName}(orderBy: {field: NAME} companyId:"${queryInformation.companyId}") {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(fieldQuery);
        });

        it("Query fails if 'orderBy' input argument only has field with Customer Id", () => {
            const fieldQuery = `{
                ${queryName}(orderBy: {field: NAME} customerId:"${queryInformation.customerId}" ) {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(fieldQuery);
        });

        it("Query fails if 'orderBy' input argument only has direction with Company Id", () => {
            const directionQuery = `{
                ${queryName}(orderBy: {direction: ASC} companyId:"${queryInformation.companyId}") {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(directionQuery);
        });

        it("Query fails if 'orderBy' input argument only has direction with Customer Id", () => {
            const directionQuery = `{
                ${queryName}(orderBy: {direction: ASC} customerId:"${queryInformation.customerId}") {
                    totalCount
                }
            }`;
            cy.postAndConfirmError(directionQuery);
        });

        it("Query will succeed with a valid 'orderBy' input argument with Company Id and one return type", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    totalCount
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it("Query will succeed with a valid 'orderBy' input argument with Customer Id and one return type", () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    totalCount
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it("Query with orderBy direction: DESC, field: NAME with Company Id will return items in a reverse order from direction: ASC ", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1} orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
                const descQuery = `{
                    ${queryName}(${trueTotalInput1} orderBy: {direction: DESC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(descQuery, queryName).then((descRes) => {
                    cy.verifyReverseOrder(queryName, ascRes, descRes);
                });
            });
        });

        it("Query with orderBy direction: DESC, field: NAME with Customer Id will return items in a reverse order from direction: ASC", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
                const descQuery = `{
                    ${queryName}(${trueTotalInput2} orderBy: {direction: DESC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndValidate(descQuery, queryName).then((descRes) => {
                    cy.verifyReverseOrder(queryName, ascRes, descRes);
                });
            });
        });
    });

    context("Testing 'first' and 'last' inputs", () => {
        it("Query without 'first' or 'last' input arguments and with Company Id will return up to 25 items", () => {
            cy.postAndValidate(standardQueryForCompany, queryName).then((res) => {
                cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                    cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
                });
            });
        });

        it("Query without 'first' or 'last' input arguments and with Customer Id will return up to 25 items", () => {
            cy.postAndValidate(standardQueryForCustomer, queryName).then((res) => {
                cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
                    cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
                });
            });
        });

        it("Query with valid 'first' input argument with Company Id will return only that amount of items", () => {
            cy.returnCount(standardQueryForCompany, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(first: ${first}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with valid 'first' input argument with Customer Id will return only that amount of items", () => {
            cy.returnCount(standardQueryForCustomer, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(first: ${first}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with valid 'last' input argument with Company Id will return only that amount of items", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(last: ${last}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with valid 'last' input argument with Customer Id will return only that amount of items", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2} orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(last: ${last}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with invalid 'first' input argument with Company Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: "4", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'first' input argument with Customer Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: "4", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'last' input argument with Company Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(last: "5", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'last' input argument with Customer Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(last: "5", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with both 'first' and 'last' with Company Id input arguments will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true);
        });

        it("Query with both 'first' and 'last' with Customer Id input arguments will fail", () => {
            const gqlQuery = `{
                ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true);
        });
    });

    context("Testing 'before' and 'after' inputs", () => {
        it("Query with a valid 'before' input argument with Company Id will return all items before that value", () => {
            cy.returnRandomCursor(standardQueryForCompany, queryName, true).then((cursor: string) => {
                const beforeQuery = `{
                    ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with a valid 'before' input argument with Customer Id will return all items before that value", () => {
            cy.returnRandomCursor(standardQueryForCustomer, queryName, true).then((cursor: string) => {
                const beforeQuery = `{
                    ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with a valid 'after' input argument with Company Id will return all items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const afterQuery = `{
                    ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with a valid 'after' input argument with Customer id will return all items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const afterQuery = `{
                    ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with invalid 'before' input argument with Company Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: 123, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'before' input argument with Customer Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: 123, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'after' input argument with Company Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(after: true, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with invalid 'after' input argument with Customer Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(after: true, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with both 'before' and 'after' input arguments with Company Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
            });
        });

        it("Query with both 'before' and 'after' input arguments with Customer Id will fail", () => {
            const gqlQuery = `{
                ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
            });
        });
    });

    context("Testing 'before'/'after' inputs with 'first'/'last' inputs", () => {
        it("Query with both 'before' and 'first' input arguments with Company Id will return a specific amount of items before that value", () => {
            cy.returnRandomCursor(standardQueryForCompany, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const first = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({ message: `first: ${first}` });
                    const beforeQuery = `{
                        ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with both 'before' and 'first' input arguments with Customer Id will return a specific amount of items before that value", () => {
            cy.returnRandomCursor(standardQueryForCustomer, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const first = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({ message: `first: ${first}` });
                    const beforeQuery = `{
                        ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with both 'after' and 'first' input arguments with Company Id will return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    cy.get('@orgCount').then((count: number) => {
                        const diff = (count - 1) - index;
                        const first = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `first: ${first}` });
                        const afterQuery = `{
                            ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with both 'after' and 'first' input arguments with Customer Id will return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    cy.get('@orgCount').then((count: number) => {
                        const diff = (count - 1) - index;
                        const first = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `first: ${first}` });
                        const afterQuery = `{
                            ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with both 'before' and 'last' input arguments with Company Id will return a specific amount of items before that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const last = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({ message: `last: ${last}` });
                    const beforeQuery = `{
                        ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with both 'before' and 'last' input arguments with Customer Id will return a specific amount of items before that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    const last = index > 1 ? Math.floor(index / 2) : 1;
                    Cypress.log({ message: `last: ${last}` });
                    const beforeQuery = `{
                        ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it("Query with both 'after' and 'last' input with Company Id will return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    cy.get('@orgCount').then((count: number) => {
                        const diff = (count - 1) - index;
                        const last = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `last: ${last}` });
                        const afterQuery = `{
                            ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with both 'after' and 'last' input with Customer Id will return a specific amount of items after that value", () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                cy.get('@cursorIndex').then((index: number) => {
                    cy.get('@orgCount').then((count: number) => {
                        const diff = (count - 1) - index;
                        const last = diff >= 2 ? Math.floor(diff / 2) : diff;
                        Cypress.log({ message: `last: ${last}` });
                        const afterQuery = `{
                            ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it('Query with invalid "Before" input and valid "first" input with Company Id will fail', () => {
            cy.returnCount(standardQueryForCompany, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, first: ${first}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "Before" input and valid "first" input with Customer Id will fail', () => {
            cy.returnCount(standardQueryForCustomer, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, first: ${first}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });


        it('Query with valid "Before" input and invalid "first" input with Company Id will fail', () => {
            cy.returnRandomCursor(standardQueryForCompany, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "Before" input and invalid "first" with input Customer Id will fail', () => {
            cy.returnRandomCursor(standardQueryForCustomer, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "first" input with Company Id will fail', () => {
            cy.returnCount(standardQueryForCompany, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, first: ${first}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "first" input with Customer Id will fail', () => {
            cy.returnCount(standardQueryForCustomer, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const first = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, first: ${first}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });


        it('Query with valid "After" input and invalid "first" input with Company Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "After" input and invalid "first" input with Customer Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", first: "4", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "Before" input and valid "last" input with Company Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, last: ${last}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "Before" input and valid "last" input with Customer Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(before: 123, last: ${last}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "Before" input and invalid "last" input with Company Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "Before" input and invalid "last" input with Customer Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(before: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "last" input with Company Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, last: ${last}, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with invalid "After" input and valid "last" input with Customer Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
                // If there's only one item, we can't do any pagination
                expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
                // Get half the items, rounding down
                const last = Math.floor(totalCount / 2);
                const gqlQuery = `{
                    ${queryName}(after: 123, last: ${last}, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "After" input and invalid "last" input with Company Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput1}orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });

        it('Query with valid "After" input and invalid "last" input with Customer Id will fail', () => {
            const trueTotalQuery = `{
                ${queryName}(${trueTotalInput2}orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
                const gqlQuery = `{
                    ${queryName}(after: "${cursor}", last: "4", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                        ${standardQueryBody}
                    }
                }`;
                cy.postAndConfirmError(gqlQuery).then((res) => {
                    expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
                    expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
                });
            });
        });
    });

    context("Testing Company and Customer Id Input", () => {
        it('Query with valid company Id, returns the addresses associated with it', () => {
            cy.postAndValidate(standardQueryForCompany, queryName).then((res) => {
                cy.validateMultipleIdSearch(res, queryName, deletionIds1);
            });
        });

        it('Query will fail with empty company Id ', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Either CompanyId or CustomerId is required');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
            });
        });

        it('Query  will fail with invalid company Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"uu22") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });

        it('Query will fail with non-string company Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:asd) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('ID cannot represent a non-string and non-integer value');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it('Query with valid customer Id, returns the addresses associated with it', () => {
            const customerId = queryInformation.customerId;
            const customerIdQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId: "${customerId}") {
                     edges {
                         cursor
                         node {
                             id
                             customer {
                                 id
                             }
                         }
                     }
                     nodes {
                         id
                         customer {
                             id
                         }
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
            cy.postAndValidate(customerIdQuery, queryName).then((res) => {
                cy.validateIdSearch(res, queryName, customerId, 'customer.id');
            });
        });

        it('Query will fail with empty customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Either CompanyId or CustomerId is required');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });

        it('Query will fail with invalid customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"uu22") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });


        it('Query will fail with non-string customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:asd) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('ID cannot represent a non-string and non-integer value');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });


        it('Query will fail with both company and  customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}"  customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Both CompanyId and CustomerId should not be provided');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });

        it('Query with valid company Id and  empty customer Id, returns the  addresses associated with company', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}"  customerId:"") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((res) => {
                cy.validateMultipleIdSearch(res, queryName, deletionIds1);
            });
        });

        it('Query with empty company Id and valid customer Id, returns the addresses associated with customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:""  customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((res) => {
                cy.validateMultipleIdSearch(res, queryName, deletionIds2);
            });
        });

        it('Query will fail with empty company Id and empty customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:""  customerId:"") {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Either CompanyId or CustomerId is required');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });

        it('Query will fail  without company and  customer Id', () => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} ) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {
                expect(res.body.errors[0].message[0].message).to.have.string('Either CompanyId or CustomerId is required');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
            });
        });

    });
    context('Testing IDs input', () => {
        it('Query with an array of one or more valid ids as "ids" input with Comapny Id ,returns the relevant items', () => {
            var ids = "";
            cy.returnMultipleRandomIds(2, standardQueryForCompany, queryName).then((idValues: []) => {

                ids = "["
                for (var i = 0; i < idValues.length; i++) {
                    ids += '"' + idValues[i] + '"' + ",";

                }
                ids += "]"
                const gqlQuery = `{
            ${queryName}( orderBy: {direction: ASC, field: NAME}  companyId:"${queryInformation.companyId}"  ids:${ids}) {
                ${standardQueryBody}
            }
        }`;
                cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                    cy.validateMultipleIdSearch(resp, queryName, idValues);
                });
            });
        });

        it('Query with an array of one or more valid ids as "ids" input with Customer Id ,returns the relevant items', () => {
            var ids = "";

            cy.returnMultipleRandomIds(2, standardQueryForCustomer, queryName).then((idValues: []) => {

                ids = "["
                for (var i = 0; i < idValues.length; i++) {
                    ids += '"' + idValues[i] + '"' + ",";

                }
                ids += "]"

                const gqlQuery = `{
            ${queryName}( orderBy: {direction: ASC, field: NAME} ids:${ids} customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
                cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                    cy.validateMultipleIdSearch(resp, queryName, idValues);
                });
            });
        });

        it('Query with single id as "ids" input with Company Id, returns the relevant item', () => {
            cy.returnRandomId(standardQueryForCompany, queryName).then((id: string) => {
                const gqlQuery = `{
                ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                    cy.validateIdSearch(resp, queryName, id);
                });
            });
        });

        it('Query with single id as "ids" input with Customer Id, returns the relevant item', () => {
            cy.returnRandomId(standardQueryForCustomer, queryName).then((id: string) => {
                const gqlQuery = `{
                ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(gqlQuery, queryName).then((resp) => {
                    cy.validateIdSearch(resp, queryName, id);
                });
            });
        });

        it('Query with  empty array as "ids" input with Company Id, retruns response data', () => {
            const gqlQuery = `{
            ${queryName}(ids:[], orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it('Query with  empty array as "ids" input with Customer Id, retruns response data', () => {
            const gqlQuery = `{
            ${queryName}(ids:[], orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndValidate(gqlQuery, queryName);
        });

        it('Query with an array of one or more empty strings as "ids" input with Company Id, returns error ', () => {
            const gqlQuery = `{
            ${queryName}(ids:["",""], orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {

                expect(res.body.errors[0].message[0].details[0].message).to.have.string('invalid aptean Id:');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");

            })
        });

        it('Query with an array of one or more empty strings as "ids" input with Customer Id, returns error ', () => {
            const gqlQuery = `{
            ${queryName}(ids:["",""], orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery, true).then((res) => {

                expect(res.body.errors[0].message[0].details[0].message).to.have.string('invalid aptean Id:');
                expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");

            })
        });

        it('Query with an array of one or more non-string values as "ids" input with Company Id, returns error ', () => {
            const gqlQuery = `{
            ${queryName}(ids:[235], orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {

                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });

        });

        it('Query with an array of one or more non-string values as "ids" input with Customer Id, returns error ', () => {
            const gqlQuery = `{
            ${queryName}(ids:[235], orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {

                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });

        });

        it('Query with non-array value as "ids" input with Company Id, returns error', () => {
            const gqlQuery = `{
            ${queryName}(ids:235, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {

                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });
        });

        it('Query with non-array value as "ids" input with Customer Id, returns error', () => {
            const gqlQuery = `{
            ${queryName}(ids:235, orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {

                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value:');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");

            });
        });

        it('Query with ids from a different item as "ids" input with Company Id returns error', () => {
            const extraqueryName = "categories";
            // Standard query body to get id from diff item 
            const extrastandardQueryBody = `edges {
                    cursor
                    node {
                        id
                        categoryInfo {
                            name
                            languageCode
                        }
                    }
                }
                nodes {
                    id
                    categoryInfo {
                        name
                        languageCode
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
            const extrastandardQuery = `{
            ${extraqueryName}(orderBy: {direction: ASC, field: NAME}) {
                ${extrastandardQueryBody}
            }
        }`;


            cy.returnRandomId(extrastandardQuery, extraqueryName).then((id: string) => {
                const gqlQuery = `{
                ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndConfirmError(gqlQuery, true).then((res) => {
                    expect(res.body.errors[0].message[0].details[0].message).to.have.string('invalid aptean Id:');
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
                });
            });

        });


        it('Query with ids from a different item as "ids" input with Customer Id returns error', () => {
            const extraqueryName = "categories";
            // Standard query body to get id from diff item 
            const extrastandardQueryBody = `edges {
                    cursor
                    node {
                        id
                        categoryInfo {
                            name
                            languageCode
                        }
                    }
                }
                nodes {
                    id
                    categoryInfo {
                        name
                        languageCode
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
            const extrastandardQuery = `{
            ${extraqueryName}(orderBy: {direction: ASC, field: NAME}) {
                ${extrastandardQueryBody}
            }
        }`;


            cy.returnRandomId(extrastandardQuery, extraqueryName).then((id: string) => {
                const gqlQuery = `{
                ${queryName}(ids: "${id}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndConfirmError(gqlQuery, true).then((res) => {
                    expect(res.body.errors[0].message[0].details[0].message).to.have.string('invalid aptean Id');
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
                });
            });

        });
    });

    context("Testing 'searchString' input", () => {

        it("Query with a valid 'searchString' input argument with Company Id will return the specific item", () => {
            cy.returnRandomName(standardQueryForCompany, queryName).then((name: string) => {
                const searchQuery = `{
                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, name);
                });
            });
        });

        it("Query with a valid 'searchString' input argument with Customer Id will return the specific item", () => {
            cy.returnRandomName(standardQueryForCustomer, queryName).then((name: string) => {
                const searchQuery = `{
                ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, name);
                });
            });
        });

        it("Query with a valid partial 'searchString' input argument with Company Id will return all items containing the string", () => {
            cy.returnRandomName(standardQueryForCompany, queryName).then((name: string) => {
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
                ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, searchText);
                });
            });
        });

        it("Query with a valid partial 'searchString' input argument with Customer Id will return all items containing the string", () => {
            cy.returnRandomName(standardQueryForCustomer, queryName).then((name: string) => {
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
                ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(searchQuery, queryName).then((resp) => {
                    cy.validateNameSearch(resp, queryName, searchText);
                });
            });
        });

        it("Query with an invalid 'searchString' input argument with Company Id will fail", () => {
            const gqlQuery = `{
            ${queryName}(searchString: 7, orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });

        it("Query with an invalid 'searchString' input argument with Customer Id will fail", () => {
            const gqlQuery = `{
            ${queryName}(searchString: 7, orderBy: {direction: ASC, field: NAME}  customerId:"${queryInformation.customerId}") {
                ${standardQueryBody}
            }
        }`;
            cy.postAndConfirmError(gqlQuery).then((res) => {
                expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
                expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
            });
        });
    });

    context("Testing response values for customData and other fields", () => {
        it("Query with customData field with Company Id will return valid value", () => {
            const gqlQuery = `{ 
            ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
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

        it("Query with customData field with Customer Id will return valid value", () => {
            const gqlQuery = `{ 
            ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
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

        it('Query all other fields with Company Id  will return valid data for the fields', () => {
            const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME} companyId:"${queryInformation.companyId}") {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
                    addressType
                    contactDetails{
                        firstName
                        lastName
                        email
                    address {
                        city
                        country
                        line1
                        line2
                        postalCode
                        region
                    }
                    phone{
                        phoneType
                        countryCode
                        phoneNumber
                    }
                }
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
                if (res.body.data[queryName].nodes.length > 0) {
                    const nodesPath = res.body.data[queryName].nodes;
                    nodesPath.forEach((item) => {
                        // has addressType and contactDetails
                        expect(item).to.have.property('addressType');
                        if (item.addressType !== null) {
                            expect(item.addressType).to.be.a('string');
                        }

                        expect(item).to.have.property('contactDetails');
                        if (item.contactDetails !== null) {
                            expect(item.contactDetails).to.have.property('firstName');
                            if (item.contactDetails.firstName !== null) {
                                expect(item.contactDetails.firstName).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('lastName');
                            if (item.contactDetails.lastName !== null) {
                                expect(item.contactDetails.lastName).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('email');
                            if (item.contactDetails.email !== null) {
                                expect(item.contactDetails.email).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('address');
                            if (item.contactDetails.address !== null) {
                                expect(item.contactDetails.address).to.have.property('city');
                                if (item.contactDetails.address.city !== null) {
                                    expect(item.contactDetails.address.city).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('country');
                                if (item.contactDetails.address.country !== null) {
                                    expect(item.contactDetails.address.country).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('line1');
                                if (item.contactDetails.address.line1 !== null) {
                                    expect(item.contactDetails.address.line1).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('line2');
                                if (item.contactDetails.address.line2 !== null) {
                                    expect(item.contactDetails.address.line2).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('postalCode');
                                if (item.contactDetails.address.postalCode !== null) {
                                    expect(item.contactDetails.address.postalCode).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('region');
                                if (item.contactDetails.address.region !== null) {
                                    expect(item.contactDetails.address.region).to.be.a('string');
                                }
                            }
                            if (item.contactDetails.phone !== null) {
                                item.contactDetails.phone.forEach((item1) => {
                                    expect(item1).to.have.property('phoneType');
                                    if (item1.phoneType !== null) {
                                        expect(item1.phoneType).to.be.a('string');
                                    }
                                    expect(item1).to.have.property('phoneNumber');
                                    if (item1.phoneNumber !== null) {
                                        expect(item1.phoneNumber).to.be.a('string');
                                    }
                                    expect(item1).to.have.property('countryCode');
                                    if (item1.countryCode !== null) {
                                        expect(item1.countryCode).to.be.a('string');
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });

        it('Query all other fields with Customer Id will return valid data for the fields', () => {
            const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME} customerId:"${queryInformation.customerId}") {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
                    addressType
                    contactDetails{
                        firstName
                        lastName
                        email
                    address {
                        city
                        country
                        line1
                        line2
                        postalCode
                        region
                    }
                    phone{
                        phoneType
                        countryCode
                        phoneNumber
                    }
                }
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
                if (res.body.data[queryName].nodes.length > 0) {
                    const nodesPath = res.body.data[queryName].nodes;
                    nodesPath.forEach((item) => {
                        // has addressType and contactDetails
                        expect(item).to.have.property('addressType');
                        if (item.addressType !== null) {
                            expect(item.addressType).to.be.a('string');
                        }

                        expect(item).to.have.property('contactDetails');
                        if (item.contactDetails !== null) {
                            expect(item.contactDetails).to.have.property('firstName');
                            if (item.contactDetails.firstName !== null) {
                                expect(item.contactDetails.firstName).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('lastName');
                            if (item.contactDetails.lastName !== null) {
                                expect(item.contactDetails.lastName).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('email');
                            if (item.contactDetails.email !== null) {
                                expect(item.contactDetails.email).to.be.a('string');
                            }
                            expect(item.contactDetails).to.have.property('address');
                            if (item.contactDetails.address !== null) {
                                expect(item.contactDetails.address).to.have.property('city');
                                if (item.contactDetails.address.city !== null) {
                                    expect(item.contactDetails.address.city).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('country');
                                if (item.contactDetails.address.country !== null) {
                                    expect(item.contactDetails.address.country).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('line1');
                                if (item.contactDetails.address.line1 !== null) {
                                    expect(item.contactDetails.address.line1).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('line2');
                                if (item.contactDetails.address.line2 !== null) {
                                    expect(item.contactDetails.address.line2).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('postalCode');
                                if (item.contactDetails.address.postalCode !== null) {
                                    expect(item.contactDetails.address.postalCode).to.be.a('string');
                                }
                                expect(item.contactDetails.address).to.have.property('region');
                                if (item.contactDetails.address.region !== null) {
                                    expect(item.contactDetails.address.region).to.be.a('string');
                                }
                            }
                            if (item.contactDetails.phone !== null) {
                                item.contactDetails.phone.forEach((item1) => {
                                    expect(item1).to.have.property('phoneType');
                                    if (item1.phoneType !== null) {
                                        expect(item1.phoneType).to.be.a('string');
                                    }
                                    expect(item1).to.have.property('phoneNumber');
                                    if (item1.phoneNumber !== null) {
                                        expect(item1.phoneNumber).to.be.a('string');
                                    }
                                    expect(item1).to.have.property('countryCode');
                                    if (item1.countryCode !== null) {
                                        expect(item1.countryCode).to.be.a('string');
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
    });

    context("Testing company/customer with no associated addresses", () => {
        it('Query address with Company Id with no associated Items , returns empty nodes', () => {
            var extraItemPath1 = "company";
            var extraItemCreate1 = "createCompany"
            const extraItemCreateInput1 = `{name:"Cypress Address New Company" integrationKey: "${Math.random().toString(36).slice(2)}"}`
            cy.createAndGetId(extraItemCreate1, extraItemPath1, extraItemCreateInput1).then((id) => {
                const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId: "${id}" ) {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(gqlQuery, queryName).then((res) => {
                    expect(res.body.data[queryName].totalCount).to.be.eql(0, "Expect no Items to be associated");
                });
            });
        });

        it('Query address with Customer Id with no associated Items, returns empty nodes', () => {
            var extraItemPath2 = "customer";
            var extraItemCreate2 = "createCustomer"
            const extraItemCreateInput2 = `{firstName:"Cypress Address New Customer" lastName:"Test" email: "Cypress${Math.random().toString(36).slice(2)}Test@email.com"}`
            cy.createAndGetId(extraItemCreate2, extraItemPath2, extraItemCreateInput2).then((id) => {
                const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId: "${id}" ) {
                    ${standardQueryBody}
                }
            }`;
                cy.postAndValidate(gqlQuery, queryName).then((res) => {
                    expect(res.body.data[queryName].totalCount).to.be.eql(0, "Expect no Items to be associated");
                });
            });
        });
    });

    context("Testing 'Deleted Ids' input", () => {
        it('Query will fail with deleted Company Id ', () => {
            const extraItemPath1 = "company";
            const extraItemCreate1 = "createCompany"
            const extraItemCreateInput1 = `{name:"Cypress Address New Company" integrationKey: "${Math.random().toString(36).slice(2)}"}`
            cy.createAndGetId(extraItemCreate1, extraItemPath1, extraItemCreateInput1).then((id) => {
                const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} companyId: "${id}" ) {
                    ${standardQueryBody}
                }
            }`;
                cy.deleteItem(deleteMutName1, id)
                cy.postAndConfirmError(gqlQuery, true).then((res) => {
                    expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
                });
            });
        });

        it('Query  will fail with deleted Customer Id', () => {
            const extraItemPath2 = "customer";
            const extraItemCreate2 = "createCustomer"
            const extraItemCreateInput2 = `{firstName:"Cypress Address New Customer" lastName:"Test" email: "Cypress${Math.random().toString(36).slice(2)}Test@email.com"}`

            cy.createAndGetId(extraItemCreate2, extraItemPath2, extraItemCreateInput2).then((id) => {
                const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME} customerId: "${id}" ) {
                    ${standardQueryBody}
                }
            }`;
                cy.deleteItem(deleteMutName2, id)
                cy.postAndConfirmError(gqlQuery, true).then((res) => {
                    expect(res.body.errors[0].message[0].message).to.have.string('Invalid Aptean Id');
                    expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR")
                });
            });
        });
    });

});