describe("CopyBox", () => {
  before(() => {
    cy.visit("/");
  });

  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  const bringUpCopybox = () => {
    cy.get(`[aria-label="Select a data profile"]`).click();
    cy.get(".css-4ljt47-MenuList").children().first().click();
  };

  it("Verify copy box is available", () => {
    bringUpCopybox();

    cy.findAllByTestId("copy-box-container").should("exist");
  });

  it("Verify copy box backgroundColor", () => {
    bringUpCopybox();

    cy.findAllByTestId("copy-box-container")
      .should("exist")
      .should("have.css", "background-color")
      .and("eq", "rgb(240, 240, 240)");
  });

  it("Verify copy box Current Query text", () => {
    bringUpCopybox();

    cy.findAllByTestId("copy-box-container")
      .should("exist")
      .first()
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/#dataProfile=actions&format=csv`
        );
      });
  });

  it("Verify copy box Action Units API Query text", () => {
    bringUpCopybox();

    cy.findAllByTestId("copy-box-container")
      .should("exist")
      .eq(1)
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `${origin}/attains/data/actions?format=csv`
        );
      });
  });

  it("Verify copy box cURL command text", () => {
    bringUpCopybox();

    cy.findAllByTestId("copy-box-container")
      .should("exist")
      .last()
      .should(($elem) => {
        expect($elem.find("span").first().text().trim()).equal(
          `curl -X POST --json ${JSON.stringify(
            '{"filters":{},"options":{"format":"csv"}}'
          )} ${origin}/attains/data/actions`
        );
      });
  });

  // electron browser management is not supported. at Debugger.webContents.debugger.sendCommand
  // https://docs.cypress.io/guides/guides/cross-browser-testing#Running-Specific-Tests-by-Browser
  it("Verify copy box copy item", { browser: "!electron" }, () => {
    bringUpCopybox();

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
});
