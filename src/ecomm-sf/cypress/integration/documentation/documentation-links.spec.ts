/// <reference types="cypress" />
describe("Ecommerce", function () {
  context("Guest Checkout", () => {
    beforeEach(() => {
      cy.visit('/');
      cy.login();
      cy.get('.administration').click();
    });

    describe('Catalog', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'Catalog',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains(data.parentNode).click();
      });

      it("Link to 'Products' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Products';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Categories' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Categories';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Manufacturers' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Manufacturers';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Product Reviews' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Product reviews';
          var parentNode = data.parentNode + '/products';
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Product Tags' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Product tags';
          var parentNode = data.parentNode + '/products';
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      describe('Attributes', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            cy.wrap(data).as('data');
            cy.get('li').contains('Attributes').click();
          });
        });

        it("Link to 'Product attributes' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Product attributes';
            var parentNode = data.parentNode + '/products';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Specification attributes' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Specification attributes';
            var parentNode = data.parentNode + '/products';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Checkout attributes' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Checkout attributes';
            var parentNode = 'order-management';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });
      });
    });

    describe('Sales', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'order-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Sales').click();
      });

      it("Link to 'Orders' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Orders';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Shipments' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Shipping management';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Shipments').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Return requests' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Return requests';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#return-requests').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Shipping management' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Shipping management';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Shipments').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Recurring products' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Recurring products';
          var parentNode = 'catalog/products';
          var urlHead = data.urlHead;
          cy.get('li').contains('Recurring payments').click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Gift cards' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Gift cards';
          var parentNode = 'promotional-tools';
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Shopping carts and wishlists' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Shopping carts and wishlists';
          var nodeUrl = node.toLowerCase().replace(/ /g, '-');
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + nodeUrl);
          cy.get('#' + nodeUrl).then(div => {
            expect(div).to.have.text(node);
          });
        });
      });
    });
    describe('Customers', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'customer-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Customers').click();
      });

      it("Link to 'Customers' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Managing customers';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li li').contains('Customers').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Customer roles' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Customer roles';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Online customers' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Online customers';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Vendor management' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Vendor management';
          var parentNode = '';
          var urlHead = data.urlHead;
          cy.get('li').contains('Vendors').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#vendor-management').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Activity log' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Activity log';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Activity Types' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Activity log';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Activity Types').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });
    });

    describe('Promotions', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'promotional-tools',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Promotions').click();
      });

      it("Link to 'Discounts' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Discounts';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#discounts').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Affiliates' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Affiliates';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Newsletter subscribers' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Email campaigns';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Newsletter subscribers').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#email-campaigns').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Campaigns' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Email campaigns';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Campaigns').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#email-campaigns').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });
    });

    describe('Content management', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'content-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Content management').click();
      });

      it("Link to 'Topics (pages)' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Topics (pages)';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/topics-pages');
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Message templates' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Message templates';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'News items' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'News';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('News items').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'News comments' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'News';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('News comments').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Blog posts' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Blog';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Blog posts').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Blog comments' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Blog';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Blog comments').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Polls' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Polls';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Forums' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Forums';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('#forums').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });
    });

    describe('Configuration', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'advanced-configuration',
          urlHead: 'tst.docs.apteanecommerce',
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Configuration').click();
      });

      it("Link to 'Email accounts' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Email accounts';
          var parentNode = 'getting-started';
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Countries' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Countries';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode + '/' + 'countries-states');
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Languages' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Localization';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Languages').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Currencies' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Currencies';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Payment methods' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Payment methods';
          var parentNode = 'configure-payments';
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Currencies' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Currencies';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Payment restrictions' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Payment method restrictions';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Payment restrictions').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Tax providers' doc should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Tax providers';
          var parentNode = 'configure-taxes';
          var urlHead = data.urlHead;
          cy.get('li').contains(node).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text('Tax');
          });
        });
      });

      describe('Shipping', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            data.parentNode = 'configure-shipping';
            cy.wrap(data).as('data');
            cy.get('li.has-treeview > a > p').contains('Shipping').parent().click();
          });
        });

        it("Link to 'Shipping providers' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Shipping providers';
            var parentNode = data.parentNode;
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Warehouses' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Warehouses';
            var parentNode = data.parentNode + '/advanced-configuration';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Pickup point providers' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Pickup Points';
            var parentNode = data.parentNode + '/advanced-configuration';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Dates and ranges' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Dates and ranges';
            var parentNode = data.parentNode + '/advanced-configuration';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });

        it("Link to 'Measures' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Measures';
            var parentNode = data.parentNode + '/advanced-configuration';
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node);
            });
          });
        });
      });

      it("Link to 'Access control list' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Access control list';
          var parentNode = 'customer-management';
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Widgets' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'plugins in nopCommerce';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Widget', { matchCase: false }).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      describe('Authentication', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            data.parentNode = 'advanced-configuration';
            cy.wrap(data).as('data');
            cy.get('li').contains('Authentication').parent().click();
          });
        });

        it("Link to 'External authentication' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'External authentication';
            var parentNode = data.parentNode;
            var urlHead = data.urlHead;
            cy.get('li').contains(node, { matchCase: false }).click();
            cy.get('.card-body a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').then(div => {
              expect(div).to.have.text(node + ' methods');
            });
          });
        });
      });
    });

    describe('System', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'system-administration',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('System').parent().click();
      });

      it("Link to 'Log' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Log';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('a[href*="/Admin/Log/List"]').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Maintenance' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Maintenance';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Message queue' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Message queue';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Schedule tasks' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Schedule tasks';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.card-body a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Search engine friendly page names' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Search engine friendly page names';
          var parentNode = 'running-your-store';
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + 'search-engine-optimization');
          cy.get('h1').then(div => {
            expect(div).to.have.text('SEO');
          });
        });
      });

      it("Link to 'Message queue' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Message queue';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains(node, { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });

      it("Link to 'Templates' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Templates';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('a[href*="/Admin/Template/List"]').click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').then(div => {
            expect(div).to.have.text(node);
          });
        });
      });
    });

    describe('Reports', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'running-your-store',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Reports').parent().click();
      });

      it("Link to 'Sales summary' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Sales summary', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      it("Link to 'Low Stock' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Low Stock', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      it("Link to 'Bestsellers' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Bestsellers', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      it("Link to 'Products never purchased' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Products never purchased', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      it("Link to 'Products never purchased' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Products never purchased', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      it("Link to 'Country sales' should properly redirect ", () => {
        cy.get('@data').then(data => {
          var node = 'Reports';
          var parentNode = data.parentNode;
          var urlHead = data.urlHead;
          cy.get('li').contains('Country sales', { matchCase: false }).click();
          cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
          cy.url().should('contain', urlHead);
          cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
          cy.get('h1').first().then(div => {
            expect(div).to.have.text('Reports');
          });
        });
      });

      describe('Customer reports', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            cy.wrap(data).as('data');
            cy.get('li').contains('Customer reports').parent().click();
          });
        });

        it("Link to 'Registered customer' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Reports';
            var parentNode = data.parentNode;
            var urlHead = data.urlHead;
            cy.get('li').contains('Registered customer', { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').first().then(div => {
              expect(div).to.have.text('Reports');
            });
          });
        });

        it("Link to 'Customers by order total' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Reports';
            var parentNode = data.parentNode;
            var urlHead = data.urlHead;
            cy.get('li').contains('Customers by order total', { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').first().then(div => {
              expect(div).to.have.text('Reports');
            });
          });
        });

        it("Link to 'Customers by number of orders' should properly redirect ", () => {
          cy.get('@data').then(data => {
            var node = 'Reports';
            var parentNode = data.parentNode;
            var urlHead = data.urlHead;
            cy.get('li').contains('Customers by number of orders', { matchCase: false }).click();
            cy.get('.documentation-reference a').invoke('removeAttr', 'target').click();
            cy.url().should('contain', urlHead);
            cy.url().should('contain', parentNode.toLowerCase() + '/' + node.toLowerCase().replace(/ /g, '-'));
            cy.get('h1').first().then(div => {
              expect(div).to.have.text('Reports');
            });
          });
        });
      });
    });

    describe('Customers', () => {
      it("Link to 'Help topics' should properly redirect ", () => {
        cy.get('li').contains('Help').click();
        cy.get('li').contains('Help topics', { matchCase: false }).invoke('removeAttr', 'target').click();
        cy.url().should('contain', 'tst.docs.apteanecommerce.com');
        cy.get('h1').first().then(div => {
          expect(div).to.have.text('Aptean eCommerce Documentation');
        });
      });
    });
  });
});
