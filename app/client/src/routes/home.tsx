import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { ReactComponent as Book } from 'uswds/img/usa-icons/local_library.svg';
import { ReactComponent as Download } from 'uswds/img/usa-icons/file_download.svg';
// components
import Alert from 'components/alert';
import Checkbox from 'components/checkbox';
import Checkboxes from 'components/checkboxes';
import CopyBox from 'components/copyBox';
import GlossaryPanel, { GlossaryTerm } from 'components/glossaryPanel';
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
type DomainValueInputStateValue = ReadonlyArray<
  Option<ReactNode | string, string>
> | null;

type DomainValueInputState = {
  [Property in keyof DomainValues]: DomainValueInputStateValue;
};

type InputState = DomainValueInputState & {
  dataProfile: Option<JSX.Element, keyof typeof profiles> | null;
  format: Option<ReactNode, string> | null;
};

type InputAction =
  | {
      type: keyof DomainValues;
      payload: ReadonlyArray<Option<string | ReactNode, string>> | null;
    }
  | {
      type: 'dataProfile';
      payload: Option<JSX.Element, keyof typeof profiles> | null;
    }
  | { type: 'format'; payload: Option<ReactNode, string> }
  | { type: 'initialize'; payload: InputState }
  | { type: 'reset' };

type URLQueryParam = [string, URLQueryArg];

type URLQueryState = {
  [field: string]: URLQueryArg | URLQueryArg[];
};

type URLQueryArg = string | number | boolean;

type InputValue = URLQueryArg | URLQueryArg[] | null;

/*
## Constants
*/
const staticOptionLimit = 100;

const defaultFormat = 'csv';

const controlFields = ['dataProfile', 'format'];

/*
## Utilities
*/
// Converts a JSON object into a parameter string
function buildQueryString(query: URLQueryState, includeProfile = true) {
  const paramsList: URLQueryParam[] = [];
  Object.entries(query).forEach(([field, value]) => {
    if (!includeProfile && field === 'dataProfile') return;

    // Duplicate the query parameter for an array of values
    if (Array.isArray(value)) value.forEach((v) => paramsList.push([field, v]));
    // Else push a single parameter
    else paramsList.push([field, value]);
  });
  return paramsList
    .reduce((a, b) => a + `&${b[0]}=${b[1]}`, '')
    .replace('&', ''); // trim the leading ampersand
}

// Filters options by search input, returning a maximum number of options
function filterStaticOptions<T>(options: ReadonlyArray<Option<string, T>>) {
  return function (inputValue: string) {
    const value = inputValue.trim().toLowerCase();
    if (value.length < 3) {
      return Promise.resolve(
        options.length < staticOptionLimit
          ? options
          : options.slice(0, staticOptionLimit),
      );
    }

    const matches: Array<Option<string, T>> = [];
    options.every((option) => {
      if (matches.length >= staticOptionLimit) return false;
      if (option.label.toLowerCase().includes(value)) matches.push(option);
      else if (
        typeof option.value === 'string' &&
        option.value.toLowerCase().includes(value)
      ) {
        matches.push(option);
      }
      return true;
    });
    return Promise.resolve(matches);
  };
}

function getArticle(noun: string) {
  if (!noun.length) return '';
  if (['a', 'e', 'i', 'o', 'u'].includes(noun.charAt(0).toLowerCase())) {
    return 'an';
  }
  return 'a';
}

function getLocalStorageItem(item: string) {
  if (storageAvailable()) {
    return localStorage.getItem(item) ?? null;
  } else return null;
}

// Empty or default values for inputs
function getDefaultInputs(): InputState {
  return {
    actionAgency: null,
    assessmentUnitStatus: null,
    dataProfile: null,
    format: matchSingleStaticOption(null, defaultFormat, listOptions.format),
    loadAllocationUnits: null,
    locationText: null,
    locationTypeCode: null,
    organizationId: null,
    parameterGroup: null,
    pollutant: null,
    sourceName: null,
    sourceScale: null,
    sourceType: null,
    state: null,
    stateIrCategory: null,
    useClassName: null,
    waterSizeUnits: null,
    waterType: null,
  };
}

// Extracts the value field from Option items, otherwise returns the item
function getInputValue(input: Exclude<InputState[keyof InputState], null>) {
  if (Array.isArray(input)) {
    return input.map((v) => {
      if (isOption(v)) return v.value;
      return v;
    });
  }
  if (isOption(input)) return input.value;
  return input;
}

