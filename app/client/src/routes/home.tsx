import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import {
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import Select from 'react-select';
import { ReactComponent as Download } from '@uswds/uswds/img/usa-icons/file_download.svg';
import { ReactComponent as Book } from '@uswds/uswds/img/usa-icons/local_library.svg';
// components
import { Accordion, AccordionItem } from 'components/accordion';
import { Alert } from 'components/alert';
import { Checkbox } from 'components/checkbox';
import { Checkboxes } from 'components/checkboxes';
import { CopyBox } from 'components/copyBox';
import { GlossaryPanel } from 'components/glossaryPanel';
import { InfoTooltip } from 'components/infoTooltip';
import { Loading } from 'components/loading';
import { DownloadModal } from 'components/downloadModal';
import { ClearSearchModal } from 'components/clearSearchModal';
import { NavButton } from 'components/navButton';
import { RadioButtons } from 'components/radioButtons';
import { SourceSelect } from 'components/sourceSelect';
import { Summary } from 'components/summary';
import { Button } from 'components/button';
// contexts
import { useContentState } from 'contexts/content';
// config
import {
  fields,
  getData,
  options as listOptions,
  postData,
  profiles,
  serverUrl,
} from 'config';
// utils
import { isAbort, useAbort } from 'utils';
// types
import type { ChangeEvent } from 'react';
import type { DomainOptions, Option, Primitive, Status } from 'types';
import type { Profile } from 'config/profiles';

/*
## Components
*/

export default Home;

export function Home() {
  const { content } = useContentState();

  const staticOptions = useStaticOptions(content);

  const { handleProfileChange, profile, profileOption } = useProfile();

  const { format, formatHandler } = useFormat();

  const { initializeFilters, filterState, filterHandlers, resetFilters } =
    useFilterState();

  const { sourceState, sourceHandlers } = useSourceState();

  const { queryParams, queryParamErrors } = useQueryParams({
    format: format.value,
    profile,
    staticOptions,
    filterState,
    initializeFilters,
  });

  const eqDataUrl =
    content.data.services?.eqDataApi || `${serverUrl}/api/attains`;

  const profileRefreshDate = profile
    ? content.data.metadata?.[profile]?.timestamp
    : null;

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
        <NavButton
          label="Glossary"
          icon={Book}
          styles={['js-glossary-toggle']}
        />
        <GlossaryPanel path={getPageName()} />
        <div>
          <h2>Query ATTAINS Data</h2>
          <hr />
          <ParameterErrorAlert parameters={queryParamErrors} />
          <Intro />
          {staticOptions && (
            <>
              <h3>Data Profile</h3>
              <Select
                id="select-data-profile"
                instanceId="instance-select-data-profile"
                aria-label="Select a data profile"
                onChange={handleProfileChange}
                options={staticOptions.dataProfile}
                placeholder="Select a data profile..."
                value={profileOption}
              />

              {profile && (
                <>
                  {profileRefreshDate && (
                    <p>
                      {profiles[profile].label} profile data last refreshed{' '}
                      <strong>
                        {new Date(profileRefreshDate).toLocaleString()}
                      </strong>
                      .
                    </p>
                  )}

                  <Outlet
                    context={{
                      filterHandlers,
                      filterState,
                      format,
                      formatHandler,
                      profile,
                      queryParams,
                      queryUrl: eqDataUrl,
                      resetFilters,
                      sourceHandlers,
                      sourceState,
                      staticOptions,
                    }}
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

export function QueryBuilder() {
  const {
    queryParams,
    queryUrl,
    filterHandlers,
    filterState,
    format,
    formatHandler,
    profile,
    resetFilters,
    sourceHandlers,
    sourceState,
    staticOptions,
  } = useHomeContext();

  const {
    clearConfirmationVisible,
    closeClearConfirmation,
    openClearConfirmation,
  } = useClearConfirmationVisibility();

  const {
    closeDownloadConfirmation,
    downloadConfirmationVisible,
    openDownloadConfirmation,
  } = useDownloadConfirmationVisibility();

  const [downloadStatus, setDownloadStatus] = useState<Status>('idle');

  return (
    <>
      {downloadConfirmationVisible && (
        <DownloadModal
          dataId="attains"
          filename={profile && format ? `${profile}.${format.value}` : null}
          downloadStatus={downloadStatus}
          onClose={closeDownloadConfirmation}
          queryData={queryParams}
          queryUrl={
            profile ? `${queryUrl}/${profiles[profile].resource}` : null
          }
          setDownloadStatus={setDownloadStatus}
        />
      )}
      {clearConfirmationVisible && (
        <ClearSearchModal
          onContinue={resetFilters}
          onClose={closeClearConfirmation}
        />
      )}
      {profile && (
        <Accordion>
          <AccordionItem heading="Filters" initialExpand>
            <div className="display-flex width-full flex-justify-center">
              <Button onClick={openClearConfirmation} color="white">
                Clear Search
              </Button>
            </div>
            <FilterGroups
              filterHandlers={filterHandlers}
              filterState={filterState}
              profile={profile}
              queryParams={queryParams}
              sourceHandlers={sourceHandlers}
              sourceState={sourceState}
              staticOptions={staticOptions}
            />
          </AccordionItem>

          <AccordionItem heading="Download the Data" initialExpand>
            <RadioButtons
              legend={
                <>
                  <b className="margin-right-05">File Format</b>
                  <InfoTooltip text="Choose a file format for the result set." />
                </>
              }
              onChange={formatHandler}
              options={staticOptions.format}
              selected={format}
              styles={['margin-bottom-2']}
            />
            <button
              className="align-items-center display-flex flex-justify-center margin-bottom-1 usa-button"
              onClick={openDownloadConfirmation}
              type="button"
            >
              <Download className="height-205 margin-right-1 usa-icon width-205" />
              Download
            </button>
            {downloadStatus === 'success' && (
              <Alert type="success">
                Query executed successfully, please check your downloads folder
                for the results file.
              </Alert>
            )}
            {downloadStatus === 'failure' && (
              <Alert type="error">
                An error occurred while executing the current query, please try
                again later.
              </Alert>
            )}
          </AccordionItem>

          <AccordionItem heading="Advanced API Queries">
            <h4>Current Query</h4>
            <CopyBox
              testId="current-query-copy-box-container"
              text={`${window.location.origin}${
                window.location.pathname
              }#${buildUrlQueryString(queryParams.filters)}`}
            />
            <h4>{profiles[profile].label} API Query</h4>
            <CopyBox
              testId="api-query-copy-box-container"
              lengthExceededMessage="The GET request for this query exceeds the maximum URL character length. Please use a POST request instead (see the cURL query below)."
              maxLength={2048}
              text={`${queryUrl}/${
                profiles[profile].resource
              }?${buildUrlQueryString(
                queryParams.filters,
                queryParams.options,
                queryParams.columns,
              )}`}
            />
            <h4>cURL</h4>
            <CopyBox
              testId="curl-copy-box-container"
              text={`curl -X POST --json "${JSON.stringify(
                queryParams,
              ).replaceAll('"', '\\"')}" ${queryUrl}/${
                profiles[profile].resource
              }`}
            />
          </AccordionItem>
        </Accordion>
      )}
    </>
  );
}

function FilterFields({
  fields,
  filterHandlers,
  filterState,
  profile,
  queryParams,
  sourceHandlers,
  sourceState,
  staticOptions,
}: FilterFieldsProps) {
  // Store each field's element in a tuple with its key
  const fieldsJsx: Array<[JSX.Element, string]> = removeNulls(
    fields.map((fieldConfig) => {
      const sourceFieldConfig =
        'source' in fieldConfig
          ? sourceFieldsConfig.find((f) => f.id === fieldConfig.source)
          : null;

      switch (fieldConfig.type) {
        case 'multiselect':
        case 'select':
          const initialOptions = getInitialOptions(
            staticOptions,
            fieldConfig.key,
          );

          if (
            !sourceFieldConfig &&
            fieldConfig.type === 'multiselect' &&
            Array.isArray(initialOptions) &&
            initialOptions.length <= 5
          ) {
            return [
              <Checkboxes
                key={fieldConfig.key}
                legend={<b>{fieldConfig.label}</b>}
                onChange={filterHandlers[fieldConfig.key]}
                options={initialOptions}
                selected={filterState[fieldConfig.key] ?? []}
                styles={['margin-top-3']}
              />,
              fieldConfig.key,
            ];
          }

          const sourceKey = sourceFieldConfig?.key ?? null;
          const sourceValue = sourceFieldConfig
            ? sourceState[sourceFieldConfig.id]
            : null;
          const selectProps = {
            contextFilters: getContextFilters(fieldConfig, profile, {
              ...queryParams.filters,
              ...(sourceKey && sourceValue
                ? { [sourceKey]: sourceValue.value }
                : {}),
            }),
            defaultOption:
              'default' in fieldConfig ? fieldConfig.default : null,
            filterHandler: filterHandlers[fieldConfig.key],
            filterKey: fieldConfig.key,
            filterLabel: fieldConfig.label,
            filterValue: filterState[fieldConfig.key],
            profile,
            secondaryFilterKey:
              'secondaryKey' in fieldConfig ? fieldConfig.secondaryKey : null,
            sortDirection:
              'direction' in fieldConfig
                ? (fieldConfig.direction as SortDirection)
                : 'asc',
            sourceKey,
            sourceValue,
            staticOptions,
          } as typeof fieldConfig.key extends MultiOptionField
            ? MultiSelectFilterProps
            : SingleSelectFilterProps;

          const tooltip = 'tooltip' in fieldConfig ? fieldConfig.tooltip : null;

          return [
            <label
              className="usa-label"
              key={fieldConfig.key}
              htmlFor={`input-${fieldConfig.key}`}
            >
              <span className="display-flex align-items-center">
                <b>{fieldConfig.label}</b>{' '}
                {tooltip && (
                  <InfoTooltip text={tooltip} styles={['margin-left-05']} />
                )}
              </span>
              <div className="margin-top-1">
                {sourceFieldConfig ? (
                  <SourceSelectFilter
                    {...selectProps}
                    sourceHandler={sourceHandlers[sourceFieldConfig.id]}
                    sourceKey={sourceFieldConfig.key}
                    sourceLabel={sourceFieldConfig.label}
                  />
                ) : (
                  <SelectFilter {...selectProps} />
                )}
              </div>
            </label>,
            fieldConfig.key,
          ];
        case 'date':
        case 'year':
          // Prevents range fields from rendering twice
          if (fieldConfig.boundary === 'high') return null;

          const pairedField = filterFieldsConfig.find(
            (otherField) =>
              otherField.key !== fieldConfig.key &&
              'domain' in otherField &&
              otherField.domain === fieldConfig.domain,
          );
          // All range inputs should have a high and a low boundary field
          if (!pairedField || !isSingleValueField(pairedField.key)) return null;

          return [
            <RangeFilter
              domain={fieldConfig.domain}
              highHandler={filterHandlers[pairedField.key]}
              highKey={pairedField.key}
              highValue={filterState[pairedField.key]}
              key={fieldConfig.key}
              label={fieldConfig.label}
              lowHandler={filterHandlers[fieldConfig.key]}
              lowKey={fieldConfig.key}
              lowValue={filterState[fieldConfig.key]}
              type={fieldConfig.type}
            />,
            fieldConfig.domain,
          ];
        default:
          return null;
      }
    }),
  );

  return (
    <div className="grid-gap grid-row">
      {fieldsJsx.map(([field, key]) => (
        <div className="desktop:grid-col-4 tablet:grid-col-6" key={key}>
          {field}
        </div>
      ))}
    </div>
  );
}

function FilterGroups(props: FilterGroupsProps) {
  const { profile } = props;
  const groupedFields = filterGroupsConfig[profile].map((group) => ({
    ...group,
    fields: group.fields
      .map((field) => filterFieldsConfig.find((f) => f.key === field))
      .filter((field) => field !== undefined),
  }));

  return (
    <>
      {groupedFields.map((group, i) => (
        <section
          className={`margin-top-${i === 0 ? '2' : '6'}`}
          key={group.key}
        >
          <hr />
          <h4 className="text-primary">{filterGroupLabels[group.key]}</h4>
          <FilterFields
            {...props}
            fields={group.fields as Array<(typeof filterFieldsConfig)[number]>}
          />
        </section>
      ))}
    </>
  );
}

function Intro() {
  const [visible, setVisible] = useState(
    !!JSON.parse(getLocalStorageItem('showIntro') ?? 'true'),
  );

  const closeIntro = useCallback(() => setVisible(false), []);

  const [dontShowAgain, setDontShowAgain] = useState<boolean | null>(null);

  const toggleDontShowAgain = useCallback(
    () => setDontShowAgain(!dontShowAgain),
    [dontShowAgain],
  );

  useEffect(() => {
    if (dontShowAgain === null) return;
    setLocalStorageItem('showIntro', JSON.stringify(!dontShowAgain));
  }, [dontShowAgain]);

  if (!visible) return null;

  return (
    <Summary heading="How to Use This Application">
      <p>
        Select a data profile, then build a query by selecting options from the
        input fields.
      </p>
      <div className="display-flex flex-justify flex-wrap">
        <Checkbox
          checked={dontShowAgain ?? false}
          label="Don't show again on this computer"
          onChange={toggleDontShowAgain}
          styles={['margin-right-1 margin-y-auto']}
        />
        <button
          className="margin-top-2 usa-button"
          onClick={closeIntro}
          type="button"
        >
          Close Intro
        </button>
      </div>
    </Summary>
  );
}

function ParameterErrorAlert({
  parameters,
}: {
  parameters: ParameterErrors | null;
}) {
  const [visible, setVisible] = useState(false);

  const closeAlert = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (parameters) setVisible(true);
  }, [parameters]);

  if (!parameters || !visible) return null;

  return (
    <Alert icon={false} type="error">
      {parameters.invalid.size > 0 && (
        <>
          <p className="text-bold">
            The following parameters could not be matched to a valid field under
            the selected profile:
          </p>
          <ul>
            {Array.from(parameters.invalid).map((invalidParam) => (
              <li key={invalidParam}>{invalidParam}</li>
            ))}
          </ul>
        </>
      )}
      {parameters.duplicate.size > 0 && (
        <>
          <p className="text-bold">
            Multiple parameters were provided for the following fields, when
            only a single parameter is allowed:
          </p>
          <ul>
            {Array.from(parameters.duplicate).map((duplicateParam) => (
              <li key={duplicateParam}>{duplicateParam}</li>
            ))}
          </ul>
        </>
      )}
      <div className="display-flex flex-justify-end">
        <button className="usa-button" onClick={closeAlert} type="button">
          Close Alert
        </button>
      </div>
    </Alert>
  );
}

function RangeFilter<F extends Extract<FilterField, SingleValueField>>({
  domain,
  highHandler,
  highKey,
  highValue,
  label,
  lowHandler,
  lowKey,
  lowValue,
  type,
}: RangeFilterProps<F>) {
  return (
    <label className="usa-label" htmlFor={`input-${lowKey}`} key={domain}>
      <b>{label}</b>
      <div className="margin-top-1 usa-hint">from:</div>
      <input
        className="usa-input"
        id={`input-${lowKey}`}
        min={type === 'year' ? 1900 : undefined}
        max={type === 'year' ? 2100 : undefined}
        onChange={lowHandler}
        placeholder={type === 'year' ? 'yyyy' : undefined}
        title={`Start of "${label}" range`}
        type={type === 'date' ? 'date' : 'number'}
        value={lowValue}
      />
      <div className="margin-top-1 usa-hint">to:</div>
      <input
        className="usa-input"
        id={`input-${highKey}`}
        min={type === 'year' ? 1900 : undefined}
        max={type === 'year' ? 2100 : undefined}
        onChange={highHandler}
        placeholder={type === 'year' ? 'yyyy' : undefined}
        title={`End of "${label}" range`}
        type={type === 'date' ? 'date' : 'number'}
        value={highValue}
      />
    </label>
  );
}

function SourceSelectFilter(
  props: SourceSelectFilterProps<
    MultiSelectFilterProps | SingleSelectFilterProps
  >,
) {
  const { sourceLabel, sourceHandler, ...selectFilterProps } = props;
  const { sourceKey, sourceValue, staticOptions } = selectFilterProps;

  return (
    <SourceSelect
      label={sourceLabel}
      sources={getStaticOptions(sourceKey, staticOptions)}
      onChange={sourceHandler}
      selected={sourceValue}
    >
      <SelectFilter {...selectFilterProps} />
    </SourceSelect>
  );
}

function SelectFilter<
  P extends SingleSelectFilterProps | MultiSelectFilterProps,
>({
  contextFilters,
  defaultOption,
  filterHandler,
  filterKey,
  filterLabel,
  filterValue,
  profile,
  secondaryFilterKey,
  sortDirection,
  sourceKey,
  sourceValue,
  staticOptions,
}: P) {
  const { content } = useContentState();
  const { abort, getSignal } = useAbort();

  // Create the filter function from the HOF
  const filterFunc = useMemo(() => {
    return filterOptions({
      defaultOption,
      filters: contextFilters,
      profile,
      fieldName: filterKey,
      direction: sortDirection,
      dynamicOptionLimit: content.data?.parameters.selectOptionsPageSize,
      secondaryFieldName: secondaryFilterKey,
      staticOptions,
    });
  }, [
    content,
    contextFilters,
    defaultOption,
    filterKey,
    profile,
    secondaryFilterKey,
    sortDirection,
    staticOptions,
  ]);

  const [options, setOptions] = useState<readonly Option[] | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOptions = useCallback(
    async (inputValue: string) => {
      abort();
      setLoading(true);
      try {
        const newOptions = await filterFunc(inputValue, getSignal());
        setLoading(false);
        setOptions(newOptions);
      } catch (err) {
        if (isAbort(err)) return;
        setLoading(false);
        console.error(err);
      }
    },
    [abort, filterFunc, getSignal],
  );

  const debouncedFetchOptions = useMemo(() => {
    if (content.status !== 'success') return null;
    return debounce(
      fetchOptions,
      content.data.parameters.debounceMilliseconds,
      {
        leading: true,
        trailing: true,
      },
    );
  }, [content, fetchOptions]);

  useEffect(() => {
    return function cleanup() {
      debouncedFetchOptions?.cancel();
    };
  }, [debouncedFetchOptions]);

  const loadOptions = (inputValue: string | null = null) =>
    inputValue === null || !debouncedFetchOptions
      ? fetchOptions(inputValue ?? '')
      : debouncedFetchOptions(inputValue);

  // Reset default options when `sourceValue` changes
  useEffect(() => {
    if (!sourceValue) return;
    setOptions(null);
  }, [sourceValue]);

  return (
    <Select
      aria-label={`${filterLabel} input`}
      className="width-full"
      inputId={`input-${filterKey}`}
      instanceId={`instance-${filterKey}`}
      isLoading={loading}
      isMulti={isMultiOptionField(filterKey)}
      menuPortalTarget={document.body}
      onChange={filterHandler}
      onInputChange={(inputValue, actionMeta) => {
        if (actionMeta.action !== 'input-change') return;
        loadOptions(inputValue);
      }}
      onMenuClose={() => {
        abort();
        setLoading(false);
        setOptions(null);
      }}
      onMenuOpen={loadOptions}
      options={options ?? undefined}
      placeholder={`Select ${getArticle(
        filterLabel.split(' ')[0],
      )} ${filterLabel}...`}
      styles={{
        control: (base) => ({
          ...base,
          border: '1px solid #adadad',
          borderRadius: sourceKey ? '0 4px 4px 0' : '4px',
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      value={filterValue}
    />
  );
}

/*
## Hooks
*/

function useClearConfirmationVisibility() {
  const [clearConfirmationVisible, setClearConfirmationVisible] =
    useState(false);

  const closeClearConfirmation = useCallback(() => {
    setClearConfirmationVisible(false);
  }, []);

  const openClearConfirmation = useCallback(() => {
    setClearConfirmationVisible(true);
  }, []);

  return {
    clearConfirmationVisible,
    closeClearConfirmation,
    openClearConfirmation,
  };
}

function useDownloadConfirmationVisibility() {
  const [downloadConfirmationVisible, setDownloadConfirmationVisible] =
    useState(false);

  const closeDownloadConfirmation = useCallback(() => {
    setDownloadConfirmationVisible(false);
  }, []);

  const openDownloadConfirmation = useCallback(() => {
    setDownloadConfirmationVisible(true);
  }, []);

  return {
    closeDownloadConfirmation,
    downloadConfirmationVisible,
    openDownloadConfirmation,
  };
}

function useFormat() {
  const [format, setFormat] = useState<FormatOption>({
    label: 'Comma-separated (CSV)',
    value: 'csv',
  });
  const handleFormatChange = useCallback(
    (format: Option) => setFormat(format as FormatOption),
    [],
  );

  return { format, formatHandler: handleFormatChange };
}

function useHomeContext() {
  return useOutletContext<HomeContext>();
}

function useFilterState() {
  const [filterState, filterDispatch] = useReducer(
    createFilterReducer(),
    getDefaultFilterState(),
  );

  // Memoize individual dispatch functions
  const filterHandlers = useMemo(() => {
    const newHandlers: Partial<FilterFieldInputHandlers> = {};
    filterFields.forEach((field) => {
      if (isMultiOptionField(field)) {
        newHandlers[field] = (ev: MultiOptionState | SingleOptionState) => {
          if (!Array.isArray(ev)) return;
          filterDispatch({ type: field, payload: ev } as FilterFieldAction);
        };
      } else if (isSingleOptionField(field)) {
        newHandlers[field] = (ev: MultiOptionState | SingleOptionState) => {
          if (Array.isArray(ev)) return;
          filterDispatch({ type: field, payload: ev } as FilterFieldAction);
        };
      } else if (isSingleValueField(field)) {
        newHandlers[field] = (ev: ChangeEvent<HTMLInputElement>) => {
          filterDispatch({
            type: field,
            payload: ev.target.value,
          } as FilterFieldAction);
        };
      }
    });
    return newHandlers as FilterFieldInputHandlers;
  }, [filterDispatch]);

  const initializeFilters = useCallback((initialFilters: FilterFieldState) => {
    filterDispatch({ type: 'initialize', payload: initialFilters });
  }, []);

  const resetFilters = useCallback(() => {
    filterDispatch({ type: 'reset' });
  }, []);

  return {
    initializeFilters,
    filterState,
    filterHandlers,
    resetFilters,
  };
}

function useProfile() {
  const navigate = useNavigate();

  const { profile: profileArg } = useParams();

  const [profileOption, setProfileOption] = useState<
    (typeof listOptions.dataProfile)[number] | null
  >(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!profileArg) return;
    if (!isProfile(profileArg)) {
      navigate('/404');
      return;
    }

    setProfile(profileArg);
    setProfileOption(
      listOptions.dataProfile.find((option) => option.value === profileArg) ??
        null,
    );
  }, [navigate, profileArg]);

  const handleProfileChange = useCallback(
    (ev: Option | null) => {
      const route = ev
        ? `/attains/${ev.value}${window.location.hash}`
        : '/attains';
      navigate(route, { replace: true });
    },
    [navigate],
  );

  return { handleProfileChange, profile, profileOption };
}

function useQueryParams({
  profile,
  filterState,
  format,
  initializeFilters,
  staticOptions,
}: {
  profile: Profile | null;
  filterState: FilterFieldState;
  format: Format;
  initializeFilters: (state: FilterFieldState) => void;
  staticOptions: StaticOptions | null;
}) {
  const { getSignal } = useAbort();

  const [parameterErrors, setParameterErrors] =
    useState<ParameterErrors | null>(null);
  const [parametersLoaded, setParametersLoaded] = useState(false);

  // Populate the input fields with URL parameters, if any
  useEffect(() => {
    if (parametersLoaded || !profile || !staticOptions) return;
    getUrlInputs(staticOptions, profile, getSignal())
      .then(({ filters, errors }) => {
        initializeFilters(filters);
        if (errors.invalid.size || errors.duplicate.size)
          setParameterErrors(errors);
      })
      .catch((err) => {
        console.error(`Error loading initial inputs: ${err}`);
      })
      .finally(() => setParametersLoaded(true));
  }, [getSignal, initializeFilters, parametersLoaded, profile, staticOptions]);

  // Track non-empty values relevant to the current profile
  const [parameters, setParameters] = useState<QueryData>({
    columns: [],
    filters: {},
    options: {},
  });

  // Update URL when inputs change
  useEffect(() => {
    if (!profile || !parametersLoaded) return;

    // Get selected parameters, including multiselectable fields
    const newFilterQueryParams: FilterQueryData = {};
    Object.entries(filterState).forEach(
      ([field, value]: [string, FilterFieldState[keyof FilterFieldState]]) => {
        if (isEmpty(value)) return;

        // Extract 'value' field from Option types
        const flattenedValue = getInputValue(value);
        const formattedValue =
          (dateFields as string[]).includes(field) &&
          typeof flattenedValue === 'string'
            ? fromIsoDateString(flattenedValue)
            : flattenedValue;

        if (formattedValue && isProfileField(field, profile)) {
          newFilterQueryParams[field as FilterField] = formattedValue;
        }
      },
    );

    if (Object.keys(newFilterQueryParams).length) {
      window.location.hash = buildUrlQueryString(newFilterQueryParams);
    } else removeHash();

    setParameters({
      filters: newFilterQueryParams,
      options: { format },
      columns: Array.from(profiles[profile].columns),
    });
  }, [filterState, format, parametersLoaded, profile]);

  return { queryParams: parameters, queryParamErrors: parameterErrors };
}

function useSourceState() {
  const [sourceState, sourceDispatch] = useReducer(
    createSourceReducer(),
    getDefaultSourceState(),
  );

  // Memoize individual dispatch functions
  const sourceHandlers = useMemo(() => {
    return sourceFields.reduce((handlers, source) => {
      return {
        ...handlers,
        [source]: (ev: Option | null) =>
          sourceDispatch({ type: source, payload: ev } as SourceFieldAction),
      };
    }, {});
  }, []) as SourceFieldInputHandlers;

  return { sourceState, sourceHandlers };
}

function useStaticOptions(
  content: ReturnType<typeof useContentState>['content'],
) {
  const [staticOptions, setStaticOptions] = useState<StaticOptions | null>(
    null,
  );

  useEffect(() => {
    if (content.status !== 'success') return;
    const domainOptions = addDomainAliases(content.data.domainValues);
    setStaticOptions(
      // Alphabetize all option lists by label
      Object.entries({ ...domainOptions, ...listOptions }).reduce(
        (sorted, [name, options]) => {
          return {
            ...sorted,
            [name]: (options as Option[]).sort((a, b) => {
              if (typeof a.label === 'string' && typeof b.label === 'string') {
                return a.label.localeCompare(b.label);
              }
              return 0;
            }),
          };
        },
        {},
      ) as StaticOptions,
    );
  }, [content]);

  return staticOptions;
}

/*
## Utils
*/

// Adds aliases for fields that share the same set of possible values
function addDomainAliases(values: DomainOptions): Required<DomainOptions> {
  return {
    ...values,
    associatedActionAgency: values.actionAgency,
    associatedActionStatus: values.assessmentUnitStatus,
    associatedActionType: values.actionType,
    pollutant: values.parameterName,
  };
}

// Converts a JSON object into a parameter string
function buildUrlQueryString(
  filters: FilterQueryData,
  options?: OptionQueryData,
  columns?: string[],
) {
  const paramsList: UrlQueryParam[] = [];
  columns?.forEach((column) => paramsList.push(['columns', column]));
  Object.entries({ ...filters, ...options }).forEach(([field, value]) => {
    // Duplicate the query parameter for an array of values
    if (Array.isArray(value)) value.forEach((v) => paramsList.push([field, v]));
    // Else push a single parameter
    else paramsList.push([field, value]);
  });
  return encodeURI(
    paramsList.reduce((a, b) => a + `&${b[0]}=${b[1]}`, '').replace('&', ''),
  ); // trim the leading ampersand
}

// Returns a boolean, specifying if a value is found in the
// specified table and column of the database
async function checkColumnValue(
  value: Primitive,
  fieldName: string,
  profile: string,
) {
  const url = `${serverUrl}/api/attains/${profile}/values/${fieldName}?${fieldName}=${value}&limit=1`;
  const res = await getData<Primitive[]>(url);
  if (res.length) return true;
  return false;
}

// Creates a reducer to manage the state of all query field inputs
function createFilterReducer() {
  const handlers: Partial<FilterFieldActionHandlers> = {};
  let field: keyof FilterFieldState;
  for (field in getDefaultFilterState()) {
    handlers[field] = (state, action) => {
      if (!('payload' in action)) return state;
      return { ...state, [action.type]: action.payload };
    };
  }
  return function reducer(state: FilterFieldState, action: FilterFieldsAction) {
    if (action.type === 'initialize') {
      return action.payload;
    } else if (action.type === 'reset') {
      return getDefaultFilterState();
    } else if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type]?.(state, action) ?? state;
    } else {
      const message = `Unhandled action type: ${action}`;
      throw new Error(message);
    }
  };
}

function createSourceReducer() {
  const actionHandlers = (sourceFields as ReadonlyArray<SourceField>).reduce(
    (current, field) => {
      return {
        ...current,
        [field]: (state: SourceFieldState, action: SourceFieldAction) => {
          return {
            ...state,
            [field]: action.payload,
          };
        },
      };
    },
    {},
  ) as SourceFieldActionHandlers;

  return function reducer(state: SourceFieldState, action: SourceFieldAction) {
    if (actionHandlers.hasOwnProperty(action.type)) {
      return actionHandlers[action.type](state, action);
    } else {
      return state;
    }
  };
}

// Filters options that require fetching values from the database
function filterDynamicOptions({
  defaultOption,
  direction = 'asc',
  fieldName,
  filters,
  limit = 20,
  profile,
  secondaryFieldName,
}: {
  defaultOption?: Option | null;
  direction?: SortDirection;
  fieldName: string;
  filters?: FilterQueryData;
  limit?: number;
  profile: string;
  secondaryFieldName?: string | null;
}) {
  return async function (
    inputValue: string,
    signal?: AbortSignal,
  ): Promise<Array<Option>> {
    const url = `${serverUrl}/api/attains/${profile}/values/${fieldName}`;
    const data = {
      text: inputValue,
      direction: direction ?? null,
      limit,
      filters,
      additionalColumns: secondaryFieldName ? [secondaryFieldName] : [],
    };
    const values = await postData(url, data, 'json', signal);
    const options = values.map((item: Record<string, string>) => {
      const value = item[fieldName];
      // Concatenate primary column value with secondary, if present
      const secondaryValue = secondaryFieldName
        ? item[secondaryFieldName]
        : null;
      const label = secondaryValue ? `${value} - ${secondaryValue}` : value;
      return { label, value };
    });
    return defaultOption ? [defaultOption, ...options] : options;
  };
}

// Filters options by search input, returning a maximum number of options
function filterOptions({
  defaultOption,
  dynamicOptionLimit,
  fieldName,
  filters = {},
  profile,
  direction = 'asc',
  staticOptions,
  secondaryFieldName,
}: {
  defaultOption?: Option | null;
  dynamicOptionLimit?: number;
  fieldName: string;
  filters?: FilterQueryData;
  profile: string;
  direction?: SortDirection;
  secondaryFieldName?: string | null;
  staticOptions: StaticOptions;
}) {
  if (!Object.keys(filters).length && staticOptions.hasOwnProperty(fieldName)) {
    return filterStaticOptions(
      staticOptions[fieldName as keyof StaticOptions] ?? [],
      defaultOption,
    );
  } else {
    return filterDynamicOptions({
      defaultOption,
      direction,
      fieldName,
      filters,
      limit: dynamicOptionLimit,
      profile,
      secondaryFieldName,
    });
  }
}

// Filters options that have values held in memory
function filterStaticOptions(
  options: ReadonlyArray<Option>,
  defaultOption?: Option | null,
) {
  return function (inputValue: string) {
    const value = inputValue.trim().toLowerCase();
    const matches: Option[] = [];
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
    return Promise.resolve(
      defaultOption ? [defaultOption, ...matches] : matches,
    );
  };
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

function getContextFilters(
  fieldConfig: (typeof filterFieldsConfig)[number],
  profile: Profile,
  filters: FilterQueryData,
) {
  if (!('contextFields' in fieldConfig)) return;

  return Object.entries(filters).reduce<FilterQueryData>(
    (current, [key, value]) => {
      if (
        isProfileField(key, profile) &&
        (fieldConfig.contextFields as readonly string[]).includes(key)
      ) {
        return {
          ...current,
          [key]: value,
        };
      }
      return current;
    },
    {},
  );
}

function getDateFields(fields: typeof allFieldsConfig) {
  return removeNulls(
    fields.map((field) => (field.type === 'date' ? field.key : null)),
  );
}

// Returns the default state for inputs
function getDefaultFilterState() {
  return filterFields.reduce((a, b) => {
    const defaultValue = getDefaultValue(b);
    const defaultState =
      defaultValue && isMultiOptionField(b) ? [defaultValue] : defaultValue;
    return { ...a, [b]: defaultState };
  }, {}) as FilterFieldState;
}

function getDefaultSourceState() {
  return (sourceFields as ReadonlyArray<SourceField>).reduce(
    (sourceState, field) => {
      return {
        ...sourceState,
        [field]: getDefaultValue(field),
      };
    },
    {},
  ) as SourceFieldState;
}

function getDefaultValue(fieldName: string) {
  const field = allFieldsConfig.find((f) => f.key === fieldName);
  const defaultValue = field && 'default' in field ? field.default : null;
  return defaultValue ?? (isSingleValueField(fieldName) ? '' : null);
}

// Returns unfiltered options for a field, up to a maximum length
function getInitialOptions(
  staticOptions: StaticOptions,
  fieldName: FilterField,
) {
  if (staticOptions.hasOwnProperty(fieldName)) {
    const fieldOptions = staticOptions[fieldName as keyof StaticOptions] ?? [];

    return fieldOptions.length > staticOptionLimit
      ? fieldOptions.slice(0, staticOptionLimit)
      : fieldOptions;
  }
  return null;
}

// Extracts the value field from Option items, otherwise returns the item
function getInputValue(input: Option | ReadonlyArray<Option> | string) {
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

function getMultiOptionFields(fields: typeof allFieldsConfig) {
  return removeNulls(
    fields.map((field) => {
      return field.type === 'multiselect' ? field.key : null;
    }),
  );
}

function getPageName() {
  const pathParts = window.location.pathname.split('/');
  return pathParts.length > 1 ? pathParts[1] : '';
}

function getSingleOptionFields(fields: typeof allFieldsConfig) {
  return removeNulls(
    fields.map((field) => {
      return field.type === 'select' ? field.key : null;
    }),
  );
}

function getYearFields(fields: typeof allFieldsConfig) {
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

// Uses URL route/query parameters or default values for initial state
async function getUrlInputs(
  staticOptions: StaticOptions,
  profile: Profile,
  _signal: AbortSignal,
): Promise<{ filters: FilterFieldState; errors: ParameterErrors }> {
  const [params, errors] = parseInitialParams(profile);

  const newState = getDefaultFilterState();

  // Match query parameters
  await Promise.all([
    ...Object.keys(params).map(async (key) => {
      if (!isFilterField(key)) return;
      if (isMultiOptionField(key)) {
        newState[key] = await matchMultipleOptions(
          params[key] ?? null,
          key,
          getStaticOptions(key, staticOptions),
          profile,
        );
      } else if (isSingleOptionField(key)) {
        newState[key] = await matchSingleOption(
          params[key] ?? null,
          key,
          getStaticOptions(key, staticOptions),
          profile,
        );
      } else if (isDateField(key)) {
        newState[key] = matchDate(params[key] ?? null);
      } else if (isYearField(key)) {
        newState[key] = matchYear(params[key] ?? null);
      }
    }),
  ]);

  return { filters: newState, errors };
}

// Type narrowing
function isDateField(field: string): field is DateField {
  return (dateFields as string[]).includes(field);
}

// Utility
function isEmpty<T>(
  v: T | null | undefined | [] | {},
): v is null | undefined | [] | {} {
  return !isNotEmpty(v);
}

// Type narrowing
function isFilterField(field: string): field is FilterField {
  return (filterFields as string[]).includes(field);
}

// Type narrowing
function isMultiOptionField(field: string): field is MultiOptionField {
  return (multiOptionFields as string[]).includes(field);
}

// Type predicate, negation is used to narrow to type `T`
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
function isProfile(maybeProfile: string | Profile): maybeProfile is Profile {
  return maybeProfile in profiles;
}

function isProfileField(field: string, profile: Profile) {
  const profileColumns = profiles[profile].columns;
  const fieldConfig = allFieldsConfig.find((config) => config.key === field);
  if (!fieldConfig) return false;
  if (profileColumns.has(fieldConfig.key)) return true;
  if ('domain' in fieldConfig && profileColumns.has(fieldConfig.domain))
    return true;
  return false;
}

// Type narrowing
function isSingleOptionField(field: string): field is SingleOptionField {
  return (singleOptionFields as string[]).includes(field);
}

// Type narrowing
function isSingleValueField(field: string): field is SingleValueField {
  return (singleValueFields as string[]).includes(field);
}

// Type narrowing
function isYearField(field: string): field is YearField {
  return (yearFields as string[]).includes(field);
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
    const defaultOption = getDefaultValue(fieldName);
    defaultOption && matches.add(defaultOption);
  }

  const matchesArray = Array.from(matches);
  return multiple ? matchesArray : matchesArray.pop() ?? null;
}

function matchYear(values: InputValue) {
  return matchDate(values, true);
}

// Parse parameters provided in the URL hash into a JSON object
function parseInitialParams(
  profile: Profile,
): [FilterQueryData, ParameterErrors] {
  const uniqueParams: { [field: string]: Primitive | Set<Primitive> } = {};
  const paramErrors: ParameterErrors = {
    duplicate: new Set(),
    invalid: new Set(),
  };

  const initialParamsList = window.location.hash.replace('#', '').split('&');
  initialParamsList.forEach((param) => {
    const parsedParam = param.split('=');
    // Disregard invalid or empty parameters
    if (parsedParam.length !== 2 || parsedParam[1] === '') return;

    const [field, uriValue] = parsedParam;
    const newValue = decodeURI(uriValue);

    if (field in uniqueParams) {
      if (!isMultiOptionField(field)) return paramErrors.duplicate.add(field);
      // Multiple values, add to an array
      const value = uniqueParams[field];
      if (value instanceof Set) value.add(newValue);
      else uniqueParams[field] = new Set([value, newValue]);
    } else {
      if (!isProfileField(field, profile)) {
        paramErrors.invalid.add(field);
        return;
      }
      // Single value
      uniqueParams[field] = newValue;
    }
  });

  const params = Object.entries(uniqueParams).reduce(
    (current, [param, value]) => {
      return {
        ...current,
        [param]: value instanceof Set ? Array.from(value) : value,
      };
    },
    {},
  );

  return [params, paramErrors];
}

function removeHash() {
  const location = window.location;
  if ('pushState' in window.history)
    window.history.replaceState(null, '', location.pathname);
  else {
    // Prevent scrolling by storing the page's current scroll offset
    const scrollTop = document.body.scrollTop;
    const scrollLeft = document.body.scrollLeft;

    location.hash = '';

    // Restore the scroll offset, should be flicker free
    document.body.scrollTop = scrollTop;
    document.body.scrollLeft = scrollLeft;
  }
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

/*
## Constants
*/

const staticOptionLimit = 100;

const {
  filterFields: filterFieldsConfig,
  filterGroupLabels,
  filterGroups: filterGroupsConfig,
  sourceFields: sourceFieldsConfig,
} = fields;
const allFieldsConfig = [...filterFieldsConfig, ...sourceFieldsConfig];
const filterFields = filterFieldsConfig.map((f) => f.key);
const sourceFields = sourceFieldsConfig.map((fieldConfig) => fieldConfig.id);
const multiOptionFields = getMultiOptionFields(allFieldsConfig);
const singleOptionFields = getSingleOptionFields(allFieldsConfig);
const dateFields = getDateFields(allFieldsConfig);
const yearFields = getYearFields(allFieldsConfig);
const singleValueFields = [...dateFields, ...yearFields];

/*
## Types
*/

type DateField = (typeof dateFields)[number];

type Format = FormatOption['value'];
type FormatOption = (typeof listOptions.format)[number];

type FilterFieldsAction =
  | FilterFieldAction
  | { type: 'initialize'; payload: FilterFieldState }
  | { type: 'reset' };

type FilterFieldAction = {
  [F in keyof FilterFieldState]: {
    type: F;
    payload: FilterFieldState[F];
  };
}[keyof FilterFieldState];

type FilterFieldActionHandlers = {
  [field in FilterField]: (
    state: FilterFieldState,
    action: FilterFieldAction,
  ) => FilterFieldState;
};

type FilterField = (typeof filterFields)[number];

type FilterFieldInputHandlers = {
  [F in Extract<FilterField, MultiOptionField>]: OptionInputHandler;
} & {
  [F in Extract<FilterField, SingleOptionField>]: OptionInputHandler;
} & {
  [F in Extract<FilterField, SingleValueField>]: SingleValueInputHandler;
};

type FilterFieldsProps = FilterGroupsProps & {
  fields: Array<(typeof filterFieldsConfig)[number]>;
};

type FilterFieldState = {
  [F in Extract<FilterField, MultiOptionField>]: MultiOptionState;
} & {
  [F in Extract<FilterField, SingleOptionField>]: SingleOptionState;
} & {
  [F in Extract<FilterField, SingleValueField>]: string;
};

type FilterGroupsProps = {
  filterHandlers: FilterFieldInputHandlers;
  filterState: FilterFieldState;
  profile: Profile;
  queryParams: QueryData;
  sourceHandlers: SourceFieldInputHandlers;
  sourceState: SourceFieldState;
  staticOptions: StaticOptions;
};

type FilterQueryData = Partial<{
  [F in FilterField]: Primitive | Primitive[];
}>;

type HomeContext = {
  filterHandlers: FilterFieldInputHandlers;
  filterState: FilterFieldState;
  format: FormatOption;
  formatHandler: (format: Option) => void;
  profile: Profile;
  queryParams: QueryData;
  queryUrl: string;
  resetFilters: () => void;
  sourceHandlers: SourceFieldInputHandlers;
  sourceState: SourceFieldState;
  staticOptions: StaticOptions;
};

type InputValue = Primitive | Primitive[] | null;

type MultiOptionField = (typeof multiOptionFields)[number];

type MultiOptionState = ReadonlyArray<Option> | null;

type MultiSelectFilterProps = SelectFilterProps<
  Extract<FilterField, MultiOptionField>
>;

type OptionInputHandler = (
  option: SingleOptionState | MultiOptionState,
) => void;

type OptionQueryData = Partial<{
  format: Format;
}>;

type ParameterErrors = {
  duplicate: Set<string>;
  invalid: Set<string>;
};

type QueryData = {
  columns: string[];
  filters: FilterQueryData;
  options: OptionQueryData;
};

type RangeFilterProps<F extends Extract<FilterField, SingleValueField>> = {
  domain: string;
  highHandler: SingleValueInputHandler;
  highKey: F;
  highValue: string;
  label: string;
  lowHandler: SingleValueInputHandler;
  lowKey: F;
  lowValue: string;
  type: 'date' | 'year';
};

type SelectFilterProps<
  F extends Extract<FilterField, MultiOptionField | SingleOptionField>,
> = {
  contextFilters: FilterQueryData;
  defaultOption?: Option | null;
  filterHandler: FilterFieldInputHandlers[F];
  filterKey: F;
  filterLabel: string;
  filterValue: FilterFieldState[F];
  profile: Profile;
  secondaryFilterKey: FilterField;
  sortDirection?: SortDirection;
  sourceKey: (typeof sourceFieldsConfig)[number]['key'] | null;
  sourceValue: SourceFieldState[SourceField] | null;
  staticOptions: StaticOptions;
};

type SingleOptionField = (typeof singleOptionFields)[number];

type SingleOptionInputHandler = (ev: SingleOptionState) => void;

type SingleOptionState = Option | null;

type SingleSelectFilterProps = SelectFilterProps<
  Extract<FilterField, SingleOptionField>
>;

type SingleValueField = (typeof singleValueFields)[number];

type SingleValueInputHandler = (ev: ChangeEvent<HTMLInputElement>) => void;

type SortDirection = 'asc' | 'desc';

type SourceField = (typeof sourceFields)[number];

type SourceFieldState = {
  [F in SourceField]: SingleOptionState;
};

type SourceFieldAction = {
  [F in SourceField]: {
    type: F;
    payload: SourceFieldState[F];
  };
}[keyof SourceFieldState];

type SourceFieldActionHandlers = {
  [F in SourceField]: (
    state: SourceFieldState,
    action: SourceFieldAction,
  ) => SourceFieldState;
};

type SourceFieldInputHandlers = {
  [F in SourceField]: SingleOptionInputHandler;
};

type SourceSelectFilterProps<
  P extends SingleSelectFilterProps | MultiSelectFilterProps,
> = P & {
  sourceHandler: SourceFieldInputHandlers[SourceField];
  sourceKey: (typeof sourceFieldsConfig)[number]['key'];
  sourceLabel: string;
};

type StaticOptions = typeof listOptions & Required<DomainOptions>;

type UrlQueryParam = [string, Primitive];

type YearField = (typeof yearFields)[number];
