const puppeteer = require('puppeteer');

exports.authenticateUser = async function authenticateUser(userOptions) {
  const { email, password, root, scopes, clientId, authorityName, homeAccountIdentifier } = userOptions;
  const contextClientKey = JSON.stringify({ "authority": authorityName, "clientId": clientId, "scopes": clientId, "homeAccountIdentifier": homeAccountIdentifier });
  const contextScopeKey = JSON.stringify({ "authority": authorityName, "clientId": clientId, "scopes": scopes, "homeAccountIdentifier": homeAccountIdentifier });
  const creds = await puppeteer
    .launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    .then(async browser => {
      try {
        const page = await browser.newPage();
        await page.goto(root);
        await page.waitForSelector("input[id=logonIdentifier]", { visible: true });
        await page.click("input[id=logonIdentifier]");
        console.log(email);
        await page.type("input[id=logonIdentifier]", email, {
          delay: 50
        });
        await page.waitFor(500);
        await page.click("input[id=password]");
        await page.waitFor(500);
        console.log('inputting password');
        await page.type("input[id=password]", password, {
          delay: 50
        });
        console.log('password success');
        await page.waitFor(500);
        await page.click("button[id=next]");
        await page.waitFor(10000);
        await page.goto(`${root}/`);
        await page.waitFor(5000);
        const sessionStorageData = await page.evaluate((contextClientKey, contextScopeKey) => {
          const accessToken = sessionStorage.getItem('msal.idtoken');
          const info = sessionStorage.getItem('msal.client.info');
          const contextClientValue = sessionStorage.getItem(contextClientKey);
          const contextScopeValue = sessionStorage.getItem(contextScopeKey);
          return { accessToken, info, contextClientKey, contextScopeKey, contextClientValue, contextScopeValue };
        }, contextClientKey, contextScopeKey);
        const cookies = await page.cookies();
        sessionStorageData.cookies = cookies;
        browser.close();
        return sessionStorageData;
      } catch (error) {
        console.log(error);
        browser.close();
        return 1;
      }
    });
  return creds;
};