// Uses URL query parameters or default values for initial state
// eslint-disable-next-line
async function getUrlInputs(
  _signal: AbortSignal,
  domainOptions: DomainValues,
): Promise<InputState> {
  const params = parseInitialParams();

  const newState = getDefaultInputs();

  let key: keyof typeof domainOptions;
  for (key in domainOptions) {
    newState[key] = matchMultipleStaticOptions(
      params[key] ?? null,
      null,
      domainOptions[key],
    );
  }

  newState.format = matchSingleStaticOption(
    params.format ?? null,
    defaultFormat,
    listOptions.format,
  );

  newState.dataProfile = matchSingleStaticOption(
    params.dataProfile ?? null,
    null,
    listOptions.dataProfile,
  );

  return newState;
}

// Manages the state of all query field inputs
function inputReducer(state: InputState, action: InputAction): InputState {
  switch (action.type) {
    case 'actionAgency':
      return {
        ...state,
        actionAgency: action.payload,
      };
    case 'assessmentUnitStatus':
      return {
        ...state,
        assessmentUnitStatus: action.payload,
      };
    case 'format':
      return {
        ...state,
        format: action.payload,
      };
    case 'dataProfile':
      return {
        ...state,
        dataProfile: action.payload,
      };
    case 'initialize':
      return action.payload;
    case 'loadAllocationUnits':
      return {
        ...state,
        loadAllocationUnits: action.payload,
      };
    case 'locationText':
      return {
        ...state,
        locationText: action.payload,
      };
    case 'locationTypeCode':
      return {
        ...state,
        locationTypeCode: action.payload,
      };
    case 'organizationId':
      return {
        ...state,
        organizationId: action.payload,
      };
    case 'parameterGroup':
      return {
        ...state,
        parameterGroup: action.payload,
      };
    case 'pollutant':
      return {
        ...state,
        pollutant: action.payload,
      };
    case 'sourceName':
      return {
        ...state,
        sourceName: action.payload,
      };
    case 'sourceScale':
      return {
        ...state,
        sourceScale: action.payload,
      };
    case 'sourceType':
      return {
        ...state,
        sourceType: action.payload,
      };
    case 'stateIrCategory':
      return {
        ...state,
        stateIrCategory: action.payload,
      };
    case 'useClassName':
      return {
        ...state,
        useClassName: action.payload,
      };
    case 'waterSizeUnits':
      return {
        ...state,
        waterSizeUnits: action.payload,
      };
    case 'waterType':
      return {
        ...state,
        waterType: action.payload,
      };
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
  maybeOption: Option<unknown, unknown> | URLQueryArg,
): maybeOption is Option<unknown, unknown> {
  return typeof maybeOption === 'object' && 'value' in maybeOption;
}

// Wrapper function for `matchStaticOptions`
function matchSingleStaticOption<S, T>(
  value: InputValue,
  defaultValue: URLQueryArg | null,
  options?: ReadonlyArray<Option<S, T>>,
): Option<S, T> | null {
  return matchStaticOptions(value, defaultValue, options ?? null) as Option<
    S,
    T
  > | null;
}

// Wrapper function for `matchStaticOptions`
function matchMultipleStaticOptions<S, T>(
  value: InputValue,
  defaultValue: URLQueryArg | null,
  options?: ReadonlyArray<Option<S, T>>,
): ReadonlyArray<Option<S, T>> | null {
  return matchStaticOptions(
    value,
    defaultValue,
    options ?? null,
    true,
  ) as ReadonlyArray<Option<S, T>> | null;
}

// Produce the option/s corresponding to a particular value
function matchStaticOptions<S, T>(
  value: InputValue,
  defaultValue: URLQueryArg | null,
  options: ReadonlyArray<Option<S, T>> | null,
  multiple = false,
) {
  if (!options) return defaultValue;
  const valuesArray: URLQueryArg[] = [];
  if (Array.isArray(value)) valuesArray.push(...value);
  else if (value !== null) valuesArray.push(value);
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
  const initialParams: URLQueryState = {};
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
  const storage: Storage = window[storageType];
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
  const { dataProfile, format } = inputState;

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
  const [queryParams, setQueryParams] = useState<URLQueryState>({});

  // Update URL when inputs change
  useEffect(() => {
    if (!inputsLoaded) return;

    // Get selected parameters, including multiselectable fields
    const newQueryParams: URLQueryState = {};
    Object.entries(inputState).forEach(
      ([field, value]: [string, InputState[keyof InputState]]) => {
        if (value == null || (Array.isArray(value) && !value.length)) return;

        // Extract 'value' field from Option types
        const flattenedValue = getInputValue(value);
        if (
          controlFields.includes(field) ||
          (dataProfile &&
            (profiles[dataProfile.value].fields as readonly string[]).includes(
              field,
            ))
        ) {
          newQueryParams[field] = flattenedValue;
        }
      },
    );

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

  const pathParts = window.location.pathname.split('/');
  const pageName = pathParts.length > 1 ? pathParts[1] : '';

  if (content.status === 'pending') return <Loading />;

  if (content.status === 'failure') {
    return (
      <Alert type="error">
        Expert Query is currently unavailable, please try again later.
      </Alert>
    );
  }

  if (content.status === 'success') {
    return (
      <>
        <button
          title="Glossary"
          className="js-glossary-toggle margin-bottom-2 bg-white border-2px border-transparent padding-1 radius-md width-auto hover:bg-white hover:border-primary"
          style={{ cursor: 'pointer' }}
          type="button"
        >
          <Book
            aria-hidden="true"
            className="height-2 margin-right-1 text-primary top-2px usa-icon width-2"
            focusable="false"
            role="img"
          />
          <span className="font-ui-md text-bold text-primary">Glossary</span>
        </button>
        <GlossaryPanel path={pageName} />
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
                <button
                  className="margin-top-2 usa-button"
                  onClick={() => setIntroVisible(false)}
                  type="button"
                >
                  Close Intro
                </button>
              </div>
            </Summary>
          )}
          <h3>Data Profile</h3>
          <Select
            aria-label="Select a data profile"
            onChange={(ev) =>
              inputDispatch({ type: 'dataProfile', payload: ev })
            }
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
                      <b className="margin-right-05">File Format</b>
                      <InfoTooltip text="Choose a file format for the result set" />
                    </>
                  }
                  onChange={(option) =>
                    inputDispatch({ type: 'format', payload: option })
                  }
                  options={listOptions.format}
                  selected={format}
                  styles={['margin-bottom-2']}
                />
                <div className="display-flex flex-column flex-1 margin-y-auto">
                  <button
                    className="align-items-center display-flex margin-x-auto margin-bottom-1 usa-button"
                    onClick={() => null}
                    type="button"
                  >
                    <Download className="height-205 margin-right-1 usa-icon width-205" />
                    Download
                  </button>
                  <button
                    className="margin-x-auto usa-button usa-button--outline"
                    onClick={(_ev) => inputDispatch({ type: 'reset' })}
                    type="button"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
              <h4>
                <GlossaryTerm term="Acidity">Current Query</GlossaryTerm>
              </h4>
              <CopyBox
                text={`${window.location.origin}${
                  window.location.pathname
                }/#${buildQueryString(queryParams)}`}
              />
              <>
                <h4>{profiles[dataProfile.value].label} API Query</h4>
                <CopyBox
                  text={`${window.location.origin}${
                    window.location.pathname
                  }/data/${
                    profiles[dataProfile.value].resource
                  }?${buildQueryString(queryParams, false)}`}
                />
              </>
            </>
          )}
        </div>
      </>
    );
  }

  return null;
}

