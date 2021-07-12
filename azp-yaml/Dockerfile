FROM cypress/included:7.7.0 as base

WORKDIR /src

COPY ./cypress ./cypress
COPY ./cypress.json ./cypress.json

RUN npm install typescript puppeteer cypress-file-upload axios cypress-mochawesome-reporter mocha mime-types @azure/storage-blob

ENTRYPOINT ["cypress", "run"] 