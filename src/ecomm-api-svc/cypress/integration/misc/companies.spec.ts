/// <reference types="cypress" />

import { confirmStorefrontEnvValues, toFormattedString } from "../../support/commands";
import { codeMessageError } from "../../support/mutationTests";

var originalBaseUrl = Cypress.config("baseUrl");
confirmStorefrontEnvValues();

describe("Misc. Tests: companies", { baseUrl: `${Cypress.env("storefrontUrl")}` }, () => {
    var id = '';
    var extraIds = [] as SupplementalItemRecord[];
    const queryName = "companies";
    const createMutName = "createCompany";
    const updateMutName = "updateCompany";
    const deleteMutName = "deleteCompany";
    const itemPath = 'company';
    const loginEmail = generateRandomString("b2btester") + "@maildrop.com";
    const loginPassword = generateRandomString("Cypress"); 
    const standardMutationBody = `${codeMessageError}
        ${itemPath} {
            id
            name
            integrationKey
        }
    `;

    const addExtraItemIds = (extIds: SupplementalItemRecord[]) => {
        extIds.forEach((id) => {
            extraIds.push(id);
        });
    };

    function generateRandomString (value: string) {
        let key = Cypress._.random(0, 1000000);
        let integrationKey = value + key;
        return integrationKey;
    }

    const createCompany = (companyName: string, companyKey: string) => {
        const extraItemInput = { name: `${companyName}`, integrationKey: `${companyKey}` };
        return cy.createAssociatedItems(1, createMutName, itemPath, queryName, extraItemInput, undefined, originalBaseUrl).then((results) => {
            const { deletionIds, items, itemIds } = results;
            addExtraItemIds(deletionIds);
            const companyId = itemIds[0];
            const company = items[0];
            return cy.wrap({
                companyId: companyId, 
                company: company
            });
        });
    };

    context("Companies: Testing companies and associated items", () => {
        var customerIds = "";
        var customerRoleIds = "";

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            cy.deleteCypressItems(queryName, deleteMutName, undefined, undefined, originalBaseUrl);
            cy.deleteCypressItems("customerRoles", "deleteCustomerRole", undefined, undefined, originalBaseUrl);    
            cy.deleteCypressItems("customers", "deleteCustomer", undefined, "@email", originalBaseUrl);
        });
            
        afterEach(() => {
            if (!deleteItemsAfter) {
                return;
            }
            if (id !== "") {
                cy.deleteItem(deleteMutName, id).then(() => {
                    id = "";
                });
            }
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
        });

        it("Mutation will associate newly created customer with a company so that companies tab will be visible", () => {
            const companyName  = generateRandomString("B2B Test Company");
            const companyKey = generateRandomString("cypress");
            const extraQuery = "customers";
            cy.visit("/");
            cy.storefrontRegister(loginEmail, loginPassword).then((createdUser) => {
                const { loginEmail, loginPassword } = createdUser;
                cy.log(loginEmail);
                cy.log(loginPassword);
                cy.get(".ico-logout").click({force: true});
                cy.storefrontLogin();
                cy.visit("/Admin/Customer/List");
                cy.get("#SearchEmail").type(loginEmail);
                cy.get("#search-customers").click({force: true});
                cy.wait(2000);
                cy.get(".button-column > .btn").click({force: true});
                cy.get("#SelectedCustomerRoleIds_taglist").click({force: true});
                cy.get("li").contains("Administrators").click({force: true});
                cy.get("[name='save']").click();
                cy.get(".alert").should("be.visible");
                cy.get("a").contains("Logout").click({force: true});
                cy.storefrontLogin(loginEmail, loginPassword);
                cy.visit("/Admin/Company/List");
                cy.get(".alert").should("contain.text", "You do not have permission to perform the selected operation");
                const gqlQuery = `{
                    ${extraQuery} (orderBy: { field: NAME, direction: ASC }
                        searchString: "${loginEmail}"
                    ) {
                        nodes {
                            id
                            email
                        }
                    }
                }`;
                cy.postAndValidate(gqlQuery, extraQuery, originalBaseUrl).then((res) => {
                    let dummyCustomerId = res.body.data[extraQuery].nodes;
                    const customerRoleIds = dummyCustomerId[0].id;
                    const mutation = `mutation {
                        ${createMutName}(input: {
                            name: "${companyName}", integrationKey: "${companyKey}"
                            customerIds: "${customerRoleIds}"
                        }) {
                            ${codeMessageError}
                            ${itemPath} {
                                id
                                name
                                integrationKey
                                customers {
                                    id
                                    email
                                }
                            }
                        }
                    }`;
                    cy.postMutAndValidate(mutation, createMutName, itemPath, originalBaseUrl).then((res) => {
                        id = res.body.data[createMutName][itemPath].id;
                        const propNames = ["name", "integrationKey", "customers"];
                        const propValues = [companyName, companyKey, dummyCustomerId];
                        cy.confirmMutationSuccess(res, createMutName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                    nodes {
                                        id
                                        name
                                        integrationKey
                                        customers {
                                            id
                                            email
                                        }
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                            cy.visit("/");
                            cy.storefrontLogin(loginEmail, loginPassword);
                            cy.visit("/Admin/Company/List");
                            cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                        });
                    });
                });
            });
        });

        it("Mutation creates and updates a company and validates it with storefront admin", () => {
            const companyName  = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const mutation = `mutation {
                ${createMutName}(input: { name: "${companyName}", integrationKey: "${companyKey}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, createMutName, itemPath, originalBaseUrl).then((res) => {
                id = res.body.data[createMutName][itemPath].id;
                const propNames = ["name", "integrationKey"];
                const propValues = [companyName, companyKey];
                cy.confirmMutationSuccess(res, createMutName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                            nodes {
                                id
                                name
                                integrationKey
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                    const companyUpdateName  = generateRandomString("Cypress API Company");
                    const mutation = `mutation {
                        ${updateMutName}(input: { id: "${id}", name: "${companyUpdateName}" }) {
                            ${standardMutationBody}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, updateMutName, itemPath, originalBaseUrl).then((res) => {
                        id = res.body.data[updateMutName][itemPath].id;
                        const propNames = ["name", "integrationKey"];
                        const propValues = [companyUpdateName, companyKey];
                        cy.confirmMutationSuccess(res, updateMutName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${companyUpdateName}", orderBy: { direction: ASC, field: NAME }) {
                                    nodes {
                                        id
                                        name
                                        integrationKey
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                            cy.verifyCompanyDetails(companyUpdateName, companyKey, loginEmail, loginPassword);
                        });
                    });
                });
            });
        });

        it("Mutation creates a company with some 'customerRoles' and 'customers' in it and validates it with storefront admin", () => {
            const customerRoleName = generateRandomString("Cypress API CustomerRole");
            const companyName = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const customerEmail = generateRandomString("cypress");
            const extraCreateCustomerRole = "createCustomerRole";
            const extraPathCustomerRole = "customerRole";
            const extraQueryCustomerRole = "customerRoles";
            const extraCreateCustomer = "createCustomer";
            const extraPathCustomer = "customer";
            const extraQueryCustomer = "customers";
            const noToMake = 3;
            const extraItemInputCustomerRole = { name: customerRoleName, isActive: true, isTaxExempt: false, systemName: "Cypress", isSystemRole: true, hasFreeShipping: false };
            const extraItemInputCustomer = { firstName: "Cypress", lastName: "Tester", email: customerEmail+".tester@email.com" };
            cy.createAssociatedItems(noToMake, extraCreateCustomerRole, extraPathCustomerRole, extraQueryCustomerRole, extraItemInputCustomerRole, undefined, originalBaseUrl).then((resultsCusRole) => {
                const { deletionIds, items, itemIds } = resultsCusRole;
                addExtraItemIds(deletionIds);
                customerRoleIds = itemIds[0];
                const dummyCustomerRole = items;
                cy.createAssociatedItems(noToMake, extraCreateCustomer, extraPathCustomer, extraQueryCustomer, extraItemInputCustomer, undefined, originalBaseUrl).then((resultsCust) => {
                    const { deletionIds, items, itemIds } = resultsCust;
                    addExtraItemIds(deletionIds);
                    customerIds = itemIds[0];
                    const dummyCustomer = items;
                    const mutation = `mutation {
                        ${createMutName}(input: {
                            name: "${companyName}", integrationKey: "${companyKey}"
                            customerRoleIds: ${toFormattedString(resultsCusRole.itemIds)}
                            customerIds: ${toFormattedString(resultsCust.itemIds)}
                        }) {
                            ${codeMessageError}
                            ${itemPath} {
                                id
                                name
                                integrationKey
                                customerRoles {
                                    id
                                    name
                                    isActive
                                    isTaxExempt
                                    systemName
                                    isSystemRole
                                    hasFreeShipping
                                }
                                customers {
                                    id
                                    firstName
                                    lastName
                                    email
                                }
                            }
                        }
                    }`;
                    cy.postMutAndValidate(mutation, createMutName, itemPath, originalBaseUrl).then((res) => {
                        let respCustRole = res.body.data[createMutName][itemPath].customerRoles;
                        const name = [], active = [], taxExempt = [], systemRole = [], freeShipping = [];
                        respCustRole.forEach((items) => {
                            name.push(items.name);
                            active.push(items.isActive);
                            taxExempt.push(items.isTaxExempt);
                            systemRole.push(items.isSystemRole);
                            freeShipping.push(items.hasFreeShipping);
                        });
                        let respCust = res.body.data[createMutName][itemPath].customers;
                        const firstName  = [], lastName = [], email = [];
                        respCust.forEach((items) => {
                            firstName.push(items.firstName);
                            lastName.push(items.lastName);
                            email.push(items.email);
                        });
                        email.reverse();
                        firstName.reverse();
                        lastName.reverse();
                        id = res.body.data[createMutName][itemPath].id;
                        const propNames = ["name", "integrationKey", "customerRoles", "customers"];
                        const propValues = [companyName, companyKey, dummyCustomerRole, dummyCustomer];
                        cy.confirmMutationSuccess(res, createMutName, itemPath, propNames, propValues).then(() => {
                            const query = `{
                                ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                                    nodes {
                                        id
                                        name
                                        integrationKey
                                        customerRoles {
                                            id
                                            name
                                            isActive
                                            isTaxExempt
                                            systemName
                                            isSystemRole
                                            hasFreeShipping
                                        }
                                        customers {
                                            id
                                            firstName
                                            lastName
                                            email
                                        }
                                    }
                                }
                            }`;
                            cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                            cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                            cy.get("#company-customerroles > .card-header > .card-tools").click();
                            cy.get("#company-customers > .card-header > .card-tools").click();
                            cy.get(".k-select").click({force: true});
                            cy.get("#search-company-customers").click();
                            cy.wait(2000);
                            let count = 0, oddEvenRow = 0;
                            for (let i = 0; i < noToMake; i++) {
                                let trClass = i % 2 === 0 ? "odd" : "even";
                                cy.get("#customerroles-grid").get("tbody").eq(1).find("." + trClass).eq(count).find("td").eq(0).should("have.text", name[i]);
                                cy.get("#customerroles-grid").get("tbody").eq(1).find("." + trClass).eq(count).find("td").eq(1).find("i").invoke("attr", "nop-value").should("include", freeShipping[i]);
                                cy.get("#customerroles-grid").get("tbody").eq(1).find("." + trClass).eq(count).find("td").eq(2).find("i").invoke("attr", "nop-value").should("include", taxExempt[i]);
                                cy.get("#customerroles-grid").get("tbody").eq(1).find("." + trClass).eq(count).find("td").eq(3).find("i").invoke("attr", "nop-value").should("include", active[i]);
                                cy.get("#customerroles-grid").get("tbody").eq(1).find("." + trClass).eq(count).find("td").eq(4).find("i").invoke("attr", "nop-value").should("include", systemRole[i]);
                                cy.get("#company-customers-grid").get("tbody").eq(3).find("." + trClass).eq(count).find("td").eq(1).should("have.text", "Guest");
                                cy.get("#company-customers-grid").get("tbody").eq(3).find("." + trClass).eq(count).find("td").eq(2).should("have.text", firstName[i] + " " + lastName[i]);
                                oddEvenRow = oddEvenRow+1;
                                if(oddEvenRow % 2 === 0) {
                                    count++;
                                } 
                            }
                        });
                    });
                });
            });
        });

        it("Mutation will create and delete a company and verifies if the company is deleted in the storefront", () => {
            const companyName  = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const mutation = `mutation {
                ${createMutName}(input: { name: "${companyName}", integrationKey: "${companyKey}" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, createMutName, itemPath, originalBaseUrl).then((res) => {
                id = res.body.data[createMutName][itemPath].id;
                const propNames = ["name", "integrationKey"];
                const propValues = [companyName, companyKey];
                cy.confirmMutationSuccess(res, createMutName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${companyName}", orderBy: { direction: ASC, field: NAME }) {
                            nodes {
                                id
                                name
                                integrationKey
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues, originalBaseUrl);
                    cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                    const mutation = `mutation {
                        ${deleteMutName}(input: { id: "${id}" }) {
                            ${codeMessageError}
                        }
                    }`;
                    cy.postMutAndValidate(mutation, deleteMutName, "deleteMutation", originalBaseUrl);                    
                    cy.visit("/");
                    cy.storefrontLogin().then(() => {
                        cy.visit("/Admin/Company/List");
                        cy.get("#SearchCompanyName").type(companyName);
                        cy.get("#SearchIntegrationKey").type(companyKey);
                        cy.get("#search-companies").click();
                        cy.wait(2000);
                        cy.get("#companies-grid").get("tbody").find("tr").find("td").should("not.have.text", companyName);
                        cy.get("#companies-grid").get("tbody").find("tr").find("td").should("not.have.text", companyKey);
                    });
                });
            });
        });
    });

    context("Payment Settings: Testing company's payment data", () => {
        const paymentSettingsQueryName = "paymentSettings";
        const paymentSettingsCreateMutName = "createPaymentSettings";
        const paymentSettingsDeleteMutName = "deletePaymentSettings";
        const paymentSettingsItemPath = "paymentSettings";
        const companyPath = `company {
            id
            name
            integrationKey
        }`;

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            cy.deleteCypressItems(paymentSettingsQueryName, paymentSettingsDeleteMutName, undefined, undefined, originalBaseUrl).then(() => {
                cy.deleteCypressItems(queryName, deleteMutName, undefined, undefined, originalBaseUrl);
            });
        });

        afterEach(() => {
            if (!deleteItemsAfter) {
                return;
            }
            if (id !== "") {
                cy.deleteItem(deleteMutName, id).then(() => {
                    id = "";
                });
            }
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
        });

        it("Mutation will create a Payment Settings for a company and validates them in storefront", () => {
            const companyName  = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const immediateCapture = true, hasTerms = false;
            let cardType: (string) = ["Discover", "Master", "Amex", "Visa", "Discover", "Master", "Amex", "Visa", "Discover", "Master"];
            let lastFour: (string) = ["2134", "3526", "5859", "3948", "3729", "3126", "2638", "2729", "1324", "1423"];
            const paymentData = [
                { cardType: `${cardType[0]}`, lastFour: `${lastFour[0]}` },
                { cardType: `${cardType[1]}`, lastFour: `${lastFour[1]}` },
                { cardType: `${cardType[2]}`, lastFour: `${lastFour[2]}` },
                { cardType: `${cardType[3]}`, lastFour: `${lastFour[3]}` },
                { cardType: `${cardType[4]}`, lastFour: `${lastFour[4]}` },
                { cardType: `${cardType[5]}`, lastFour: `${lastFour[5]}` },
                { cardType: `${cardType[6]}`, lastFour: `${lastFour[6]}` },
                { cardType: `${cardType[7]}`, lastFour: `${lastFour[7]}` },
                { cardType: `${cardType[8]}`, lastFour: `${lastFour[8]}` },
                { cardType: `${cardType[9]}`, lastFour: `${lastFour[9]}` }
            ];
            createCompany(companyName, companyKey).then((createdCompany) => {
                const { companyId, company } = createdCompany;
                const mutation = `mutation {
                    ${paymentSettingsCreateMutName} (input: {
                        companyId: "${companyId}"
                        hasTerms: ${hasTerms}
                        immediateCapture: ${immediateCapture}
                        paymentData: ${toFormattedString(paymentData)}
                    })
                    {
                        ${codeMessageError}
                        ${paymentSettingsItemPath} {
                            id
                            hasTerms
                            immediateCapture
                            paymentData {
                                cardType
                                lastFour
                            }
                            ${companyPath}
                        }
                    }
                }`;
                cy.postMutAndValidate(mutation, paymentSettingsCreateMutName, paymentSettingsItemPath, originalBaseUrl).then((res) => {
                    id = res.body.data[paymentSettingsCreateMutName][paymentSettingsItemPath].id;
                    const propNames = ["company", "hasTerms", "immediateCapture", "paymentData"];
                    const propValues = [company, hasTerms, immediateCapture, paymentData ];
                    cy.confirmMutationSuccess(res, paymentSettingsCreateMutName, paymentSettingsItemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${paymentSettingsQueryName}(ids: "${id}", orderBy: {direction: ASC, field: COMPANY_NAME}) {
                                nodes {
                                    id
                                    hasTerms
                                    immediateCapture
                                    paymentData {
                                        cardType
                                        lastFour
                                    }
                                    ${companyPath}
                                }
                            }
                        }`;
                        cy.confirmUsingQuery(query, paymentSettingsQueryName, id, propNames, propValues, originalBaseUrl);
                        cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                        cy.get("#company-savedcards > .card-header > .card-tools").click();
                        if(hasTerms) {
                        cy.get("#HasTerms").invoke("attr", "checked").should("include", "checked");
                        } else if(!hasTerms) {
                            cy.get("#HasTerms").should("not.have.attr", "checked");
                        } 
                        if(immediateCapture) {
                            cy.get("#ImmediateCapture").invoke("attr", "checked").should("include", "checked");
                        } else if(!immediateCapture) {
                            cy.get("#ImmediateCapture").should("not.have.attr", "checked");
                        } 
                        let oddEvenRow = 0, count = 0;
                        for (let i = 0; i < 2; i++) {
                            let trClass = i % 2 === 0 ? "odd" : "even";
                            cy.get("#cards-grid").get("tbody").eq(4).find("." + trClass).eq(count).find("td").eq(0).should("have.text", cardType[i]);
                            cy.get("#cards-grid").get("tbody").eq(4).find("." + trClass).eq(count).find("td").eq(1).should("have.text", "XXXX-XXXX-XXXX-" + lastFour[i]);
                            oddEvenRow = oddEvenRow+1;
                            if(oddEvenRow % 2 === 0) {
                                count++;
                            }
                        }   
                    });
                });
            });
        });
    });

    context("Address data: Testing company's address details", () => {
        const addressesQueryName = "addresses";
        const addressCreateMutName = "createAddress";
        const addressDeleteMutName = "deleteAddress";
        const addressItemPath = "addressInfo";
        const companyPath = `company {
            id
            name
            integrationKey
        }`;

        var deleteItemsAfter = undefined as boolean | undefined;
        before(() => {
            deleteItemsAfter = Cypress.env("deleteItemsAfter");
            // cy.deleteCypressItems(addressesQueryName, addressDeleteMutName, undefined, undefined, originalBaseUrl).then(() => {
                cy.deleteCypressItems(queryName, deleteMutName, undefined, undefined, originalBaseUrl);
            // });
        });

        afterEach(() => {
            if (!deleteItemsAfter) {
                return;
            }
            if (id !== "") {
                cy.deleteItem(deleteMutName, id).then(() => {
                    id = "";
                });
            }
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
        });   

        const firstName = "Cypress", lastName = "Tester", email = "cypress.tester" + Cypress._.random(0, 1000000) + "@email.com";
        const line1 = "5343", line2 = "Northlake Blvd", city = "Palm Beach Gardens", region = "Florida", postalCode = "33418", country = "US";
        const addressDetails = { line1: `${line1}`, line2: `${line2}`, city: `${city}`, region: `${region}`, postalCode: `${postalCode}`, country: `${country}` };
        const contactDetails = { firstName: `${firstName}`, lastName: `${lastName}`, email: `${email}`, address: addressDetails };
        const addressPath = `
            line1: "${line1}"
            line2: "${line2}"
            city: "${city}"
            region: "${region}"
            postalCode: "${postalCode}"
            country: "${country}"
        `;
        const contactPath = `
            firstName
            lastName
            email
            address {
                line1
                line2
                city
                region
                country
                postalCode
            }`;
        const createAddress = (addressType: string, addressDescription: string, companyId: string, company: string) => {
            const mutation = `mutation {
                ${addressCreateMutName} (input: { companyId: "${companyId}", addressType: ${addressType}
                    description: "${addressDescription}"
                    contactDetails: {
                        firstName: "${firstName}", lastName: "${lastName}", email: "${email}"
                        address: { ${addressPath} }
                    }
                }) {
                    ${codeMessageError}
                    ${addressItemPath} {
                        id
                        addressType
                        description
                        contactDetails {
                            ${contactPath}
                        }
                        ${companyPath}
                    }
                }
            }`;
            cy.postMutAndValidate(mutation, addressCreateMutName, addressItemPath, originalBaseUrl).then((res) => {
                id = res.body.data[addressCreateMutName][addressItemPath].id;
                const propNames = ["company", "addressType", "description", "contactDetails"];
                const propValues = [company, addressType, addressDescription, contactDetails];
                cy.confirmMutationSuccess(res, addressCreateMutName, addressItemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${addressesQueryName}(companyId: "${companyId}", ids: "${id}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                addressType
                                description
                                contactDetails {
                                    ${contactPath}
                                }
                                ${companyPath}
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, addressesQueryName, id, propNames, propValues, originalBaseUrl);
                    return cy.wrap({
                        addressId: id
                    });
                });
            });
        };
        
        it("Mutation creates a new shipping and billling address and validates it in storefront", () => {
            const companyName  = generateRandomString("Cypress API Company");
            const companyKey = generateRandomString("cypress");
            const addressTypeShipping = `SHIPPING`;
            const addressTypeBilling = `BILLING`;
            let addressType: (string) = ["Shipping", "Billing"];
            let addressDescription: (string) = ["Shipping address", "Billing address"];
            createCompany(companyName, companyKey).then((createdCompany) => {
                const { companyId, company } = createdCompany;
                createAddress(addressTypeShipping, addressDescription[0], companyId, company);
                createAddress(addressTypeBilling, addressDescription[1], companyId, company);
                cy.verifyCompanyDetails(companyName, companyKey, loginEmail, loginPassword);
                cy.get("#company-address > .card-header > .card-tools").click();
                let oddEvenRow = 0, count = 0;
                for (let i = 0; i < 2; i++) {
                    let trClass = i % 2 === 0 ? "odd" : "even";
                    cy.get("#company-addresses-grid").get("tbody").eq(0).find("." + trClass).eq(count).find("td").eq(0).should("have.text", addressDescription[i]);
                    cy.get("#company-addresses-grid").get("tbody").eq(0).find("." + trClass).eq(count).find("td").eq(1).should("have.text", addressType[i]);
                    cy.get("#company-addresses-grid").get("tbody").eq(0).find("." + trClass).eq(count).find("td").eq(2).find("div").should("have.text", line1 + line2 + city + "," + region + "," + postalCode + "United States");
                    oddEvenRow = oddEvenRow+1;
                    if(oddEvenRow % 2 === 0) {
                        count++;
                    }
                }          
            });
        });
    });
});