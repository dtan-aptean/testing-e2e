/**
 * COMMANDS FOR QUERY TESTS
 */

import { toFormattedString } from "./commands";

export const defaultField = (queryName: string) => {
    var field = "NAME";
    switch(queryName) {
        case ("orders" || "refunds"):
            field = "TIMESTAMP"
            break;
        case "paymentSettings":
            field = "COMPANY_NAME";
            break;
    };
    return field;
};

Cypress.Commands.add("queryNoReturnType", (queryName: string) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            
        }
    }`;
    cy.postAndConfirmError(gqlQuery);
});

Cypress.Commands.add("queryNoOrderBy", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName} {
            ${standardQueryBody}
        }
    }`;
    cy.postGQL(gqlQuery).then((res) => {
        cy.confirmOrderByError(res);
    });
});

Cypress.Commands.add("queryNullOrderBy", (queryName: string) => {
    const gqlQuery = `{
        ${queryName}(orderBy: null) {
            totalCount
        }
    }`;
    cy.postAndConfirmError(gqlQuery);
});

Cypress.Commands.add("queryFieldOrderBy", (queryName: string) => {
    const fieldQuery = `{
        ${queryName}(orderBy: {field: ${defaultField(queryName)}}) {
            totalCount
        }
    }`;
    cy.postAndConfirmError(fieldQuery);
});

Cypress.Commands.add("queryDirectionOrderBy", (queryName: string) => {
    const directionQuery = `{
        ${queryName}(orderBy: {direction: ASC}) {
            totalCount
        }
    }`;
    cy.postAndConfirmError(directionQuery);
});

Cypress.Commands.add("queryOneReturn", (queryName: string) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            totalCount
        }
    }`;
    cy.postAndValidate(gqlQuery, queryName);
});

Cypress.Commands.add("queryReverseOrder", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndValidate(trueTotalQuery, queryName).then((ascRes) => {
        const descQuery = `{
            ${queryName}(${trueTotalInput}orderBy: {direction: DESC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndValidate(descQuery, queryName).then((descRes) => {
            cy.verifyReverseOrder(queryName, ascRes, descRes);
        });
    });
});

Cypress.Commands.add("queryUpTo25", (queryName: string, standardQuery: string) => {
    cy.postAndValidate(standardQuery, queryName).then((res) => {
        cy.confirmCount(res, queryName).then((hitUpperLimit: boolean) => {
            cy.verifyPageInfo(res, queryName, hitUpperLimit, false);
        });
    });
});

