import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Select from 'react-select';
// components
import Alert from 'components/alert';
import Button from 'components/button';
import Checkbox from 'components/checkbox';
import CopyBox from 'components/copyBox';
import InfoTooltip from 'components/infoTooltip';
import { Loading } from 'components/loading';
import RadioButtons from 'components/radioButtons';
import RangeSlider from 'components/rangeSlider';
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';
// types
import type { Dispatch, ReactNode } from 'react';
// config
import { options as listOptions, profiles } from 'config';

/*
## Types
*/
interface InputState {
  fileFormat: Option<ReactNode, string> | null;
  dataProfile: Option<JSX.Element, keyof typeof profiles> | null;
  state: Readonly<Option<string, string>[]> | null;
}

type InputAction =
  | { type: 'fileFormat'; payload: Option<ReactNode, string> }
  | {
      type: 'dataProfile';
      payload: Option<JSX.Element, keyof typeof profiles> | null;
    }
  | { type: 'initialize'; payload: InputState }
  | { type: 'reset' }
  | { type: 'state'; payload: Readonly<Option<string, string>[]> };

type QueryParameter = [string, QueryValue];

interface QueryState {
  [field: string]: QueryValue | QueryValue[];
}

type QueryValue = string | number | boolean;

/*
## Constants
*/
const defaultFileFormat = 'csv';

const controlFields = ['dataProfile', 'fileFormat'];

