import { dataProfiles } from "./index";

export const confirmed = [
  {
    label: "Yes",
    value: "Y",
  },
  {
    label: "No",
    value: "N",
  },
] as const;

export const dataProfile = Object.entries(dataProfiles).map(([id, profile]) => {
  return {
    value: id,
    label: (
      <p className="margin-1">
        <b>{profile.label}</b>
        <br />
        <em>{profile.description}</em>
      </p>
    ),
  };
});

export const fileFormat = [
  {
    label: "Comma-separated (CSV)",
    value: "csv",
  },
  {
    label: "Tab-separated (TSV)",
    value: "tsv",
  },
  {
    label: "Microsoft Excel (XLSX)",
    value: "xlsx",
  },
  {
    label: "JavaScript Object Notation (JSON)",
    value: "json",
  },
] as const;

export const inIndianCountry = confirmed;

export const organizationType = [
  {
    label: "State",
    value: "State",
  },
  {
    label: "Tribe",
    value: "Tribe",
  },
] as const;
