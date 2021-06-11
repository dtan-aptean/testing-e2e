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

Cypress.Commands.add("queryAndValidateMultipleIds", (count, queryName, standardQueryBody) => {
    const extraGqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnMultipleIds(count, extraGqlQuery, queryName).then((IDs: string[]) => {
        cy.get('@totCount').then((totalCount: number) => {
            const gqlQuery = `{
                ${queryName}(orderBy: {direction: ASC, field: NAME}
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
        ${queryName}(orderBy: {direction: ASC, field: NAME}) {
            ${standardQueryBody}
        }
    }`;
    cy.returnRandomId(extraGqlQuery, queryName).then((curId: string) => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME}
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

Cypress.Commands.add("queryAndValidateEmptyArray", (ids, queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: NAME}
            ids: []
            ) {
            ${standardQueryBody}
        }
    }`;
    cy.postAndValidate(gqlQuery, queryName);
});

Cypress.Commands.add("queryAndValidateEmptyStrings", (ids, queryName, standardQueryBody) => {
    const gqlQuery = `{
        ${queryName}(orderBy: {direction: ASC, field: NAME}
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
        ${queryName}(orderBy: {direction: ASC, field: NAME}
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
        ${queryName}(orderBy: {direction: ASC, field: NAME}
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

Cypress.Commands.add("queryAndValidateDifferentItemIds", (extraQueryName, extraStandardQueryBody, queryName, standardQueryBody) => {
    const extraGqlQuery = `{
        ${extraQueryName}(orderBy: {direction: ASC, field: NAME}) {
            ${extraStandardQueryBody}
        }
    }`;
    cy.returnRandomId(extraGqlQuery, extraQueryName).then((curId: string) => {
        const gqlQuery = `{
            ${queryName}(orderBy: {direction: ASC, field: NAME}
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

