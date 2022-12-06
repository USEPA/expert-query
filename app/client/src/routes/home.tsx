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
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';
// types
import type { Dispatch, ReactNode } from 'react';
// config
import { fields as allFields, options as listOptions, profiles } from 'config';

/*
## Types
*/
type InputAction =
  | InputFieldAction
  | {
      type: 'dataProfile';
      payload: Option<JSX.Element, keyof typeof profiles> | null;
    }
  | { type: 'format'; payload: Option<ReactNode, string> }
  | { type: 'initialize'; payload: InputState }
  | { type: 'reset' };

type InputFieldAction = {
  [k in keyof InputState]: {
    type: k;
    payload: InputState[k];
  };
}[keyof InputState];

type InputState = MultiValueState & {
  dataProfile: Option<JSX.Element, keyof typeof profiles> | null;
  format: InputStateSingleOption;
};

type InputStateMultiOption = ReadonlyArray<Option<ReactNode, string>> | null;
type InputStateSingleOption = Option<ReactNode, string> | null;

type InputValue = URLQueryArg | URLQueryArg[] | null;

type MultiValueField = Exclude<keyof StaticOptions, 'dataProfile' | 'format'>;

type MultiValueState = {
  [key in MultiValueField]: InputStateMultiOption;
};

type StaticOptions = typeof listOptions & Required<DomainOptions>;

type URLQueryArg = string | number | boolean;

type URLQueryParam = [string, URLQueryArg];

type URLQueryState = {
  [field: string]: URLQueryArg | URLQueryArg[];
};

/*
## Constants
*/
const staticOptionLimit = 100;

const defaultFormat = 'csv';

const controlFields = ['dataProfile', 'format'];

