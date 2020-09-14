Cypress.Commands.add('fromPublicStore_loginAsUser', (userProfile) => {  
  cy.get('.ico-login').click()

  cy.get('#Email')
    .type(userProfile.username)
    .get('#Password')
    .type(userProfile.password)
    .get('form > .buttons > .button-1')
    .click()
});

Cypress.Commands.add('fromPublicStore_logout', () => {  
  cy.get('.ico-logout').click()
});

Cypress.Commands.add('fromPublicStore_QuickCheckout', (profileName) => {  
  cy.get('.ico-cart')
    .should('be.visible')
    .click();

  cy.get('#termsofservice')
    .should('be.visible')
    .check()    
    .should('be.visible')
    .get('#checkout')
    .click()
});

Cypress.Commands.add('fromCheckoutAsGuest_FillForm', (profile) => {  

  var contactDetails = [
    {
      key: '#BillingNewAddress_FirstName',
      value: profile.firstName
    },
    {
      key: '#BillingNewAddress_LastName',
      value: profile.lastName
    },
    {
      key: '#BillingNewAddress_Email',
      value: profile.email
    },
    {
      key: '#BillingNewAddress_City',
      value: profile.city
    },
    {
      key: '#BillingNewAddress_Address1',
      value: profile.address
    },
    {
      key: '#BillingNewAddress_PhoneNumber',
      value: profile.phone
    },
    {
      key: '#BillingNewAddress_ZipPostalCode',
      value: profile.zipcode
    }
  ];
  var dropDowns = [    
    {
      key: '#BillingNewAddress_CountryId',
      value: profile.countryId
    },
    {
      key: '#BillingNewAddress_StateProvinceId',
      value: profile.stateId
    },
  ];
  contactDetails.forEach(detail => {
    cy.get(detail.key)
    .type(detail.value)
    .should('have.value', detail.value);
  });
  dropDowns.forEach(detail => {
    cy.get(detail.key)
    .select(detail.value)
    .should('have.value', detail.value);
  });

});

Cypress.Commands.add('getIframeBody', (iFrameName) => {
  // get the iframe > document > body
  // and retry until the body element is not empty
  return cy
    .get(iFrameName)
    .its('0.contentDocument.body').should('not.be.empty')
    // wraps "body" DOM element to allow
    // chaining more Cypress commands, like ".find(...)"
    // https://on.cypress.io/wrap
    .then(cy.wrap);
});

