// Azure AD Auth - https://mechanicalrock.github.io/2020/05/05/azure-ad-authentication-cypress.html
Cypress.Commands.add("login", () => {
  cy.task("authenticateUser", {
    email: Cypress.config("username"),
    password: Cypress.config("password"),
    root: Cypress.config("baseUrl"),
    clientId: Cypress.config("clientId"),
    scopes: Cypress.config("scopes"),
    authorityName: Cypress.config("authority"),
    homeAccountIdentifier: Cypress.config("homeAccountIdentifier"),
  }).then((creds) => {
    // Need to store in creds to bypass undefined type errors.
    Cypress.env(creds);
    const clientId = Cypress.config("clientId");
    const {
      contextClientKey,
      contextScopeKey,
      contextClientValue,
      contextScopeValue,
      accessToken,
      info,
      cookies,
    } = Cypress.env();
    if (
      contextScopeValue &&
      contextClientValue &&
      accessToken &&
      info &&
      cookies
    ) {
      cy.setCookie("ai_session", cookies[0].value);
      cy.setCookie("ai_user", cookies[1].value);
      sessionStorage.setItem(`${contextScopeKey}`, contextScopeValue);
      sessionStorage.setItem(`${contextClientKey}`, contextClientValue);
      sessionStorage.setItem("msal.idtoken", accessToken);
      sessionStorage.setItem(`msal.${clientId}.idtoken`, accessToken);
      sessionStorage.setItem(`msal.client.info`, info);
      sessionStorage.setItem(`msal.${clientId}.client.info`, info);
    }
  });
});

Cypress.Commands.add("getIframeBody", () => {
  // get the iframe > document > body
  // and retry until the body element is not empty
  return (
    cy
      .get('iframe[id="kyc-iframe_iframe"]')
      .its("0.contentDocument.body")
      .should("not.be.empty")
      // wraps "body" DOM element to allow
      // chaining more Cypress commands, like ".find(...)"
      // https://on.cypress.io/wrap
      .then(cy.wrap)
  );
});

Cypress.Commands.add("onboard", (options) => {
  // Determine if onboard needs to occur.
  let hasFrame = Cypress.$('iframe[id="kyc-iframe_iframe"]').length > 0;
  if (hasFrame) {
    // Country select
    // Entity type selection and their options
    if (options.entityType === "sole") {
      cy.getIframeBody().find('label[for="radio-input-entity_type-S"]').click();
    } else if (options.entityType === "business") {
      // Business type selection.
      cy.getIframeBody().find('label[for="radio-input-entity_type-B"]').click();
      if (options.structure === "corporation") {
        cy.getIframeBody()
          .find('label[for="radio-input-legal_structure-corporation"]')
          .click();
        if (options.industryCategory === 0) {
          cy.getIframeBody()
            .find('select[id="select-input-industry_category"]')
            .select("amusement_and_entertainment");
          if (options.industryType === 0) {
            cy.getIframeBody()
              .find('select[id="select-input-industry_type"]')
              .select("bands_orchestras_misc_entertainment");
          }
        }
      } else if (options.structure === "llc") {
        cy.getIframeBody()
          .find(
            'label[for="radio-input-legal_structure-limited_liability_company"]'
          )
          .click();
      } else if (options.structure === "paternership") {
        cy.getIframeBody()
          .find('label[for="radio-input-legal_structure-partnership"]')
          .click();
      }
      cy.wait(1000);
      // Business info fields
      cy.getIframeBody()
        .find('input[id="text-input-business_name"]')
        .type(options.businessName);
      cy.getIframeBody()
        .find('input[id="text-input-business_ein"]')
        .type(options.businessEIN);
      cy.getIframeBody()
        .find('input[id="text-input-business_website"]')
        .type(options.businessWebsite);
      cy.getIframeBody()
        .find('textarea[id="textarea-input-business_description"]')
        .type(options.businessDescription);
      cy.getIframeBody()
        .find('input[id="text-input-business1_street_address"]')
        .type(options.businessAddress);
      cy.getIframeBody()
        .find('input[id="text-input-business_city"]')
        .type(options.businessCity);
      cy.getIframeBody()
        .find('select[id="select-input-business_region"]')
        .select(options.businessRegion);
      cy.getIframeBody()
        .find('input[id="text-input-business_postal_code"]')
        .type(options.businessPostal);
      cy.getIframeBody()
        .find('input[id="text-input-business_phone_number"]')
        .type(options.businessPhone);
    }
    // Controller info fields
    cy.getIframeBody()
      .find('input[id="text-input-personal_first_name"]')
      .type(options.controllerFirstName);
    cy.getIframeBody()
      .find('input[id="text-input-personal_last_name"]')
      .type(options.controllerLastName);
    cy.getIframeBody()
      .find('select[id="select-input-personal_job_title"]')
      .select(options.controllerTitle);
    cy.getIframeBody()
      .find('input[id="text-input-personal_street_address"]')
      .type(options.controllerAddress);
    cy.getIframeBody()
      .find('input[id="text-input-personal_city"]')
      .type(options.controllerCity);
    cy.getIframeBody()
      .find('select[id="select-input-personal_region"]')
      .select(options.controllerRegion);
    cy.getIframeBody()
      .find('input[id="text-input-personal_postal_code"]')
      .type(options.controllerPostal);
    if (options.controllerCountryCode !== "1") {
      cy.getIframeBody()
        .find('input[id="text-input-personal_phone_country_code"]')
        .clear();
      cy.getIframeBody()
        .find('input[id="text-input-personal_phone_country_code"]')
        .type(options.controllerCountryCode);
    }
    cy.getIframeBody()
      .find('input[id="text-input-personal_phone_number"]')
      .type(options.controllerPhone);
    cy.getIframeBody()
      .find('select[id="select-input-personal_dob_month"]')
      .select(options.controllerDOBMonth);
    cy.getIframeBody()
      .find('select[id="select-input-personal_dob_day"]')
      .select(options.controllerDOBDay);
    cy.getIframeBody()
      .find('select[id="select-input-personal_dob_year"]')
      .select(options.controllerDOBYear);
    // SSN input
    if (options.entityType === "sole") {
      // sole ssn
    } else if (options.entityType === "business") {
      cy.getIframeBody()
        .find('input[id="text-input-personal_ssn4_input"]')
        .type(options.controllerSSNLastFour);
      if (options.controllerOwn25orMore) {
        cy.getIframeBody()
          .find('label[for="radio-input-personal_is_bene_owner-true"]')
          .click();
      } else {
        cy.getIframeBody()
          .find('label[for="radio-input-personal_is_bene_owner-false"]')
          .click();
      }
    }
    // Click next.
    cy.get('button[data-cy="onboard-next"]').click();

    // Account creation
    cy.getInput("account-name").type(options.accountName);
    cy.getInput("account-description").type(options.accountDescription);
    cy.getInput("account-statement-description").type(
      options.accountStatementDescription
    );
    cy.getTextArea("refund-policy").type(options.refundPolicy);

    // Click next.
    cy.get('button[data-cy="onboard-next"]').click();

    // Terms of service name agreement
    cy.getInput("tos-name").type(options.tosName);

    // Click finish.
    cy.get('button[data-cy="onboard-next"]').click();
  }
});

