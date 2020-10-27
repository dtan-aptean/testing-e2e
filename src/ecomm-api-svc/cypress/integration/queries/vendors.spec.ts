/// <reference types="cypress" />
// TEST COUNT: 10
describe('Query: vendors', () => {
    const standardQueryBody = `edges {
                cursor
                node {
                    id
                    name
                }
            }
            nodes {
                id
                name
            }
            pageInfo {
                endCursor
                hasNextPage
                hasPreviousPage
                startCursor
            }
            totalCount`;
    
    const standardQuery = `{
        vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
            ${standardQueryBody}
        }
    }`;

    it("Query with valid 'orderBy' input argument returns valid data types", () => {
        cy.postAndValidate(standardQuery, "vendors");
    });

    it("Query will fail without 'orderBy' input argument", () => {
        const gqlQuery = `{
            vendors {
                ${standardQueryBody}
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });
    
    it("Query fails if the 'orderBy' input argument is null", () => {
        const gqlQuery = `{
            vendors(orderBy: null) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query fails if 'orderBy' input argument only has field", () => {
        const fieldQuery = `{
            vendors(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(fieldQuery);
    });

    it("Query fails if 'orderBy' input argument only has direction", () => {
        const directionQuery = `{
            vendors(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postAndConfirmError(directionQuery);
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
            }
        }`;
        cy.postAndConfirmError(gqlQuery);
    });

    it("Query will succeed with a valid 'orderBy' input argument and one return type", () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.vendors.totalCount);
        });
    });

    it("Query without 'first' or 'last' input arguments will return all items", () => {
        cy.postAndValidate(standardQuery, "vendors").then((res) => {
            cy.confirmCount(res, "vendors");
            cy.verifyPageInfo(res, "vendors", false, false);
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
        cy.postAndValidate(gqlQuery, "vendors").then((res) => {
            cy.checkCustomData(res, "vendors");
        });
    });

    it('Query with address field will return valid data and correct fields', () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
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
                pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                }
                totalCount
            }
        }`;
        cy.postAndValidate(gqlQuery, "vendors").then((res) => {
            if (res.body.data.vendors.nodes.length > 0) {
                const nodesPath = res.body.data.vendors.nodes;
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
});