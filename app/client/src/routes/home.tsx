import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
// components
import Alert from 'components/alert';
import Button from 'components/button';
import CopyBox from 'components/copyBox';
import { Loading } from 'components/loading';
import RadioButtons from 'components/radioButtons';
import InfoTooltip from 'components/infoTooltip';
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';

interface Option<S, T> {
  label: S;
  value: T;
}

type QueryParameter = [string, QueryValue];

interface QueryState {
  [field: string]: QueryValue | QueryValue[];
}

type QueryValue = string | number | boolean;

/*
## Constants
*/
const dataProfiles = {
  assessmentUnits: {
    description: 'Description of assessment units',
    fields: ['state'],
    label: 'Assessment Units',
    subdirectory: 'assessmentUnits',
  },
  assessmentUnitsMonitoring: {
    description: 'Description of assessment units with monitoring locations',
    fields: ['state'],
    label: 'Assessment Units with Monitoring Locations',
    subdirectory: 'assessmentUnitsMonitoring',
  },
  catchmentCorrespondence: {
    description: 'Description of Catchment Correspondence',
    fields: ['state'],
    label: 'Catchment Correspondence',
    subdirectory: 'catchmentCorrespondence',
  },
  sources: {
    description: 'Description of Sources',
    fields: ['state'],
    label: 'Sources',
    subdirectory: 'sources',
  },
  tmdl: {
    description: 'Description of Total Maximum Daily Load',
    fields: ['state'],
    label: 'Total Maximum Daily Load',
    subdirectory: 'tmdl',
  },
};

// static options
const dataProfileOptions = Object.keys(dataProfiles).map((profileId) => {
  return dataProfileOption(profileId as keyof typeof dataProfiles);
});

const defaultDataProfile = 'assessmentUnits';

const fileFormatOptions = [
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
];

const defaultFileFormat = 'csv';

const staticFields = {
  dataProfile: dataProfileOptions,
  fileFormat: fileFormatOptions,
};

/*
## Utilities
*/
// Convert a JSON object into a parameter string
function buildQueryString(query: QueryState) {
  const paramsList: Array<QueryParameter> = [];
  Object.entries(query).forEach(([field, value]) => {
    if (Array.isArray(value)) value.forEach((v) => paramsList.push([field, v]));
    else paramsList.push([field, value]);
  });
  return paramsList
    .reduce((a, b) => a + `&${b[0]}=${b[1]}`, '')
    .replace('&', '');
}

// Get data profile select options from data profiles config
function dataProfileOption(profileId: keyof typeof dataProfiles) {
  return {
    value: profileId,
    label: (
      <p className="margin-1">
        <b>{dataProfiles[profileId].label}</b>
        <br />
        <em>{dataProfiles[profileId].description}</em>
      </p>
    ),
  };
}

// Produce the option corresponding to a particular value
function getStaticOption<S, T>(
  value: string,
  defaultValue: string,
  options: Option<S, T>[],
) {
  return (
    options.find((option) => option.value === value) ??
    options.find((option) => option.value === defaultValue) ??
    null
  );
}

// Parse parameters provided in the URL hash into a JSON object
function parseInitialParams() {
  const initialParams: QueryState = {};
  const initialParamsList = window.location.hash.replace('#', '').split('&');
  initialParamsList.forEach((param) => {
    const parsedParam = param.split('=');
    if (parsedParam.length !== 2) return;
    const [field, newValue] = parsedParam;
    if (field in initialParams) {
      const value = initialParams[field];
      if (Array.isArray(value)) value.push(newValue);
      else initialParams[field] = [value, newValue];
    } else {
      initialParams[field] = newValue;
    }
  });
  return initialParams;
}

/*
## Components
*/
export function Home() {
  const { content } = useContentState();

  // Params passed in through the URL hash
  const [initialParams] = useState<QueryState>(parseInitialParams());

  // Filter fields
  const [fileFormat, setFileFormat] = useState<
    typeof fileFormatOptions[number] | null
  >(null);

  useEffect(() => {
    const value = initialParams.fileFormat;
    if (typeof value !== 'string') return;
    setFileFormat(getStaticOption(value, defaultFileFormat, fileFormatOptions));
  }, [initialParams]);

  const [dataProfile, setDataProfile] = useState<
    typeof dataProfileOptions[number] | null
  >(null);

  useEffect(() => {
    const value = initialParams.dataProfile;
    if (typeof value !== 'string') return;
    setDataProfile(
      getStaticOption(value, defaultDataProfile, dataProfileOptions),
    );
  }, [initialParams]);

  // Reset all inputs to a default or empty value
  const clearInputs = useCallback(() => {
    setFileFormat(null);
    setDataProfile(null);
  }, []);

  // Update URL when inputs change
  const [queryParams, setQueryParams] = useState<QueryState>({});

  useEffect(() => {
    const allParams = {
      dataProfile: dataProfile?.value,
      fileFormat: fileFormat?.value,
    };

    // Get selected parameters, including multiselectable fields
    // const currentQueryParams: Array<QueryParameter> = [];
    const newQueryParams: QueryState = {};
    Object.entries(allParams).forEach(([field, value]) => {
      if (value == null) return;
      if (
        Object.keys(staticFields).includes(field) ||
        (dataProfile && dataProfiles[dataProfile.value].fields.includes(field))
      ) {
        newQueryParams[field] = value;
      }
    });

    window.location.hash = buildQueryString(newQueryParams);

    setQueryParams(newQueryParams);
  }, [fileFormat, dataProfile]);

  if (content.status === 'pending') return <Loading />;

  if (content.status === 'failure')
    return (
      <Alert type="error">
        Expert Query is currently unavailable, please try again later.
      </Alert>
    );

  if (content.status === 'success')
    return (
      <div>
        <Summary heading="How to Use This Application" styles={['margin-2']}>
          <p>
            Select a data profile, then build a query by selecting options from
            the input fields.
          </p>
        </Summary>
        <h3>Data Profile</h3>
        <Select
          isClearable={true}
          onChange={(ev) => setDataProfile(ev)}
          options={dataProfileOptions}
          value={dataProfile}
        />
        <h3>Filters</h3>
        <h3>Download the Data</h3>
        <div className="display-flex flex-wrap">
          <RadioButtons
            legend={
              <>
                <b className="margin-right-1">File Format</b>
                <InfoTooltip text="Choose a file format for the result set" />
              </>
            }
            onChange={(option) =>
              setFileFormat(option as typeof fileFormatOptions[number])
            }
            options={fileFormatOptions}
            selected={fileFormat}
            styles={['margin-bottom-2']}
          />
          <div className="display-flex flex-column flex-1 margin-y-auto">
            <Button
              onClick={() => {}}
              styles={['margin-x-auto', 'margin-bottom-1']}
            >
              Download
            </Button>
            <Button
              color="white"
              onClick={clearInputs}
              styles={['margin-x-auto']}
            >
              Clear Search
            </Button>
          </div>
        </div>
        <h4>Current Query</h4>
        <CopyBox
          text={`${window.location.origin}/#${buildQueryString(queryParams)}`}
        />
        {dataProfile && (
          <>
            <h4>{dataProfiles[dataProfile.value].label} API Query</h4>
            <CopyBox
              text={`${window.location.origin}/data/${
                dataProfiles[dataProfile.value].subdirectory
              }?${buildQueryString(queryParams)}`}
            />
          </>
        )}
      </div>
    );

  return null;
}