type FilterFieldsProps = {
  dispatch: Dispatch<InputAction>;
  fields: readonly string[];
  options: typeof listOptions & DomainValues;
  state: InputState;
};

function FilterFields({ dispatch, fields, options, state }: FilterFieldsProps) {
  const checkboxFields = [
    { key: 'actionAgency', label: 'Action Agency' },
    { key: 'assessmentUnitStatus', label: 'Assessment Unit Status' },
    { key: 'waterSizeUnits', label: 'Water Size Units' },
  ] as const;

  const selectFields = [
    { key: 'loadAllocationUnits', label: 'Load Allocation Unit' },
    { key: 'locationText', label: 'Location Text' },
    { key: 'locationTypeCode', label: 'Location Type Code' },
    { key: 'organizationId', label: 'Organization ID' },
    { key: 'parameterGroup', label: 'Parameter Group' },
    { key: 'pollutant', label: 'Pollutant' },
    { key: 'sourceName', label: 'Source Name' },
    { key: 'sourceScale', label: 'Source Scale' },
    { key: 'sourceType', label: 'Source Type' },
    { key: 'state', label: 'State' },
    { key: 'stateIrCategory', label: 'State IR Category' },
    { key: 'waterType', label: 'Water Type' },
  ] as const;

  return (
    <div>
      {checkboxFields
        .filter((field) => fields.includes(field.key))
        .map((field) => (
          <div key={field.key}>
            <Checkboxes
              legend={<b>{field.label}</b>}
              onChange={(ev) => dispatch({ type: field.key, payload: ev })}
              options={options[field.key]}
              selected={state[field.key] ?? []}
            />
          </div>
        ))}

      {selectFields
        .filter((field) => fields.includes(field.key))
        .map((field) => (
          <div>
            <label className="usa-label">
              <b>{field.label}</b>
              <AsyncSelect
                aria-label={`${field.label} input`}
                isMulti
                onChange={(ev) => dispatch({ type: field.key, payload: ev })}
                defaultOptions={
                  options[field.key].length > staticOptionLimit
                    ? options[field.key].slice(0, staticOptionLimit)
                    : options[field.key]
                }
                loadOptions={filterStaticOptions(options[field.key])}
                placeholder={`Select ${getArticle(field.label)} ${
                  field.label
                }...`}
                value={state[field.key]}
              />
            </label>
          </div>
        ))}

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
