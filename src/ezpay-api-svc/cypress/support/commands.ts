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
Cypress.Commands.add('postGQL', query => {
  return cy.request({
    method: 'POST',
    url: '/graphql',
    headers: {
      'x-aptean-apim': Cypress.env('x-aptean-apim'),
      'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
      'x-ezpay-pmt': Cypress.env('x-ezpay-pmt'),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

// -- This will post GQL query with bearer token --
Cypress.Commands.add('postGQLWithBearerToken', query => {
  return cy.request({
    method: 'POST',
    url: '/graphql',
    headers: {
      authorization: Cypress.env('authorization'),
      'x-aptean-apim': Cypress.env('x-aptean-apim'),
      'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
      'x-ezpay-pmt': Cypress.env('x-ezpay-pmt'),
    },
    body: { query },
    failOnStatusCode: false,
  });
});

// -- This will upload an invoice and return the invoiceRef number --
Cypress.Commands.add('getInvoiceRef', () => {
  const settings = {
    url: Cypress.env('api-svc-url'),
    method: 'POST',
    headers: {
      accept: ' */*',
      authorization: Cypress.env('authorization'),
      'content-type': [' multipart/form-data; boundary=----WebKitFormBoundaryyvKAJwzxkixBJ6vF'],
      'x-aptean-tenant': Cypress.env('x-aptean-tenant'),
      'x-aptean-apim': Cypress.env('x-aptean-apim'),
      'x-ezpay': Cypress.env('x-ezpay'),
    },
    data: `------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="operations"\r\n\r\n{"operationName":"uploadDocument","variables":{"input":{"file":null}},"query":"mutation uploadDocument($input: UploadInput!) { upload(input: $input) { uniqueId } }\\n"}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="map"\r\n\r\n{"1":["variables.input.file"]}\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF\r\nContent-Disposition: form-data; name="1"; filename="sample.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-1.3\r\n%����\r\n\r\n1 0 obj\r\n<<\r\n/Type /Catalog\r\n/Outlines 2 0 R\r\n/Pages 3 0 R\r\n>>\r\nendobj\r\n\r\n2 0 obj\r\n<<\r\n/Type /Outlines\r\n/Count 0\r\n>>\r\nendobj\r\n\r\n3 0 obj\r\n<<\r\n/Type /Pages\r\n/Count 2\r\n/Kids [ 4 0 R 6 0 R ] \r\n>>\r\nendobj\r\n\r\n4 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 5 0 R\r\n>>\r\nendobj\r\n\r\n5 0 obj\r\n<< /Length 1074 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( A Simple PDF File ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( This is a small demonstration .pdf file - ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( just for use in the Virtual Mechanics tutorials. More text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 628.8480 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 616.8960 Td\r\n( text. And more text. Boring, zzzzz. And more text. And more text. And ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 604.9440 Td\r\n( more text. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 592.9920 Td\r\n( And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 569.0880 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 557.1360 Td\r\n( text. And more text. And more text. Even more. Continued on page 2 ...) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n6 0 obj\r\n<<\r\n/Type /Page\r\n/Parent 3 0 R\r\n/Resources <<\r\n/Font <<\r\n/F1 9 0 R \r\n>>\r\n/ProcSet 8 0 R\r\n>>\r\n/MediaBox [0 0 612.0000 792.0000]\r\n/Contents 7 0 R\r\n>>\r\nendobj\r\n\r\n7 0 obj\r\n<< /Length 676 >>\r\nstream\r\n2 J\r\nBT\r\n0 0 0 rg\r\n/F1 0027 Tf\r\n57.3750 722.2800 Td\r\n( Simple PDF File 2 ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 688.6080 Td\r\n( ...continued from page 1. Yet more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 676.6560 Td\r\n( And more text. And more text. And more text. And more text. And more ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 664.7040 Td\r\n( text. Oh, how boring typing this stuff. But not as boring as watching ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 652.7520 Td\r\n( paint dry. And more text. And more text. And more text. And more text. ) Tj\r\nET\r\nBT\r\n/F1 0010 Tf\r\n69.2500 640.8000 Td\r\n( Boring.  More, a little more text. The end, and just as well. ) Tj\r\nET\r\nendstream\r\nendobj\r\n\r\n8 0 obj\r\n[/PDF /Text]\r\nendobj\r\n\r\n9 0 obj\r\n<<\r\n/Type /Font\r\n/Subtype /Type1\r\n/Name /F1\r\n/BaseFont /Helvetica\r\n/Encoding /WinAnsiEncoding\r\n>>\r\nendobj\r\n\r\n10 0 obj\r\n<<\r\n/Creator (Rave \\(http://www.nevrona.com/rave\\))\r\n/Producer (Nevrona Designs)\r\n/CreationDate (D:20060301072826)\r\n>>\r\nendobj\r\n\r\nxref\r\n0 11\r\n0000000000 65535 f\r\n0000000019 00000 n\r\n0000000093 00000 n\r\n0000000147 00000 n\r\n0000000222 00000 n\r\n0000000390 00000 n\r\n0000001522 00000 n\r\n0000001690 00000 n\r\n0000002423 00000 n\r\n0000002456 00000 n\r\n0000002574 00000 n\r\n\r\ntrailer\r\n<<\r\n/Size 11\r\n/Root 1 0 R\r\n/Info 10 0 R\r\n>>\r\n\r\nstartxref\r\n2714\r\n%%EOF\r\n\r\n------WebKitFormBoundaryyvKAJwzxkixBJ6vF--\r\n`,
  };
  return Cypress.$.ajax(settings);
});

// -- This will generate a payment request url --
Cypress.Commands.add('generatePaymentRequest', () => {
  cy.getInvoiceRef()
    .then(uploadResponse => {
      return uploadResponse.data.upload.uniqueId;
    })
    .then(uniqueId => {
      const amount = Cypress._.random(0, 1e3);
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
      cy.postGQL(gqlQuery).then(paymentRequest => {
        // should be 200 ok
        cy.expect(paymentRequest.isOkStatusCode).to.be.equal(true);

        const response = {
          amount,
          invoiceRef: uniqueId,
          paymentUrl: paymentRequest.body.data.upsertPaymentRequest.paymentUrl,
          referenceNumber,
          paymentRequestId: paymentRequest.body.data.upsertPaymentRequest.paymentRequestId,
        };
        return response;
      });
    });
});