Cypress.Commands.add("queryInvalidSearch", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(searchString: 7, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryFirst", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const first = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(first: ${first}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const last = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(last: ${last}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryInvalidFirst", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(first: "4", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryInvalidLast", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(last: "5", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "5"');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryFirstLast", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(first: 7, last: 3, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery, true);
});

Cypress.Commands.add("queryBefore", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
        const beforeQuery = `{
            ${queryName}(before: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryAfter", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
        const afterQuery = `{
            ${queryName}(after: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryInvalidBefore", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(before: 123, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryInvalidAfter", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(after: true, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: true');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryBeforeAfter", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(before: "MTow2R1Y3Q=", after: "MTowfjI6fjRCAz", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery, true).then((res) => {
        expect(res.body.errors[0].message[0].message).to.include("Both After and Before cursors cannot be provided in the same request");
    });
});

Cypress.Commands.add("queryBeforeFirst", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
        cy.get('@cursorIndex').then((index: number) => {
            const first = index > 1 ? Math.floor(index / 2) : 1;
            Cypress.log({message: `first: ${first}`});
            const beforeQuery = `{
                ${queryName}(first: ${first}, before: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryAfterFirst", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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
                    ${queryName}(first: ${first}, after: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryBeforeLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
        cy.get('@cursorIndex').then((index: number) => {
            const last = index > 1 ? Math.floor(index / 2) : 1;
            Cypress.log({message: `last: ${last}`});
            const beforeQuery = `{
                ${queryName}(last: ${last}, before: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryAfterLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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
                    ${queryName}(last: ${last}, after: "${cursor}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryInvalidBeforeFirst", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const first = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(before: 123, first: ${first}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryBeforeInvalidFirst", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnRandomCursor(standardQuery, queryName, true).then((cursor: string) => {
        const gqlQuery = `{
            ${queryName}(before: "${cursor}", first: "4", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryInvalidAfterFirst", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnCount(standardQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const first = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(after: 123, first: ${first}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryAfterInvalidFirst", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
        const gqlQuery = `{
            ${queryName}(after: "${cursor}", first: "4", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryInvalidBeforeLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const last = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(before: 123, last: ${last}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryBeforeInvalidLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomCursor(trueTotalQuery, queryName, true).then((cursor: string) => {
        const gqlQuery = `{
            ${queryName}(before: "${cursor}", last: "4", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryInvalidAfterLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnCount(trueTotalQuery, queryName).then((totalCount: number) => {
        // If there's only one item, we can't do any pagination
        expect(totalCount).to.be.gte(2, "Need >=2 items to test with");
        // Get half the items, rounding down
        const last = Math.floor(totalCount / 2);
        const gqlQuery = `{
            ${queryName}(after: 123, last: ${last}, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 123');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryAfterInvalidLast", (queryName: string, standardQueryBody: string, trueTotalInput: string) => {
    const trueTotalQuery = `{
        ${queryName}(${trueTotalInput}orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomCursor(trueTotalQuery, queryName, false).then((cursor: string) => {
        const gqlQuery = `{
            ${queryName}(after: "${cursor}", last: "4", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery).then((res) => {
            expect(res.body.errors[0].message).to.have.string('Int cannot represent non-integer value: "4"');
            expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
        });
    });
});

Cypress.Commands.add("queryValidSearchString", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnRandomName(standardQuery, queryName).then((name: string) => {
        const searchQuery = `{
            ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndValidate(searchQuery, queryName).then((resp) => {
            cy.validateNameSearch(resp, queryName, name);
        });
    });
});

Cypress.Commands.add("queryPartialSearchString", (queryName: string, standardQuery: string, standardQueryBody: string) => {
    cy.returnRandomName(standardQuery, queryName).then((name: string) => {
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
            ${queryName}(searchString: "${searchText}", orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndValidate(searchQuery, queryName).then((resp) => {
            cy.validateNameSearch(resp, queryName, searchText);
        });
    });
});

Cypress.Commands.add("queryInvalidSearchString", (queryName: string, standardQueryBody: string) => {
    const gqlQuery = `{
        ${queryName}(searchString: 7, orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string('String cannot represent a non string value: 7');
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryAndValidateMultipleIds", (count, queryName, standardQueryBody) => {
    const extraGqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnMultipleIds(count, extraGqlQuery, queryName).then((IDs: string[]) => {
        cy.get('@totCount').then((totalCount: number) => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
                    ids: ${toFormattedString(IDs)}
                    ) {
                    ${standardQueryBody}
                }
            }`;
            cy.postAndValidate(gqlQuery, queryName).then((res) => {
                for(let i = 0; i < totalCount; i++){
                    expect(IDs).contains(res.body.data[queryName].edges[i].node.id);
                    expect(IDs).contains(res.body.data[queryName].nodes[i].id);
                }
            });
        });
    });
});

Cypress.Commands.add("queryAndValidateRandomId", (queryName, standardQueryBody) => {
    const extraGqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomId(extraGqlQuery, queryName).then((curId: string) => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
                ids: "${curId}"
                ) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndValidate(gqlQuery, queryName).then((res) => {
            expect(res.body.data[queryName].edges[0].node.id).to.be.eql(curId);
            expect(res.body.data[queryName].nodes[0].id).to.be.eql(curId);
        });
    });
});

Cypress.Commands.add("queryAndValidateEmptyArray", (queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(ids: [], orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndValidate(gqlQuery, queryName);
});

Cypress.Commands.add("queryAndValidateEmptyStrings", (ids, queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
            ids: ${toFormattedString(ids)}
            ) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery, true).then((res) => {
        expect(res.body.errors[0].message[0].details[0].code).to.have.string("Invalid Argument");
        expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
    });
});

Cypress.Commands.add("queryAndValidateNonStringValues", (ids, queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
            ids: [
                ${ids}
            ]
            ) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value: "+ ids[0]);
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryAndValidateNonArrayValues", (ids, queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
            ids: ${ids}
            ) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndConfirmError(gqlQuery).then((res) => {
        expect(res.body.errors[0].message).to.have.string("String cannot represent a non string value");
        expect(res.body.errors[0].extensions.code).to.be.eql("GRAPHQL_VALIDATION_FAILED");
    });
});

Cypress.Commands.add("queryAndValidateDifferentItemIds", (extraQueryName, extraQuery, queryName, standardQueryBody) => {
    cy.returnRandomId(extraQuery, extraQueryName).then((curId: string) => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}
                ids: "${curId}"
                ) {
                ${standardQueryBody}
            }
        }`;
        cy.postAndConfirmError(gqlQuery, true).then((res) => {
            expect(res.body.errors[0].message[0].details[0].code).to.have.string("Invalid Argument");
            expect(res.body.errors[0].message[0].message).to.have.string("Invalid Aptean Id");
            expect(res.body.errors[0].extensions.code).to.be.eql("INTERNAL_SERVER_ERROR");
        });
    });
});

Cypress.Commands.add("queryForCustomData", (queryName: string) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
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

Cypress.Commands.add("queryForAddress", (queryName: string) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: ${defaultField(queryName)}}) {
            nodes {
                address {
                    city
                    country
                    line1
                    line2
                    postalCode
                    region
                }
            }
            totalCount
        }
    }`;
    cy.postAndValidate(gqlQuery, queryName).then((res) => {
        if (res.body.data[queryName].nodes.length > 0) {
            const nodesPath = res.body.data[queryName].nodes;
            nodesPath.forEach((item) => {
                // has address field
                expect(item).to.have.property('address');
                if (item.address !== null) {
                    expect(item.address).to.have.property('city');
                    if (item.address.city !== null) {
                        expect(item.address.city).to.be.a('string');
                    }
                    expect(item.address).to.have.property('country');
                    if (item.address.country !== null) {
                        expect(item.address.country).to.be.a('string');
                    }
                    expect(item.address).to.have.property('line1');
                    if (item.address.line1 !== null) {
                        expect(item.address.line1).to.be.a('string');
                    }
                    expect(item.address).to.have.property('line2');
                    if (item.address.line2 !== null) {
                        expect(item.address.line2).to.be.a('string');
                    }
                    expect(item.address).to.have.property('postalCode');
                    if (item.address.postalCode !== null) {
                        expect(item.address.postalCode).to.be.a('string');
                    }
                    expect(item.address).to.have.property('region');
                    if (item.address.region !== null) {
                        expect(item.address.region).to.be.a('string');
                    }
                }
            });
        }
    });
});