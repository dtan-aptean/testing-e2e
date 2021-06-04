/// <reference types="cypress" />

import { confirmStorefrontEnvValues, createInfoDummy, SupplementalItemRecord, toFormattedString } from "../../../support/commands";

// TEST COUNT: 17
describe('Mutation: createCustomer', () => {
    let email = '';
    let vendorId = '';
    let companyId = '';
    const originalBaseUrl = Cypress.config("baseUrl");
    const mutationName = 'createCustomer';
    const deleteMutName = "deleteCustomer";
    const queryName = "customers";
    const itemPath = 'customer';
    const infoName = "customerInfo";
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
        it("Mutation will succeed with a minimum of 'email', 'firstName', and 'lastName' inputs", () => {
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

        it("Mutation will fail without 'email'", () => {
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

        it("Mutation will fail without 'firstName'", () => {
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
        it("Mutation will succeed if 'isActive' has a boolean input", () => {
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

        it("Mutation will fail if 'isActive' has a non-boolean input", () => {
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

        it("Mutation will succeed if 'gender' has one of the given enum inputs", () => {
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

        it("Mutation will fail if 'gender' has a non-given enum input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        email: "${testEmail}",
                        firstName: "Testy",
                        lastName: "McTest",
                        gender: BAKLAVA
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

        it("Mutation will fail if 'gender' has a non-enum input", () => {
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
                        isActive
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'dateOfBirth' has a toISOString input", () => {
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

        it("Mutation will also succeed if 'dateOfBirth' has a toDateString input", () => {
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

        it("Mutation will succeed if 'isTaxExempt' has a boolean input", () => {
            const date = new Date();
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

        it("Mutation will fail if 'isTaxExempt' has a non-boolean input", () => {
            const date = new Date();
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

        it("Mutation will succeed if 'newsletter' has any number input", () => {
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

        it("Mutation will succeed if 'newsletter' has a string input", () => {
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                newsletter: '4'
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

        it("Mutation will fail if 'adminComment' has a non-string input", () => {
            const date = new Date();
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

        it("Mutation will succeed if 'adminComment' has a string input", () => {
            const date = new Date();
            const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                email: testEmail,
                firstName: 'Testy',
                lastName: 'McTest',
                adminComment: "I'm gonna need two bolters for this heresy."
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

        it("Mutation will succeed if 'cannotLoginUntilDate' has a toISOString input", () => {
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

        it("Mutation will also succeed if 'cannotLoginUntilDate' has a toDateString input", () => {
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

        it("Mutation will succeed if 'requireReLogin' has a boolean input", () => {
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

        it("Mutation will fail if 'requireReLogin' has a non-boolean input", () => {
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

        it("Mutation will succeed if 'emailCustomer' has a boolean input", () => {
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

        it("Mutation will fail if 'emailCustomer' has a non-boolean input", () => {
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
                managerOfVendorId: 'Trazyn the Infinite'
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
    // context.only("Testing customer optional input 'companyId', which requires content-specific data)", () => {
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
    //         debugger;
    //         const mutationName = "deleteCompany";
    //         const mutation = `mutation {
    //                 ${mutationName}(input: { id: "${vendorId}" }) {
    //                     ${standardMutationContent}
    //                 }
    //             }`;
    //         cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
    //             debugger;
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
    //             companyId: 'Trazyn the Infinite'
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
});