/// <reference types="cypress"/>

import { should } from "chai";

describe('Ecommerce Portal', function() {
    context('Language Service APIs', () => {

        it('Register must return success', () => {
            var tenantId = 'tenant-id';
            cy.request('POST', '/language/service/register', {
                tenantId:tenantId
            }).should((response) => {
                expect(response.status).to.eq(200)
                expect(response.body.successful).to.be.true
                expect(response.body.tenantId).to.eq(tenantId)
            })
        })

    })
})