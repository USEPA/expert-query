describe("Home Page", () => {
  before(() => {
    cy.visit("/");
  });

  it("close the intro info box", () => {
    cy.findByText("Close Intro").click();
    cy.findByText("Close Intro").should("not.exist");
  });

  it("Clear Search button is available when data profile is select", () => {
    cy.get(`[aria-label="Select a data profile"]`).click();
    cy.findByText("Actions").click();
    cy.findByText("Clear Search").should("exist");
  });

  it("Data profile Sources query link", () => {
    cy.get(`[aria-label="Select a data profile"]`).type(
      "Sour{downArrow}{enter}"
    );
    cy.url().should("include", "/attains#dataProfile=sources&format=csv");
  });

  it("All data profile option are select one by one and check Clear Search button is available ", () => {
    cy.get(`[aria-label="Select a data profile"]`).click();
    cy.get(".css-4ljt47-MenuList")
      .children()
      .its("length")
      .then((length) => {
        for (let i = 0; i < length; i++) {
          cy.get(`#react-select-3-option-${i}`).click();
          cy.findByText("Clear Search").should("exist");

          // for open the select input // last index no need to open
          i !== length - 1 &&
            cy.get(`[aria-label="Select a data profile"]`).click();
        }
      });
  });
});