/*
## Utilities
*/
function addDomainAliases(values: DomainOptions): Required<DomainOptions> {
  values.associatedActionAgency = values.actionAgency;
  values.associatedActionStatus = values.assessmentUnitStatus;
  values.parameter = values.pollutant;
  values.parameterName = values.pollutant;
  values.parameterStateIrCategory = values.pollutant;
  values.useStateIrCategory = values.pollutant;
  return values;
}

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
function filterStaticOptions<S, T>(options: ReadonlyArray<Option<S, T>>) {
  return function (inputValue: string) {
    const value = inputValue.trim().toLowerCase();
    if (value.length < 3) {
      return Promise.resolve(
        options.length < staticOptionLimit
          ? options
          : options.slice(0, staticOptionLimit),
      );
    }

    const matches: Array<Option<S, T>> = [];
    options.every((option) => {
      if (matches.length >= staticOptionLimit) return false;
      if (
        (typeof option.label === 'string' &&
          option.label.toLowerCase().includes(value)) ||
        (typeof option.value === 'string' &&
          option.value.toLowerCase().includes(value))
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

// Empty or default values for inputs
function getDefaultInputState(): InputState {
  return {
    actionAgency: null,
    assessmentTypes: null,
    assessmentUnitStatus: null,
    associatedActionAgency: null,
    associatedActionStatus: null,
    associatedActionType: null,
    confirmed: null,
    cwa303dPriorityRanking: null,
    dataProfile: null,
    delisted: null,
    delistedReason: null,
    format: matchSingleStaticOption(null, defaultFormat, listOptions.format),
    inIndianCountry: null,
    loadAllocationUnits: null,
    // TODO: Add after endpoint is created for values
    // locationText: null,
    locationTypeCode: null,
    organizationId: null,
    organizationType: null,
    parameter: null,
    parameterGroup: null,
    parameterName: null,
    parameterStateIrCategory: null,
    pollutant: null,
    sourceName: null,
    sourceScale: null,
    sourceType: null,
    state: null,
    stateIrCategory: null,
    useClassName: null,
    useName: null,
    useStateIrCategory: null,
    waterSizeUnits: null,
    waterType: null,
  };
}

// Returns unfiltered options for a field, up to a maximum length
// TODO: `field` should also include dynamic fields
function getInitialOptions(
  staticOptions: StaticOptions,
  field: typeof allFields[number]['key'],
) {
  if (field in staticOptions) {
    const fieldOptions = staticOptions[field] ?? [];
    return fieldOptions.length > staticOptionLimit
      ? fieldOptions.slice(0, staticOptionLimit)
      : fieldOptions;
  }
  // TODO: Handle dynamic fields
  return [];
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

function getLocalStorageItem(item: string) {
  return localStorage.getItem(item) ?? null;
}

// Uses URL query parameters or default values for initial state
async function getUrlInputs(
  _signal: AbortSignal,
  options: StaticOptions,
): Promise<InputState> {
  const params = parseInitialParams();

  const newState = getDefaultInputState();

  const { dataProfile, format, ...rest } = options;

  // Multi-select inputs with static options
  let key: keyof typeof rest;
  for (key in rest) {
    newState[key] = matchMultipleStaticOptions(
      params[key] ?? null,
      null,
      rest[key],
    );
  }

  // Single-select inputs with static options
  newState.dataProfile = matchSingleStaticOption(
    params.dataProfile ?? null,
    null,
    options.dataProfile,
  );

  newState.format = matchSingleStaticOption(
    params.format ?? null,
    defaultFormat,
    options.format,
  );

  return newState;
}

// Creates a reducer to manage the state of all query field inputs
function createReducer() {
  const handlers: Partial<{
    [field in keyof InputState]: (
      state: InputState,
      action: InputAction,
    ) => InputState;
  }> = {};
  let field: keyof InputState;
  for (field in getDefaultInputState()) {
    handlers[field] = (state, action) => {
      if (!('payload' in action)) return state;
      return { ...state, [action.type]: action.payload };
    };
  }
  return function reducer(state: InputState, action: InputAction) {
    if (action.type === 'initialize') {
      return action.payload;
    } else if (action.type === 'reset') {
      return getDefaultInputState();
    } else if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type]?.(state, action) ?? state;
    } else {
      const message = `Unhandled action type: ${action}`;
      throw new Error(message);
    }
  };
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
  const [staticOptions, setStaticOptions] = useState<StaticOptions | null>(
    null,
  );

  useEffect(() => {
    if (content.status !== 'success') return;
    const domainOptions = addDomainAliases(content.data.domainValues);
    setStaticOptions({ ...domainOptions, ...listOptions });
  }, [content]);

  const getAbortSignal = useAbortSignal();

  const [inputState, inputDispatch] = useReducer(
    createReducer(),
    getDefaultInputState(),
  );
  const { dataProfile, format } = inputState;

  // Populate the input fields with URL parameters, if any
  const [inputsLoaded, setInputsLoaded] = useState(false);
  useEffect(() => {
    if (!staticOptions) return;
    getUrlInputs(getAbortSignal(), staticOptions)
      .then((initialInputs) => {
        inputDispatch({ type: 'initialize', payload: initialInputs });
      })
      .catch((err) => {
        console.error(`Error loading initial inputs: ${err}`);
      })
      .finally(() => setInputsLoaded(true));
  }, [getAbortSignal, staticOptions]);

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
          {staticOptions && (
            <>
              <h3>Data Profile</h3>
              <Select
                aria-label="Select a data profile"
                onChange={(ev) =>
                  inputDispatch({ type: 'dataProfile', payload: ev })
                }
                options={staticOptions.dataProfile}
                placeholder="Select a data profile..."
                value={dataProfile}
              />
              {dataProfile && (
                <>
                  <h3 className="margin-bottom-0">Filters</h3>
                  <FilterFields
                    dispatch={inputDispatch}
                    fields={profiles[dataProfile.value].fields}
                    staticOptions={staticOptions}
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
                      options={staticOptions.format}
                      selected={format}
                      styles={['margin-bottom-2']}
                    />
                    <div className="display-flex flex-column flex-1 margin-y-auto">
                      <button
                        className="align-items-center display-flex flex-justify-center margin-bottom-1 margin-x-auto usa-button"
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
                    {/* TODO - Remove the glossary linkage before production deployment */}
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
  state: InputState;
  staticOptions: StaticOptions;
};

function FilterFields({
  dispatch,
  fields,
  state,
  staticOptions,
}: FilterFieldsProps) {
  const fieldsJsx = allFields
    .filter((field) => fields.includes(field.key))
    .map((field) => {
      if (field.type === 'multiselect') {
        const defaultOptions = getInitialOptions(staticOptions, field.key);
        if (defaultOptions.length <= 5)
          return (
            <Checkboxes
              legend={<b>{field.label}</b>}
              onChange={(ev) => dispatch({ type: field.key, payload: ev })}
              options={defaultOptions}
              selected={state[field.key] ?? []}
              styles={['margin-top-3']}
            />
          );
        return (
          <label className="usa-label">
            <b>{field.label}</b>
            <AsyncSelect
              aria-label={`${field.label} input`}
              className="margin-top-1"
              isMulti
              onChange={(ev) => dispatch({ type: field.key, payload: ev })}
              defaultOptions={defaultOptions}
              loadOptions={
                staticOptions.hasOwnProperty(field.key)
                  ? filterStaticOptions(defaultOptions)
                  : // TODO: Add handler for dynamic options
                    async () => []
              }
              placeholder={`Select ${getArticle(field.label)} ${
                field.label
              }...`}
              value={state[field.key]}
            />
          </label>
        );
      } else return null;
    });

  const rows: (JSX.Element | null)[][] = [];
  for (let i = 0; i < fieldsJsx.length; i += 3) {
    rows.push(fieldsJsx.slice(i, i + 3));
  }

  return (
    <div>
      {rows.map((row, i) => (
        <div className="grid-gap grid-row" key={`filter-row-${i}`}>
          {row.map((field, j) => (
            <div className="tablet:grid-col" key={`field-${i}-${j}`}>
              {field}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
