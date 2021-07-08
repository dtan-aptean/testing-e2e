/// <reference types="cypress" />

import { toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 13
describe('Mutation: createVendor', () => {
    var id = '';
    const mutationName = "createWarehouse";
	const deleteMutName = "deleteWarehouse";
    const queryName = "warehouses";
    const itemPath = "warehouse";
    const standardMutationBody = `
        ${codeMessageError}
        ${itemPath} {
            id
            name
            address {
                city
                country
                line1
                line2
                postalCode
                region
            }
            customData
        }
    `;

	var deleteItemsAfter = undefined as boolean | undefined;
	before(() => {
		deleteItemsAfter = Cypress.env("deleteItemsAfter");
		cy.deleteCypressItems(queryName, deleteMutName);
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
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            cy.mutationInvalidName(mutationName, standardMutationBody);
        });

        it("Mutation will fail with only 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { name: "Cypress ${mutationName} only name" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "CreateWarehouseInput.address" of required type "AddressInput!" was not provided.');
            });
        });

        it("Mutation will fail with invalid 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { address: 7 }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with empty 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { address: {} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with only 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { 
                    address: {
                        city: "Alpharetta",
                        country: "US",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "30022", 
                        region: "Georgia"
                    } 
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field \"CreateWarehouseInput.name\" of required type \"String!\" was not provided.');
            });
        });

        it("Mutation with valid 'Name' and 'Address' input will create a new item", () => {
            const name = `Cypress API ${mutationName}`;
            const address = {
                country: "US",
                postalCode: "30022", 
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        address: ${toFormattedString(address)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                let dummyAddress = {
                    city: "",
                    country: "US",
                    line1: "",
                    line2: "",
                    postalCode: "30022",
                    region: "Georgia"
                };
                const propNames = ["name", "address"];
                const propValues = [name, dummyAddress];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    city
                                    country
                                    line1
                                    line2
                                    postalCode
                                    region
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });

        it("Mutation will fail if 'Address' input does not have 'country'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { 
                    name: "Cypress ${mutationName} missing country"
                    address: {
                        city: "Alpharetta",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "30022", 
                        region: "Georgia"
                    } 
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "AddressInput.country" of required type "String!" was not provided.');
            });
        });

        it("Mutation will fail if 'Address' input does not have 'postalCode'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { 
                    name: "Cypress ${mutationName} missing postalCode"
                    address: {
                        city: "Alpharetta",
                        country: "US",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        region: "Georgia"
                    } 
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field \"AddressInput.postalCode\" of required type \"String!\" was not provided.');
            });
        });

        it("Mutation will fail if 'Address' input does not have 'region'", () => {
            const mutation = `mutation {
                ${mutationName}(input: { 
                    name: "Cypress ${mutationName} missing region"
                    address: {
                        city: "Alpharetta",
                        country: "US",
                        line1: "4325 Alexander Dr",
                        line2: "#100",
                        postalCode: "30022"
                    } 
                }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation).then((res) => {
                expect(res.body.errors[0].message).to.eql('Field "AddressInput.region" of required type "String!" was not provided.');
            });
        });
    });

    context("Testing customData input and optional input", () => {
        it("Mutation with all required input and 'customData' input creates item with customData", () => {
            const name = `Cypress ${mutationName} customData`;
            const address = {
                country: "US",
                postalCode: "30022", 
                region: "Georgia"
            };
            const customData = {data: `${itemPath} customData`, canDelete: true};
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        address: ${toFormattedString(address)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["customData", "name", "address"];
                const propValues = [customData, name, address];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    city
                                    country
                                    line1
                                    line2
                                    postalCode
                                    region
                                }
                                customData
                            }
                        }
                    }`;
                    cy.postAndCheckCustom(query, queryName, id, customData);
                });
            });
        });

        it("Mutation creates item that has all included input", () => {
            const name = `Cypress ${mutationName} Input`;
            const address = {
                city: "Alpharetta",
                country: "US",
                line1: "4325 Alexander Dr",
                line2: "#100",
                postalCode: "30022", 
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        name: "${name}"
                        address: ${toFormattedString(address)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                id = res.body.data[mutationName][itemPath].id;
                const propNames = ["name", "address"];
                const propValues = [name, address];
                cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                    const query = `{
                        ${queryName}(searchString: "${name}", orderBy: {direction: ASC, field: NAME}) {
                            nodes {
                                id
                                name
                                address {
                                    city
                                    country
                                    line1
                                    line2
                                    postalCode
                                    region
                                }
                            }
                        }
                    }`;
                    cy.confirmUsingQuery(query, queryName, id, propNames, propValues);
                });
            });
        });
    });
});