/// <reference types="cypress" />

import { SupplementalItemRecord, toFormattedString } from "../../../support/commands";
import { codeMessageError } from "../../../support/mutationTests";

// TEST COUNT: 16
describe('Mutation: updateWarehouse', () => {
    var id = '';
    var itemCount = 1;
    var extraIds = [] as SupplementalItemRecord[];
    const mutationName = "updateWarehouse";
    const createName = "createWarehouse";
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

	beforeEach(() => {
        const name = `Cypress ${mutationName} Test #${itemCount}`;
        // Address of Leamy Lake Park in Canada
        const input = `{name: "${name}", address: { city: "Gatineau", country: "CA", line1: "Leamy Lake Pkwy", line2: "", postalCode: "J8X 3P5", region: "Quebec" }}`;
        cy.createAndGetId(createName, itemPath, input).then((returnedId: string) => {
            assert.exists(returnedId);
            id = returnedId;
            itemCount++;
        });
	});

    afterEach(() => {
		if (!deleteItemsAfter) {
			return;
		}
        if (id !== "") {
            // Delete any supplemental items we created
            cy.deleteSupplementalItems(extraIds).then(() => {
                extraIds = [];
            });
            // Delete the item we've been updating
            cy.deleteItem(deleteMutName, id);
        }
    });

    context("Testing basic required inputs", () => {
        it("Mutation will fail without input", () => {
            cy.mutationNoInput(mutationName, standardMutationBody);
        });

        it("Mutation will fail when input is an empty object", () => {
            cy.mutationEmptyObject(mutationName, standardMutationBody);
        });

        it("Mutation will fail with invalid 'id' input", () => {
            cy.mutationInvalidId(mutationName, standardMutationBody);
        });

        // TODO: failing ecause of 200 status code instead of 400
        it("Mutation will fail if the only input provided is 'id'", () => {
            cy.mutationOnlyId(id, mutationName, standardMutationBody);
        });

        it("Mutation will fail with invalid 'Name' input", () => {
            cy.mutationInvalidName(mutationName, standardMutationBody, id);
        });

        it("Mutation will fail with only 'Name' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", name: "Cypress ${mutationName} only name" }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath);
        });

        it("Mutation will fail with invalid 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", address: 7 }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with empty 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { id: "${id}", address: {} }) {
                    ${standardMutationBody}
                }
            }`;
            cy.postAndConfirmError(mutation);
        });

        it("Mutation will fail with only 'Address' input", () => {
            const mutation = `mutation {
                ${mutationName}(input: { 
                    id: "${id}",
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
            cy.postAndConfirmMutationError(mutation, mutationName, itemPath).then((res) => {
                expect(res.body.data[mutationName].errors[0].message).to.eql("Warehouse Name is Required");
            });
        });

        it("Mutation will succeed with valid 'id', 'name', and 'address' input", () => {
            const name = `Cypress ${mutationName} basic required`;
            const address = {
                country: "US",
                postalCode: "30022", 
                region: "Georgia"
            };
            const mutation = `mutation {
                ${mutationName}(
                    input: {
                        id: "${id}"
                        name: "${name}"
                        address: ${toFormattedString(address)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
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
                    id: "${id}"
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
                    id: "${id}"
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
                    id: "${id}"
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
        it("Mutation with all required input and 'customData' input updates item with customData", () => {
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
                        id: "${id}"
                        name: "${name}"
                        address: ${toFormattedString(address)}
                        customData: ${toFormattedString(customData)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                let dummyAddress = {
                    city: "",
                    country: "US",
                    line1: "",
                    line2: "",
                    postalCode: "30022",
                    region: "Georgia"
                };
                const propNames = ["customData", "name", "address"];
                const propValues = [customData, name, dummyAddress];
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

        it("Mutation with all required input and 'customData' input will overwrite the customData on an existing object", () => {
            const name = `Cypress ${mutationName} customData extra`;
            const address = {
                country: "US",
                postalCode: "30022", 
                region: "Georgia"
            };
            const customData = {data: `${itemPath} customData`, extraData: ['C', 'Y', 'P', 'R', 'E', 'S', 'S']};
            const input = `{name: "${name}", address: ${toFormattedString(address)}, customData: ${toFormattedString(customData)}}`;
            cy.createAndGetId(createName, itemPath, input, "customData").then((createdItem) => {
                assert.exists(createdItem.id);
                assert.exists(createdItem.customData);
                extraIds.push({itemId: createdItem.id, deleteName: deleteMutName, itemName: name, queryName: queryName});
                const newName = `Cypress ${mutationName} CD extra updated`;
                const newAddress = {
                    country: "CA",
                    postalCode: "J8X 3P5",
                    region: "Quebec"
                };
                const newCustomData = {data: `${itemPath} customData`, newDataField: { canDelete: true }};
                const mutation = `mutation {
                    ${mutationName}(
                        input: {
                            id: "${createdItem.id}"
                            name: "${newName}"
                            address: ${toFormattedString(newAddress)}
                            customData: ${toFormattedString(newCustomData)}
                        }
                    ) {
                        ${standardMutationBody}
                    }
                }`;
                cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
                    let dummyAddress = {
                        city: "",
                        country: newAddress.country,
                        line1: "",
                        line2: "",
                        postalCode: newAddress.postalCode,
                        region: newAddress.region
                    };
                    const propNames = ["customData", "name", "address"];
                    const propValues = [newCustomData, newName, dummyAddress];
                    cy.confirmMutationSuccess(res, mutationName, itemPath, propNames, propValues).then(() => {
                        const query = `{
                            ${queryName}(searchString: "${newName}", orderBy: {direction: ASC, field: NAME}) {
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
                        cy.postAndCheckCustom(query, queryName, id, newCustomData);
                    });
                });
            });
        });

        it("Mutation will correctly use all input", () => {
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
                        id: "${id}"
                        name: "${name}"
                        address: ${toFormattedString(address)}
                    }
                ) {
                    ${standardMutationBody}
                }
            }`;
            cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
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