// -- Gets an input element based on selector (data-cy value) --
Cypress.Commands.add("getInput", (selector) => {
  return cy.get("[data-cy=" + selector + "]").find("input");
});

// -- Gets an input element based on selector (data-cy value) --
Cypress.Commands.add("getTextArea", (selector) => {
  return cy.get("[data-cy=" + selector + "]").find("textarea");
});

// -- Gets a select element based on selector (data-cy value) --
Cypress.Commands.add("getSelect", (selector) => {
  return cy.get("[data-cy=" + selector + "]").find("select");
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
      const amount = Cypress._.random(100, 1e3);
      const referenceNumber = Cypress._.random(0, 1e6);
      const email = "john.doe@aptean.com";
      const phone = "5555555555";
      const gqlQuery = `mutation {
        upsertPaymentRequest(
          input: {
            referenceNumber: "${referenceNumber}"
            type: EMAIL_AND_SMS
            email: "${email}"
            phoneNumber: "${phone}"
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
          referenceNumber,
          email,
          phone,
        };
        return response;
      });
    });
});

Cypress.Commands.add("getViewerUser", (email) => {
  const gqlQuery = `query {
    person (email: "${email}") {
      id
      firstName
      lastName
      email
      relationship {
        role
      }
      owner {
        tenantId
      }
    }
  }`;

  cy.postGQL(gqlQuery).then((response) => {
    // should be 200 ok
    cy.expect(response.isOkStatusCode).to.be.equal(true);

    const data = response.body.data.person;

    return data;
  });
});

// -- This will log into payer portal and pay a set number of payments
/**
 * count - the number of payment requests that should be paid
 */
Cypress.Commands.add("makePayment", (count) => {
  Cypress.log({
    name: "makePayment",
    message: `${count}`,
    consoleProps: () => {
      return {
        "Number to Pay": count,
      };
    },
  });

  // Make sure count is a vaild number
  expect(count).to.not.be.null;
  expect(count).to.not.be.undefined;
  assert.isNotNaN(count);
  assert.isNumber(count);
  expect(count).to.be.greaterThan(0);

  cy.get("body").then(($body) => {
    const appWindow = $body[0].ownerDocument.defaultView;
    // TODO - switch this to work in all environments
    appWindow.location = "https://tst.payer.apteanpay.com/";
    return new Promise((resolve) => {
      setTimeout((x) => {
        // Log in - taken from payer portal login command
        cy.get("body").then(($body) => {
          if ($body.find("[data-cy=sign-in]").length) {
            cy.get("[data-cy=sign-in]").click();
            cy.wait(10000);

            // check if clicking sign in automatically logs you in, else enter credentials on B2C page
            cy.get("body").then(($body) => {
              if ($body.find("input[id=logonIdentifier]").length) {
                cy.get("input[id=logonIdentifier]").type(
                  Cypress.config("username")
                );
                cy.get("input[id=password]").type(Cypress.config("password"));
                cy.get("button[id=next]").click();
              }
            });
          }
        });
        // Wait to finish logging in, or to finish loading
        cy.wait(5000);
        cy.get("div").then(($boday) => {
          // Check if we need to fill in billing information
          const billing = $boday.find("button").filter((index, item) => {
            return item.innerText === "ADD BILLING INFORMATION";
          });
          // Fill in billing information if we find the button
          if (billing.length) {
            cy.get("button").contains("ADD BILLING INFORMATION").click();
            cy.wait(500);
            cy.getInput("first-name").clear();
            cy.getInput("first-name").type("Johnny");
            cy.getInput("last-name").clear();
            cy.getInput("last-name").type("Tester");
            cy.getInput("email").clear();
            cy.getInput("email").type(Cypress.config("username"));
            cy.getInput("street-address").clear();
            cy.getInput("street-address").type(
              "4325 Alexander Dr #100, Alpharetta, GA"
            );
            cy.getSelect("country").select("US");
            cy.getInput("zipcode").clear();
            cy.getInput("zipcode").type("30022");
            cy.getInput("country-code").clear();
            cy.getInput("country-code").type("+1");
            cy.getInput("phone-number").clear();
            cy.getInput("phone-number").type("6785555555");
            cy.get("[data-cy=continue-to-payment]").click();
            cy.wait(2000);
          }
          // Get the credit iframe - taken from payer portal tests
          const getIframeBody = () => {
            return cy
              .get("#cc_iframe_iframe")
              .its("0.contentDocument.body")
              .should("not.be.empty")
              .then(cy.wrap);
          };
          // Complete assigned payments
          for (var i = 0; i < count; i++) {
            // Let table load
            cy.wait(5000);
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
            // TODO: Set up command to deal when payer has no payment method or doesn't have default payment method, etc
            cy.get("[data-cy=submit-payment-button]").click();
            cy.wait(500);
            cy.get("[data-cy=pay-now]").click();
            cy.wait(5000).then(() => {
              // If we need to make more than one payment, send us back to the home page
              if (count > 1) {
                cy.wait(5000);
                appWindow.location = "https://tst.payer.apteanpay.com/";
              }
            });
          }
        });
        resolve();
      }, 2000);
    });
  });
});
// -- This creates a given number of payment requests, then call the command to pay them
/**
 * requestCount - how many payment requests to make. Required
 * amount - Monetary amount the requests should be. Optional
 * refPrefix - Prefix for the reference number, to differentiate between tests. Optional
 * paymentCount - Object containing info to pass onto the makePayment command. Optional
 */
Cypress.Commands.add(
  "createAndPay",
  (requestCount, amount, refPrefix, paymentCount) => {
    Cypress.log({
      name: "createAndPay",
      message: `|${requestCount}|${amount ? amount + "|" : ""}${
        refPrefix ? refPrefix + "|" : ""
      }${paymentCount ? paymentCount + "|" : ""}`,
      consoleProps: () => {
        return {
          "Number of requests to make": requestCount,
          "Request amount": amount || "Not provided",
          "Reference number prefix": refPrefix || "Not provided",
          "Number of requests to pay": paymentCount || "Not provided",
        };
      },
    });

    // Make sure the requestCount is a valid number
    expect(requestCount).to.not.be.null;
    expect(requestCount).to.not.be.undefined;
    assert.isNotNaN(requestCount);
    assert.isNumber(requestCount);
    expect(requestCount).to.be.greaterThan(0);

    const invoicePath = "sample.pdf";
    const referencePrefix = refPrefix || "cypress";

    // Make the requests
    for (var i = 0; i < requestCount; i++) {
      const money = amount || Cypress._.random(2, 1e3);
      const referenceNumber = `${referencePrefix}-${Cypress._.random(
        100,
        1e9
      )}`;
      cy.getInput("recipient-email").type(Cypress.config("username"));
      cy.getInput("amount").type(money);
      cy.getInput("reference-number").type(referenceNumber);
      cy.getInput("invoice").attachFile(invoicePath);
      cy.get("[data-cy=send-payment]").should("not.be.disabled").click();
      cy.wait(5000);
    }
    // Give it a moment to make sure all requests got in
    cy.wait(3000);
    // Call the payment function
    cy.makePayment(paymentCount || requestCount);
    // Give it time to get in
    cy.wait(5000);
    // Return to merchant portal
    cy.visit("/");
  }
);

/**
 * Returns a table body after it has completely loaded (no skeleton).
 * selector - DOM selector to use.
 * invokeChildren - Whether or not to invoke children and return them vs the table body.
 */
Cypress.Commands.add("getTableBodyAfterLoad", (selector, invokeChildren) => {
  function getTable(tableSelector) {
    cy.get(tableSelector)
      .invoke("children")
      .then(($el) => {
        if ($el && $el[0]) {
          // Still loading.
          const elements = $el[0].getElementsByClassName("MuiSkeleton-root");
          if (elements && elements.length > 0) {
            cy.wait(100);
            getTable(tableSelector);
          } else {
            if (invokeChildren) {
              return $el;
            } else {
              return $el.parent();
            }
          }
        }
      });
  }
  return getTable(selector);
});
