
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10
describe('Mutation: createAddress', () => {
    let companyId = '';
    let addressId = '';
    const mutationName = 'createAddress';
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
        const itemPath = 'company';
        const mutation =
            `mutation {
                ${mutationName}(
                    input:  ${toFormattedString(input)}
                ) {
                    ${standardMutationContent}
                    ${itemPath} {
                        id
                        name
                        integrationKey
                    }
                }
            }`;
        cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
            companyId = res.body.data[mutationName][itemPath].id;
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
        it("Mutation will succeed with a minimum of the required inputs", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}",
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
                  ${itemPath} {
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'companyId' is not included", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'companyId' is not a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: ${companyId}
                    addressType: "SHIPPING"
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'companyId' is not a valid string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "Cadia"
                    addressType: KHORN
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'addressType' is not included", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'addressType' is not an enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: "SHIPPING"
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'addressType' is not a valid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: KHORN
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
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'phoneType' is not included", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        phoneNumber: "Badab" 
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'phoneType' is not an enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        phoneType: "UNKNOWN"
                        phoneNumber: "Badab" 
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'phoneType' is not a valid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        phoneType: "KHORN"
                        phoneNumber: "Badab" 
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'phoneNumber' is not included", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        phoneType: "UNKNOWN"
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'phoneNumber' is not a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        phoneType: "UNKNOWN"
                        phoneNumber: 4
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'country' is not included", () => {
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
                        postalCode: "Pylons",
                        region: "Georgia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'country' is not a string", () => {
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
                        country: 4,
                        postalCode: "Pylons",
                        region: "Georgia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'country' is not a valid string", () => {
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
                        country: "Cadia",
                        postalCode: "Pylons",
                        region: "Georgia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmMutationError(mutation, mutationName);
        });

        it("Mutation will fail if 'address's 'postalCode' is not included", () => {
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
                        country: "US",
                        region: "Georgia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'postalCode' is not a string", () => {
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
                        country: "US",
                        postalCode: 4,
                        region: "Georgia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'region' is not included", () => {
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
                        country: "US",
                        postalCode: "Pylons",
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'region' is not a string", () => {
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
                        country: "US",
                        postalCode: "Pylons",
                        region: 4
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'address's 'region' is not a valid string", () => {
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
                        country: "US",
                        postalCode: "Pylons",
                        region: "Cadia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
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
            cy.postAndConfirmMutationError(mutation, mutationName);
        });
    });

    context("Testing Address API's simple, optional inputs", () => {
        it("Mutation will succeed if 'customData' is an object", () => {
            const customData = {
                text: "For the emperor",
                number: 4
            };
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    customData: ${toFormattedString(customData)}
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
                  ${itemPath} {
                    addressType
                    customData
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'customData' is not an object", () => {
            const customData = [
                "For the emperor",
                "Exterminatus"
            ];
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    customData: ${toFormattedString(customData)}
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
                  ${itemPath} {
                    addressType
                    customData
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'contactDetails's 'firstName' is a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      firstName: "Khorn"
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      firstName
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'contactDetails's 'firstName' is not a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      firstName: 4
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      firstName
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'contactDetails's 'lastName' is a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      lastName: "Khorn"
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      lastName
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'contactDetails's 'lastName' is not a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      lastName: 4
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      lastName
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
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'contactDetails's 'email' is a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      email: "Khorn"
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
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
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'contactDetails's 'email' is not a string", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      email: 4
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
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
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
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing Address API's 'contactDetails's optional 'phone' inputs", () => {
        it("Mutation will succeed if 'phone's 'countryCode' is a valid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        ${reqPhoneInput}
                        countryCode: ZA
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                        countryCode
                      }
                      address {
                        ${reqAddressInfo}
                      }
                    }
                  }
                }
              }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'phone's 'countryCode' is not an enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        ${reqPhoneInput}
                        countryCode: "ZA"
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                        countryCode
                      }
                      address {
                        ${reqAddressInfo}
                      }
                    }
                  }
                }
              }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail if 'phone's 'countryCode' is not a valid enum", () => {
            const mutation = `mutation {
                ${mutationName}(
                  input: {
                    companyId: "${companyId}"
                    addressType: ${addressType}
                    contactDetails: {
                      phone: { 
                        ${reqPhoneInput}
                        countryCode: "KHORN
                      }
                      address: {
                        ${reqAddressInput}
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                        countryCode
                      }
                      address {
                        ${reqAddressInfo}
                      }
                    }
                  }
                }
              }`;
            cy.postAndConfirmError(mutation);
        });
    });

    context("Testing Address API's 'contactDetails's optional 'address' inputs", () => {
        it("Mutation will succeed if 'address's 'city' is a string", () => {
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
                        city: "Cadia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        city
                      }
                    }
                  }
                }
              }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'address's 'city' is not a string", () => {
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
                        city: 4
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        city
                      }
                    }
                  }
                }
              }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'address's 'line1' is a string", () => {
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
                        line1: "Cadia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        line1
                      }
                    }
                  }
                }
              }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'address's 'line1' is not a string", () => {
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
                        line1: 4
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        line1
                      }
                    }
                  }
                }
              }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will succeed if 'address's 'line2' is a string", () => {
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
                        line2: "Cadia"
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        line2
                      }
                    }
                  }
                }
              }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                addressId = res.body.data[mutationName][itemPath].id;
            });
        });

        it("Mutation will fail if 'address's 'line2' is not a string", () => {
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
                        line2: 4
                      }
                    }
                  }
                ) {
                  ${standardMutationContent}
                  ${itemPath} {
                    addressType
                    contactDetails {
                      email
                      phone {
                        ${reqPhoneInfo}
                      }
                      address {
                        ${reqAddressInfo}
                        line2
                      }
                    }
                  }
                }
              }`;
            cy.postAndConfirmError(mutation);
        });
    })
});