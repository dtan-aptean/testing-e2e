/// <reference types="cypress" />

describe("Mutation: createReport", () => {
  it("should pass if the report is created", () => {
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
      assert.exists(res.body.data);

      // assertions
      assert.isNotNull(res.body.data.createReport);
      assert.isNotNull(res.body.data.createReport.code);
      assert.isNull(res.body.data.createReport.error);
      assert.equal(
        res.body.data.createReport.code,
        "SUCCESS",
        "Code is not SUCCESS"
      );
    });
  });

  it("should fail if the report is date diff is > 31", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: {
                startDate: "2021-05-01T00:00:00.000Z"
                endDate: "2021-06-20T00:00:00.000Z"
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
      assert.notExists(res.body.data);
      assert.exists(res.body.errors);
    });
  });

  it("should fail if the report startdate > enddate", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: {
                startDate: "2021-05-10T00:00:00.000Z"
                endDate: "2021-05-01T00:00:00.000Z"
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
      assert.notExists(res.body.data);
      assert.exists(res.body.errors);
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
            )
          }
          
        `;
    cy.postGQLBearer(gqlQuery).then((res) => {
      assert.notExists(res.body.data);
      assert.exists(res.body.errors);
    });
  });

  it("should fail if argument null is provided", () => {
    const gqlQuery = `
        mutation {
            createReport(
              input: null
            ){
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
      assert.notExists(res.body.data);
      assert.exists(res.body.errors);
    });
  });

  it("should fail if no argument is provided", () => {
    const gqlQuery = `
        mutation {
            createReport{
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
      assert.notExists(res.body.data);
      assert.exists(res.body.errors);
    });
  });
});
