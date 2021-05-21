/// <reference types="cypress" />

import { confirmStorefrontEnvValues, createInfoDummy, SupplementalItemRecord, toFormattedString } from "../../support/commands";
var term = 'roleAccessTest';
var aclInitialState;
var accountNum = 1;
var password = 'Aptean123';
const roles = [
    {
        "id": "e069e75b-dc2f-4f99-a3cf-b8b910ed96f0",
        "name": "Administrators"
    },
    {
        "id": "7f83a1cb-c367-463e-85ff-e645ff50e309",
        "name": "API Test Role"
    },
    {
        "id": "b13b95ff-195d-4f38-80c6-664f24caf03e",
        "name": "Forum Moderators"
    },
    {
        "id": "778c9051-9651-4cdf-9f45-3b9d7937db4f",
        "name": "Gold"
    },
];

describe("Customer Role Access", function () {
    // before(() => {
    // Get all the customer roles we need to test - not
    // const customerRoles = "customerRoles";
    // const rolesQuery = `{
    //     ${customerRoles} (orderBy: {direction: ASC, field: NAME}) {
    //         nodes {
    //             id
    //             name
    //         }
    //     }
    // }`;
    // cy.postAndValidate(rolesQuery, customerRoles).then((res) => {
    // const roles = res.body.data[customerRoles].nodes;

    // var length = roles.length;
    // cy.wrap(roles).as('roles');

    // cy.get('li').contains('Customers').click();
    // cy.get('a[href*="/Admin/Customer/List"]').first().click().then(() => {
    //     // TODO: change number - currently, just for quick testing
    //     for (let i = 0; i < length; i++) {
    //         var role = roles[i].name;
    //         var num = i+1;
    //         var email = 'roleAccessTest' + num + '@test.com'
    //         cy.get('input[name*="SearchEmail"]').type(email);
    //         cy.get('[id*="search-customers"]').click();
    //         cy.wait(100);
    //         cy.get('.btn').contains('Edit').click();
    //         cy.get('input[aria-describedby="SelectedCustomerRoleIds_taglist"]').click();
    //         cy.get('li').contains(role).click();
    //         cy.get('button').contains('Save').click();
    //     }
    // });
    // });
    // });

    context('Categories', () => {
        before(() => {
            // cy.get('@roles').then(roles => {
            var mutationName = 'createCategory';
            var queryName = "categories";
            var itemPath = 'category';
            var infoName = "categoryInfo";
            cy.visit('https://tst.apteanecommerce.com/');
            cy.login();
            cy.get('.administration').click();
            cy.get('li').contains('Configuration').click();
            cy.get('li').contains('Settings').click();
            cy.get('li').contains('Catalog settings').click();
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click();
                }
                cy.get('input[id="IgnoreAcl"').then((res) => {
                    if (res[0].checked === false) {
                        aclInitialState = false;
                    } else {
                        aclInitialState = true;
                        cy.get('input[id="IgnoreAcl"').check();
                        cy.get('button[name="save"]').click();
                    };
                    cy.get('a[href="/en/logout"]').click();
                });
            });
            generateData(roles, mutationName, queryName, itemPath, infoName);
            // });
        });
        beforeEach(() => {
            cy.visit('https://tst.apteanecommerce.com/');
            cy.get(".ico-login").click();
            cy.get("#Email")
                .type('roleAccessTest' + accountNum + '@test.com')
                .get("#Password")
                .type(password)
                .get("form > .buttons > .button-1")
                .click();
            cy.get('input[id="small-searchterms"]').type('categories');
            cy.get('.search-box-button').click();
            cy.get('.menu-toggle').click();
            accountNum++
        });

        it('The ' + roles[0].name + ' profile should only be able to see categories of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[1].name + ' profile should only be able to see categories of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[2].name + ' profile should only be able to see categories of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[3].name + ' profile should only be able to see categories of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('exist');
            // });
        });

        after(() => {
            cy.visit('https://tst.apteanecommerce.com/en/login?returnUrl=%2Fen%2F');
            cy.get(".email").type(Cypress.config("username"), { force: true });
            cy.get(".password").type(Cypress.config("password"));
            cy.get(".login-button").click();
            cy.get('.administration').click({ force: true });
            cy.get('li').contains('Configuration').click({ force: true });
            cy.get('li').contains('Settings').click({ force: true });
            cy.get('li').contains('Catalog settings').click({ force: true });
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click({ force: true });
                };
                if (res[0].checked !== aclInitialState) {
                    cy.get('input[id="IgnoreAcl"').check({ force: true });
                    cy.get('button[name="save"]').click({ force: true });
                };
            });
            cy.get('li').contains('Catalog').click({ force: true });
            cy.get('li').contains('Categories').click({ force: true });
            cy.get('input[name*="SearchCategoryName"]').type(term, { force: true });
            cy.wait(100);
            cy.get('button[id*="search-categories"]').click({ force: true });
            cy.wait(100);
            cy.get('[type="checkbox"]').first().click({ force: true });
            cy.wait(100);
            cy.get('button').contains('Delete').click({ force: true });
            cy.wait(100);
            cy.get('button').contains('Yes').click({ force: true });
            accountNum = 1;
        });
    });

    context('Manufacturers', () => {
        before(() => {
            // cy.get('@roles').then(data => {
            var mutationName = 'createManufacturer';
            var queryName = "manufacturers";
            var itemPath = 'manufacturer';
            var infoName = "manufacturerInfo";

            cy.visit('https://tst.apteanecommerce.com/');
            cy.login();
            cy.get('.administration').click();
            cy.get('li').contains('Configuration').click();
            cy.get('li').contains('Settings').click();
            cy.get('li').contains('Catalog settings').click();
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click();
                }
                cy.get('input[id="IgnoreAcl"').then((res) => {
                    if (res[0].checked === false) {
                        aclInitialState = false;
                    } else {
                        aclInitialState = true;
                        cy.get('input[id="IgnoreAcl"').check();
                        cy.get('button[name="save"]').click();
                    };
                    cy.get('a[href="/en/logout"]').click();
                });
            });
            generateData(roles, mutationName, queryName, itemPath, infoName);
            // });
        });
        beforeEach(() => {
            cy.visit('https://tst.apteanecommerce.com/');
            cy.get(".ico-login").click();
            cy.get("#Email")
                .type('roleAccessTest' + accountNum + '@test.com')
                .get("#Password")
                .type(password)
                .get("form > .buttons > .button-1")
                .click();
            cy.get('input[id="small-searchterms"]').type('categories');
            cy.get('.search-box-button').click();
            cy.get('div').contains('Manufacturer').click();
            cy.get('a[href*="/en/manufacturer/all"]').click();
            accountNum++;
        });

        it('The ' + roles[0].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[1].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[2].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[3].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('li').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('li').contains(term + ' ' + roles[3].name).should('exist');
            // });
        });

        after(() => {
            cy.visit('https://tst.apteanecommerce.com/en/login?returnUrl=%2Fen%2F');
            cy.get(".email").type(Cypress.config("username"), { force: true });
            cy.get(".password").type(Cypress.config("password"), { force: true });
            cy.get(".login-button").click();
            cy.get('.administration').click({ force: true });
            cy.get('li').contains('Configuration').click({ force: true });
            cy.get('li').contains('Settings').click({ force: true });
            cy.get('li').contains('Catalog settings').click({ force: true });
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click({ force: true });
                };
                if (res[0].checked !== aclInitialState) {
                    cy.get('input[id="IgnoreAcl"').check({ force: true });
                    cy.get('button[name="save"]').click({ force: true });
                };
            });
            cy.get('li').contains('Catalog').click({ force: true });
            cy.get('li').contains('Manufacturers').click({ force: true });
            cy.wait(100);
            cy.get('input[name*="SearchManufacturerName"]').type(term, { force: true });
            cy.wait(100);
            cy.get('[id*="search-manufacturers"]').click({ force: true });
            cy.wait(100)
            cy.get('[type="checkbox"]').first().check({ force: true });
            cy.wait(100);
            cy.get('button').contains('Delete').click({ force: true });
            cy.wait(100);
            cy.get('button').contains('Yes').click({ force: true });
            accountNum = 1;
        });
    });

    context('Products', () => {
        before(() => {
            cy.visit('https://tst.apteanecommerce.com/');
            cy.login();
            cy.get('.administration').click();
            cy.get('li').contains('Configuration').click();
            cy.get('li').contains('Settings').click();
            cy.get('li').contains('Catalog settings').click();
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click();
                };
                cy.get('input[id="IgnoreAcl"').then((res) => {
                    debugger;
                    if (res[0].checked === false) {
                        aclInitialState = false;
                    } else {
                        aclInitialState = true;
                        cy.get('input[id="IgnoreAcl"').check({ force: true });
                        cy.get('button[name="save"]').click();
                    };
                });
            });
            cy.get('li').contains('Catalog').click();
            cy.get('li').contains('Products').click().then(() => {
                var length = roles.length;
                for (let i = 0; i < length; i++) {
                    var name = roles[i].name;
                    cy.get('a[href="/Admin/Product/Create"]').click();
                    cy.get('input[id="Name"]').type(term + ' ' + name);
                    cy.get('input[aria-describedby="SelectedCustomerRoleIds_taglist"]').click();
                    cy.get('li').contains(name).click();
                    cy.get('button[name="save"]').click();
                }
            });
            cy.get('a[href="/en/logout"]').click();
        });

        beforeEach(() => {
            cy.visit('https://tst.apteanecommerce.com/');
            cy.get(".ico-login").click();
            cy.get("#Email")
                .type('roleAccessTest' + accountNum + '@test.com')
                .get("#Password")
                .type(password)
                .get("form > .buttons > .button-1")
                .click();
            cy.get('input[id="small-searchterms"]').type(term);
            cy.get('.search-box-button').click();
            accountNum++;
        });

        it('The ' + roles[0].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div').contains(term + ' ' + roles[0].name).should('exist');
            cy.get('div').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[1].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[1].name).should('exist');
            cy.get('div').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[2].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[2].name).should('exist');
            cy.get('div').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[3].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div').contains(term + ' ' + roles[3].name).should('exist');
            // });
        });


        after(() => {
            cy.visit('https://tst.apteanecommerce.com/en/login?returnUrl=%2Fen%2F');
            cy.get(".email").type(Cypress.config("username"), { force: true });
            cy.get(".password").type(Cypress.config("password"), { force: true });
            cy.get(".login-button").click();
            cy.get('.administration').click({ force: true });
            cy.get('li').contains('Configuration').click({ force: true });
            cy.get('li').contains('Settings').click({ force: true });
            cy.get('li').contains('Catalog settings').click({ force: true });
            cy.get('div[id="catalogsettings-performance"]').then((res) => {
                if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                    cy.get('div[id="catalogsettings-performance"]').click({ force: true });
                };
                if (res[0].checked !== aclInitialState) {
                    cy.get('input[id="IgnoreAcl"').check({ force: true });
                    cy.get('button[name="save"]').click({ force: true });
                };
            });
            cy.get('li').contains('Catalog').click({ force: true });
            cy.get('li').contains('Products').click({ force: true });
            cy.wait(100);
            cy.get('input[name*="SearchProductName"]').type(term, { force: true });
            cy.wait(100);
            cy.get('[id*="search-products"]').click({ force: true });
            cy.wait(100)
            cy.get('[type="checkbox"]').first().check({ force: true });
            cy.wait(100);
            cy.get('button').contains('Delete').click({ force: true });
            cy.wait(100);
            cy.get('button').contains('Yes').click({ force: true });
            accountNum = 1;
        });
    });
});

function generateData(roles, mutationName, queryName, itemPath, infoName) {
    var length = roles.length;
    for (let i = 0; i < length; i++) {
        var role = roles[i];
        var roleName = role.name;
        var id = term + roleName;
        var info = [{
            name: term + ' ' + roleName,
            description: `Cypress ${mutationName} test`,
            languageCode: "Standard"
        }];
        var customData = {
            data: `${itemPath} customData`,
            canDelete: true
        };
        var accessibleRoles = [roles[i].id];
        const mutation = `mutation {
                ${mutationName}(
                    input: {
                        ${infoName}: ${toFormattedString(info)}
                        customData: ${toFormattedString(customData)}
                        roleBasedAccess: {
                            enabled: true,
                            roleIds: ${toFormattedString(accessibleRoles)}

                        }
                        published: true
                    }
                ) {
                    code
                    message
                    error
                    ${itemPath} {
                        id
                        ${infoName} {
                            name
                        }
                        customData
                    }
                }
            }`;
        cy.postMutAndValidate(mutation, mutationName, itemPath);
    };
}