# Frontend Template

This Repo is intended to be used as a template frontend repo for all moleculemaker frontends.
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.7. 

## Bootstrap

1. Clone repo to local machine
2. Run `npm i` to install the dependencies
3. Run `npm run init` to generate deployment configuration for the app. You will be prompted to enter the app name.

## Utilities

This repo includes a library that helps build frontend application quickly.

- Code Generator:

  - Command: `ng g @moleculemaker/ui-lib:mmli-job`

    Effect: Generate a template job input page, loading page, and result page

  - Command: `ng g @moleculemaker/ui-lib:deployment`
 
    Effect: Generate an application with ArgoCD deployment configuation.

- UI Library

  All builtin components are inside `src/app/components` folder.

  Component Preview (WIP): use storybook

## Development server

For marvin.js license add the following lines to the ~/.npmrc file:
```
@chemaxon:registry=https://hub.chemaxon.com/artifactory/api/npm/npm/
hub.chemaxon.com/artifactory/api/npm/npm/:_auth="<auth>"
hub.chemaxon.com/artifactory/api/npm/npm/:_password="<password>"
hub.chemaxon.com/artifactory/api/npm/npm/:username=<user>
hub.chemaxon.com/artifactory/api/npm/npm/:email=<email>
hub.chemaxon.com/artifactory/api/npm/npm/:always-auth=true
```

MMLI members can reach out to developers for the secrets. Non-MMLI members will need to make their own arrangements for a MarvinJS license.

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
