import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 17
describe('Mutation: updateCustomer', () => {
    let customerId = '';
    let vendorId = '';
    let companyId = '';
    let goldId = '';
    let adminId = '';
    const mutationName = 'updateCustomer';
    const deleteMutName = "deleteCustomer";
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

    beforeEach(() => {
        const beforeMutation = 'createCustomer';
        const testEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
        const input = {
            email: testEmail,
            firstName: 'Testy',
            lastName: 'McTest',
        };
        const mutation = `mutation {
                ${beforeMutation}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        email
                        firstName
                        lastName
                    }
                }
            }`;
        cy.postMutAndValidate(mutation, beforeMutation, itemPath).then((res) => {
            customerId = res.body.data[beforeMutation][itemPath].id;
        });
    });

    afterEach(() => {
        const mutation = `mutation {
            ${deleteMutName}(input: { id: "${customerId}" }) {
                ${standardMutationContent}
            }   
        }`;
        cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
            customerId = '';
        });
    });

    context("Testing updates on customer required inputs", () => {
        it("Mutation will succeed if 'email' is a string", () => {
            const altEmail = 'testcustomer' + Math.floor(100000 + Math.random() * 900000) + '@test.com';
            const input = {
                id: customerId,
                email: altEmail
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        email
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'email' is not a string", () => {
            const altEmail = 4;
            const input = {
                id: customerId,
                email: altEmail
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        email
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'firstName' is a string", () => {
            const input = {
                id: customerId,
                firstName: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        firstName
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'firstName' is not a string", () => {
            const altEmail = 4;
            const input = {
                id: customerId,
                firstName: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        firstName
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'lastName' is a string", () => {
            const input = {
                id: customerId,
                lastName: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        lastName
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'lastName' is not a string", () => {
            const altEmail = 4;
            const input = {
                id: customerId,
                lastName: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        lastName
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing customer optional generic inputs (i.e. simple, non-specific data)", () => {
        it("Mutation will succeed if 'customData' is an object", () => {
            const customData = {
                first: 1,
                second: 'string'
            };
            const input = {
                id: customerId,
                customData: customData
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customData
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'customData' is not an object", () => {
            const input = [1, 'test'];
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customData
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'isActive' is a boolean", () => {
            const input = {
                id: customerId,
                isActive: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        isActive
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'isActive' is not a boolean", () => {
            const input = {
                id: customerId,
                isActive: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        isActive
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'gender' is a valid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${customerId}",
                        gender: UNKNOWN
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        gender
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'gender' is not an enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${customerId}",
                        gender: 'UNKNOWN'
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        gender
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'gender' is an invalid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${customerId}",
                        gender: WAAAGH
                    }
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        gender
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        // BUG SECTION
        it("Mutation will succeed if 'dateOfBirth' is a toISOstring", () => {
            const date = new Date();
            const input = {
                id: customerId,
                dateOfBirth: date.toISOString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'dateOfBirth' is a toDatestring", () => {
            const date = new Date();
            const input = {
                id: customerId,
                dateOfBirth: date.toDateString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'dateOfBirth' has non-date format", () => {
            const date = 4;
            const input = {
                id: customerId,
                dateOfBirth: date
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        dateOfBirth
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'isTaxExempt' is a boolean", () => {
            const input = {
                id: customerId,
                isTaxExempt: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        isTaxExempt
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'isTaxExempt' is not a boolean", () => {
            const input = {
                id: customerId,
                isTaxExempt: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        isTaxExempt
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'newsletter' is a number", () => {
            const input = {
                id: customerId,
                newsletter: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        isTaxExempt
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'newsletter' is a string", () => {
            const input = {
                id: customerId,
                newsletter: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        newsletter
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'adminComment' is a string", () => {
            const input = {
                id: customerId,
                adminComment: "I'm gonna need two bolters for this heresy."
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        adminComment
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'adminComment' is not a string", () => {
            const input = {
                id: customerId,
                adminComment: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        adminComment
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'vendorId' is a string", () => {
            const input = {
                id: customerId,
                vendorId: "Waaagh"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        vendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        // BUG SECTION
        it("Mutation will succeed if 'vendorId' is not a string", () => {
            const input = {
                id: customerId,
                vendorId: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        vendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'affiliateId' is a string", () => {
            const input = {
                id: customerId,
                affiliateId: "Waaagh"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        affiliateId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'affiliateId' is not a string", () => {
            const input = {
                id: customerId,
                affiliateId: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        affiliateId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        // BUG SECTION
        it("Mutation will succeed if 'cannotLoginUntilDate' is a toISOstring", () => {
            const date = new Date();
            const input = {
                id: customerId,
                cannotLoginUntilDate: date.toISOString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'cannotLoginUntilDate' is a toDatestring", () => {
            const date = new Date();
            const input = {
                id: customerId,
                cannotLoginUntilDate: date.toDateString()
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'cannotLoginUntilDate' has non-date format", () => {
            const date = 4;
            const input = {
                id: customerId,
                cannotLoginUntilDate: date
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        cannotLoginUntilDate
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'requireReLogin' is a boolean", () => {
            const input = {
                id: customerId,
                requireReLogin: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        requireReLogin
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'requireReLogin' is not a boolean", () => {
            const input = {
                id: customerId,
                requireReLogin: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        requireReLogin
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        // BUG SECTION - "Field \"emailCustomer\" is not defined by type \"UpdateCustomerInput\"."
        it("Mutation will succeed if 'emailCustomer' is a boolean", () => {
            const input = {
                id: customerId,
                emailCustomer: true
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        emailCustomer
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'emailCustomer' is not a boolean", () => {
            const input = {
                id: customerId,
                emailCustomer: 'true'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
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

        it("Mutation will succeed if 'managerOfVendorId' is a valid vendordId input", () => {
            const input = {
                id: customerId,
                managerOfVendorId: vendorId
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        managerOfVendorId
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'managerOfVendorId' has an invalid vendorId input", () => {
            const input = {
                id: customerId,
                managerOfVendorId: 'Waaagh'
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        managerOfVendorId
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    // TODO: MODIFY THIS! THIS WAS COPIED DIRECTLY OVER FROM createCustomer.spec.ts, SO IT WON'T WORK YET.
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

    //     it("Mutation will succeed if 'companyId' is a valid companyId input", () => {
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

    // BUG SECTON "Expected value of type \"AssignmentInput!\", found \"778c9051-9651-4cdf-9f45-3b9d7937db4f\"."
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
            const input = {
                id: customerId,
                customerRoleIds: [goldId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customerRoleIds
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will succeed if 'customerRoleIds' has multiple valid inputs", () => {
            const input = {
                id: customerId,
                customerRoleIds: [goldId, adminId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customerRoleIds
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'customerRoleIds' contains an invalid value", () => {
            const input = {
                id: customerId,
                customerRoleIds: ["Waaagh"]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customerRoleIds
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will fail if 'customerRoleIds' contains a mix of valid and invalid inputs", () => {
            const input = {
                id: customerId,
                customerRoleIds: [4, goldId]
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        customerRoleIds
                    }
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    context("Testing customer optional input 'billingAddress', which requires complex data)", () => {
        it("Mutation will succeed if 'billingAddress's 'firstName' is a string", () => {
            const input = {
                id: customerId,
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
                        id
                        billingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'firstName' is not a string", () => {
            const input = {
                id: customerId,
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
                        id
                        billingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
        it("Mutation will succeed if 'billingAddress's 'lastName' is a string", () => {
            const input = {
                id: customerId,
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
                            id
                            billingAddress {
                                lastName
                            }
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'lastName' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
                            billingAddress {
                                lastName
                            }
                        }
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'billingAddress's 'email' is a string", () => {
            const input = {
                id: customerId,
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
                            id
                            billingAddress {
                                email
                            }
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'email' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
                            billingAddress {
                                email
                            }
                        }
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        // BUG SECTION - code: "Invalid Argument", message: "Customer Id Is Required", domain: "Aptean.ATG.EComm"
        it("Mutation will succeed if 'billingAddress's 'phone' has valid, required 'phoneNumber' and 'phoneType' inputs", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            billingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: WORK
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneNumber' is not a string", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
                                phone: {
                                    phoneNumber: 4,
                                    phoneType: WORK
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' is not an enum", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: 'WORK'
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' is not a valid enum", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: WAAAGH
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        //BUG SECTION - code: "Invalid Argument", message: "Customer Id Is Required", domain: "Aptean.ATG.EComm"
        it("Mutation will succeed if 'billingAddress's 'phone' has valid 'countryCode'", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'phone' is not an enum 'countryCode'", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
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
                            id
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

        it("Mutation will fail if 'billingAddress's 'phone' is not a valid enum 'countryCode'", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            billingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    countryCode: WAAAGH
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'country' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will fail if 'billingAddress's 'address's 'country' is not a valid string", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Terra',
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
                            id
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

        it("Mutation will fail if 'billingAddress's 'address's 'postalCode' is a non-string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will fail if 'billingAddress's 'address's 'region' is a non-string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will fail if 'billingAddress's 'address's 'region' is an invalid string", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: ${toFormattedString(input)}
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'city' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will succeed if 'billingAddress's 'address's 'line1' is a valid input", () => {
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'line1' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will succeed if 'billingAddress's 'address's 'line2' is a valid input", () => {
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'address's 'line2' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

    context.only("Testing customer optional input 'shippingAddress', which requires complex data)", () => {
        it("Mutation will succeed if 'shippingAddress's 'firstName' is a string", () => {
            const input = {
                id: customerId,
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
                        id
                        shippingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress';s 'firstName' is a non-string", () => {
            const input = {
                id: customerId,
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
                        id
                        shippingAddress {
                            firstName
                        }
                    }
                }
            }`;
            cy.postAndConfirmError(mutation);
        });
        it("Mutation will succeed if 'shippingAddress's 'lastName' is a string", () => {
            const input = {
                id: customerId,
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
                            id
                            shippingAddress {
                                lastName
                            }
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'lastName' is a non-string", () => {
            const input = {
                id: customerId,
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
                            id
                            shippingAddress {
                                lastName
                            }
                        }
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'shippingAddress's 'email' is a string", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    email: 'Waaagh'
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: ${toFormattedString(input)}
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
                            shippingAddress {
                                email
                            }
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'email' is a non-string", () => {
            const input = {
                id: customerId,
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
                            id
                            shippingAddress {
                                email
                            }
                        }
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        // BUG SECTION - code: "Invalid Argument", message: "Customer Id Is Required", domain: "Aptean.ATG.EComm"
        it("Mutation will succeed if 'shippingAddress's 'phone' has valid, required 'phoneNumber' and 'phoneType' inputs", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: WORK
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneNumber' is not a string", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
                                phone: {
                                    phoneNumber: 4,
                                    phoneType: WORK
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneType' is not an enum", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: 'WORK'
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    phoneType: WAAAGH
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        // BUG SECTION - code: "Invalid Argument", message: "Customer Id Is Required", domain: "Aptean.ATG.EComm"
        it("Mutation will succeed if 'shippingAddress's 'phone' has valid 'countryCode'", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'phone' is not an enum 'countryCode'", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
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
                            id
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
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
                            shippingAddress:{
                                phone: {
                                    phoneNumber: "Waaagh",
                                    countryCode: WAAAGH
                                }
                            }
                        }
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'country' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will fail if 'shippingAddress's 'address's 'country' is not a valid string", () => {
            const input = {
                id: customerId,
                shippingAddress: {
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
                            id
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
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'postalCode' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 4,
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: ${toFormattedString(input)}
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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

        it("Mutation will fail if 'shippingAddress's 'address's 'region' is not a valid string", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'US',
                        postalCode: 'Cadia',
                        region: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: ${toFormattedString(input)}
                    ) {
                        ${standardMutationContent}
                        ${itemPath} {
                            id
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
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will succeed if 'shippingAddress's 'address's 'city' is a string", () => {
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'city' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will succeed if 'shippingAddress's 'address's 'line1' is a valid input", () => {
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'line1' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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

        it("Mutation will succeed if 'shippingAddress's 'address's 'line2' is a valid input", () => {
            const input = {
                id: customerId,
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
                            id
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
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'shippingAddress's 'address's 'line2' is not a string", () => {
            const input = {
                id: customerId,
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
                            id
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