/*
## Utilities
*/
// Converts a JSON object into a parameter string
function buildQueryString(query: QueryState, includeControl = true) {
  const paramsList: Array<QueryParameter> = [];
  Object.entries(query).forEach(([field, value]) => {
    if (!includeControl && controlFields.includes(field)) return;

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

// Empty or default values for inputs
function getDefaultInputs(): InputState {
  return {
    dataProfile: null,
    fileFormat: matchSingleStaticOption(
      null,
      defaultFileFormat,
      listOptions.fileFormat,
    ),
    state: null,
  };
}

// Uses URL query parameters or default values for initial state
async function getUrlInputs(
  signal: AbortSignal, // will need for DB checks
  domainOptions: DomainValues,
): Promise<InputState> {
  const params = parseInitialParams();

  const fileFormat = matchSingleStaticOption(
    params.fileFormat ?? null,
    defaultFileFormat,
    listOptions.fileFormat,
  );

  const dataProfile = matchSingleStaticOption(
    params.dataProfile ?? null,
    null,
    listOptions.dataProfile,
  );

  const state = matchMultipleStaticOptions(
    params.state ?? null,
    null,
    domainOptions.state,
  );

  return { dataProfile, fileFormat, state };
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
        ...state,
        dataProfile: action.payload,
      };
    case 'initialize':
      return action.payload;
    case 'reset':
      return getDefaultInputs();
    case 'state':
      return {
        ...state,
        state: action.payload,
      };
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

// Wrapper function for `matchStaticOptions`
function matchSingleStaticOption<S, T>(
  values: QueryValue | QueryValue[] | null,
  defaultValue: QueryValue | null,
  options?: readonly Option<S, T>[],
): Option<S, T> | null {
  return matchStaticOptions(values, defaultValue, options ?? null) as Option<
    S,
    T
  > | null;
}

// Wrapper function for `matchStaticOptions`
function matchMultipleStaticOptions<S, T>(
  values: QueryValue | QueryValue[] | null,
  defaultValue: QueryValue | null,
  options?: Option<S, T>[],
): Option<S, T>[] | null {
  return matchStaticOptions(values, defaultValue, options ?? null, true) as
    | Option<S, T>[]
    | null;
}

// Produce the option/s corresponding to a particular value
function matchStaticOptions<S, T>(
  values: QueryValue | QueryValue[] | null,
  defaultValue: QueryValue | null,
  options: readonly Option<S, T>[] | null,
  multiple = false,
) {
  if (!options) return defaultValue;
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

function useAbortSignal() {
  const abortController = useRef(new AbortController());
  const getAbortController = useCallback(() => {
    if (abortController.current.signal.aborted) {
      abortController.current = new AbortController();
    }
    return abortController.current;
  }, []);

  useEffect(() => {
    return function cleanup() {
      abortController.current.abort();
    };
  }, [getAbortController]);

  const getSignal = useCallback(
    () => getAbortController().signal,
    [getAbortController],
  );

  return getSignal;
}
/*
## Components
*/
export function Home() {
  const { content } = useContentState();
  const getAbortSignal = useAbortSignal();

  const [inputState, inputDispatch] = useReducer(
    inputReducer,
    getDefaultInputs(),
  );
  const { dataProfile, fileFormat } = inputState;

  // Populate the input fields with URL parameters, if any
  const [inputsLoaded, setInputsLoaded] = useState(false);
  useEffect(() => {
    if (content.status === 'failure') return setInputsLoaded(true);
    if (content.status !== 'success') return;
    getUrlInputs(getAbortSignal(), content.data.domainValues)
      .then((initialInputs) => {
        inputDispatch({ type: 'initialize', payload: initialInputs });
      })
      .catch((err) => {
        console.error(`Error loading initial inputs: ${err}`);
      })
      .finally(() => setInputsLoaded(true));
  }, [content, getAbortSignal]);

  // Track non-empty values relevant to the current profile
  const [queryParams, setQueryParams] = useState<QueryState>({});

  // Update URL when inputs change
  useEffect(() => {
    if (!inputsLoaded) return;

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
        controlFields.includes(field) ||
        (dataProfile &&
          (
            profiles[dataProfile.value].fields as ReadonlyArray<string>
          ).includes(field))
      ) {
        newQueryParams[field] = flattenedValue;
      }
    });

    window.location.hash = buildQueryString(newQueryParams);

    setQueryParams(newQueryParams);
  }, [dataProfile, inputState, inputsLoaded]);

  const [introVisible, setIntroVisible] = useState(
    !!JSON.parse(getLocalStorageItem('showIntro') ?? 'true'),
  );
  const [dontShowAgain, setDontShowAgain] = useState<boolean | null>(null);

  useEffect(() => {
    if (dontShowAgain === null) return;
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
            <div className="display-flex flex-justify flex-wrap">
              <Checkbox
                checked={dontShowAgain ?? false}
                label="Don't show again on this computer"
                onChange={(_ev) => setDontShowAgain(!dontShowAgain)}
                styles={['margin-right-1 margin-y-auto']}
              />
              <Button
                onClick={() => setIntroVisible(false)}
                styles={['margin-top-2']}
              >
                Close Intro
              </Button>
            </div>
          </Summary>
        )}
        <h3>Data Profile</h3>
        <Select
          aria-label="Select a data profile"
          onChange={(ev) => inputDispatch({ type: 'dataProfile', payload: ev })}
          options={listOptions.dataProfile}
          placeholder="Select a data profile..."
          value={dataProfile}
        />
        {dataProfile && (
          <>
            <h3>Filters</h3>
            <FilterFields
              dispatch={inputDispatch}
              fields={profiles[dataProfile.value].fields}
              options={{ ...listOptions, ...content.data.domainValues }}
              state={inputState}
            />
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
                options={listOptions.fileFormat}
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
              <h4>{profiles[dataProfile.value].label} API Query</h4>
              <CopyBox
                text={`${window.location.origin}/data/${
                  profiles[dataProfile.value].resource
                }?${buildQueryString(queryParams, false)}`}
              />
            </>
          </>
        )}
      </div>
    );

  return null;
}

type FilterFieldsProps = {
  dispatch: Dispatch<InputAction>;
  fields: readonly string[];
  options: typeof listOptions & DomainValues;
  state: InputState;
};

function FilterFields({ dispatch, fields, options, state }: FilterFieldsProps) {
  return (
    <div>
      {fields.includes('state') && (
        <div>
          <label className="usa-label">
            <b>State</b>
            <Select
              aria-label="Select a state..."
              isMulti
              onChange={(ev) => dispatch({ type: 'state', payload: ev })}
              options={options.state}
              placeholder="Select a state..."
              value={state.state}
            />
          </label>
        </div>
      )}

      {fields.includes('region') && (
        <div>
          <label className="usa-label">
            <b>Region</b>
            <Select
              aria-label="Select a region"
              // onChange={(ev) => dispatch({ type: 'state', payload: ev })}
              // options={dataProfileOptions}
              placeholder="Select a region..."
              // value={state}
            />
          </label>
        </div>
      )}

      {fields.includes('reportingCycle') && (
        <RangeSlider
          label={<b>Reporting Cycle</b>}
          onChange={(value) => console.log(value)}
          value={0}
        />
      )}
    </div>
  );
}
