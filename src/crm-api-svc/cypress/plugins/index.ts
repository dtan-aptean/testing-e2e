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
import axios from 'axios';
import * as fs from 'fs';
import * as mime from 'mime-types';
import { BlobServiceClient } from "@azure/storage-blob";
const { beforeRunHook, afterRunHook } = require('cypress-mochawesome-reporter/lib');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = async (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  const dateSubFolder = new Date().toISOString().substring(0,19);
  const storageConnString = config.env.storageAccountConnString;
  config.screenshotsFolder = `${config.screenshotsFolder}/${dateSubFolder}`;
  config.reporterOptions.reportDir = `${config.reporterOptions.reportDir}/${dateSubFolder}`

  on('before:run', async (details) => {
    console.log('override before:run');
    await beforeRunHook(details);  
  });

  on('after:run', async (results) => {
    console.log(results);
    console.log('override after:run');
    await afterRunHook();

    if (config.env.runtimeEnv == 'local') 
      return;

    const blobServiceClient = BlobServiceClient.fromConnectionString(storageConnString);
    const reportContainer = blobServiceClient.getContainerClient("crm-api-svc-cypress-report");
    await uploadBlobs(reportContainer, results.config.reporterOptions.reportDir, dateSubFolder);
    
    if (results) {
      const title = results.totalFailed > 0 ? `<span style='color:red'>**IMPORTANT!<br>${results.totalPassed} out of ${results.totalTests} passed**</span>` : `<span style='color:green'>**${results.totalPassed} out of ${results.totalTests} passed**</span>`;
      await axios.post("https://apteanonline.webhook.office.com/webhookb2/b879817b-ffa3-404c-8f59-37ecabce0a54@560ec2b0-df0c-4e8c-9848-a15718863bb6/IncomingWebhook/98cc844d8169477a88edcbd0e5f6ef18/454b10e8-52f9-46f3-98d9-d90774cf43bf", {      
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": "CRM API Services Cypress Test Result",
          "sections": [{
              "activityTitle": title,
              "activitySubtitle": "On CRM API Services",
              "facts": [],
              "markdown": true
          }],
          "potentialAction": [{
              "@type": "OpenUri",
              "name": "See Details",
              "targets": [{
                  "os": "default",
                  "uri": `https://stcypressdev001.blob.core.windows.net/crm-api-svc-cypress-report/${dateSubFolder}/index.html`
              }]
          }]
      });
    }
  });
  return config;    
};

const walk = (dir, done) => {
  let results:any[] = [];
  let i = 0;
  const list = fs.readdirSync(dir);
  (function next() {
    let file = list[i++];
    if (!file) {
      return done(null, results);
    }
    file = dir + '/' + file;
    const fsStat = fs.statSync(file);
    if (fsStat && fsStat.isDirectory()) {
      walk(file, (err, res) => {
        results = results.concat(res);
        next();
      });
    } else {
      results.push(file);
      next();
    }    
  })();
};

const uploadBlobs = async (containerClent, sourceDirectoryPath, dateSubFolder) => {
  if (!fs.existsSync(sourceDirectoryPath)) {
    console.log(sourceDirectoryPath + ' is an invalid directory path.');
    return;
  }
  let fileList:any[] = [];
  // Search the directory and generate a list of files to upload.
  walk(sourceDirectoryPath, function (error, files) {
    if (error) {
      console.log(error);
    } else {
      fileList = files;
    }
  });

  for (const file of fileList) {
    console.log(`Processing file ${file}`);
    const blobName = file.substr(sourceDirectoryPath.length + 1);
    const blobClient = containerClent.getBlockBlobClient(`${dateSubFolder}/${blobName}`);
    try {
      await blobClient.uploadFile(file, {
        blobHTTPHeaders: {
          blobContentType: mime.lookup(file)
        },
        blockSize: 4 * 1024 * 1024,
        concurrency: 20
      });
      console.log(`Upload file ${file} succeeds`);
    } catch (err) {
      console.log(`Upload file failed, requestId - ${err.details.requestId}, statusCode - ${err.statusCode}, errorCode - ${err.details.errorCode}`);
    }    
  };  
}
