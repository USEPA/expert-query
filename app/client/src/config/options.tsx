import profiles from './profiles';

const yesNo = [
  {
    label: 'Yes',
    value: 'Y',
  },
  {
    label: 'No',
    value: 'N',
  },
] as const;

export const confirmed = yesNo;

export const cwa303dPriorityRanking = [
  {
    label: 'High',
    value: 'High',
  },
  {
    label: 'Medium',
    value: 'Medium',
  },
  {
    label: 'Low',
    value: 'Low',
  },
] as const;

export const dataProfile = Object.entries(profiles).map(([id, profile]) => {
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
}) as Array<Option<JSX.Element, keyof typeof profiles>>;

export const delisted = yesNo;

export const format = [
  {
    label: 'Comma-separated (CSV)',
    value: 'csv',
  },
  {
    label: 'Tab-separated (TSV)',
    value: 'tsv',
  },
  {
    label: 'Microsoft Excel (XLSX)',
    value: 'xlsx',
  },
  {
    label: 'JavaScript Object Notation (JSON)',
    value: 'json',
  },
] as const;

export const inIndianCountry = yesNo;

export const organizationType = [
  {
    label: 'State',
    value: 'State',
  },
  {
    label: 'Tribe',
    value: 'Tribe',
  },
] as const;
