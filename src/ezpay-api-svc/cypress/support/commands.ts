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
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

// -- This will post GQL query --
Cypress.Commands.add("postGQL", (query) => {
  return cy.request({
    method: "POST",
    url: "/graphql",
    headers: {
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-tenant-secret": Cypress.env("x-aptean-tenant-secret"),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

//-- This will post GQL query with bearer token --
Cypress.Commands.add("postGQLBearer", (query) => {
  return cy.request({
    method: "POST",
    url: "/graphql",
    headers: {
      authorization: Cypress.env("authorization"),
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

// -- This will upload an invoice and return the invoiceRef number --
Cypress.Commands.add("getInvoiceRef", () => {
  const settings = {
    url: Cypress.env("api-svc-url"),
    method: "POST",
    headers: {
      accept: " */*",
      "content-type": [
        " multipart/form-data; boundary=----WebKitFormBoundaryyvKAJwzxkixBJ6vF",
      ],
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-ezpay": Cypress.env("x-ezpay"),
      "x-aptean-tenant-secret": Cypress.env("x-aptean-tenant-secret"),
    },
    data: `------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="operations"\r\n\r\n{"operationName":"uploadDocument","variables":{"input":{"file":null}},"query":"mutation uploadDocument($input: UploadInput!) { upload(input: $input) { uniqueId } }\\n"}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="map"\r\n\r\n{"1":["variables.input.file"]}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="1"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.3\r\n%����\r\n\r\n1 0 obj\r\n<<\r\n/Type /Catalog\r\n/Outlines 2 0 R\r\n/Pages 3 0 R\r\n>>\r\nendobj\r\n\r\n2 0 obj\r\n<<\r\n/Type /Outlines\r\n/Count 0\r\n>>\r\nendobj\r\n\r\n3 0 obj\r\n<<\r\n/Type /Pages\r\n/Count 2\r\n/Kids [ 4 0 R 6 0 R ] \r\n>>\r\nendobj\r\n\r\n4 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 5 0 R\r\n>>\r\nendobj\r\n\r\n5 0 obj\r\n<< /Length 1074 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( A Simple PDF File ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( This is a small demonstration .pdf file - ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( just for use in the Virtual Mechanics tutorials. More text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 628.8480 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 616.8960 Td\r\n( text. And more text. Boring, zzzzz. And more text. And more text. And ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 604.9440 Td\r\n( more text. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 592.9920 Td\r\n( And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 569.0880 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 557.1360 Td\r\n( text. And more text. And more text. Even more. Continued on page 2 ...) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n6 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 7 0 R\r\n>>\r\nendobj\r\n\r\n7 0 obj\r\n<< /Length 676 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( Simple PDF File 2 ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( ...continued from page 1. Yet more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 676.6560 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( text. Oh, how boring typing this stuff. But not as boring as watching ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( paint dry. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 640.8000 Td\r\n( Boring.  More, a little more text. The end, and just as well. ) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n8 0 obj\r\n[/PDF /Text]\r\nendobj\r\n\r\n9 0 obj\r\n<<\r\n/Type /Font\r\n/Subtype /Type1\r\n/Name /F1\r\n/BaseFont /Helvetica\r\n/Encoding /WinAnsiEncoding\r\n>>\r\nendobj\r\n\r\n10 0 obj\r\n<<\r\n/Creator (Rave \\(http://www.nevrona.com/rave\\))\r\n/Producer (Nevrona Designs)\r\n/CreationDate (D:20060301072826)\r\n>>\r\nendobj\r\n\r\nxref\r\n0 11\r\n0000000000 65535 f\r\n0000000019 00000 n\r\n0000000093 00000 n\r\n0000000147 00000 n\r\n0000000222 00000 n\r\n0000000390 00000 n\r\n0000001522 00000 n\r\n0000001690 00000 n\r\n0000002423 00000 n\r\n0000002456 00000 n\r\n0000002574 00000 n\r\n\r\ntrailer\r\n<<\r\n/Size 11\r\n/Root 1 0 R\r\n/Info 10 0 R\r\n>>\r\n\r\nstartxref\r\n2714\r\n%%EOF\r\n\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF--\r\n`,
  };
  return Cypress.$.ajax(settings);
});

// -- This will generate a payment request url --
Cypress.Commands.add("generatePaymentRequest", (requestAmount: Number = 0) => {
  cy.getInvoiceRef()
    .then((uploadResponse) => {
      return uploadResponse.data.upload.uniqueId;
    })
    .then((uniqueId) => {
      let amount = requestAmount;
      if (amount === 0) {
        amount = Cypress._.random(100, 1e3);
      }
      const referenceNumber = Cypress._.random(0, 1e20);
      const gqlQuery = `mutation {
        upsertPaymentRequest(
          input: {
            referenceNumber: "${referenceNumber}"
            type: NONE
            amount: ${amount}
            invoiceRef: "${uniqueId}"
          }
        ) {
          paymentUrl
          paymentRequestId
        }
      }`;
      cy.postGQL(gqlQuery).then((paymentRequest) => {
        // should be 200 ok
        cy.expect(paymentRequest.isOkStatusCode).to.be.equal(true);

        const response = {
          amount,
          invoiceRef: uniqueId,
          paymentUrl: paymentRequest.body.data.upsertPaymentRequest.paymentUrl,
          referenceNumber,
          paymentRequestId:
            paymentRequest.body.data.upsertPaymentRequest.paymentRequestId,
        };
        return response;
      });
    });
});

// -- This will make an api request as an api consumer --
Cypress.Commands.add("postGQLWithIdempotencyKey", (query, idempotencyKey) => {
  return cy.request({
    method: "POST",
    url: "/graphql",
    headers: {
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-tenant-secret": Cypress.env("x-aptean-tenant-secret"),
      "idempotency-key": idempotencyKey,
    },
    body: { query },
    failOnStatusCode: false,
  });
});

//generates a wepay payment method token and calls convertPayfacPaymentMethodToken on it to generate a payment method token
Cypress.Commands.add("generateWePayToken", () => {
  const baseUrl = Cypress.config("baseUrl"); //store the baseUrl
  Cypress.config("baseUrl", ""); //set the baseUrl to null to be able to visit a local file
  cy.visit("./cypress/support/WePayToken.html").then((contentWindow) => {
    cy.get("[id=WePayToken]")
      .invoke("text")
      .then((token) => {
        Cypress.config("baseUrl", baseUrl); //set the baseUrl back to normal now that we don't need the local file anymore
        return token;
      });
  });
});

Cypress.Commands.add(
  "convertPayfacPaymentMethodTokenCreditCard",
  (token: string) => {
    const gqlQuery = `mutation {
    convertPayfacPaymentMethodToken(
      input: {
        token: "${token}"
        type: CREDIT_CARD
        holder: {
          email: "bortbort@snortgort.com"
          name: "John Snow"
          address: { postalCode: "12222", country: "US" }
        }
      }
    ) {
      code
      message
      error
      token {
        id
        livemode
        type
        used
      }
    }
  }
  `;

    cy.postGQL(gqlQuery).then((res) => {
      return res.body.data.convertPayfacPaymentMethodToken.token.id;
    });
  }
);

Cypress.Commands.add("getPaymentMethodStatus", (paymentMethodId: string) => {
  const gqlQuery = `query {
    paymentMethods(id: "${paymentMethodId}") {
      nodes {
        status
      }
    }
  }
  `;

  cy.postGQL(gqlQuery).then((res) => {
    return res.body.data.paymentMethods.nodes[0].status;
  });
});

Cypress.Commands.add("convertPayfacPaymentMethodToken", (token: string) => {
  const gqlQuery = `mutation {
    convertPayfacPaymentMethodToken(input: {
      token: "${token}"
      type: PAYMENT_BANK_US
      holder: {
        email: "something@somewhere.com"
        name: "Somebody Somewhere"
        address: {
          country: "US",
          postalCode: "30022"
        }
        phone: {
          countryCode: "01"
          number: "6783425532"
        }
      }
    }) {
      token {
        id
        type
      }
    }
  }`;

  cy.postGQL(gqlQuery).then((res) => {
    return res.body.data.convertPayfacPaymentMethodToken.token.id;
  });
});

//Queries the tenant for a list of payment methods
Cypress.Commands.add("getPaymentMethods", () => {
  const resourceId = Cypress.env("x-aptean-tenant");
  const gqlQuery = `{
    paymentMethods(resourceId:"${resourceId}") {
        nodes {
            id
            type
        }
        totalCount
    }
  }`;
  cy.postGQL(gqlQuery).then((res) => {
    return res.body.data.paymentMethods;
  });
});

//Calls the createPaymentMethod api after generating a wepay payment method token
Cypress.Commands.add("createPaymentMethod", () => {
  const resourceId = Cypress.env("x-aptean-tenant");
  cy.generateWePayToken().then((token) => {
    cy.convertPayfacPaymentMethodToken(token).then((id) => {
      const gqlQuery = `mutation {
        createPaymentMethod(input: {
          token: "${id}"
          attachToResourceId: "${resourceId}"
        }) {
          code
          error
          message
          paymentMethod {
            id
            owner {
              tenantId
            }
          }
        }
      }`;
      return cy.postGQL(gqlQuery);
    });
  });
});

Cypress.Commands.add("generateWepayTokenCreditCard", () => {
  const settings = {
    url: "https://stage-api.wepay.com/tokens",
    method: "POST",
    timeout: 0,
    headers: {
      "Content-Type": "application/json",
      "app-id": `${Cypress.env("wepay-app-id")}`,
      "app-token": `${Cypress.env("wepay-app-secret")}`,
      "api-version": `${Cypress.env("wepay-api-version")}`,
    },
    data: JSON.stringify({
      resource: "payment_methods",
      payment_methods: {
        type: "credit_card",
        credit_card: {
          card_number: "4111111111111111",
          expiration_month: 12,
          expiration_year: 2025,
          cvv: "007",
        },
      },
    }),
  };
  return Cypress.$.ajax(settings);
});

//generates a payment method id either from an existing payment method on the tenant or creating a new payment method for the tenant
Cypress.Commands.add("generatePaymentMethodId", () => {
  cy.getPaymentMethods().then((paymentMethods) => {
    if (paymentMethods.totalCount > 0) {
      return paymentMethods.nodes[0].id;
    } else {
      cy.createPaymentMethod().then(() => {
        cy.getPaymentMethods().then((newPaymentMethods) => {
          return newPaymentMethods.nodes[0].id;
        });
      });
    }
  });
});

Cypress.Commands.add("getPaymentMethodById", (id: string) => {
  const gqlQuery = `query {
    paymentMethods(id: "${id}") {
      nodes {
        id
        status
        type
      }
    }
  }`;
  cy.postGQL(gqlQuery).then((res) => {
    return res.body.data.paymentMethods.nodes[0];
  });
});

Cypress.Commands.add("deletePerson", (personId) => {
  const gqlQuery = `mutation {
    deletePerson(input: { id: "${personId}" }) {
      code
      message
      error
    }
  }`;

  cy.postGQLBearer(gqlQuery).then((res) => {
    // should be 200 ok
    cy.expect(res.isOkStatusCode).to.be.equal(true);

    // should have errors
    assert.notExists(
      res.body.errors,
      `One or more errors ocuured while executing query: ${gqlQuery}`
    );

    // has data
    assert.exists(res.body.data);
  });
});

Cypress.Commands.add(
  "generatePaymentRequestAndPay",
  (requestAmount: Number = 0, immediateCapture: Boolean = true) => {
    cy.generatePaymentRequest(requestAmount).then((paymentRequest) => {
      cy.generateWepayTokenCreditCard()
        .then((payfacToken) => {
          cy.wait(1000).then(() => {
            return cy
              .convertPayfacPaymentMethodTokenCreditCard(payfacToken.id)
              .then((paymentMethodId) => {
                return paymentMethodId;
              });
          });
        })
        .then((paymentMethodId) => {
          // payment
          const gqlQuery = `mutation {
          createPayment(
            input: {
              paymentMethodId: "${paymentMethodId}",
              paymentRequestId: "${paymentRequest.paymentRequestId}"
              amount: ${paymentRequest.amount}
              immediateCapture: ${immediateCapture}
              currency: ${Cypress.env("currency")}
              riskMetadata: {
                address: { postalCode: "12222", country: "US" }
                phone: { countryCode: "1", number: "222111445" }
                lineItems: {
                  description: "TestLine"
                  price: ${paymentRequest.amount}
                  currency: ${Cypress.env("currency")}
                  quantity: 1
                }
              }
            }
          ) {
            code
            message
            error
            payment {
              id
              status
            }
          }
        }
        `;

          cy.postGQLWithIdempotencyKey(
            gqlQuery,
            paymentRequest.paymentRequestId
          ).then((res) => {
            // should be 200 ok
            cy.expect(res.isOkStatusCode).to.be.equal(true);

            // should have errors
            assert.notExists(
              res.body.errors,
              `One or more errors ocuured while executing query: ${gqlQuery}`
            );

            // has data
            assert.exists(res.body.data);

            // assertions
            assert.isNotNull(res.body.data.createPayment);
            assert.isNotNull(res.body.data.createPayment.code);
            assert.isNotNull(res.body.data.createPayment.payment.id);
            assert.isNull(res.body.data.createPayment.error);
            assert.equal(
              res.body.data.createPayment.code,
              "SUCCESS",
              "Code is not SUCCESS"
            );

            const id = res.body.data.createPayment.payment.id;
            const amount = paymentRequest.amount;
            return { id: id, amount: amount };
          });
        });
    });
  }
);

Cypress.Commands.add("getWePayAccount", (accountId) => {
  const settings = {
    url: `https://stage-api.wepay.com/accounts/${accountId}`,
    method: "GET",
    timeout: 0,
    headers: {
      "Content-Type": "application/json",
      "app-id": `${Cypress.env("wepay-app-id")}`,
      "app-token": `${Cypress.env("wepay-app-secret")}`,
      "api-version": `${Cypress.env("wepay-api-version")}`,
    },
  };
  return Cypress.$.ajax(settings);
});
