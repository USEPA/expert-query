describe("CopyBox", () => {
  before(() => {
    cy.visit("/");
  });

  const location = window.location;
  const origin =
    location.hostname === "localhost"
      ? `${location.protocol}//${location.hostname}:3000`
      : window.location.origin;

  const bringUpCkeckbox = () => {
    cy.get(`[aria-label="Select a data profile"]`).click();
    cy.get(".css-4ljt47-MenuList").children().first().click();
  };

  it("Verify copy box is available", () => {
    bringUpCkeckbox();

    cy.findAllByTestId("copy-box-container").should("exist");
  });

  it("Verify copy box backgroundColor", () => {
    bringUpCkeckbox();

    cy.findAllByTestId("copy-box-container")
      .should("exist")
      .should("have.css", "background-color")
      .and("eq", "rgb(240, 240, 240)");
  });

  it("Verify copy box Current Query text", () => {
    bringUpCkeckbox();

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
    bringUpCkeckbox();

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
    bringUpCkeckbox();

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
});
