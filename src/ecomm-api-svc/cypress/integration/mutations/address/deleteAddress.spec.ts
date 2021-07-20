
import { add } from "cypress/types/lodash";
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 5
describe('Mutation: deleteAddress', () => {
    let companyId = '';
    let addressId = '';
    let customerId = '';
    const mutationName = 'createAddress';
    const deleteMutName = 'deleteAddress';
    const companyMutName = 'createCompany';
    const companyDeleteMutName = 'deleteCompany';
    const customerMutName = 'createCustomer';
    const customerDeleteMutName = 'deleteCustomer';
    const addressQueryName = 'addresses';
    const customerQueryName = 'customers';
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
            const companyPath = 'company';
            const mutation =
                `mutation {
                    ${companyMutName}(
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
            cy.postMutAndValidate(mutation, companyMutName, companyPath).then((res) => {
                companyId = res.body.data[companyMutName][companyPath].id;
                const addressType = 'SHIPPING';
                const mutation = `mutation {
                    ${mutationName}(
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
                cy.postMutAndValidate(mutation, mutationName, addressInfo).then((res) => {
                    const query = `{
                        ${addressQueryName}(companyId: "${companyId}", orderBy: {direction: ASC, field: NAME }) {
                            nodes {
                                id
                            }
                        }
                    }`;
                    cy.postAndValidate(query, addressQueryName).then((res) => {
                        addressId = res.body.data[addressQueryName].nodes[0].id;
                    });
                });
            });
        });

        after(() => {
            if (companyId !== '') {
                const mutation =
                    `mutation {
                        ${companyDeleteMutName}(input: { id: "${companyId}" }) {
                            ${standardMutationContent}
                        }
                    }`;
                cy.postMutAndValidate(mutation, companyDeleteMutName, 'deleteMutation').then((res) => {
                    companyId = '';
                });
            }
        });

        it("Mutation will succeed if 'id' is a valid string", () => {
            const mutation =
                `mutation {
                    ${deleteMutName}(input: { id: "${addressId}" }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
                addressId = '';
            });
        });

        it("Mutation will fail if 'id' is not a string", () => {
            const mutation =
                `mutation {
                    ${deleteMutName}(input: { id: ${addressId} }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'id' is not a valid string", () => {
            const mutation =
                `mutation {
                    ${deleteMutName}(input: { id: "KHORN" }) {
                        ${standardMutationContent}
                    }
                }`;
            cy.postAndConfirmMutationError(mutation, deleteMutName);
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
            const query =
                `query {
                ${customerQueryName}(
                    searchString: "${emailTag}"
                    orderBy: { direction: ASC, field:NAME }
                ) {
                    nodes {
                        id
                    }
                }
            }`;
            cy.postAndValidate(query, customerQueryName).then((res) => {
                const nodes = res.body.data[customerQueryName].nodes;
                const length = nodes.length;
                let idArray = [];
                for (let i = 0; i < length; i++) {
                    let id = nodes[i].id;
                    idArray.push(id);
                };
                cy.wrap(idArray).each((i) => {
                    let mutation =
                        `mutation {
                                ${customerDeleteMutName}(input: { id: "${i}" }) {
                                    ${standardMutationContent}
                                }
                            }`;
                    cy.postMutAndValidate(mutation, customerDeleteMutName, 'deleteMutation')
                }).then(() => {
                    // Generate a new customer for this test.
                    const input = {
                        firstName: "Bob",
                        lastName: "Bobber",
                        email: emailTag + Math.floor(100000 + Math.random() * 900000) + '@gmail.com'
                    };
                    const companyPath = 'customer';
                    const mutation =
                        `mutation {
                                ${customerMutName}(
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
                    cy.postMutAndValidate(mutation, customerMutName, companyPath).then((res) => {
                        customerId = res.body.data[customerMutName][companyPath].id;
                    });
                });
            });
        });

        after(() => {
            if (customerId !== '') {
                const mutation =
                    `mutation {
                        ${customerDeleteMutName}(input: { id: "${customerId}" }) {
                            ${standardMutationContent}
                        }
                    }`;
                cy.postMutAndValidate(mutation, customerDeleteMutName, 'deleteMutation').then((res) => {
                    customerId = '';
                });
            }
        });

        it("The deleted item is successfully disconnected and no longer shows in the connected item's 'shippingAddress' field.", () => {
            const addressType = 'SHIPPING';
            const queryInfo = addressType.toLowerCase() + 'Address';
            const mutation = `mutation {
            ${mutationName}(
                    input: {
                        customerId: "${customerId}"
                        addressType: ${addressType}
                        ${commonContent}
                `;
            cy.postMutAndValidate(mutation, mutationName, addressInfo).then((res) => {
                addressId = res.body.data[mutationName][addressInfo].id;
                const mutation =
                    `mutation {
                ${deleteMutName}(input: { id: "${addressId}" }) {
                    ${standardMutationContent}
                }
            }`;
                cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
                    addressId = '';
                    const query =
                        `query {
                            ${customerQueryName}(
                                ids: "${customerId}"
                                orderBy: { direction: ASC, field:NAME }
                                ) {
                                    nodes {
                                        ${queryInfo} {
                                            ${queryContent}
                            }
                        }
                    }`;
                    cy.postAndValidate(query, customerQueryName).then((res) => {
                        cy.expect(res.body.data[customerQueryName].nodes[0][queryInfo]).to.be.null;
                    });
                });
            });
        });

        it("The deleted item is successfully disconnected and no longer shows in the connected item's 'billingAddress' field.", () => {
            const addressType = 'BILLING';
            const queryInfo = addressType.toLowerCase() + 'Address';
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        customerId: "${customerId}"
                        addressType: ${addressType}
                        ${commonContent}
                `;
            cy.postMutAndValidate(mutation, mutationName, addressInfo).then((res) => {
                addressId = res.body.data[mutationName][addressInfo].id;
                const mutation =
                    `mutation {
                ${deleteMutName}(input: { id: "${addressId}" }) {
                    ${standardMutationContent}
                }
            }`;
                cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
                    addressId = '';
                    const query =
                        `query {
                            ${customerQueryName}(
                                ids: "${customerId}"
                                orderBy: { direction: ASC, field:NAME }
                                ) {
                                    nodes {
                                        ${queryInfo} {
                                            ${queryContent}
                            }
                        }
                    }`;
                    cy.postAndValidate(query, customerQueryName).then((res) => {
                        cy.expect(res.body.data[customerQueryName].nodes[0][queryInfo]).to.be.null;
                    });
                });
            });
        });
    });
});