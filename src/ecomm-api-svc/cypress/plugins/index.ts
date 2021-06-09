import axios from 'axios';
/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
 module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  const dateSubFolder = new Date().toISOString().substring(0,10);
  config.screenshotsFolder = `${config.screenshotsFolder}/${dateSubFolder}`;
  config.reporterOptions.mochaFile = `/e2e/cypress/results/${dateSubFolder}/test-result-ecomm-api-svc-[hash].xml`;
  
  on('after:run', async (results) => {
    if (results) {
      let facts = [];
      let failed: Array<string> = [];
      let skipped: Array<string> = [];
      facts.push({
        "name": "Duration",
        "value": `${results.totalDuration/1000} seconds`
      });
      results.runs.forEach(r => {
        r.tests.forEach(t => {
          // Check if there is passed attempt
          if (!t.attempts.some(a => { return a.state == "passed" })) {
            if (t.attempts[0].state == "failed") 
              failed.push(`${t.title[1]}:${t.title[2]}`);
            else 
              skipped.push(`${t.title[1]}:${t.title[2]}`);
          }
        });
      });

      if (failed.length > 0) {
        facts.push({
          "name": "Failed",
          "value": failed.join("<br>")
        })
      }
      if (skipped.length > 0) {
        facts.push({
          "name": "Skipped",
          "value": skipped.join("<br>")
        })
      }      

      await axios.post("https://apteanonline.webhook.office.com/webhookb2/b879817b-ffa3-404c-8f59-37ecabce0a54@560ec2b0-df0c-4e8c-9848-a15718863bb6/IncomingWebhook/eb364835301e4e84a8228da33ba09146/a7c163f2-fcf7-4365-a94c-6d9bf23155cc", {      
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": "Cypress Test Result",
          "sections": [{
              "activityTitle": `${results.totalPassed} out of ${results.totalTests} passed`,
              "activitySubtitle": "On Ecommerce API Services",
              "facts": facts,
              "markdown": true
          }],
          "potentialAction": [{
              "@type": "OpenUri",
              "name": "See Details",
              "targets": [{
                  "os": "default",
                  "uri": "https://portal.azure.com/#blade/Microsoft_Azure_FileStorage/FileShareMenuBlade/overview/storageAccountId/%2Fsubscriptions%2Fa31596c1-e218-48d6-ad65-c7beafeb2bfa%2FresourceGroups%2Frg-eastus-tst-ecommerce%2Fproviders%2FMicrosoft.Storage%2FstorageAccounts%2Fstecommercetenanttst001/path/cypress-ecomm-api-svc/protocol/SMB"
              }]
          }
          ]
      });
    }
  });
  return config;  
};