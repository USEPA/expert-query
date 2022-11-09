import { useEffect, useReducer, useState } from 'react';
import Select from 'react-select';
// components
import Alert from 'components/alert';
import Button from 'components/button';
import Checkbox from 'components/checkbox';
import CopyBox from 'components/copyBox';
import { Loading } from 'components/loading';
import RadioButtons from 'components/radioButtons';
import InfoTooltip from 'components/infoTooltip';
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';
// types
import type { ReactNode } from 'react';

/*
## Types
*/
interface InputState {
  fileFormat: Option<ReactNode, string> | null;
  dataProfile: Option<JSX.Element, keyof typeof dataProfiles> | null;
}

type InputAction =
  | { type: 'reset' }
  | { type: 'fileFormat'; payload: Option<ReactNode, string> }
  | {
      type: 'dataProfile';
      payload: Option<JSX.Element, keyof typeof dataProfiles> | null;
    };

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

const defaultFileFormat = 'csv';

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

const staticFields = ['dataProfile', 'fileFormat'];

/*
## Utilities
*/
// Converts a JSON object into a parameter string
function buildQueryString(query: QueryState, includeStatic = true) {
  const paramsList: Array<QueryParameter> = [];
  Object.entries(query).forEach(([field, value]) => {
    if (!includeStatic && staticFields.includes(field)) return;

    // Duplicate the query parameter for an array of values
    if (Array.isArray(value)) value.forEach((v) => paramsList.push([field, v]));
    // Else push a single parameter
    else paramsList.push([field, value]);
  });
  return paramsList
    .reduce((a, b) => a + `&${b[0]}=${b[1]}`, '')
    .replace('&', ''); // trim the leading ampersand
}

function getLocalStorageItem(item: string) {
  if (storageAvailable()) {
    return localStorage.getItem(item) ?? null;
  } else return null;
}

// Gets data profile select options from data profiles configuration
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

// Empty or default values for inputs
function getClearedState(): InputState {
  return {
    dataProfile: null,
    fileFormat: matchSingleOption(null, defaultFileFormat, fileFormatOptions),
  };
}

// Uses URL query parameters or default values for initial state
function getInitialState(): InputState {
  const params = parseInitialParams();

  const fileFormat = matchSingleOption(
    params.fileFormat ?? null,
    defaultFileFormat,
    fileFormatOptions,
  );

  const dataProfile = matchSingleOption(
    params.dataProfile ?? null,
    null,
    dataProfileOptions,
  );

  return { fileFormat, dataProfile };
}

// Manages the state of all query field inputs
function inputReducer(state: InputState, action: InputAction): InputState {
  switch (action.type) {
    case 'fileFormat':
      return {
        ...state,
        fileFormat: action.payload,
      };
    case 'dataProfile':
      return {
        ...getClearedState(),
        dataProfile: action.payload,
      };
    case 'reset':
      return getClearedState();
    default: {
      const message = `Unhandled action type: ${action}`;
      throw new Error(message);
    }
  }
}

// Type narrowing for InputState
function isOption(
  maybeOption: Option<unknown, unknown> | QueryValue,
): maybeOption is Option<unknown, unknown> {
  return typeof maybeOption === 'object' && 'value' in maybeOption;
}

// Type assertion for return value `matchStaticOptions`
function matchSingleOption<S, T>(
  values: QueryValue | QueryValue[] | null,
  defaultValue: QueryValue | null,
  options: Option<S, T>[],
): Option<S, T> | null {
  return matchStaticOptions(values, defaultValue, options) as Option<
    S,
    T
  > | null;
}

// Produce the option/s corresponding to a particular value
function matchStaticOptions<S, T>(
  values: QueryValue | QueryValue[] | null,
  defaultValue: QueryValue | null,
  options: Option<S, T>[],
  multiple = false,
) {
  const valuesArray: QueryValue[] = [];
  if (Array.isArray(values)) valuesArray.push(...values);
  else if (values !== null) valuesArray.push(values);
  if (!valuesArray.length && defaultValue) valuesArray.push(defaultValue);

  const matches = new Set<Option<S, T>>(); // prevent duplicates
  // Check if the value is valid, otherwise use a default value
  valuesArray.forEach((value) => {
    const match =
      options.find((option) => option.value === value) ??
      options.find((option) => option.value === defaultValue);
    if (match) matches.add(match);
  });
  const matchesArray = Array.from(matches);
  return multiple ? matchesArray : matchesArray.pop() ?? null;
}

