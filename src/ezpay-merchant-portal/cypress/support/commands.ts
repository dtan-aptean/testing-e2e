// Azure AD Auth - https://mechanicalrock.github.io/2020/05/05/azure-ad-authentication-cypress.html
Cypress.Commands.add("waitAfterLogIn", (waitCount: number, maxWait: number) => {
  if (waitCount === maxWait) {
    return;
  }
  cy.get("body").then(($loginBody) => {
    if (!$loginBody.find("[data-cy=payment-tab]").length) {
      cy.wait(10000);
      cy.waitAfterLogIn(waitCount + 1, maxWait);
    }
    return;
  });
});

Cypress.Commands.add("login", () => {
  const waitForB2COrLogin = (waitCount: number) => {
    if (waitCount > 10) {
      return;
    }
    cy.get("body").then(($loginBody) => {
      if (
        !$loginBody.find("input[id=logonIdentifier]").length &&
        !$loginBody.find("[data-cy=payment-tab]").length
      ) {
        cy.wait(10000);
        waitForB2COrLogin(waitCount + 1);
      }
      return;
    });
  };

  sessionStorage.clear();

  cy.visit("/", { timeout: 100000 });
  cy.wait(5000);
  waitForB2COrLogin(0);

  cy.get("body").then(($body) => {
    if ($body.find("input[id=logonIdentifier]").length) {
      cy.get("input[id=logonIdentifier]").type(Cypress.config("username"));
      cy.get("input[id=password]").type(Cypress.config("password"));
      cy.get("button[id=next]").click({ force: true });
      cy.waitAfterLogIn(0, 10);
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
    },
    data: `------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="operations"\r\n\r\n{"operationName":"uploadDocument","variables":{"input":{"file":null}},"query":"mutation uploadDocument($input: UploadInput!) { upload(input: $input) { uniqueId } }\\n"}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="map"\r\n\r\n{"1":["variables.input.file"]}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="1"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.3\r\n%????????????\r\n\r\n1 0 obj\r\n<<\r\n/Type /Catalog\r\n/Outlines 2 0 R\r\n/Pages 3 0 R\r\n>>\r\nendobj\r\n\r\n2 0 obj\r\n<<\r\n/Type /Outlines\r\n/Count 0\r\n>>\r\nendobj\r\n\r\n3 0 obj\r\n<<\r\n/Type /Pages\r\n/Count 2\r\n/Kids [ 4 0 R 6 0 R ] \r\n>>\r\nendobj\r\n\r\n4 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 5 0 R\r\n>>\r\nendobj\r\n\r\n5 0 obj\r\n<< /Length 1074 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( A Simple PDF File ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( This is a small demonstration .pdf file - ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( just for use in the Virtual Mechanics tutorials. More text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 628.8480 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 616.8960 Td\r\n( text. And more text. Boring, zzzzz. And more text. And more text. And ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 604.9440 Td\r\n( more text. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 592.9920 Td\r\n( And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 569.0880 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 557.1360 Td\r\n( text. And more text. And more text. Even more. Continued on page 2 ...) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n6 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 7 0 R\r\n>>\r\nendobj\r\n\r\n7 0 obj\r\n<< /Length 676 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( Simple PDF File 2 ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( ...continued from page 1. Yet more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 676.6560 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( text. Oh, how boring typing this stuff. But not as boring as watching ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( paint dry. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 640.8000 Td\r\n( Boring.  More, a little more text. The end, and just as well. ) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n8 0 obj\r\n[/PDF /Text]\r\nendobj\r\n\r\n9 0 obj\r\n<<\r\n/Type /Font\r\n/Subtype /Type1\r\n/Name /F1\r\n/BaseFont /Helvetica\r\n/Encoding /WinAnsiEncoding\r\n>>\r\nendobj\r\n\r\n10 0 obj\r\n<<\r\n/Creator (Rave \\(http://www.nevrona.com/rave\\))\r\n/Producer (Nevrona Designs)\r\n/CreationDate (D:20060301072826)\r\n>>\r\nendobj\r\n\r\nxref\r\n0 11\r\n0000000000 65535 f\r\n0000000019 00000 n\r\n0000000093 00000 n\r\n0000000147 00000 n\r\n0000000222 00000 n\r\n0000000390 00000 n\r\n0000001522 00000 n\r\n0000001690 00000 n\r\n0000002423 00000 n\r\n0000002456 00000 n\r\n0000002574 00000 n\r\n\r\ntrailer\r\n<<\r\n/Size 11\r\n/Root 1 0 R\r\n/Info 10 0 R\r\n>>\r\n\r\nstartxref\r\n2714\r\n%%EOF\r\n\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF--\r\n`,
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
      const referenceNumber = `${Date.now()
        .toString()
        .slice(-4)}-${Cypress._.random(0, 1e12)}`;
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

//This is to get the index and length of merchant summary
Cypress.Commands.add("getMerchantIndex", (amount) => {
  const gqlQuery = `query {
        payerTransactionSummaryByMerchant{
          merchantSummary{
            merchantInfo{
              name
              owner{
                tenantId
              }
              features {
                paymentRequests {
                  consolidatedPayment
                  partialPayment
                }
              }
            }
          }
        }
      }`;
  cy.postGQL(gqlQuery).then((resp) => {
    // should be 200 ok
    cy.expect(resp.isOkStatusCode).to.be.equal(true);
    let consolidatedPayment = null;
    let partialPayment = null;
    let merchantIndex = 0;
    const userTenant = Cypress.env("x-aptean-tenant");
    const merchantSummary =
      resp.body.data.payerTransactionSummaryByMerchant.merchantSummary;

    const sortedMerchantSummary = merchantSummary.slice().sort((a, b) => {
      if (a.merchantInfo.name && b.merchantInfo.name) {
        return a.merchantInfo.name > b.merchantInfo.name ? 1 : -1;
      }
      return 0;
    });

    sortedMerchantSummary.forEach((element, index) => {
      if (element.merchantInfo.owner.tenantId === userTenant) {
        merchantIndex = index;
        consolidatedPayment =
          element.merchantInfo.features.paymentRequests.consolidatedPayment;
        partialPayment =
          element.merchantInfo.features.paymentRequests.partialPayment;
      }
    });

    const response = {
      merchantIndex,
      merchantLength: sortedMerchantSummary.length,
      consolidatedPayment,
      partialPayment,
    };
    return response;
  });
});

// -- This will log into payer portal and pay a set number of payments
/**
 * count - the number of payment requests that should be paid
 */
Cypress.Commands.add(
  "makePayment",
  (count, consolidatedPaymentCount, referenceRecords: string[]) => {
    const waitAfterRootPageVisit = (waitCount: number) => {
      if (waitCount > 10) {
        return;
      }
      cy.get("body").then(($rootBody) => {
        if (
          !$rootBody.find("[data-cy=sign-in]").length &&
          !$rootBody.find("div:contains(Unpaid Invoices)").length
        ) {
          cy.wait(5000);
          waitAfterRootPageVisit(waitCount + 1);
        }
        return;
      });
    };

    const waitAfterSignInClick = (waitCount: number) => {
      if (waitCount > 10) {
        return;
      }
      cy.get("body").then(($rootBody) => {
        if (
          !$rootBody.find("input[id=logonIdentifier]").length &&
          !$rootBody.find("div:contains(Unpaid Invoices)").length
        ) {
          cy.wait(10000);
          waitAfterSignInClick(waitCount + 1);
        }
        return;
      });
    };

    const waitForRequestLoading = (waitCount: number) => {
      if (waitCount > 3) {
        return;
      }
      cy.get("body").then(($rootBody) => {
        if (!$rootBody.find("button:contains(MAKE PAYMENT)").length) {
          cy.wait(10000);
          waitForRequestLoading(waitCount + 1);
        }
        return;
      });
    };

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
      waitAfterRootPageVisit(0);
      return new Promise((resolve) => {
        setTimeout((x) => {
          // Log in - taken from payer portal login command
          cy.get("body").then(($body) => {
            if ($body.find("[data-cy=sign-in]").length) {
              cy.get("[data-cy=sign-in]").click({ force: true });
              waitAfterSignInClick(0);

              // check if clicking sign in automatically logs you in, else enter credentials on B2C page
              cy.get("body").then(($body) => {
                if ($body.find("input[id=logonIdentifier]").length) {
                  cy.get("input[id=logonIdentifier]").type(
                    Cypress.config("username")
                  );
                  cy.get("input[id=password]").type(Cypress.config("password"));
                  cy.get("button[id=next]").click();
                  cy.wait(10000);
                }
              });
            }
          });

          // Wait to finish logging in, or to finish loading
          cy.get("body").then(($loadingBody) => {
            if (
              $loadingBody.find("[data-cy=sign-in]").length > 0 ||
              $loadingBody.find("div:contains(Loading!)").length > 0
            ) {
              cy.wait(10000);
            }
          });

          cy.get("div").then(($boday) => {
            //function to get cc iframe
            const getIframeBody = () => {
              return cy
                .get("#cc_iframe_iframe")
                .its("0.contentDocument.body")
                .should("not.be.empty")
                .then(cy.wrap);
            };

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
              cy.get("[data-cy=email]").type("testuser@testusers.com");
              cy.get("[data-cy=street-address]").type("4324 somewhere st");
              cy.get("[data-cy=country]").find("select").select("US");
              cy.get("[data-cy=zipcode]").type("30022");
              cy.get("[data-cy=phone-number]").type("6784324574");
              cy.get("[data-cy=continue-to-payment]")
                .last()
                .should("be.enabled")
                .click({ force: true });
              cy.wait(2000);
              cy.get("[data-cy=holder-name]").type("Test User");
              cy.wait(2000);
              //Entering card details
              getIframeBody()
                .find("#text-input-cc-number")
                .type("4111111111111111");
              getIframeBody().find("#text-input-expiration-month").type("12");
              getIframeBody().find("#text-input-expiration-year").type("30");
              getIframeBody().find("#text-input-cvv-number").type("123");
              cy.get("[data-cy=continue-to-payment]")
                .first()
                .click({ force: true });
              cy.wait(20000);
              cy.get("[data-cy=menu-options]").should(
                "have.length",
                length + 1
              );
            };

            cy.get("[data-cy=menu-icon]").click({ force: true });

            if (
              $boday.find("[data-cy=menu-options]").length === 1 &&
              !$boday.find("[data-cy=add-bank-account]").length
            ) {
              addCreditCard($boday.find("[data-cy=menu-options]").length);
            } else if (!$boday.find("[data-cy=menu-options]").length) {
              addCreditCard(0);
            }

            cy.getMerchantIndex().then((resp) => {
              const merchantIndex = resp.merchantIndex;
              const merchantLength = resp.merchantLength;

              // Complete assigned payments
              for (var i = 0; i < count; i++) {
                //select the merchant to pay
                if (merchantLength > 1) {
                  cy.get("h6:contains(Balance Due)")
                    .eq(merchantIndex)
                    .parent()
                    .parent()
                    .within(() => {
                      cy.get("button").click({ force: true });
                    });
                  cy.wait(18000);
                }
                // Let table load
                // Grab the payment from the table according to consolidated check and pay by credit card
                waitForRequestLoading(0);
                const consolidated =
                  consolidatedPaymentCount && resp.consolidatedPayment === true
                    ? consolidatedPaymentCount
                    : 1;

                for (let i = 0; i < consolidated; i++) {
                  if (referenceRecords[i]) {
                    cy.get("table")
                      .find(`tr:contains(${referenceRecords[i]})`)
                      .within(() => {
                        cy.get("button").click({ force: true });
                      });
                  } else {
                    cy.get("table")
                      .find("tr")
                      .eq(i)
                      .within(() => {
                        cy.get("button").click({ force: true });
                      });
                  }
                }

                if (resp.consolidatedPayment === true) {
                  cy.get("button:contains('PAY SELECTED')")
                    .last()
                    .click({ force: true });
                } else if (resp.partialPayment === true) {
                  cy.get("button:contains('PAY')")
                    .last()
                    .click({ force: true });
                }

                // Wait for page to load
                cy.wait(5000);
                // TODO: Set up command to deal when payer has no payment method or doesn't have default payment method, etc
                cy.get("body").then(($makePaymentBody) => {
                  if (
                    $makePaymentBody
                      .find("[data-cy=submit-payment-button]")
                      .is(":disabled")
                  ) {
                    cy.get('input[type="radio"]:enabled').last().check();
                  } else if (
                    $makePaymentBody.find("p:contains(Account ending in)")
                      .length
                  ) {
                    cy.get("[data-cy=payment-method-list-icon]").click({
                      force: true,
                    });
                    cy.get('input[type="radio"]:enabled').last().check();
                  }
                });
                cy.get("[data-cy=submit-payment-button]").click();
                cy.wait(500);
                cy.get("[data-cy=pay-now]").click();
                cy.wait(15000);
                cy.wait(5000).then(() => {
                  // If we need to make more than one payment, send us back to the home page
                  if (count > 1) {
                    referenceRecords.shift();
                    cy.wait(5000);
                    appWindow.location = "https://tst.payer.apteanpay.com/";
                  }
                });
              }
            });
          });
          resolve();
        }, 2000);
      });
    });
  }
);
// -- This creates a given number of payment requests, then call the command to pay them
/**
 * requestCount - how many payment requests to make. Required
 * amount - Monetary amount the requests should be. Optional
 * refPrefix - Prefix for the reference number, to differentiate between tests. Optional
 * paymentCount - Object containing info to pass onto the makePayment command. Optional
 */
Cypress.Commands.add(
  "createAndPay",
  (requestCount, amount, refPrefix, paymentCount, consolidatedPaymentCount) => {
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
    const referenceRecords: string[] = [];

    // Make the requests
    for (var i = 0; i < requestCount; i++) {
      const money = amount || Cypress._.random(2, 1e3);
      const referenceNumber = `${referencePrefix}-${Date.now()
        .toString()
        .slice(-4)}-${Cypress._.random(100, 1e12)}`;
      cy.getInput("recipient-email").type(Cypress.config("username"));
      cy.getInput("amount").type(money);
      cy.getInput("reference-number").type(referenceNumber);
      cy.getInput("invoice").attachFile(invoicePath);
      cy.wait(3000);
      cy.get("[data-cy=send-payment]")
        .should("not.be.disabled")
        .click()
        .then(() => {
          referenceRecords.push(referenceNumber);
        });
      cy.wait(5000);
    }
    // Give it a moment to make sure all requests got in
    cy.wait(3000);
    const referenceNumbers = referenceRecords;
    // Call the payment function
    cy.makePayment(
      paymentCount || 1,
      consolidatedPaymentCount,
      referenceRecords
    );
    // Give it time to get in
    cy.wait(5000);
    // Return to merchant portal
    cy.visit("/").then(() => {
      return referenceNumbers;
    });
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
