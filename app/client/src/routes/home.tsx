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
import { Accordion, AccordionItem } from 'components/accordion';
import Alert from 'components/alert';
import Checkbox from 'components/checkbox';
import Checkboxes from 'components/checkboxes';
import CopyBox from 'components/copyBox';
import GlossaryPanel, { GlossaryTerm } from 'components/glossaryPanel';
import InfoTooltip from 'components/infoTooltip';
import { Loading } from 'components/loading';
import DownloadModal from 'components/downloadModal';
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
  profiles,
  serverUrl,
} from 'config';
// types
import type { ChangeEvent } from 'react';

/*
## Types
*/
type InputAction =
  | InputFieldAction
  | { type: 'initialize'; payload: InputState }
  | { type: 'reset' };

type InputField = MultiOptionField | SingleOptionField | SingleValueField;

type InputFieldAction = {
  [k in keyof InputState]: {
    type: k;
    payload: InputState[k];
  };
}[keyof InputState];

type InputHandlers = MultiOptionHandlers &
  SingleOptionHandlers &
  SingleValueHandlers;

type InputState = MultiOptionState & SingleOptionState & SingleValueState;

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

const dateFields = getDateFields(allFields);
const yearFields = getYearFields(allFields);
const singleValueFields = [...dateFields, ...yearFields];
type SingleValueField = typeof singleValueFields[number];

type SingleValueHandlers = {
  [key in SingleValueField]: (ev: ChangeEvent<HTMLInputElement>) => void;
};

type SingleValueState = {
  [key in SingleValueField]: string;
};

type StaticOptions = typeof listOptions & Required<DomainOptions>;

type UrlQueryParam = [string, Primitive];

