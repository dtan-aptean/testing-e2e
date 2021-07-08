/// <reference types="cypress" />

import { CommandType } from "../../support/commands";

// @ts-check

describe("Query: report", () => {
  it("should pass if the query has at least one return type", () => {
    const gqlQuery = `
    mutation {
        createReport(
          input: {
            startDate: "2021-06-22T00:00:00.000Z"
            endDate: "2021-06-22T00:00:00.000Z"
            reportType: PAYMENT
            format: CSV
          }
        ) {
          code
          error
          message
          report {
            id
            status
          }
        }
      }
      
    `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      // has data
      const reportId = res.body.data.createReport.report.id;
      assert.exists(reportId);

      const reportQuery = `
      query {
        report(id:"${reportId}"){
          downloadUrl
          status
        }
      }
      `;

      cy.while(
        reportQuery,
        CommandType.PostGQLBearer,
        (res) =>
          res.body.data.report.status === "COMPLETED" ||
          res.body.data.report.status === "FAILED",
        1000
      ).then((res) => {
        console.log(res);
        assert.exists(res.body.data);
        assert.notExists(res.body.errors);
        assert.isNotNull(res.body.data.report.downloadUrl);
        assert.isNotNull(res.body.data.report.status);
      });
    });
  });

  it("should fail if no return type is provided", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: {
                startDate: "2021-06-22T00:00:00.000Z"
                endDate: "2021-06-22T00:00:00.000Z"
                reportType: PAYMENT
                format: CSV
              }
            ) {
              code
              error
              message
              report {
                id
                status
              }
            }
          }
          
        `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      // has data
      const reportId = res.body.data.createReport.report.id;
      assert.exists(reportId);

      const reportQuery = `
          query {
            report(id:"${reportId}")
          }
          `;

      cy.postGQLBearer(reportQuery).then((res) => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(false);

        // should have errors
        assert.exists(res.body.errors);

        // no data
        assert.notExists(res.body.data);
      });
    });
  });

  it("should fail if argument null is provided", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: {
                startDate: "2021-06-22T00:00:00.000Z"
                endDate: "2021-06-22T00:00:00.000Z"
                reportType: PAYMENT
                format: CSV
              }
            ) {
              code
              error
              message
              report {
                id
                status
              }
            }
          }
          
        `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      // has data
      const reportId = res.body.data.createReport.report.id;
      assert.exists(reportId);

      const reportQuery = `
          query {
            report(null){
                downloadUrl
                status
              }
          }
          `;

      cy.postGQLBearer(reportQuery).then((res) => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(false);

        // should have errors
        assert.exists(res.body.errors);

        // no data
        assert.notExists(res.body.data);
      });
    });
  });

  it("should fail if argument is empty", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: {
                startDate: "2021-06-22T00:00:00.000Z"
                endDate: "2021-06-22T00:00:00.000Z"
                reportType: PAYMENT
                format: CSV
              }
            ) {
              code
              error
              message
              report {
                id
                status
              }
            }
          }
          
        `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      // has data
      const reportId = res.body.data.createReport.report.id;
      assert.exists(reportId);

      const reportQuery = `
          query {
            report {
                downloadUrl
                status
              }
          }
          `;

      cy.postGQLBearer(reportQuery).then((res) => {
        // should not be 200 ok
        cy.expect(res.isOkStatusCode).to.be.equal(false);

        // should have errors
        assert.exists(res.body.errors);

        // no data
        assert.notExists(res.body.data);
      });
    });
  });
});
