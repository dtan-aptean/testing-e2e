/// <reference types="cypress" />

import { codeMessageError } from "../../../support/mutationTests";

describe("Mutation: createCompany", () => {
  const upsertMutationName = "upsertCompany";
  const deleteMutationName = "deleteCompany";
  const entityName = "company";

  let companyIntegrationKey = "";

  it("should successfully create a company with company name1", () => {
    companyIntegrationKey = "cypressTest1";
    const expect200 = true;

    const mutationBody = `
    ${codeMessageError}
    ${entityName} {
        id
        name1
        integrationKey
    }
    `;

    const mutation = `mutation {
      ${upsertMutationName} (input: {
        integrationKey: ${companyIntegrationKey}
        name1: "Cypress Test Company"
      }, isImport: false){
        ${mutationBody}
      }
    }
    `;

    cy.postGQL(mutation).then(res=>{
        Cypress.log({message: `Duration: ${res.duration}ms (${res.duration / 1000}s)`});
        cy.confirmError(res, expect200).then(() => {
            return res;
        });
    })
  });

  after(() => {
    if(companyIntegrationKey) {
      cy.deleteItem(deleteMutationName, companyIntegrationKey).then(()=>{
        companyIntegrationKey = '';
      })
    }
  })
});
