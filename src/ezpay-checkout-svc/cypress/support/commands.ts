// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })


// -- This will post GQL query for checkout service --
Cypress.Commands.add("postGQLCheckoutConsumer", (query) => {
  return cy.request({
    method: "POST",
    url: `${Cypress.env("api-svc-url")}/graphql`,
    headers: {
      "x-aptean-apim": Cypress.env("x-aptean-apim-checkout-consumer"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-tenant-secret": Cypress.env("x-aptean-tenant-secret"),
      "x-aptean-product": Cypress.env("x-aptean-product"),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

// -- This will create a checkout session --
Cypress.Commands.add("createCheckoutSession", () => {
 const mutation = `mutation {
   createCheckoutSession(
     input: {
       amount: 1200
       cancelUrl: "www.youtube.com"
       successUrl: "www.google.com"
       currency: USD
       failOnReview: true
       immediateCapture: true
       orderDetails: {
         customerReferenceNumber: "ref"
         lineItems: [
           {
             currency: USD
             description: "desc"
             quantity: 1
             totalAmount: 100
             unitOfMeasure: "pieces"
             unitPrice: 100
           }
         ]
         orderType: GOODS
         shortDescription: "SHORTDESC"
         taxAmount: 2
       }
       payerDetails: {
         address: { country: "NL", postalCode: "4711 JJ" }
         email: "fjongmans@aptean.com"
         name: "Ferry Jongmans"
         phone: { countryCode: "+31", number: "0623963878" }
       }
     }
   ) {
     checkoutSession {
       id
     }
   }
 }
 `;
 return cy.postGQLCheckoutConsumer(mutation);
});