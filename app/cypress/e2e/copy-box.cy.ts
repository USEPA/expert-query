describe("CopyBox", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.selectProfile("Actions");
    cy.findByRole("button", { name: "Queries" }).click();
  });

  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  const grantPermissions = () => {
    cy.wrap(
      Cypress.automation("remote:debugger:protocol", {
        command: "Browser.grantPermissions",
        params: {
          permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"],
          // make the permission tighter by allowing the current origin only
          // like "http://localhost:3000"
          origin: window.location.origin,
        },
      })
    );
  };

  it("Verify copy box is available", () => {
    cy.findByTestId("current-query-copy-box-container").should("exist");
    cy.findByTestId("api-query-copy-box-container").should("exist");
    cy.findByTestId("curl-copy-box-container").should("exist");
  });

  it("Verify copy box backgroundColor", () => {
    cy.findByTestId("current-query-copy-box-container")
      .should("exist")
      .should("have.css", "background-color")
      .and("eq", "rgb(240, 240, 240)");

    cy.findByTestId("api-query-copy-box-container")
      .should("exist")
      .should("have.css", "background-color")
      .and("eq", "rgb(240, 240, 240)");

    cy.findByTestId("curl-copy-box-container")
      .should("exist")
      .should("have.css", "background-color")
      .and("eq", "rgb(240, 240, 240)");
  });

  // electron browser management is not supported. at Debugger.webContents.debugger.sendCommand
  // https://docs.cypress.io/guides/guides/cross-browser-testing#Running-Specific-Tests-by-Browser
  it(
    "Verify copy box  Current Query copyed item",
    { browser: "!electron" },
    () => {
      grantPermissions();
      cy.wait(1000);
      cy.findAllByRole("button", { name: "Copy content" }).first().click();
      cy.clipboardValue(`${origin}/attains/actions#`);
    }
  );

  it(
    "Verify copy box Actions API Query copyed item",
    { browser: "!electron" },
    () => {
      grantPermissions();
      cy.wait(1000);
      cy.findAllByRole("button", { name: "Copy content" }).eq(1).click();
      cy.clipboardValue(`${origin}/attains/data/actions?format=csv`);
    }
  );

  it(
    "Verify copy box Actions cURL copyed item",
    { browser: "!electron" },
    () => {
      grantPermissions();
      cy.wait(1000);
      cy.findAllByRole("button", { name: "Copy content" }).last().click();
      cy.clipboardValue(
        `curl -X POST --json ${JSON.stringify(
          '{"filters":{},"options":{"format":"csv"}}'
        )} ${origin}/attains/data/actions`
      );
    }
  );
});