// Parse parameters provided in the URL hash into a JSON object
function parseInitialParams() {
  const initialParams: QueryState = {};
  const initialParamsList = window.location.hash.replace('#', '').split('&');
  initialParamsList.forEach((param) => {
    const parsedParam = param.split('=');
    // Disregard invalid or empty parameters
    if (parsedParam.length !== 2 || parsedParam[1] === '') return;
    const [field, newValue] = parsedParam;
    if (field in initialParams) {
      // Multiple values, add to an array
      const value = initialParams[field];
      if (Array.isArray(value)) value.push(newValue);
      else initialParams[field] = [value, newValue];
    } else {
      // Single value
      initialParams[field] = newValue;
    }
  });
  return initialParams;
}

function setLocalStorageItem(item: string, value: string) {
  storageAvailable() && localStorage.setItem(item, value);
}

function storageAvailable(
  storageType: 'localStorage' | 'sessionStorage' = 'localStorage',
) {
  let storage: Storage = window[storageType];
  try {
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      // everything except Firefox
      (e.name === 'QuotaExceededError' ||
        // Firefox
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

/*
## Components
*/
export function Home() {
  const { content } = useContentState();

  const [inputState, inputDispatch] = useReducer(
    inputReducer,
    getInitialState(),
  );
  const { dataProfile, fileFormat } = inputState;

  // Track non-empty values relevant to the current profile
  const [queryParams, setQueryParams] = useState<QueryState>({});

  // Update URL when inputs change
  useEffect(() => {
    // Get selected parameters, including multiselectable fields
    const newQueryParams: QueryState = {};
    Object.entries(inputState).forEach(([field, value]) => {
      if (value == null || (Array.isArray(value) && !value.length)) return;
      // Extract 'value' field from Option types
      const flattenedValue = Array.isArray(value)
        ? value.map((v) => (isOption(v) ? v.value : v))
        : isOption(value)
        ? value.value
        : value;
      if (
        staticFields.includes(field) ||
        (dataProfile && dataProfiles[dataProfile.value].fields.includes(field))
      ) {
        newQueryParams[field] = flattenedValue;
      }
    });

    window.location.hash = buildQueryString(newQueryParams);

    setQueryParams(newQueryParams);
  }, [dataProfile, inputState]);

  const [introVisible, setIntroVisible] = useState(
    getLocalStorageItem('showIntro') === 'true' ?? true,
  );
  const [dontShowAgain, setDontShowAgain] = useState<boolean | null>(null);

  useEffect(() => {
    if (!dontShowAgain) return;
    setLocalStorageItem('showIntro', JSON.stringify(!dontShowAgain));
  }, [dontShowAgain]);

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
        {introVisible && (
          <Summary heading="How to Use This Application">
            <p>
              Select a data profile, then build a query by selecting options
              from the input fields.
            </p>
            <p className="display-flex flex-justify flex-wrap">
              <Checkbox
                checked={dontShowAgain ?? false}
                id="do-not-show-intro-checkbox"
                label="Don't show again on this computer"
                onChange={(_ev) => setDontShowAgain(!dontShowAgain)}
                styles={['margin-bottom-2 margin-right-1']}
              />
              <Button onClick={() => setIntroVisible(false)}>Close</Button>
            </p>
          </Summary>
        )}
        <h3>Data Profile</h3>
        <Select
          onChange={(ev) => inputDispatch({ type: 'dataProfile', payload: ev })}
          options={dataProfileOptions}
          placeholder="Select a data profile..."
          value={dataProfile}
        />
        {dataProfile && (
          <>
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
                  inputDispatch({ type: 'fileFormat', payload: option })
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
                  onClick={(_ev) => inputDispatch({ type: 'reset' })}
                  styles={['margin-x-auto']}
                >
                  Clear Search
                </Button>
              </div>
            </div>
            <h4>Current Query</h4>
            <CopyBox
              text={`${window.location.origin}/#${buildQueryString(
                queryParams,
              )}`}
            />
            <>
              <h4>{dataProfiles[dataProfile.value].label} API Query</h4>
              <CopyBox
                text={`${window.location.origin}/data/${
                  dataProfiles[dataProfile.value].subdirectory
                }?${buildQueryString(queryParams, false)}`}
              />
            </>
          </>
        )}
      </div>
    );

  return null;
}
