import * as puppeteer from 'puppeteer';

export function getAdToken(email:string, password:string, appURI:string) {
  return puppeteer.launch({ headless: true, args: ['--no-sandbox'] }).then(async browser => {
    try {
      const page = await browser.newPage();

      await page.goto(appURI);

      await page.waitForTimeout(3000);
      await page.click('input[id=logonIdentifier]');
      await page.type('input[id=logonIdentifier]', email, {
          delay: 50
      });

      await page.waitForTimeout(500);
      await page.click('input[id=password]');
      await page.waitForTimeout(500);
      await page.type('input[id=password]', password, {
          delay: 50
      });
        
      await page.waitForTimeout(500);

      await page.click('button[id=next]');
      await page.waitForSelector('.jwtHeader', { visible: true, timeout: 10000 });

      const headerElement = await page.$(".jwtHeader");
      const headerText = await page.evaluate(element => element.innerText, headerElement);
      const claimsElement = await page.$(".jwtClaims");
      const claimsText = await page.evaluate(element => element.innerText, claimsElement);
      const signatureElement = await page.$(".jwtSignature");
      const signatureText = await page.evaluate(element => element.innerText, signatureElement);
      const token = `${headerText}.${claimsText}.${signatureText}`;
      browser.close();
      return `bearer ${token}`;
    } catch (error) {
      console.log(error);
      browser.close();
    }
  });
};