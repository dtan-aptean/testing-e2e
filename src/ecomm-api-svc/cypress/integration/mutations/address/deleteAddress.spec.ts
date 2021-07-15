
import { add } from "cypress/types/lodash";
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 3
describe('Mutation: deleteAddress', () => {
    let companyId = '';
    let addressId = '';
    let customerId = '';
    const mutationName = 'updateAddress';
    const itemPath = 'addressInfo';
    const addressType = `SHIPPING`;
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
            const addressMut = 'createAddress';
            const addressPath = 'addressInfo'
            const mutation = `mutation {
                ${addressMut}(
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
                  }
                ) {
                  ${standardMutationContent}
                  ${addressPath} {
                    addressType
                    contactDetails {
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                      }
                    }
                  }
                }
              }`;
            cy.postMutAndValidate(mutation, addressMut, addressPath).then((res) => {
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

    context("Testing Address API's required inputs", () => {
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
});