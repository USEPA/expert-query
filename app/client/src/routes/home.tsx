import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
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
import { Modal } from 'components/modal';
import RadioButtons from 'components/radioButtons';
import SourceSelect from 'components/sourceSelect';
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';
// config
import {
  fields as allFields,
  getData,
  options as listOptions,
  postData,
  profiles,
  serverUrl,
} from 'config';
// types
import type { ModalRef } from 'components/modal';

/*
## Types
*/
type InputAction =
  | InputFieldAction
  | { type: 'initialize'; payload: InputState }
  | { type: 'reset' };

type InputFieldAction = {
  [k in keyof InputState]: {
    type: k;
    payload: InputState[k];
  };
}[keyof InputState];

type InputHandlers = MultiOptionHandlers & SingleOptionHandlers;

type InputState = MultiOptionState & SingleOptionState;

type InputValue = Primitive | Primitive[] | null;

const multiOptionFields = getMultiOptionFields(allFields);
type MultiOptionField = typeof multiOptionFields[number];

type MultiOptionHandlers = {
  [key in MultiOptionField]: (ev: ReadonlyArray<Option>) => void;
};

type MultiOptionState = {
  [key in MultiOptionField]: ReadonlyArray<Option> | null;
};

const singleOptionFields = getSingleOptionFields(allFields);
type SingleOptionField = typeof singleOptionFields[number];

type SingleOptionHandlers = {
  [key in SingleOptionField]: (ev: Option | null) => void;
};

type SingleOptionState = {
  [key in SingleOptionField]: Option | null;
};

type StaticOptions = typeof listOptions & Required<DomainOptions>;

type UrlQueryParam = [string, Primitive];

type UrlQueryState = {
  [field: string]: Primitive | Primitive[];
};

type PostData = {
  filters: {
    [field: string]: Primitive | Primitive[];
  };
  options: {
    f?: string;
    format?: string;
  };
};

/*
## Constants
*/
const dynamicOptionLimit = 20;
const staticOptionLimit = 100;

const controlFields = ['dataProfile', 'format'];

/*
## Utilities
*/

// Adds aliases for fields that share the same set of possible values
function addDomainAliases(values: DomainOptions): Required<DomainOptions> {
  values.associatedActionAgency = values.actionAgency;
  values.associatedActionStatus = values.assessmentUnitStatus;
  values.parameter = values.pollutant;
  values.parameterName = values.pollutant;
  values.parameterStateIrCategory = values.pollutant;
  values.useStateIrCategory = values.pollutant;
  return values;
}

function buildPostData(query: UrlQueryState) {
  const postData: PostData = {
    filters: {},
    options: {},
  };
  Object.entries(query).forEach(([field, value]) => {
    if (value === undefined) return;
    if (field === 'format') {
      const singleValue = Array.isArray(value) ? value.pop() : value;
      if (typeof singleValue !== 'string') return;
      postData.options.format = singleValue;
    } else if (field === 'dataProfile') return;
    else {
      postData.filters[field] = value;
    }
  });
  return postData;
}

