
import { toFormattedString } from "../../../support/commands";

// TEST COUNT: 10
describe('Mutation: createAddress', () => {
    let email = '';
    let vendorId = '';
    let companyId = '';
    let goldId = '';
    let adminId = '';
    const mutationName = 'createAddress';
    const deleteMutName = "deleteAddress";
    const queryName = "addresses";
    const itemPath = 'address';
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
    const requiredItems = `
        companyId
        customerId
        addressType
        contactDetails {
            phone {
                phoneNumber
                phoneType
            }
            address {
                country
                postalCode
                region
            }
        }
    `;

    before(() => {

    });

    // afterEach(() => {
    //     let query = `{
    //         ${queryName}(searchString: "${email}", orderBy: {direction: ASC, field: NAME }) {
    //             nodes {
    //                 id
    //                 email
    //             }
    //             totalCount
    //         }
    //     }`;
    //     if (email !== '') {
    //         cy.postAndValidate(query, 'customers').then((res) => {
    //             debugger;
    //             let id = res.body.data[queryName].nodes[0].id;
    //             const deleteName = 'deleteCustomer';
    //             const mutation = `mutation {
    //                     ${deleteName}(input: { id: "${id}" }) {
    //                         ${standardMutationContent}
    //                     }
    //                 }`;
    //             cy.postMutAndValidate(mutation, deleteMutName, 'deleteMutation').then((res) => {
    //                 email = '';
    //             });
    //         });
    //     };
    // });

    context("Testing Address API's required inputs", () => {
        // it("Mutation will succeed with a minimum of ", () => {
        //     const input = `

        //     `;
        //     const mutation = `mutation {
        //         ${mutationName}(
        //             input: {
        //                 customerId: "D3BE1F72-94F8-41BE-9D9E-638E6BCBCFF2",
        //                 companyId: "a30211bc-7791-47d1-9ab3-fd8dab29f516",
        //                 addressType: SHIPPING,
        //                 contactDetails: {
        //                     phone: {
        //                         phoneNumber: "Cadia"
        //                         phoneType: UNKNOWN
        //                     }
        //                     address: {
        //                         country: "Cadia"
        //                         postalCode: "Pylons"
        //                         region: "Eye of Terror"
        //                     }
        //                 }
        //             }
        //         ) {
        //             ${standardMutationContent}
        //             ${itemPath} {
        //                 ${requiredItems}
        //             }
        //         }
        //     }`;
        //     cy.postMutAndValidate(mutation, mutationName, itemPath).then((res) => {
        //         debugger;
        //         email = res.body.data[mutationName][itemPath].email;
        //     });
        // });
    });
});