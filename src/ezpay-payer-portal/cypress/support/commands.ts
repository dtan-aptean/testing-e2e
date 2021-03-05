Cypress.Commands.add("login", () => {
  sessionStorage.clear();

  cy.visit("/");

  cy.get("body").then(($body) => {
    if ($body.find("[data-cy=sign-in]").length) {
      cy.get("[data-cy=sign-in]").click();
      cy.wait(10000);

      // check if clicking sign in automatically logs you in, else enter credentials on B2C page
      cy.get("body").then(($body) => {
        if ($body.find("input[id=logonIdentifier]").length) {
          cy.get("input[id=logonIdentifier]").type(Cypress.config("username"));
          cy.get("input[id=password]").type(Cypress.config("password"));
          cy.get("button[id=next]").click();
        }
      });
    }
  });
});

// -- Gets an input element based on selector (data-cy value) --
Cypress.Commands.add("getInput", (selector) => {
  return cy.get(`[data-cy=${selector}]`).find("input");
});

// -- Gets a select element based on selector (data-cy value) --
Cypress.Commands.add("getSelect", (selector) => {
  return cy.get(`[data-cy=${selector}]`).find("select");
});

// -- This will post GQL query --
Cypress.Commands.add("postGQL", (query) => {
  return cy.request({
    method: "POST",
    url: Cypress.env("api-svc-url"),
    headers: {
      authorization: Cypress.env("authorization"),
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-ezpay": Cypress.env("x-ezpay"),
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
      authorization: Cypress.env("authorization"),
      "content-type": [
        " multipart/form-data; boundary=----WebKitFormBoundaryyvKAJwzxkixBJ6vF",
      ],
      "x-aptean-tenant": Cypress.env("x-aptean-tenant"),
      "x-aptean-apim": Cypress.env("x-aptean-apim"),
      "x-ezpay": Cypress.env("x-ezpay"),
    },
    data: `------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="operations"\r\n\r\n{"operationName":"uploadDocument","variables":{"input":{"file":null}},"query":"mutation uploadDocument($input: UploadInput!) { upload(input: $input) { uniqueId } }\\n"}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="map"\r\n\r\n{"1":["variables.input.file"]}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="1"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.3\r\n%����\r\n\r\n1 0 obj\r\n<<\r\n/Type /Catalog\r\n/Outlines 2 0 R\r\n/Pages 3 0 R\r\n>>\r\nendobj\r\n\r\n2 0 obj\r\n<<\r\n/Type /Outlines\r\n/Count 0\r\n>>\r\nendobj\r\n\r\n3 0 obj\r\n<<\r\n/Type /Pages\r\n/Count 2\r\n/Kids [ 4 0 R 6 0 R ] \r\n>>\r\nendobj\r\n\r\n4 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 5 0 R\r\n>>\r\nendobj\r\n\r\n5 0 obj\r\n<< /Length 1074 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( A Simple PDF File ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( This is a small demonstration .pdf file - ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( just for use in the Virtual Mechanics tutorials. More text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 628.8480 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 616.8960 Td\r\n( text. And more text. Boring, zzzzz. And more text. And more text. And ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 604.9440 Td\r\n( more text. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 592.9920 Td\r\n( And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 569.0880 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 557.1360 Td\r\n( text. And more text. And more text. Even more. Continued on page 2 ...) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n6 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 7 0 R\r\n>>\r\nendobj\r\n\r\n7 0 obj\r\n<< /Length 676 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( Simple PDF File 2 ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( ...continued from page 1. Yet more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 676.6560 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( text. Oh, how boring typing this stuff. But not as boring as watching ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( paint dry. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 640.8000 Td\r\n( Boring.  More, a little more text. The end, and just as well. ) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n8 0 obj\r\n[/PDF /Text]\r\nendobj\r\n\r\n9 0 obj\r\n<<\r\n/Type /Font\r\n/Subtype /Type1\r\n/Name /F1\r\n/BaseFont /Helvetica\r\n/Encoding /WinAnsiEncoding\r\n>>\r\nendobj\r\n\r\n10 0 obj\r\n<<\r\n/Creator (Rave \\(http://www.nevrona.com/rave\\))\r\n/Producer (Nevrona Designs)\r\n/CreationDate (D:20060301072826)\r\n>>\r\nendobj\r\n\r\nxref\r\n0 11\r\n0000000000 65535 f\r\n0000000019 00000 n\r\n0000000093 00000 n\r\n0000000147 00000 n\r\n0000000222 00000 n\r\n0000000390 00000 n\r\n0000001522 00000 n\r\n0000001690 00000 n\r\n0000002423 00000 n\r\n0000002456 00000 n\r\n0000002574 00000 n\r\n\r\ntrailer\r\n<<\r\n/Size 11\r\n/Root 1 0 R\r\n/Info 10 0 R\r\n>>\r\n\r\nstartxref\r\n2714\r\n%%EOF\r\n\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF--\r\n`,
  };
  return Cypress.$.ajax(settings);
});

// -- This will generate a payment request url --
Cypress.Commands.add("generatePaymentRequest", () => {
  cy.getInvoiceRef()
    .then((uploadResponse) => {
      return uploadResponse.data.upload.uniqueId;
    })
    .then((uniqueId) => {
      const amount = Cypress._.random(0, 1e3);
      const referenceNumber = Cypress._.random(0, 1e6);
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
        }
      }`;
      cy.postGQL(gqlQuery).then((paymentRequest) => {
        // should be 200 ok
        cy.expect(paymentRequest.isOkStatusCode).to.be.equal(true);

        const response = {
          paymentUrl: paymentRequest.body.data.upsertPaymentRequest.paymentUrl,
        };
        return response;
      });
    });
});

Cypress.Commands.add("getPaymentRequestInfo", (urlToken) => {
  const gqlQuery = `query {
    paymentRequestFromUrlToken (urlToken: "${urlToken}") {
      amount
      referenceNumber
      status
      merchantName
      refundPolicy
    }
  }`;

  cy.postGQL(gqlQuery).then((response) => {
    // should be 200 ok
    cy.expect(response.isOkStatusCode).to.be.equal(true);

    const data = response.body.data.paymentRequestFromUrlToken;

    return data;
  });
});

// -- This will generate a payment request(including email) for the user to make payment --
Cypress.Commands.add("createPaymentRequest", (amount) => {
  cy.getInvoiceRef()
    .then((uploadResponse) => {
      return uploadResponse.data.upload.uniqueId;
    })
    .then((uniqueId) => {
      const referenceNumber = Cypress._.random(0, 1e6);
      const email = Cypress.config("username");
      const gqlQuery = `mutation {
        upsertPaymentRequest(
          input: {
            referenceNumber: "${referenceNumber}"
            type: EMAIL
            email: "${email}"
            amount: ${amount}
            invoiceRef: "${uniqueId}"
          }
        ) {
          paymentRequestId
        }
      }`;
      cy.postGQL(gqlQuery).then((resp) => {
        // should be 200 ok
        cy.expect(resp.isOkStatusCode).to.be.equal(true);

        const response = {
          referenceNumber: referenceNumber,
        };
        return response;
      });
    });
});

// -- This will make payment for the first due payment in payments due table --
Cypress.Commands.add("makePayment", () => {
  // Let table load
  cy.wait(5000);
  cy.visit("/");
  cy.wait(5000);

  cy.get("body").then(($body) => {
    //Adding payment method according to our need

    //function to add the credit card
    const addCreditCard = (length: number) => {
      //opening the modal
      cy.get("[data-cy=add-credit-card]").click();
      cy.get("[data-cy=payment-method-add]")
        .should("exist")
        .should("be.visible");
      //opening the add address modal
      //In case the default address is selected
      cy.get("[data-cy=payment-method-add]").then(($modal) => {
        if (!$modal.find("[data-cy=add-address]").length) {
          cy.get("[data-cy=address-list-icon]").click();
        }
      });
      cy.get("[data-cy=add-address]").click();
      cy.get("[data-cy=billing-address-modal]").should("be.visible");
      // Entering the address details
      cy.get("[data-cy=holder-name]").type("Test User");
      cy.get("[data-cy=email]").type("testuser@testusers.com");
      cy.get("[data-cy=street-address]").type("4324 somewhere st");
      cy.get("[data-cy=country]").find("select").select("US");
      cy.get("[data-cy=zipcode]").type("30022");
      cy.get("[data-cy=country-code]").type("1");
      cy.get("[data-cy=phone-number]").type("6784324574");
      cy.get("[data-cy=continue-to-payment]")
        .last()
        .should("be.enabled")
        .click({ force: true });
      cy.wait(2000);
      //Entering card details
      getIframeBody().find("#text-input-cc-number").type("4111111111111111");
      getIframeBody().find("#text-input-expiration-month").type("12");
      getIframeBody().find("#text-input-expiration-year").type("30");
      getIframeBody().find("#text-input-cvv-number").type("123");
      cy.get("[data-cy=continue-to-payment]").first().click({ force: true });
      cy.wait(20000);
      cy.get("[data-cy=menu-options]").should("have.length", length + 1);
    };

    if (
      $body.find("[data-cy=menu-options]").length === 1 &&
      !$body.find("[data-cy=add-bank-account]").length
    ) {
      addCreditCard($body.find("[data-cy=menu-options]").length);
    } else if (!$body.find("[data-cy=menu-options]").length) {
      addCreditCard(1);
    }

    cy.wait(10000);
    // Grab the first payment from the table and pay by credit card
    cy.get("table")
      .find("tr")
      .eq(1)
      .find("td")
      .eq(5)
      .find("button")
      .click({ force: true });
    // Wait for page to load
    cy.wait(5000);
    if (!$body.find("[data-cy=submit-payment-button]").length) {
      cy.get(".MuiFormGroup-root")
        .children()
        .contains("Card ending in")
        .last()
        .click({ force: true });
    }
    cy.get("[data-cy=submit-payment-button]").click();
    cy.wait(500);
    cy.get("[data-cy=pay-now]").click();
    cy.wait(5000);
    cy.visit("/");
    cy.wait(5000);
  });
});
