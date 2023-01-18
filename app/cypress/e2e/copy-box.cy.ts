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
  it("Verify copy box copy item", { browser: "!electron" }, () => {
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
    cy.wait(1000);
    cy.findAllByRole("button", { name: "Copy content" }).first().click();
    cy.window().then(async (win) => {
      const text = await win.navigator.clipboard.readText();
      expect(text).to.equal(
        `${origin}/attains/#dataProfile=actions&format=csv`
      );
    });
  });

  //TODO :update all 3 copy boxes || Currently it is only testing the first copy box.
});



