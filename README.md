
# Automation Tests

Testing guidelines

## Tech
- [Cypress](https://www.cypress.io/)

## Getting started
1. Install cypress - the package will be in the dependencies of the project. Run yarn install at root level of repo.

```
yarn install
```

2. Open cypress launcher to view tests available and run them with the UI.

```
yarn cypress
```

3. Run the tests from the command line.
```
yarn cypress run
```

## Adding tests
1. Within the project, there will be a root level cypress folder, within this folder there exists an integration folder; this is where the cypress tests will live. Add any new tests here.

## CI/CD Integration
- [Cypress with React App in CI/CD](https://www.codewithkarma.com/2019/09/create-react-app-functional-automation.html)

## Debugging
- [Debugging with cypress](https://docs.cypress.io/guides/guides/debugging.html#Using-debugger)