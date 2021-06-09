import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 17
describe('Mutation: createCustomer', () => {
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
        it("Mutation will succeed if 'email' has a string input", () => {
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
            // TODO: seee if we can remove the .then()s. If we don't need to query, we probably don't need it.
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'email' has a non-string input", () => {
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

        it("Mutation will succeed if 'firstName' has a string input", () => {
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

        it("Mutation will fail if 'firstName' has a non-string input", () => {
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

        it("Mutation will succeed if 'lastName' has a string input", () => {
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

        it("Mutation will fail if 'lastName' has a non-string input", () => {
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
        it("Mutation will succeed if 'isActive' has a boolean input", () => {
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

        it("Mutation will fail if 'isActive' has a non-boolean input", () => {
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

        it("Mutation will fail if 'gender' has one of the given enum input", () => {
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

        it("Mutation will fail if 'gender' has a non-given enum input", () => {
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${customerId}",
                        gender: Waaagh
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

        it("Mutation will fail if 'gender' has a non-given enum input", () => {
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

        it("Mutation will succeed if 'dateOfBirth' has a toISOString input", () => {
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

        it("Mutation will also succeed if 'dateOfBirth' has a toDateString input", () => {
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

        it("Mutation will fail if 'dateOfBirth' has non-date-format input", () => {
            const date = 'January 1, 2000'
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'isTaxExempt' has a boolean input", () => {
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

        it("Mutation will fail if 'isTaxExempt' has a non-boolean input", () => {
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

        it("Mutation will succeed if 'newsletter' has a number input", () => {
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

        it("Mutation will succeed if 'newsletter' has a string input", () => {
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

        it("Mutation will succeed if 'adminComment' has a string input", () => {
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

        it("Mutation will fail if 'adminComment' has a non-string input", () => {
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

        it("Mutation will succeed if 'vendorId' has a string input", () => {
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

        it("Mutation will succeed if 'vendorId' has a non-string input", () => {
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

        it("Mutation will succeed if 'affiliateId' has a string input", () => {
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

        it("Mutation will succeed if 'affiliateId' has a non-string input", () => {
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

        it("Mutation will succeed if 'cannotLoginUntilDate' has a toISOString input", () => {
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

        it("Mutation will also succeed if 'cannotLoginUntilDate' has a toDateString input", () => {
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

        it("Mutation will fail if 'cannotLoginUntilDate' has non-date-format input", () => {
            const date = 'January 1, 2000'
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'requireReLogin' has a boolean input", () => {
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

        it("Mutation will fail if 'requireReLogin' has a non-boolean input", () => {
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

        it("Mutation will succeed if 'emailCustomer' has a boolean input", () => {
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

        it("Mutation will fail if 'emailCustomer' has a non-boolean input", () => {
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

        it("Mutation will succeed if 'managerOfVendorId' has a valid vendordId input", () => {
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

        it("Mutation will succeed if 'customerRoleIds' has a multiple valid inputs", () => {
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
        it("Mutation will succeed if 'billingAddress' has a string 'firstName' input", () => {
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

        it("Mutation will fail if 'billingAddress' has a non-string 'firstName' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });
        it("Mutation will succeed if 'billingAddress' has a string 'lastName' input", () => {
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

        it("Mutation will fail if 'billingAddress' has a non-string 'lastName' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });

        it("Mutation will succeed if 'billingAddress' has a string 'email' input", () => {
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

        it("Mutation will fail if 'billingAddress' has a non-string 'email' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });

        it("Mutation will succeed if 'billingAddress's 'phone' has valid, required 'phoneNumber' and 'phoneType' inputs", () => {
            const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${companyId}"
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                customerId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneNumber' has a non-string input", () => {
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

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' has a non-enum input", () => {
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

        it("Mutation will fail if 'billingAddress's 'phone's required 'phoneType' has a non-valid enum input", () => {
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

        it("Mutation will succeed if 'billingAddress's 'phone' has valid 'countryCode input", () => {
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

        it("Mutation will fail if 'billingAddress's 'phone' has a non-enum 'countryCode' input", () => {
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

        it("Mutation will fail if 'billingAddress's 'phone' has a non-valid enum 'countryCode' input", () => {
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
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 4,
                        postalCode: 'stands',
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 4,
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will succeed if 'billingAddress's 'address's 'city' has a valid input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        city: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'city' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        city: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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
                cy.postAndConfirmError(mutation);
            });
        });

        it("Mutation will succeed if 'billingAddress's 'address's 'line1' has a valid input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line1: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'line1' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line1: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will succeed if 'billingAddress's 'address's 'line2' has a valid input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line2: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'billingAddress's 'address's 'line2' has a non-string input", () => {
            const input = {
                id: customerId,
                billingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line2: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

    context("Testing customer optional input 'shippingAddress', which requires complex data)", () => {
        it("Mutation will succeed if 'shippingAddress' has a string 'firstName' input", () => {
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

        it("Mutation will fail if 'shippingAddress' has a non-string 'firstName' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });
        it("Mutation will succeed if 'shippingAddress' has a string 'lastName' input", () => {
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

        it("Mutation will fail if 'shippingAddress' has a non-string 'lastName' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });

        it("Mutation will succeed if 'shippingAddress' has a string 'email' input", () => {
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

        it("Mutation will fail if 'shippingAddress' has a non-string 'email' input", () => {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                cy.postAndConfirmError(mutation);
            });
        });

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

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneNumber' has a non-string input", () => {
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

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneType' has a non-enum input", () => {
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

        it("Mutation will fail if 'shippingAddress's 'phone's required 'phoneType' has a non-valid enum input", () => {
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

        it("Mutation will succeed if 'shippingAddress's 'phone' has valid 'countryCode input", () => {
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

        it("Mutation will fail if 'shippingAddress's 'phone' has a non-enum 'countryCode' input", () => {
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

        it("Mutation will fail if 'shippingAddress's 'phone' has a non-valid enum 'countryCode' input", () => {
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
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 4,
                        postalCode: 'stands',
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 4,
                        region: 'Eye of Terror'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'country' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will succeed if 'shippingAddress's 'address's 'city' has a valid input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        city: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'city' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        city: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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
                cy.postAndConfirmError(mutation);
            });
        });

        it("Mutation will succeed if 'shippingAddress's 'address's 'line1' has a valid input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line1: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'line1' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line1: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will succeed if 'shippingAddress's 'address's 'line2' has a valid input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line2: 'Pylons'
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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

        it("Mutation will fail if 'shippingAddress's 'address's 'line2' has a non-string input", () => {
            const input = {
                id: customerId,
                shippingAddress: {
                    address: {
                        country: 'Cadia',
                        postalCode: 'stands',
                        region: 'Eye of Terror',
                        line2: 4
                    }
                }
            };
            const mutation = `mutation {
                    ${mutationName}(
                        input: "${input}"
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