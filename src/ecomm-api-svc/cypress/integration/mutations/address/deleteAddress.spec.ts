
import { add } from "cypress/types/lodash";
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 3
describe('Mutation: deleteAddress', () => {
    let companyId = '';
    let addressId = '';
    let customerId = '';
    const customerClear = "deleteCustomer";
    const createMut = 'createAddress';
    const addressInfo = 'addressInfo';
    const emailTag = 'addressAPITest';
    const reqPhoneInput = `
        phoneType: UNKNOWN, 
        phoneNumber: "Badab" 
    `;
    const reqAddressInput = `
        country: "US",
        postalCode: "Pylons",
        region: "Georgia"
    `;
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
    const reqPhoneInfo = `
        phoneType
        phoneNumber
    `;
    const reqAddressInfo = `
        country
        postalCode
        region
    `;
    const description = "The Emperor protects."

    context("Testing Address API's required inputs", () => {
        before(() => {
            const input = {
                name: "Address API Test Company",
                integrationKey: 'testkey' + Math.floor(100000 + Math.random() * 900000)
            };
            const mutationName = 'createCompany';
            const companyPath = 'company';
            const mutation =
                `mutation {
                    ${mutationName}(
                        input:  ${toFormattedString(input)}
                    ) {
                        ${standardMutationContent}
                        ${companyPath} {
                            id
                            name
                            integrationKey
                        }
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, companyPath).then((res) => {
                companyId = res.body.data[mutationName][companyPath].id;
                const addressType = 'SHIPPING';
                const mutation = `mutation {
                    ${createMut}(
                      input: {
                        companyId: "${companyId}"
                        addressType: ${addressType}
                        contactDetails: {
                          phone: { 
                            ${reqPhoneInput}
                          }
                          address: {
                            ${reqAddressInput}
                          }
                        }
                        description: "${description}"
                      }
                    ) {
                      ${standardMutationContent}
                      ${addressInfo} {
                        addressType
                        contactDetails {
                          phone {
                            ${reqPhoneInfo}
                          }
                          address {
                            ${reqAddressInfo}
                          }
                        }
                        description
                      }
                    }
                  }`;
                cy.postMutAndValidate(mutation, createMut, addressInfo).then((res) => {
                    const queryName = 'addresses';
                    const query = `{
                        ${queryName}(companyId: "${companyId}", orderBy: {direction: ASC, field: NAME }) {
                            nodes {
                                id
                            }
                        }
                    }`;
                    cy.postAndValidate(query, queryName).then((res) => {
                        addressId = res.body.data[queryName].nodes[0].id;
                    });
                });
            });
        });

        after(() => {
            if (companyId !== '') {
                const mutationName = "deleteCompany";
                const mutation =
                    `mutation {
                        ${mutationName}(input: { id: "${companyId}" }) {
                            ${standardMutationContent}
                        }
                    }`;
                cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                    companyId = '';
                });
            }
        });

        it("Mutation will succeed if 'id' is a valid string", () => {
            const mutationName = "deleteAddress";
            const mutation =
                `mutation {
                    ${mutationName}(input: { id: "${addressId}" }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                addressId = '';
            });
        });

        it("Mutation will fail if 'id' is not a string", () => {
            const mutationName = "deleteAddress";
            const mutation =
                `mutation {
                    ${mutationName}(input: { id: ${addressId} }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'id' is not a valid string", () => {
            const mutationName = "deleteAddress";
            const mutation =
                `mutation {
                    ${mutationName}(input: { id: "KHORN" }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    context("Testing that deleting address will disconnect it from 'customer' data", () => {
        const commonContent = `
                contactDetails: {
                    phone: { 
                        ${reqPhoneInput}
                    }
                    address: {
                        ${reqAddressInput}
                    }
                    }
                    description: "${description}"
                }
                ) {
                ${standardMutationContent}
                ${addressInfo} {
                id
                addressType
                contactDetails {
                phone {
                    ${reqPhoneInfo}
                }
                address {
                    ${reqAddressInfo}
                }
                }
                description
                }
            }
        }`;
        const queryContent = `                                    
            firstName
            lastName
            email
            address {
            country
            postalCode
            region
            }
        }
        id
        `;

        before(() => {
            // Cleans up old customers created during testing.
            const queryName = 'customers';
            const query =
                `query {
                ${queryName}(
                    searchString: "${emailTag}"
                    orderBy: { direction: ASC, field:NAME }
                ) {
                    nodes {
                        id
                    }
                }
            }`;
            cy.postAndValidate(query, queryName).then((res) => {
                const nodes = res.body.data[queryName].nodes;
                const length = nodes.length;
                const mutationName = 'deleteCustomer';
                let idArray = [];
                for (let i = 0; i < length; i++) {
                    let id = nodes[i].id;
                    idArray.push(id);
                };
                cy.wrap(idArray).each((i) => {
                    let mutation =
                        `mutation {
                                ${customerClear}(input: { id: "${i}" }) {
                                    ${standardMutationContent}
                                }
                            }`;
                    cy.postMutAndValidate(mutation, mutationName, 'deleteMutation')
                }).then(() => {
                    // Generate a new customer for this test.
                    const input = {
                        firstName: "Bob",
                        lastName: "Bobber",
                        email: emailTag + Math.floor(100000 + Math.random() * 900000) + '@gmail.com'
                    };
                    const mutationName = 'createCustomer';
                    const companyPath = 'customer';
                    const mutation =
                        `mutation {
                                ${mutationName}(
                                    input:  ${toFormattedString(input)}
                                ) {
                                    ${standardMutationContent}
                                    ${companyPath} {
                                        id
                                        firstName
                                        lastName
                                        email
                                    }
                                }
                            }`;
                    cy.postMutAndValidate(mutation, mutationName, companyPath).then((res) => {
                        customerId = res.body.data[mutationName][companyPath].id;
                    });
                });
            });
        });

        after(() => {
            if (customerId !== '') {
                const mutationName = 'deleteCustomer'
                const mutation =
                    `mutation {
                        ${mutationName}(input: { id: "${customerId}" }) {
                            ${standardMutationContent}
                        }
                    }`;
                cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                    customerId = '';
                });
            }
        });

        it("The deleted item is successfully disconnected and no longer shows in the connected item's 'shippingAddress' field.", () => {
            const addressType = 'SHIPPING';
            const queryInfo = addressType.toLowerCase() + 'Address';
            const mutation = `mutation {
                ${createMut}(
                    input: {
                        customerId: "${customerId}"
                        addressType: ${addressType}
                        ${commonContent}
                `;
            cy.postMutAndValidate(mutation, createMut, addressInfo).then((res) => {
                addressId = res.body.data[createMut][addressInfo].id;
                const mutationName = "deleteAddress";
                const mutation =
                    `mutation {
                ${mutationName}(input: { id: "${addressId}" }) {
                    ${standardMutationContent}
                }
            }`;
                cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                    addressId = '';
                    const queryName = 'customers';
                    const query =
                        `query {
                            ${queryName}(
                                ids: "${customerId}"
                                orderBy: { direction: ASC, field:NAME }
                                ) {
                                    nodes {
                                        ${queryInfo} {
                                            ${queryContent}
                            }
                        }
                    }`;
                    cy.postAndValidate(query, queryName).then((res) => {
                        cy.expect(res.body.data[queryName].nodes[0][queryInfo]).to.be.null;
                    });
                });
            });
        });

        it("The deleted item is successfully disconnected and no longer shows in the connected item's 'billingAddress' field.", () => {
            const addressType = 'BILLING';
            const queryInfo = addressType.toLowerCase() + 'Address';
            const mutation = `mutation {
                ${createMut}(
                    input: {
                        customerId: "${customerId}"
                        addressType: ${addressType}
                        ${commonContent}
                `;
            cy.postMutAndValidate(mutation, createMut, addressInfo).then((res) => {
                addressId = res.body.data[createMut][addressInfo].id;
                const mutationName = "deleteAddress";
                const mutation =
                    `mutation {
                ${mutationName}(input: { id: "${addressId}" }) {
                    ${standardMutationContent}
                }
            }`;
                cy.postMutAndValidate(mutation, mutationName, 'deleteMutation').then((res) => {
                    addressId = '';
                    const queryName = 'customers';
                    const query =
                        `query {
                            ${queryName}(
                                ids: "${customerId}"
                                orderBy: { direction: ASC, field:NAME }
                                ) {
                                    nodes {
                                        ${queryInfo} {
                                            ${queryContent}
                            }
                        }
                    }`;
                    cy.postAndValidate(query, queryName).then((res) => {
                        cy.expect(res.body.data[queryName].nodes[0][queryInfo]).to.be.null;
                    });
                });
            });
        });
    });
});