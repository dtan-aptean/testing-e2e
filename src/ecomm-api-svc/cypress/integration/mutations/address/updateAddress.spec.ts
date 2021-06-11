
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10
describe('Mutation: updateAddress', () => {
  let companyId = '';
  let addressId = '';
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
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'id' is not included", () => {
      const mutation = `mutation {
              ${mutationName} (
                input: {
                  companyId:"${companyId}",
                  addressType: BILLING
                }
              ) {
              ${standardMutationContent}
              addressInfo {
                addressType
              }
            }
          }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'id' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: ${addressId},
                    companyId:"${companyId}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'id' is not a valid string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "KHORN",
                    companyId:"${companyId}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmMutationError(mutation, mutationName);
    });

    it("Mutation will fail if 'companyId' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmMutationError(mutation, mutationName);
    });

    it("Mutation will fail if 'companyId' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId: ${companyId},
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'companyId' is not a valid string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId: "KHORN",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmMutationError(mutation, mutationName);
    });

    it("Mutation will succeed if 'addressType' is a valid enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'addressType' is not an enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: "BILLING"
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'addressType' is not a valid enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: KHORN
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'phone's 'phoneType' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            phoneNumber: "KHORN"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    phone {
                        phoneNumber
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'phone's 'phoneType' is not an enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            phoneNumber: "KHORN"
                            phoneType: "UNKNOWN"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'phone's 'phoneType' is not a valid enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            phoneNumber: "KHORN"
                            phoneType: WAAAGH
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'phone's 'phoneNumber' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            phoneType: UNKNOWN
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    phone {
                        phoneType
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'phone's 'phoneNumber' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            phoneNumber: 4
                            phoneType: UNKNOWN
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'address's 'country' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            postalCode: "Pylons",
                            region: "Georgia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        postalCode
                        region
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'address's 'country' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            postalCode: "Pylons",
                            region: "Georgia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'address's 'country' is not a valid string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: "KHORN",
                            postalCode: "Pylons",
                            region: "Georgia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'address's 'postalCode' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            region: "Georgia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        country
                        region
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'address's 'postalCode' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            postalCode: 4,
                            region: "Georgia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'address's 'region' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            postalCode: 4,
                            region: GEORGIA
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will fail if 'address's 'region' is not included", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            postalCode: 4,
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        country
                        postalCode
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if 'address's 'region' is not a valid string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            country: US,
                            postalCode: 4,
                            region: "KHORN"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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
  });

  context("Testing Address API's simple, optional inputs", () => {
    it("Mutation will succeed if 'customData' is an object", () => {
      const customData = {
        text: "For the emperor",
        number: 4
      }
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    customData: ${toFormattedString(customData)}
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  customData
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'customData' is not an object", () => {
      const customData = [
        "For the emperor",
        "Exterminatus"
      ]
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${toFormattedString(companyId)}",
                    addressType: BILLING
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  customData: ${customData}
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will succeed if 'contactDetails's 'firstName' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        firstName: "KHORN"
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    firstName
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'contactDetails's 'firstname' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        firstName: 4
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    firstName
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will succeed if 'contactDetails's 'lastName' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        lastName: "KHORN"
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    lastName
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'contactDetails's 'lastName' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        lastName: 4
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    lastName
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will succeed if 'contactDetails's 'email' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        email: "KHORN"
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    email
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if 'contactDetails's 'email' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        email: 4
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    email
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });
  });

  context("Testing Address API's 'contactDetails's optional 'phone' inputs", () => {
    it("Mutation will succeed if required 'phone' inputs included and 'countryCode' is a valid enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            ${reqPhoneInput}
                            countryCode: ZA
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    phone {
                        ${reqPhoneInfo}
                        countryCode
                    }
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if required 'phone' inputs included but 'countryCode' is a not an enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            ${reqPhoneInfo}
                            countryCode: "ZA"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    phone {
                        ${reqPhoneInput}
                        countryCode
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });

    it("Mutation will fail if required 'phone' inputs included but 'countryCode' is a not a valid enum", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        phone: {
                            ${reqPhoneInfo}
                            countryCode: "KHORN"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    phone {
                        ${reqPhoneInput}
                        countryCode
                    }
                  }
                }
              }
            }`;
      cy.postAndConfirmError(mutation);
    });
  });

  context("Testing Address API's 'contactDetails' 'address' inputs", () => {
    it("Mutation will succeed if required 'address' inputs included and 'city' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            city: "Cadia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        ${reqAddressInfo}
                        city
                    }
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if required 'address' inputs included but 'city' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            city: 4
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will succeed if required 'address' inputs included and 'line1' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            line1: "Cadia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        ${reqAddressInfo}
                        line1
                    }
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if required 'address' inputs included but 'line1' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            line1: 4
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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

    it("Mutation will succeed if required 'address' inputs included and 'line2' is a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            line2: "Cadia"
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
                    address {
                        ${reqAddressInfo}
                        line2
                    }
                  }
                }
              }
            }`;
      cy.postMutAndValidate(mutation, mutationName, itemPath);
    });

    it("Mutation will fail if required 'address' inputs included but 'line2' is not a string", () => {
      const mutation = `mutation {
                ${mutationName} (
                  input: {
                    id: "${addressId}",
                    companyId:"${companyId}",
                    addressType: BILLING,
                    contactDetails: {
                        address: {
                            ${reqAddressInput}
                            line2: 4
                        }
                    }
                  }
                ) {
                ${standardMutationContent}
                addressInfo {
                  addressType
                  contactDetails {
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
  });
});