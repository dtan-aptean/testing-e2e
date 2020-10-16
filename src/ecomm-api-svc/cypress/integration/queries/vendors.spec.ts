/// <reference types="cypress" />
// TEST COUNT: 10
describe('Query: vendors', () => {
    it('A query with orderBy returns valid data types', () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
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
        cy.postGQL(gqlQuery).then(res => {
            cy.validateQueryRes(gqlQuery, res, "vendors");
        });
    });

    it("Query will fail without orderBy input", () => {
        const gqlQuery = `{
            vendors {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    id
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
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmOrderByError(res);
        });
    });
    
    it('Query fails if the orderBy argument is null', () => {
        const gqlQuery = `{
            vendors(orderBy: null) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has field', () => {
        const fieldQuery = `{
            vendors(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postGQL(fieldQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has direction', () => {
        const directionQuery = `{
            vendors(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postGQL(directionQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmError(res);
        });
    });

    it('Query will succeed with orderBy input and one return type', () => {
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

    it("Query without first or last will return all items", () => {
        const gqlQuery = `{
            vendors(orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmCount(res, "vendors");
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
        cy.postGQL(gqlQuery).then(res => {
            cy.validateQueryRes(gqlQuery, res, "vendors").then(() => {
                cy.checkCustomData(res, "vendors");
            });
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
        cy.postGQL(gqlQuery).then(res => {
            cy.validateQueryRes(gqlQuery, res, "vendors").then(() => {
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
});