type UrlQueryState = {
  [field: string]: Primitive | Primitive[];
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
  values.assessmentUnitState = values.assessmentUnitStatus;
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
      const singleValue = Array.isArray(value) ? value[0] : value;
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

// Convert `yyyy-mm-dd` date format to `mm-dd-yyyy`
function fromIsoDateString(dateString: string) {
  const date = new Date(dateString);
  return `${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date
    .getUTCDate()
    .toString()
    .padStart(2, '0')}-${date.getUTCFullYear().toString().padStart(4, '0')}`;
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

function getDateFields(fields: typeof allFields) {
  return removeNulls(
    fields.map((field) => (field.type === 'date' ? field.key : null)),
  );
}

// Returns the empty state for inputs (default values populated in `getUrlInputs`)
function getDefaultInputState(): InputState {
  return [
    ...singleOptionFields,
    ...multiOptionFields,
    ...singleValueFields,
  ].reduce((a, b) => {
    return { ...a, [b]: isSingleValueField(b) ? '' : null };
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
  return removeNulls(
    fields.map((field) => {
      return field.type === 'multiselect' ? field.key : null;
    }),
  );
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
  return removeNulls(
    fields.map((field) => {
      return field.type === 'select' || field.type === 'radio'
        ? field.key
        : null;
    }),
  );
}

function getYearFields(fields: typeof allFields) {
  return removeNulls(
    fields.map((field) => (field.type === 'year' ? field.key : null)),
  );
}

function removeNulls<T>(fields: Array<T | null>) {
  return fields.reduce<Array<T>>((a, b) => {
    if (isNotEmpty(b)) {
      a.push(b);
    }
    return a;
  }, []);
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
    // Date inputs
    ...dateFields.map((key) => {
      newState[key] = matchDate(params[key] ?? null);
      return Promise.resolve();
    }),
    // Year inputs
    ...yearFields.map((key) => {
      newState[key] = matchYear(params[key] ?? null);
      return Promise.resolve();
    }),
  ]);

  return newState;
}

function isNotEmpty<T>(v: T | null | undefined | [] | {}): v is T {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  else if (
    Object.keys(v).length === 0 &&
    Object.getPrototypeOf(v) === Object.prototype
  ) {
    return false;
  }
  return true;
}

// Type narrowing
function isOption(maybeOption: Option | Primitive): maybeOption is Option {
  return typeof maybeOption === 'object' && 'value' in maybeOption;
}

// Type narrowing
function isMultiOptionField(field: InputField): field is MultiOptionField {
  return (multiOptionFields as string[]).includes(field);
}

// Type narrowing
function isSingleOptionField(field: InputField): field is SingleOptionField {
  return (singleOptionFields as string[]).includes(field);
}

// Type narrowing
function isSingleValueField(field: InputField): field is SingleValueField {
  return (singleValueFields as string[]).includes(field);
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

// Verify that a given string matches a parseable date format
function matchDate(values: InputValue, yearOnly = false) {
  const value = Array.isArray(values) ? values[0] : values;
  if (!value) return '';
  const date = new Date(value.toString());
  if (isNaN(date.getTime())) return '';
  const dateString = date.toISOString();
  const endIndex = yearOnly ? 4 : 10;
  return dateString.substring(0, endIndex);
}

function matchYear(values: InputValue) {
  return matchDate(values, true);
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
      } else if (isSingleValueField(field.key)) {
        newHandlers[field.key] = (ev: ChangeEvent<HTMLInputElement>) => {
          inputDispatch({
            type: field.key,
            payload: ev.target.value,
          } as InputFieldAction);
        };
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
        if (
          value == null ||
          value === '' ||
          (Array.isArray(value) && !value.length)
        )
          return;

        // Extract 'value' field from Option types
        const flattenedValue = getInputValue(value);
        const formattedValue =
          (dateFields as string[]).includes(field) &&
          typeof flattenedValue === 'string'
            ? fromIsoDateString(flattenedValue)
            : flattenedValue;

        const profileFields = profile
          ? (profiles[profile].fields as readonly string[])
          : null;
        if (
          formattedValue &&
          (controlFields.includes(field) || profileFields?.includes(field))
        ) {
          newQueryParams[field] = formattedValue;
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
    content.data.services?.eqDataApi ||
    `${window.location.origin}${window.location.pathname}`;

  const [confirmationVisible, setConfirmationVisible] = useState(false);

  const handleDownloadModalClose = useCallback(() => {
    setConfirmationVisible(false);
  }, []);

  const [downloadStatus, setDownloadStatus] = useState<Status>('idle');

  useEffect(() => {
    if (downloadStatus === 'idle' || downloadStatus === 'pending') return;

    const messageTimeout = setTimeout(() => setDownloadStatus('idle'), 10_000);

    return function cleanup() {
      clearTimeout(messageTimeout);
    };
  }, [downloadStatus]);

  const queryData = useMemo(() => {
    return buildPostData(queryParams);
  }, [queryParams]);

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
            downloadStatus={downloadStatus}
            onClose={handleDownloadModalClose}
            queryData={queryData}
            queryUrl={
              eqDataUrl && profile
                ? `${eqDataUrl}/data/${profiles[profile].resource}`
                : null
            }
            setDownloadStatus={setDownloadStatus}
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
                <Accordion styles={['margin-top-2']}>
                  <AccordionItem heading="Filters">
                    <FilterFields
                      handlers={inputHandlers}
                      staticOptions={staticOptions}
                      state={inputState}
                    />
                    <div className="display-flex margin-top-1 width-full">
                      <button
                        className="margin-top-1 margin-x-auto usa-button usa-button--outline"
                        onClick={(_ev) => inputDispatch({ type: 'reset' })}
                        type="button"
                      >
                        Clear Search
                      </button>
                    </div>
                  </AccordionItem>

                  <AccordionItem heading="Download the Data">
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
                    <button
                      className="align-items-center display-flex flex-justify-center margin-bottom-1 usa-button"
                      onClick={() => setConfirmationVisible(true)}
                      type="button"
                    >
                      <Download className="height-205 margin-right-1 usa-icon width-205" />
                      Download
                    </button>
                    {downloadStatus === 'success' && (
                      <Alert type="success">Query executed successfully.</Alert>
                    )}
                    {downloadStatus === 'failure' && (
                      <Alert type="error">
                        An error occurred while executing the current query,
                        please try again later.
                      </Alert>
                    )}
                  </AccordionItem>

                  <AccordionItem heading="Queries">
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
                  </AccordionItem>
                </Accordion>
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
  const fieldsJsx: Array<[JSX.Element, string]> = removeNulls(
    allFields
      .filter((field) => fields.includes(field.key))
      .map((field) => {
        switch (field.type) {
          case 'multiselect':
            const contextField = 'context' in field ? field.context : null;
            const contextValue = contextField
              ? state[contextField]?.value
              : null;
            const defaultOptions = getInitialOptions(
              staticOptions,
              field.key,
              contextValue,
            );
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
                    contextField &&
                    getOptions(profile, contextField, staticOptions)
                  }
                  onChange={contextField && handlers[contextField]}
                  selected={contextField && state[contextField]}
                >
                  <AsyncSelect
                    aria-label={`${field.label} input`}
                    className="width-full"
                    inputId={`input-${field.key}`}
                    isMulti
                    // Re-renders default options when `contextValue` changes
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
                    placeholder={`Select ${getArticle(
                      field.label.split(' ')[0],
                    )} ${field.label}...`}
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
          case 'date':
          case 'year':
            // Prevents range fields from rendering twice
            if (field.boundary === 'high') return null;

            const pairedField = allFields.find(
              (otherField) =>
                otherField.key !== field.key &&
                'domain' in otherField &&
                otherField.domain === field.domain,
            );
            // All range inputs should have a high and a low boundary field
            if (!pairedField || !isSingleValueField(pairedField.key))
              return null;

            return [
              <label
                className="usa-label"
                htmlFor={`input-${field.key}`}
                key={field.domain}
              >
                <b>{field.label}</b>
                <div className="margin-top-1 usa-hint">from:</div>
                <input
                  className="usa-input"
                  id={`input-${field.key}`}
                  min={field.type === 'year' ? 1900 : undefined}
                  max={field.type === 'year' ? 2100 : undefined}
                  onChange={handlers[field.key]}
                  placeholder={field.type === 'year' ? 'yyyy' : undefined}
                  type={field.type === 'date' ? 'date' : 'number'}
                  value={state[field.key]}
                />
                <div className="margin-top-1 usa-hint">to:</div>
                <input
                  className="usa-input"
                  id={`input-${pairedField.key}`}
                  min={pairedField.type === 'year' ? 1900 : undefined}
                  max={pairedField.type === 'year' ? 2100 : undefined}
                  onChange={handlers[pairedField.key]}
                  placeholder={pairedField.type === 'year' ? 'yyyy' : undefined}
                  type={pairedField.type === 'date' ? 'date' : 'number'}
                  value={state[pairedField.key]}
                />
              </label>,
              field.domain,
            ];
          default:
            return null;
        }
      }),
  );

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
