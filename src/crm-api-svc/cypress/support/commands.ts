// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import { codeMessageError } from "./mutationTests";

// -- This will post GQL query --
Cypress.Commands.add("postGQL", (query) => {
  return cy.request({
    method: "POST",
    url: "/graphql",
    headers: {
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-tenant-secret": Cypress.env("x-aptean-tenant-secret"),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

// Flat delete the the item, without querying for it afterwards
Cypress.Commands.add(
  "deleteItem",
  (mutationName: string, integrationKey: string, altUrl?: string) => {
    Cypress.log({
      name: "deleteItem",
      message: `delete ${mutationName.replace(
        "delete",
        ""
      )} with integration key "${integrationKey}"`,
      consoleProps: () => {
        return {
          "Delete Mutation": mutationName,
          "Item's integration key": integrationKey,
        };
      },
    });

    var mutation = `mutation {
      ${mutationName}(input: { integrationKey: "${integrationKey}" }) {
          ${codeMessageError}
      }
  }`;

    return cy.postGQL(mutation, mutationName, "deleteMutation", altUrl);
  }
);

// Tests the response for errors. Can be used for queries and mutations. Use when we expect it to fail. Add expect200 when we expect to get a 200 status code
Cypress.Commands.add("confirmError", (res, expect200?: boolean) => {
  Cypress.log({
    name: "confirmError",
    message: `Confirm expected errors.${
      expect200 ? " Expecting 200 status code" : ""
    }`,
    consoleProps: () => {
      return {
        Response: res,
        "Expected a 200 status code": !!expect200,
      };
    },
  });

  if (expect200) {
    // Should be 200 ok
    expect(res.isOkStatusCode).to.be.equal(true, "Status code should be 200");
  } else {
    // should not be 200 ok
    expect(res.isOkStatusCode).to.be.equal(
      false,
      "Status code should not be 200"
    );
    // Usually expecting a 400 error
    expect(res.status).to.be.equal(400, "Status code should be 400");
    // should have errors
    assert.exists(res.body.errors, "Errors should be present");
    // no data
    assert.notExists(res.body.data, "Response data should not exist");
  }
});
