/// <reference types="cypress" />

describe('Merchant portal', function() {
  before(() => {
    sessionStorage.clear();
    // navigate to home screen
    cy.login();
  })
  
  context('Disputes', () => {
    beforeEach(() => {
      //navigate to home screen
      cy.visit('/');
      // Onbaord if necessary
      cy.onboard({
        entityType: 'business',
        structure: 'corporation',
        industryCategory: 0,
        industryType: 0,
        businessName: 'Aqueas',
        businessEIN: '121212121',
        businessDescription: 'Aqueas Description',
        businessWebsite: 'a.co.uk',
        businessAddress: '123 St',
        businessCity: 'Atlanta',
        businessRegion: 'GA',
        businessPostal: '30338',
        businessPhone: '4045675678',
        controllerFirstName: 'Aqueas',
        controllerLastName: 'Ocean',
        controllerTitle: 'Owner',
        controllerAddress: '123 St',
        controllerCity: 'Atlanta',
        controllerRegion: 'GA',
        controllerPostal: '30338',
        controllerCountryCode: '1',
        controllerPhone: '4045675678',
        controllerDOBMonth: 'March',
        controllerDOBDay: '6',
        controllerDOBYear: '1990',
        controllerSSNLastFour: '1234',
        controllerOwn25orMore: true,
        accountName: 'Aqueas',
        accountDescription: 'Aqueas Ocean Corp',
        accountStatementDescription: 'aqueas-pay',
        refundPolicy: 'No refunds',
        tosName: 'Mike Riehlman',
      });
    });

    it('should pass if able to make a dispute', () => {
      const referenceNumber = '1111';
      // get payment by reference number
      cy.getInput('search')
        .type(referenceNumber)
        .should('have.value', referenceNumber.toString());
    });
  });
});
