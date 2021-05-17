/// <reference types="cypress" />
describe("Ecommerce", function () {
  context("Documentation Links", () => {
    beforeEach(() => {
      cy.visit('/');
      cy.login();
      cy.get('.administration').click();
    });

    context('Catalog', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'Catalog',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains(data.parentNode).click();
      });

      it("Document link in menu item 'Products' should properly redirect ", () => {
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

      it("Document link in menu item 'Categories' should properly redirect ", () => {
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

      it("Document link in menu item 'Manufacturers' should properly redirect ", () => {
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

      it("Document link in menu item 'Product reviews' should properly redirect ", () => {
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

      it("Document link in menu item 'Product tags' should properly redirect ", () => {
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

      context('Attributes', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            cy.wrap(data).as('data');
            cy.get('li').contains('Attributes').click();
          });
        });

        it("Document link in menu item 'Product attributes' should properly redirect ", () => {
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

        it("Document link in menu item 'Specification attributes' should properly redirect ", () => {
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

        it("Document link in menu item 'Checkout attributes' should properly redirect ", () => {
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

    context('Sales', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'order-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Sales').click();
      });

      it("Document link in menu item 'Orders' should properly redirect ", () => {
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

      it("Document link in menu item 'Shipments' should properly redirect ", () => {
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

      it("Document link in menu item 'Return requests' should properly redirect ", () => {
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

      it("Document link in menu item 'Recurring payments' should properly redirect ", () => {
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

      it("Document link in menu item 'Gift cards' should properly redirect ", () => {
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

      it("Document link in menu item 'Shopping carts and wishlists' should properly redirect ", () => {
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

    context('Customers', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'customer-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Customers').click();
      });

      it("Document link in menu item 'Customers' should properly redirect ", () => {
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

      it("Document link in menu item 'Customer roles' should properly redirect ", () => {
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

      it("Document link in menu item 'Online customers' should properly redirect ", () => {
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

      it("Document link in menu item 'Vendors' should properly redirect ", () => {
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

      it("Document link in menu item 'Activity log' should properly redirect ", () => {
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

      it("Document link in menu item 'Activity Types' should properly redirect ", () => {
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

    context('Promotions', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'promotional-tools',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Promotions').click();
      });

      it("Document link in menu item 'Discounts' should properly redirect ", () => {
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

      it("Document link in menu item 'Affiliates' should properly redirect ", () => {
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

      it("Document link in menu item 'Newsletter subscribers' should properly redirect ", () => {
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

      it("Document link in menu item 'Campaigns' should properly redirect ", () => {
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

    context('Content management', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'content-management',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Content management').click();
      });

      it("Document link in menu item 'Topics (pages)' should properly redirect ", () => {
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

      it("Document link in menu item 'Message templates' should properly redirect ", () => {
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

      it("Document link in menu item 'News items' should properly redirect ", () => {
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

      it("Document link in menu item 'News comments' should properly redirect ", () => {
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

      it("Document link in menu item 'Blog posts' should properly redirect ", () => {
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

      it("Document link in menu item 'Blog comments' should properly redirect ", () => {
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

      it("Document link in menu item 'Polls' should properly redirect ", () => {
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

      it("Document link in menu item 'Forums' should properly redirect ", () => {
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

    context('Configuration', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'advanced-configuration',
          urlHead: 'tst.docs.apteanecommerce',
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Configuration').click();
      });

      it("Document link in menu item 'Email accounts' should properly redirect ", () => {
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

      it("Document link in menu item 'Countries' should properly redirect ", () => {
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

      it("Document link in menu item 'Languages' should properly redirect ", () => {
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

      it("Document link in menu item 'Currencies' should properly redirect ", () => {
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

      it("Document link in menu item 'Payment methods' should properly redirect ", () => {
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

      it("Document link in menu item 'Payment restrictions' should properly redirect ", () => {
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

      it("Document link in menu item 'Tax providers' should properly redirect ", () => {
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

      context('Shipping', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            data.parentNode = 'configure-shipping';
            cy.wrap(data).as('data');
            cy.get('li.has-treeview > a > p').contains('Shipping').parent().click();
          });
        });

        it("Document link in menu item 'Shipping providers' should properly redirect ", () => {
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

        it("Document link in menu item 'Warehouses' should properly redirect ", () => {
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

        it("Document link in menu item 'Pickup point providers' should properly redirect ", () => {
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

        it("Document link in menu item 'Dates and ranges' should properly redirect ", () => {
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

        it("Document link in menu item 'Measures' should properly redirect ", () => {
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

      it("Document link in menu item 'Access control list' should properly redirect ", () => {
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

      it("Document link in menu item 'Widgets' should properly redirect ", () => {
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

      context('Authentication', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            data.parentNode = 'advanced-configuration';
            cy.wrap(data).as('data');
            cy.get('li').contains('Authentication').parent().click();
          });
        });

        it("Document link in menu item 'External authentication' should properly redirect ", () => {
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

    context('System', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'system-administration',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('System').parent().click();
      });

      it("Document link in menu item 'Log' should properly redirect ", () => {
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

      it("Document link in menu item 'Maintenance' should properly redirect ", () => {
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

      it("Document link in menu item 'Message queue' should properly redirect ", () => {
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

      it("Document link in menu item 'Schedule tasks' should properly redirect ", () => {
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

      it("Document link in menu item 'Search engine friendly page names' should properly redirect ", () => {
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

      it("Document link in menu item 'Templates' should properly redirect ", () => {
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

    context('Reports', () => {
      beforeEach(() => {
        var data = {
          parentNode: 'running-your-store',
          urlHead: 'tst.docs.apteanecommerce'
        };
        cy.wrap(data).as('data');
        cy.get('li').contains('Reports').parent().click();
      });

      it("Document link in menu item 'Sales summary' should properly redirect ", () => {
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

      it("Document link in menu item 'Low stock' should properly redirect ", () => {
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

      it("Document link in menu item 'Bestsellers' should properly redirect ", () => {
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

      it("Document link in menu item 'Products never purchased' should properly redirect ", () => {
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

      it("Document link in menu item 'Country sales' should properly redirect ", () => {
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

      context('Customer reports', () => {
        beforeEach(() => {
          cy.get('@data').then(data => {
            cy.wrap(data).as('data');
            cy.get('li').contains('Customer reports').parent().click();
          });
        });

        it("Document link in menu item 'Registered customer' should properly redirect ", () => {
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

        it("Document link in menu item 'Customers by order total' should properly redirect ", () => {
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

        it("Document link in menu item 'Customers by number of orders' should properly redirect ", () => {
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

    context('Customers', () => {
      it("Document link in menu item 'Help topics' should properly redirect ", () => {
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
