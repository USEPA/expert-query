// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import "@testing-library/cypress/add-commands";

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       *  Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      selectProfile(profile: string): Chainable<Element>;
      selectOption(id: string, option: string): Chainable<Element>;
      clipboardValue(value: string): Chainable<Element>;
      selectCopyBox(id: string, value: string): Chainable<Element>;
    }
  }
}

/**
 * This selects a profile from the Data Profile dropdown.
 *
 * @param profile - Profile to select
 */

Cypress.Commands.add("selectProfile", (profile: string) => {
  cy.get("#select-data-profile").within(($el) => {
    cy.wrap($el).click();
    cy.findByText(profile).click();
  });
});

/**
 * This selects a option from the given id.
 *
 * @param id - id of input tag  to type
 * @param option - option to select
 */

Cypress.Commands.add("selectOption", (id: string, option: string) => {
  cy.get(`#${id}`).type(`${option}{enter}`, {
    force: true,
    delay: 500,
    timeout: 150000,
  });
});

/**
 * This read the value from windows clipboard.
 *
 * @param value - string to examine
 */

Cypress.Commands.add("clipboardValue", (value: string) => {
  cy.window().then((win) => {
    win.navigator.clipboard.readText().then((text) => {
      expect(text).to.eq(value);
    });
  });
});

/**
 * This selects CopyBox text from the given id.
 *
 * @param id - id of copy box tag
 * @param value - string to examine
 */

Cypress.Commands.add("selectCopyBox", (id: string, value: string) => {
  cy.findByTestId(id)
    .should("exist")
    .should(($elem) => {
      expect($elem.find("span").first().text().trim()).equal(value);
    });
});
