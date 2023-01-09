describe("Home Page", () => {
  before(() => {
    cy.visit("/");
  });
  const bringUpCopybox = () => {
    cy.get(`[aria-label="Select a data profile"]`).click();
    cy.get(".css-4ljt47-MenuList").children().first().click();
  };

  it("close the intro info box", () => {
    cy.findByText("Close Intro").click();
    cy.findByText("Close Intro").should("not.exist");
  });

  it("Close Intro from this computer", () => {
    cy.visit("/");
    cy.findByText("How to Use This Application").should("exist");
    cy.get('[type="checkbox"]').click({ force: true });
    cy.findByText("Close Intro").click();
    cy.visit("/");
    cy.findByText("How to Use This Application").should("not.exist");
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

  it("searching with a <script> tag displays no option", () => {
    const search = "<script>var j = 1;</script>";
    cy.get(`[aria-label="Select a data profile"]`).type(search);
    cy.get(".css-4ljt47-MenuList")
      .children("div")
      .should("contain.text", "No options");
    cy.get("body").click(0, 0);
  });

  it("Verify url by selecting different format", () => {
    bringUpCopybox();

    cy.findByText("Comma-separated (CSV)").click();
    cy.url().should("include", "attains#dataProfile=actions&format=csv");
    cy.findByText("Tab-separated (TSV)").click();
    cy.url().should("include", "attains#dataProfile=actions&format=tsv");
    cy.findByText("Microsoft Excel (XLSX)").click();
    cy.url().should("include", "attains#dataProfile=actions&format=xlsx");
    cy.findByText("JavaScript Object Notation (JSON)").click();
    cy.url().should("include", "attains#dataProfile=actions&format=json");
  });

  it("Verify Clear Search button after clear", () => {
    bringUpCopybox();

    cy.findByText("Clear Search").click();
    cy.findByText("Clear Search").should("not.exist");
  });

  it("Verify Download Status Pop-up", () => {
    bringUpCopybox();

    cy.intercept("POST", `${origin}/attains/data/actions/count`, {
      count: "510",
    }).as("api-response");

    cy.findByRole("button", { name: "Download" }).click();
    cy.wait(2000);
    cy.get(".usa-modal__main")
      .children("div")
      .first()
      .children("p")
      .first()
      .children("strong")
      .contains("510");

    // closing button X
    cy.get(`[aria-label="Close this window"]`).should("exist");

    cy.findByText("Continue").should("exist");
    cy.findByText("Click continue to download the data.").should("exist");
    cy.findByText("Cancel").should("exist").click();
    cy.get(".usa-modal__main").should("not.exist");
  });
});
