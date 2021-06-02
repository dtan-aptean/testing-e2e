/// <reference types="cypress" />

import { toFormattedString } from "../support/commands";

const loginUrl = 'https://tst.apteanecommerce.com/en/login?returnUrl=%2Fen%2F';
const term = 'roleAccessTest';
const password = 'Aptean123';
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
let accountNum = 1;

describe("Customer Role Access", function () {
    before(() => {
        cy.visit(loginUrl);
        cy.login();

        // Ensures theme is set to default
        cy.visit('https://tst.apteanecommerce.com/Admin/Setting/GeneralCommon');
        cy.get('input[value="ApteanDefault"]').click();
        cy.get('button[name="save"]').click();

        // Ensures proper ignore configs are set.
        cy.get('li').contains('Configuration').click({ force: true });
        cy.get('li').contains('Settings').click({ force: true });
        cy.get('li').contains('Catalog settings').click({ force: true });
        cy.get('div[id="catalogsettings-performance"]').then((res) => {
            if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
                cy.get('div[id="catalogsettings-performance"]').click();
            };
            cy.get('input[id="IgnoreAcl"').then((res) => {
                if (res[0].checked === false) {
                } else {
                    cy.get('input[id="IgnoreAcl"').check({ force: true });
                    cy.get('button[name="save"]').click();
                };
            });
        });

        // Ensures Newsletter is deactivated
        cy.visit('https://tst.apteanecommerce.com/admin/NewsletterPopupAdmin/Settings');
        cy.get('input[id="Enabled"]').then((res) => {
            if (res[0].checked === true) {
                cy.get('input[id="Enabled"]').click();
            };
        });
        cy.get('input[id="PreselectDoNotShowPopupCheckbox"]').then((res) => {
            if (res[0].checked !== true) {
                cy.get('input[id="PreselectDoNotShowPopupCheckbox"]').click();
            };
        });
        cy.get('button[name="save"]').click();

        // Get all the customer roles we need to test - not currently in use.
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

        // let length = roles.length;
        // cy.wrap(roles).as('roles');

        // Generates the user profiles we use in every test - not currently in use.
        // cy.get('li').contains('Customers').click();
        // cy.get('a[href*="/Admin/Customer/List"]').first().click().then(() => {
        //     // TODO: change number - currently, just for quick testing
        //     for (let i = 0; i < length; i++) {
        //         let role = roles[i].name;
        //         let num = i+1;
        //         let email = 'roleAccessTest' + num + '@test.com'
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

        cy.get('a[href="/en/logout"]').click();
    });

    context('Categories', () => {
        const catFirst = 'Categories';
        const catSec = 'Category';
        const catThird = 'categories';

        before(() => {
            generateTestItems(catFirst, catSec);
        });

        beforeEach(() => {
            accessTestData(catFirst);
        });

        afterEach(() => {
            cy.get('a[href="/en/logout"]').click();
        });

        after(() => {
            clearTestData(catFirst, catSec, catThird);
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
    });

    context('Manufacturers', () => {
        const manuFirst = 'Manufacturers';
        const manuSec = 'Manufacturer';
        const manuThird = 'manufacturers';

        before(() => {
            generateTestItems(manuFirst, manuSec);
        });

        beforeEach(() => {
            accessTestData(manuFirst);
        });

        afterEach(() => {
            cy.get('a[href="/en/logout"]').click();
        });

        after(() => {
            clearTestData(manuFirst, manuSec, manuThird);
        });

        it('The ' + roles[0].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[1].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[2].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[3].name + ' profile should only be able to see manufacturers of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('exist');
            // });
        });
    });

    context('Products', () => {
        const productFirst = 'Products';
        const productSec = 'Product';
        const productThird = 'products';
        before(() => {
            generateTestItems(productFirst, productSec);
        });

        beforeEach(() => {
            accessTestData(productFirst);
        });

        afterEach(() => {
            cy.get('a[href="/en/logout"]').click();
        });

        after(() => {
            clearTestData(productFirst, productSec, productThird);
        });

        it('The ' + roles[0].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[1].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[2].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('not.exist');
            // });
        });

        it('The ' + roles[3].name + ' profile should only be able to see products of the same type', () => {
            // cy.get('@data').then(data => {
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[0].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[1].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[2].name).should('not.exist');
            cy.get('div[class="item-box"]').contains(term + ' ' + roles[3].name).should('exist');
            // });
        });
    });
});

function generateTestItems(first, second) {
    cy.visit(loginUrl);
    cy.login();
    cy.get('.administration').click();
    cy.get('li').contains('Catalog').click();
    cy.get('li').contains(first).click().then(() => {
        let length = roles.length;
        for (let i = 0; i < length; i++) {
            let name = roles[i].name;
            cy.get('a[href="/Admin/' + second + '/Create"]').click().then(() => {
                if (first === 'Manufacturers') {
                    mappingSettings('div[id="manufacturer-mappings"]');
                } else if (first === 'Categories') {
                    mappingSettings('div[id="category-mappings"]');
                }
            });
            cy.get('input[id="Name"]').type(term + ' ' + name);
            cy.get('input[aria-describedby="SelectedCustomerRoleIds_taglist"]').type(name);
            cy.wait(100);
            cy.get('input[aria-describedby="SelectedCustomerRoleIds_taglist"]').type('{enter}');
            cy.get('button[name="save"]').click();
        }
    });
    cy.get('a[href="/en/logout"]').click();
};

function mappingSettings(mapping) {
    cy.get(mapping).then((res) => {
        if (res[0].firstChild.lastChild.firstChild.firstChild.classList.contains('fa-plus')) {
            cy.get('div[id="catalogsettings-performance"]').click({ force: true });
        };
    });
};

function accessTestData(type) {
    cy.visit(loginUrl);
    cy.get("#Email")
        .type('roleAccessTest' + accountNum + '@test.com')
        .get("#Password")
        .type(password)
        .get("form > .buttons > .button-1")
        .click().then(() => {
            if (type === 'Products' || type === 'Categories') {
                cy.get('input[id="small-searchterms"]').type(term, { force: true });
                cy.get('.search-box-button').click();
            } else if (type === 'Manufacturers') {
                cy.visit('https://tst.apteanecommerce.com/en/manufacturer/all');
            }
            accountNum++;
        });
};

function clearTestData(first, second, third) {
    cy.visit(loginUrl);
    cy.wait(100);
    cy.get("input[class*='email']").type(Cypress.config("username"), { force: true });
    cy.wait(100);
    cy.get(".password").type(Cypress.config("password"), { force: true });
    cy.wait(100);
    cy.get(".login-button").click({ force: true });
    cy.wait(100);
    cy.get('.administration').click({ force: true });
    cy.wait(100);
    cy.get('li').contains('Catalog').click({ force: true });
    cy.wait(100);
    cy.get('li').contains(first).click({ force: true });
    cy.wait(100);
    cy.get('input[name*="Search' + second + 'Name"]').type(term, { force: true });
    cy.wait(100);
    cy.get('[id*="search-' + third + '"]').click({ force: true });
    cy.wait(100);
    cy.get('input[class="mastercheckbox"]').first().check({ force: true });
    cy.wait(100);
    cy.get('button').contains('Delete').click({ force: true });
    cy.wait(100);
    cy.get('button').contains('Yes').click({ force: true });
    cy.wait(100);
    accountNum = 1;
};