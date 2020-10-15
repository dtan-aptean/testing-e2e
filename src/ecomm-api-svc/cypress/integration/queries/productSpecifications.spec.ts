/// <reference types="cypress" />
// TEST COUNT: 10
describe('Query: productSpecifications', () => {
    it('A query with orderBy returns valid data types', () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            cy.validateQueryRes(gqlQuery, res, "productSpecifications");
        });
    });

    it("Query will fail without orderBy input", () => {
        const gqlQuery = `{
            productSpecifications {
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
            productSpecifications(orderBy: null) {
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has field', () => {
        const fieldQuery = `{
            productSpecifications(orderBy: {field: TIMESTAMP}) {
                totalCount
            }
        }`;
        cy.postGQL(fieldQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query fails if orderBy argument only has direction', () => {
        const directionQuery = `{
            productSpecifications(orderBy: {direction: ASC}) {
                totalCount
            }
        }`;
        cy.postGQL(directionQuery).then((res) => {
            cy.confirmError(res);
        });
    });

    it('Query will fail if no return type is provided', () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
            }
        }`;
        cy.postGQL(gqlQuery).then(res => {
            cy.confirmError(res);
        });
    });

    it('Query will succeed with orderBy input and one return type', () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            assert.isNotNaN(res.body.data.productSpecifications.totalCount);
        });
    });

    it("Query without first or last will return all items", () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
                nodes {
                    id
                }
                totalCount
            }
        }`;
        cy.postGQL(gqlQuery).then((res) => {
            cy.confirmCount(res, "productSpecifications");
        });
    });

    it("Requesting the options field returns an array with valid values", () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
                edges {
                    cursor
                    node {
                        id
                    }
                }
                nodes {
                    options {
                        displayOrder
                        name
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
            cy.validateQueryRes(gqlQuery, res, "productSpecifications").then(() => {
                if (res.body.data.productSpecifications.nodes.length > 0) {
                    const nodesPath = res.body.data.productSpecifications.nodes;
                    nodesPath.forEach((item) => {
                        // has options field
                        expect(item).to.have.property('options');
                        assert.exists(item.options);
                        // validate options as an array
                        assert.isArray(item.options);
                        expect(item.options.length).to.be.gte(1);
                        item.options.forEach((opt) => {
                            expect(opt).to.have.property('displayOrder');
                            if (opt.displayOrder !== null) {
                                expect(opt.displayOrder).to.be.a('number');
                            }
                            expect(opt).to.have.property('name');
                            if (opt.name !== null) {
                                expect(opt.name).to.be.a('string');
                            }
                        });
                    });    
                }
            });
        });
    });

    it("Query with customData field will return valid value", () => {
        const gqlQuery = `{
            productSpecifications(orderBy: {direction: ASC, field: TIMESTAMP}) {
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
            cy.validateQueryRes(gqlQuery, res, "productSpecifications").then(() => {
                cy.checkCustomData(res, "productSpecifications");
            });
        });
    });
});