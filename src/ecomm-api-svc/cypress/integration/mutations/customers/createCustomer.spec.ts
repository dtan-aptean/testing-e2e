/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";

describe('Mutation: createCustomer', () => {
    let email = '';
    let vendorId = '';
    let companyId = '';
    let goldId = '';
    let adminId = '';
    const mutationName = 'createCustomer';
    const deleteMutName = "deleteCustomer";
    const queryName = "customers";
    const itemPath = 'customer';
    const standardMutationContent = `
        code
        message
        errors {
            code
            message
            domain
            details {
                code
                message
                target
            }
        }
    `;
    const requiredItems = `
        id
        email
        firstName
        lastName
    `;

    afterEach(() => {
        let query = `{
            ${queryName}(searchString: "${email}", orderBy: {direction: ASC, field: NAME }) {
                nodes {
                    id
                    email
                }
                totalCount
            }
        }`;
        if (email !== '') {
            cy.postAndValidate(query, 'customers').then((res) => {
                let id = res.body.data[queryName].nodes[0].id;
                const deleteName = 'deleteCustomer';
                const mutation = `mutation {
                        ${deleteName}(input: { id: "${id}" }) {
                            ${standardMutationContent}
                        }
                    }`;
                cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
                    email = '';
                });
            });
        };
    });

    context("Testing customer required inputs", () => {
        it("Mutation will succeed with 'email', 'firstName', and 'lastName' strings", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will if 'email' is not included", () => {
            const input = {
                email: null,
                firstName: 'Testy',
                lastName: 'McTest',
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'email' is not a string", () => {
            const input = {
                email: 4,
                firstName: 'Testy',
                lastName: 'McTest',
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'firstName' is not included", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: null,
                lastName: 'McTest',
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'firstName' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 4,
                lastName: 'McTest',
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail without 'lastName'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: null,
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'lastName' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 4,
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing customer optional generic inputs (i.e. simple, non-specific data)", () => {
        it.only("Mutation will succeed if 'customData' is an object", () => {
            const customData = {
                first: 1,
                second: 'string'
            };
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customData: customData
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it.only("Mutation will fail if 'customData' is not an object", () => {
            const customData = [1, 'string'];
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customData: customData
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customData
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'isActive' is a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                isActive: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        isActive
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'isActive' is a non-boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                isActive: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        isActive
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'gender' is a valid enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        gender: UNKNOWN
                    }
                    
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        gender
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'gender' it not an enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                gender: 'UNKNOWN'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        gender
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'gender' is an invalid enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        gender: WAAAGH
                    }
                    
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        gender
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'dateOfBirth' has a toISOstring", () => {
            const date = new Date();
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                dateOfBirth: date.toISOString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'dateOfBirth' has a toDatestring", () => {
            const date = new Date();
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                dateOfBirth: date.toDateString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'dateOfBirth' has non-date format", () => {
            const date = 4;
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                dateOfBirth: date
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'isTaxExempt' is a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                isTaxExempt: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        isTaxExempt
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'isTaxExempt' is not a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                isTaxExempt: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        isTaxExempt
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'newsletter' is a number", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                newsletter: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        newsletter
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'newsletter' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                newsletter: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        newsletter
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'adminComment' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                adminComment: "Waaagh"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        adminComment
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'adminComment' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                adminComment: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        adminComment
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'vendorId' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                vendorId: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        vendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'vendorId' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                vendorId: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        vendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'affiliateId' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                affiliateId: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        affiliateId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'affiliateId' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                affiliateId: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        affiliateId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'cannotLoginUntilDate' has a toISOstring", () => {
            const date = new Date();
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                cannotLoginUntilDate: date.toISOString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'cannotLoginUntilDate' has a toDatestring", () => {
            const date = new Date();
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                cannotLoginUntilDate: date.toDateString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'cannotLoginUntilDate' has non-date format", () => {
            const date = 4;
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                cannotLoginUntilDate: date
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'requireReLogin' is a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                requireReLogin: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        requireReLogin
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'requireReLogin' is not a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                requireReLogin: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        requireReLogin
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'emailCustomer' is a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                emailCustomer: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        emailCustomer
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'emailCustomer' is not a boolean", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                emailCustomer: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        emailCustomer
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing customer optional input 'managerOfVendorId', which requires content-specific data)", () => {
        before(() => {
            const input = [{ name: "Customer Tests Vendor", description: `Waaagh`, languageCode: "Standard" }];
            const mutationName = 'createVendor';
            const itemPath = 'vendor';
            const info = "vendorInfo";
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${info}: ${toFormattedString(input)}
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        ${info} {
                            name
                            description
                            languageCode
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                vendorId = res.body.data[mutationName][itemPath].id;
            });
        });

        after(() => {
            const mutationName = "deleteVendor";
            const mutation = `mutation {
                    ${mutationName}(input: { id: "${vendorId}" }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                vendorId = '';
            });
        });

        it("Mutation will succeed if 'managerOfVendorId' has a valid vendordId input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                managerOfVendorId: vendorId
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        managerOfVendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'managerOfVendorId' has an invalid vendorId input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                managerOfVendorId: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        managerOfVendorId
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    // BUG: When trying to create a customer with a companyId, it throws an error and asks if you meant 'company' instead. If switched to 'company,
    //      it still throws an error, now asking if you meant 'companyId' instead.
    // context("Testing customer optional input 'companyId', which requires content-specific data)", () => {
    //     before(() => {
    //         const input = {
    //             name: "Customer Tests Company",
    //             integrationKey: 'testkey' + Math.floor(100000 + Math.random() * 900000)
    //         };
    //         const mutationName = 'createCompany';
    //         const itemPath = 'company';
    //         const mutation = `mutation {
    //             ${mutationName}(
    //                 input:  ${toFormattedString(input)}
    //             ) {
    //                 ${standardMutationContent}
    //                 ${itemPath} {
    //                     id
    //                     name
    //                     integrationKey
    //                 }
    //             }
    //         }`;
    //         cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
    //             companyId = res.body.data[mutationName][itemPath].id;
    //         });
    //     });

    //     after(() => {
    //         const mutationName = "deleteCompany";
    //         const mutation = `mutation {
    //                 ${mutationName}(input: { id: "${vendorId}" }) {
    //                     ${standardMutationContent}
    //                 }
    //             }`;
    //         cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
    //             companyId = '';
    //         });
    //     });

    //     it("Mutation will succeed if 'companyId' has a valid companyId input", () => {
    //         const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
    //         const input = {
    //             email: testEmail,
    //             firstName: 'Testy',
    //             lastName: 'McTest',
    //             companyId: companyId
    //         };
    //         const mutation = `mutation {
    //             ${mutationName}(
    //                 input: ${toFormattedString(input)}
    //             ) {
    //                 ${standardMutationContent}
    //                 ${itemPath} {
    //                     ${requiredItems}
    //                     companyId
    //                 }
    //             }
    //         }`;
    //         cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
    //             email = res.body.data[mutationName][itemPath].email;
    //         });
    //     });

    //     it("Mutation will fail if 'companyId' has an invalid companyId input", () => {
    //         const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
    //         const input = {
    //             email: testEmail,
    //             firstName: 'Testy',
    //             lastName: 'McTest',
    //             companyId: 'Waaagh'
    //         };
    //         const mutation = `mutation {
    //             ${mutationName}(
    //                 input: ${toFormattedString(input)}
    //             ) {
    //                 ${standardMutationContent}
    //                 ${itemPath} {
    //                     ${requiredItems}
    //                     companyId
    //                 }
    //             }
    //         }`;
    //         cy.postAndConfirmMutationError(mutation, mutationName);
    //     });
    // });

    context("Testing customer optional input 'customerRoleIds', which requires content-specific data)", () => {
        before(() => {
            const queryName = 'customerRoles';
            const goldQuery = `{
                ${queryName}(searchString: "Gold", orderBy: {direction: ASC, field: NAME }) {
                    nodes {
                        id
                        name
                    }
                    totalCount
                }
            }`;
            cy.postAndValidate(goldQuery, queryName).then((res) => {
                goldId = res.body.data[queryName].nodes[0].id;
                const adminQuery = `{
                    ${queryName}(searchString: "Administrators", orderBy: {direction: ASC, field: NAME }) {
                        nodes {
                            id
                            name
                        }
                        totalCount
                    }
                }`;
                cy.postAndValidate(adminQuery, queryName).then((res) => {
                    adminId = res.body.data[queryName].nodes[0].id;
                });
            });
        })

        it("Mutation will succeed if 'customerRoleIds' has a valid input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customerRoleIds: [goldId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customerRoleIds
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will succeed if 'customerRoleIds' has multiple valid inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customerRoleIds: [goldId, adminId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customerRoleIds
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'customerRoleIds' contains an invalid value", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customerRoleIds: ["Waaagh"]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customerRoleIds
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will fail if 'customerRoleIds' contains a mix of valid and invalid inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                customerRoleIds: [4, goldId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        customerRoleIds
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    context("Testing customer optional input 'billingAddress', which requires complex data)", () => {
        it("Mutation will succeed if 'billingAddress's 'firstName' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    firstName: 'Testy'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'firstName' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    firstName: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'lastName' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    lastName: 'McTest'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            lastName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'lastName' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    lastName: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            lastName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'email' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    email: 'Waaagh'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            email
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'email' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    email: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            email
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'phone' has valid required 'phoneNumber' and 'phoneType' inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneNumber' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: 4,
                                phoneType: WORK
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' is not a enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: 'WORK'
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' has non-valid enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WAAAGH
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'phone' has valid 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: ZA
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'phone' is not a enum 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: 'ZA'
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'phone' is not a valid, enum 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        billingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: WAAAGH
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'address' has all required inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'country' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 4,
                        postalCode: 'Cadia',
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'address's 'country' has an invalid input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'Terra',
                        postalCode: 'Cadia',
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will fail if 'billingAddress's 'address's 'postalCode' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 4,
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'address's 'region' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'billingAddress's 'address's 'region' has an invalid input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Terra'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will succeed if 'billingAddress's 'address's 'city' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        city: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                city
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'city' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        city: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                city
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'address's 'line1' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line1: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                line1
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'line1' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line1: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                line1
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'address's 'line2' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line2: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                line2
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'line2' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line2: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        billingAddress {
                            address {
                                country
                                postalCode
                                region
                                line2
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing customer optional input 'shippingAddress', which requires complex data)", () => {
        it("Mutation will succeed if 'shippingAddress' is a string 'firstName' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    firstName: 'Testy'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress' is not a string 'firstName' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    firstName: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress' is a string 'lastName' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    lastName: 'McTest'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            lastName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress' is not a string 'lastName' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    lastName: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            lastName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress' is a string 'email' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    email: 'McTest'
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            email
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress' is not a string 'email' input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    email: 4
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            email
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'phone' has valid, required 'phoneNumber' and 'phoneType' inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneNumber' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: 4,
                                phoneType: WORK
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneType' is not a enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: 'WORK'
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneType' is not a valid enum", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WAAAGH
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'phone' has valid 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: ZA
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'phone' is not a enum 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: 'ZA'
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'shippingAddress's 'phone' is not a valid enum 'countryCode'", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        shippingAddress: {
                            phone: {
                                phoneNumber: "Waaagh",
                                phoneType: WORK,
                                countryCode: WAAAGH
                            }
                        }
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            phone {
                                phoneNumber
                                phoneType
                                countryCode
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'address' has all required inputs", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'country' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 4,
                        postalCode: 'Cadia',
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'postalCode' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 4,
                        region: 'Georgia'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'region' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'address's 'city' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        city: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                city
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'city' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        city: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                city
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'address's 'line1' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line1: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                line1
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'line1' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line1: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                line1
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'address's 'line2' is a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line2: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                line2
                            }
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                email = res.body.data[mutationName][itemPath].email;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'line2' is not a string", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Georgia',
                        line2: 4
                    }
                }
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        ${requiredItems}
                        shippingAddress {
                            address {
                                country
                                postalCode
                                region
                                line2
                            }
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });
});