// Converts a JSON object into a parameter string
function buildQueryString(query: UrlQueryState, includeProfile = true) {
  const paramsList: UrlQueryParam[] = [];
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

// Returns a boolean, specifying if a value is found in the
// specified table and column of the database
async function checkColumnValue(
  value: Primitive,
  fieldName: string,
  profile: string,
) {
  let url = `${serverUrl}/api/${profile}/values/${fieldName}?${fieldName}=${value}&limit=1`;
  const res = await getData<Primitive[]>(url);
  if (res.length) return true;
  return false;
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

// Filters options that require fetching values from the database
function filterDynamicOptions(
  profile: string,
  fieldName: string,
  contextField?: string | null,
  contextValue?: Primitive | null,
  limit?: number | null,
) {
  return async function (inputValue?: string): Promise<Array<Option>> {
    let url = `${serverUrl}/api/${profile}/values/${fieldName}?text=${inputValue}`;
    if (isNotEmpty(limit)) url += `&limit=${limit}`;
    if (isNotEmpty(contextField) && isNotEmpty(contextValue)) {
      url += `&${contextField}=${contextValue}`;
    }
    const values = await getData<Primitive[]>(url);
    return values.map((value) => ({ label: value, value }));
  };
}

// Filters options by search input, returning a maximum number of options
function filterOptions(
  profile: string,
  field: string,
  staticOptions: StaticOptions,
  contextField?: string | null,
  contextValue?: Primitive | null,
) {
  if (staticOptions.hasOwnProperty(field)) {
    return filterStaticOptions(
      staticOptions[field as keyof StaticOptions] ?? [],
      contextValue,
    );
  } else {
    return filterDynamicOptions(
      profile,
      field,
      contextField,
      contextValue,
      dynamicOptionLimit,
    );
  }
}

// Filters options that have values held in memory
function filterStaticOptions(
  options: ReadonlyArray<Option>,
  context?: Primitive | null,
) {
  const contextOptions = filterStaticOptionsByContext(options, context);

  return function (inputValue: string) {
    const value = inputValue.trim().toLowerCase();
    const matches: Option[] = [];
    contextOptions.every((option) => {
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

// Filters options by context value, if present
function filterStaticOptionsByContext(
  options: ReadonlyArray<Option>,
  context?: Primitive | null,
) {
  if (isNotEmpty(context)) {
    return options.filter((option) => {
      if ('context' in option && option.context === context) return true;
      return false;
    });
  } else return options;
}

// Utility function to choose between 'a' or 'an'
function getArticle(noun: string) {
  if (!noun.length) return '';
  const aExceptions = ['use'];
  if (aExceptions.includes(noun.toLowerCase())) return 'a';
  if (['a', 'e', 'i', 'o', 'u'].includes(noun.charAt(0).toLowerCase())) {
    return 'an';
  }
  return 'a';
}

// Returns the empty state for inputs (default values populated in `getUrlInputs`)
function getDefaultInputState(): InputState {
  return [...singleOptionFields, ...multiOptionFields].reduce((a, b) => {
    return { ...a, [b]: null };
  }, {}) as InputState;
}

// Returns the default option for a field, if specified
function getDefaultOption(
  fieldName: string,
  options: ReadonlyArray<Option> | null = null,
) {
  const field = allFields.find((f) => f.key === fieldName);
  const defaultValue = field && 'default' in field ? field.default : null;
  if (defaultValue) {
    const defaultOption = options?.find(
      (option) => option.value === defaultValue,
    );
    return defaultOption ?? { label: defaultValue, value: defaultValue };
  } else return null;
}

// Returns unfiltered options for a field, up to a maximum length
function getInitialOptions(
  staticOptions: StaticOptions,
  fieldName: typeof allFields[number]['key'],
  context?: Primitive | null,
) {
  if (staticOptions.hasOwnProperty(fieldName)) {
    const fieldOptions = staticOptions[fieldName as keyof StaticOptions] ?? [];
    const contextOptions = filterStaticOptionsByContext(fieldOptions, context);

    return contextOptions.length > staticOptionLimit
      ? contextOptions.slice(0, staticOptionLimit)
      : contextOptions;
  }
  // Return true to trigger an immediate fetch from the database
  return true;
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

function getMultiOptionFields(fields: typeof allFields) {
  const multiFields = fields.map((field) => {
    return field.type === 'multiselect' ? field.key : null;
  });
  const filtered = multiFields.reduce<
    Array<Exclude<typeof multiFields[number], null>>
  >((a, b) => {
    if (b !== null) {
      a.push(b);
    }
    return a;
  }, []);
  return filtered;
}

// Retrieves all possible options for a given field
function getOptions(
  profile: string,
  field: string,
  staticOptions: StaticOptions,
) {
  const options = getStaticOptions(field, staticOptions);
  if (options !== null) {
    return Promise.resolve(options);
  } else {
    return filterDynamicOptions(profile, field)();
  }
}

function getSingleOptionFields(fields: typeof allFields) {
  const singleFields = fields.map((field) => {
    return field.type === 'radio' || field.type === 'select' ? field.key : null;
  });
  const filtered = singleFields.reduce<
    Array<Exclude<typeof singleFields[number], null>>
  >((a, b) => {
    if (b !== null) {
      a.push(b);
    }
    return a;
  }, []);
  return filtered;
}

function getStaticOptions(fieldName: string, staticOptions: StaticOptions) {
  return staticOptions.hasOwnProperty(fieldName)
    ? staticOptions[fieldName as keyof StaticOptions] ?? []
    : null;
}

// Uses URL query parameters or default values for initial state
async function getUrlInputs(
  _signal: AbortSignal,
  staticOptions: StaticOptions,
): Promise<InputState> {
  const params = parseInitialParams();

  // Get the data profile first, so it can be
  // used to check values against the database
  const profileArg = Array.isArray(params.dataProfile)
    ? params.dataProfile[0]
    : params.dataProfile;
  const profile = Object.keys(profiles).find((p) => {
    return p === profileArg;
  });

  const newState = getDefaultInputState();

  await Promise.all([
    // Multi-select inputs
    ...multiOptionFields.map(async (key) => {
      newState[key] = await matchMultipleOptions(
        params[key] ?? null,
        key,
        getStaticOptions(key, staticOptions),
        profile,
      );
    }),
    // Single-select inputs
    ...singleOptionFields.map(async (key) => {
      newState[key] = await matchSingleOption(
        params[key] ?? null,
        key,
        getStaticOptions(key, staticOptions),
        profile,
      );
    }),
  ]);

  return newState;
}

function isNotEmpty<T>(v: T | null | undefined): v is T {
  return v !== undefined && v !== null;
}

// Type narrowing
function isOption(maybeOption: Option | Primitive): maybeOption is Option {
  return typeof maybeOption === 'object' && 'value' in maybeOption;
}

// Type narrowing
function isMultiOptionField(
  field: MultiOptionField | SingleOptionField,
): field is MultiOptionField {
  return (multiOptionFields as string[]).includes(field);
}

// Type narrowing
function isSingleOptionField(
  field: MultiOptionField | SingleOptionField,
): field is SingleOptionField {
  return (singleOptionFields as string[]).includes(field);
}

// Wrapper function to add type assertion
async function matchMultipleOptions(
  values: InputValue,
  fieldName: MultiOptionField,
  options: ReadonlyArray<Option> | null = null,
  profile: string | null = null,
) {
  return (await matchOptions(
    values,
    fieldName,
    options,
    profile,
    true,
  )) as ReadonlyArray<Option>;
}

// Wrapper function to add type assertion
async function matchSingleOption(
  values: InputValue,
  fieldName: SingleOptionField,
  options: ReadonlyArray<Option> | null = null,
  profile: string | null = null,
) {
  return (await matchOptions(
    values,
    fieldName,
    options,
    profile,
  )) as Option | null;
}

// Produce the option/s corresponding to a particular value
async function matchOptions(
  values: InputValue,
  fieldName: MultiOptionField | SingleOptionField,
  options: ReadonlyArray<Option> | null = null,
  profile: string | null = null,
  multiple = false,
) {
  const valuesArray: Primitive[] = [];
  if (Array.isArray(values)) valuesArray.push(...values);
  else if (values !== null) valuesArray.push(values);

  const matches = new Set<Option>(); // prevent duplicates
  // Check if the value is valid, otherwise use a default value
  await Promise.all(
    valuesArray.map(async (value) => {
      if (options) {
        const match = options.find((option) => option.value === value);
        if (match) matches.add(match);
      } else if (profile) {
        const isValid = await checkColumnValue(value, fieldName, profile);
        if (isValid) matches.add({ label: value, value });
      }
    }),
  );

  if (matches.size === 0) {
    const defaultOption = getDefaultOption(fieldName, options);
    defaultOption && matches.add(defaultOption);
  }

  const matchesArray = Array.from(matches);
  return multiple ? matchesArray : matchesArray.pop() ?? null;
}

// Parse parameters provided in the URL hash into a JSON object
function parseInitialParams() {
  const initialParams: UrlQueryState = {};
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

  // Memoize individual dispatch functions
  const inputHandlers = useMemo(() => {
    const newHandlers: Partial<InputHandlers> = {};
    allFields.forEach((field) => {
      if (isMultiOptionField(field.key)) {
        newHandlers[field.key] = (ev: ReadonlyArray<Option>) =>
          inputDispatch({ type: field.key, payload: ev } as InputFieldAction);
      } else if (isSingleOptionField(field.key)) {
        newHandlers[field.key] = (ev: Option | null) =>
          inputDispatch({ type: field.key, payload: ev } as InputFieldAction);
      }
    });
    return newHandlers as InputHandlers;
  }, [inputDispatch]);

  const { dataProfile, format } = inputState;
  const profile = dataProfile
    ? (dataProfile.value as keyof typeof profiles)
    : null;

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
  const [queryParams, setQueryParams] = useState<UrlQueryState>({});

  // Update URL when inputs change
  useEffect(() => {
    if (!inputsLoaded) return;

    // Get selected parameters, including multiselectable fields
    const newQueryParams: UrlQueryState = {};
    Object.entries(inputState).forEach(
      ([field, value]: [string, InputState[keyof InputState]]) => {
        if (value == null || (Array.isArray(value) && !value.length)) return;

        // Extract 'value' field from Option types
        const flattenedValue = getInputValue(value);
        if (
          controlFields.includes(field) ||
          (profile &&
            (profiles[profile].fields as readonly string[]).includes(field))
        ) {
          newQueryParams[field] = flattenedValue;
        }
      },
    );

    window.location.hash = buildQueryString(newQueryParams);

    setQueryParams(newQueryParams);
  }, [inputState, inputsLoaded, profile]);

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

  const eqDataUrl =
    window.location.hostname === 'localhost'
      ? `${window.location.origin}${window.location.pathname}`
      : content.data.services?.eqDataApi;

  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const handleDownloadModalClose = useCallback(() => {
    setConfirmationVisible(false);
  }, []);

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
        {confirmationVisible && (
          <DownloadModal
            filename={
              profile && inputState.format
                ? `${profile}.${inputState.format.value}`
                : null
            }
            onClose={handleDownloadModalClose}
            queryData={buildPostData(queryParams)}
            queryUrl={
              eqDataUrl && profile
                ? `${eqDataUrl}/data/${profiles[profile].resource}`
                : null
            }
          />
        )}
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
                onChange={inputHandlers.dataProfile}
                options={staticOptions.dataProfile}
                placeholder="Select a data profile..."
                value={dataProfile}
              />
              {profile && (
                <>
                  <h3 className="margin-bottom-0">Filters</h3>
                  <FilterFields
                    handlers={inputHandlers}
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
                      onChange={inputHandlers.format}
                      options={staticOptions.format}
                      selected={format}
                      styles={['margin-bottom-2']}
                    />
                    <div className="display-flex flex-column flex-1 margin-y-auto">
                      <button
                        className="align-items-center display-flex flex-justify-center margin-bottom-1 margin-x-auto usa-button"
                        onClick={() => setConfirmationVisible(true)}
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
                  <h4>{profiles[profile].label} API Query</h4>
                  <CopyBox
                    lengthExceededMessage="The GET request for this query exceeds the maximum URL character length. Please use a POST request instead (see the cURL query below)."
                    maxLength={2048}
                    text={`${eqDataUrl}/data/${
                      profiles[profile].resource
                    }?${buildQueryString(queryParams, false)}`}
                  />
                  <h4>cURL</h4>
                  <CopyBox
                    text={`curl -X POST --json "${JSON.stringify(
                      buildPostData(queryParams),
                    ).replaceAll('"', '\\"')}" ${eqDataUrl}/data/${
                      profiles[profile].resource
                    }`}
                  />
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
  handlers: InputHandlers;
  state: InputState;
  staticOptions: StaticOptions;
};

function FilterFields({ handlers, state, staticOptions }: FilterFieldsProps) {
  const profile = (state.dataProfile?.value as keyof typeof profiles) ?? null;
  if (!profile) return null;

  const fields: readonly string[] = profiles[profile].fields;

  // Store each field's element in a tuple with its key
  const fieldsJsx: Array<[JSX.Element, string]> = allFields
    .filter((field) => fields.includes(field.key))
    .map((field) => {
      const contextField = 'context' in field ? field.context : null;
      const contextValue = contextField ? state[contextField]?.value : null;
      const defaultOptions = getInitialOptions(
        staticOptions,
        field.key,
        contextValue,
      );
      if (field.type === 'multiselect') {
        if (
          !contextField &&
          Array.isArray(defaultOptions) &&
          defaultOptions.length <= 5
        ) {
          return [
            <Checkboxes
              key={field.key}
              legend={<b>{field.label}</b>}
              onChange={handlers[field.key]}
              options={defaultOptions}
              selected={state[field.key] ?? []}
              styles={['margin-top-3']}
            />,
            field.key,
          ];
        }
        return [
          <label
            className="usa-label"
            key={field.key}
            htmlFor={`input-${field.key}`}
          >
            <b>{field.label}</b>
            <SourceSelect
              label={
                contextField &&
                allFields.find((f) => f.key === contextField)?.label
              }
              sources={
                contextField && getOptions(profile, contextField, staticOptions)
              }
              onChange={contextField && handlers[contextField]}
              selected={contextField && state[contextField]}
            >
              <AsyncSelect
                aria-label={`${field.label} input`}
                className="width-full"
                inputId={`input-${field.key}`}
                isMulti
                // re-renders default options when `contextValue` changes
                key={JSON.stringify(contextValue)}
                onChange={handlers[field.key]}
                defaultOptions={defaultOptions}
                loadOptions={filterOptions(
                  profile,
                  field.key,
                  staticOptions,
                  contextField,
                  contextValue,
                )}
                placeholder={`Select ${getArticle(field.label.split(' ')[0])} ${
                  field.label
                }...`}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #adadad',
                    borderRadius: contextField ? '0 4px 4px 0' : '4px',
                  }),
                  loadingIndicator: () => ({
                    display: 'none',
                  }),
                }}
                value={state[field.key]}
              />
            </SourceSelect>
          </label>,
          field.key,
        ];
      } else return [<></>, field.key];
    });

  // Store each row as a tuple with its row key
  const rows: Array<[Array<[JSX.Element, string]>, string]> = [];
  for (let i = 0; i < fieldsJsx.length; i += 3) {
    const row = fieldsJsx.slice(i, i + 3);
    const rowKey = row.reduce((a, b) => a + '-' + b[1], 'row');
    rows.push([row, rowKey]);
  }

  return (
    <div>
      {rows.map(([row, rowKey]) => (
        <div className="grid-gap grid-row" key={rowKey}>
          {row.map(([field, fieldKey]) => (
            <div className="tablet:grid-col" key={fieldKey}>
              {field}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

type DownloadModalProps = {
  filename: string | null;
  onClose: () => void;
  queryData: PostData;
  queryUrl: string | null;
};

function DownloadModal({
  filename,
  onClose,
  queryData,
  queryUrl,
}: DownloadModalProps) {
  const [count, setCount] = useState<number | null>(null);
  const [countStatus, setCountStatus] = useState<Status>('idle');

  // Get the row count for the current query
  useEffect(() => {
    if (!queryUrl) return;

    const countUrl = `${queryUrl}/count`;
    setCountStatus('pending');
    postData(countUrl, queryData)
      .then((res) => {
        setCount(parseInt(res.count));
        setCountStatus('success');
      })
      .catch((err) => {
        console.error(err);
        setCountStatus('failure');
      });
  }, [queryData, queryUrl]);

  const [downloadStatus, setDownloadStatus] = useState<Status>('idle');

  // Retrieve the requested data in the specified format
  const executeQuery = useCallback(() => {
    if (!queryUrl) return;
    if (!filename) return;

    setDownloadStatus('pending');
    postData(queryUrl, queryData, 'blob')
      .then((res) => {
        const fileUrl = window.URL.createObjectURL(res);
        const trigger = document.createElement('a');
        trigger.style.display = 'none';
        trigger.href = fileUrl;
        trigger.download = filename;
        trigger.click();
        window.URL.revokeObjectURL(fileUrl);
        setDownloadStatus('success');
      })
      .catch((err) => {
        console.error(err);
        setDownloadStatus('failure');
      })
      .finally(() => onClose());
  }, [filename, onClose, queryUrl, queryData]);

  const modalRef = useRef<ModalRef>(null);

  return (
    <Modal ref={modalRef} id="confirm-modal" isInitiallyOpen onClose={onClose}>
      <h2 className="usa-modal__heading">Download Status</h2>
      {countStatus === 'pending' && (
        <div className="usa-prose">
          <p>Validating query, please wait...</p>
        </div>
      )}
      {countStatus === 'failure' && (
        <Alert type="error">
          The specified query could not be executed at this time.
        </Alert>
      )}
      {countStatus === 'success' && (
        <>
          <div className="usa-prose">
            <p>
              Your query will return <strong>{count}</strong> rows.
            </p>
            <p>Click continue to download the data.</p>
          </div>
          <div className="usa-modal__footer">
            <ul className="flex-justify-center usa-button-group">
              <li className="usa-button-group__item">
                <button type="button" className="usa-button" onClick={onClose}>
                  Cancel
                </button>
              </li>
              <li className="usa-button-group__item">
                <button
                  className="usa-button"
                  disabled={count === 0}
                  onClick={executeQuery}
                  type="button"
                >
                  {downloadStatus === 'pending' ? 'Working...' : 'Continue'}
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </Modal>
  );
}
