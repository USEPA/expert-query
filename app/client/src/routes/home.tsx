import { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
// components
import Alert from 'components/alert';
import Button from 'components/button';
import CopyBox from 'components/copyBox';
import DescribedOption from 'components/describedOption';
import { Loading } from 'components/loading';
import RadioButtons from 'components/radioButtons';
import InfoTooltip from 'components/infoTooltip';
import Summary from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';

type QueryParameter = [string, string | number | boolean];

const baseFields = ['dataProfile', 'fileFormat'];

const dataProfiles = {
  assessmentUnits: {
    description: 'Description of assessment units',
    fields: ['state'],
    label: 'Assessment Units',
  },
  assessmentUnitsMonitoring: {
    description: 'Description of assessment units with monitoring locations',
    fields: ['state'],
    label: 'Assessment Units with Monitoring Locations',
  },
  catchmentCorrespondence: {
    description: 'Description of Catchment Correspondences',
    fields: ['state'],
    label: 'Catchment Correspondences',
  },
  sources: {
    description: 'Description of Sources',
    fields: ['state'],
    label: 'Sources',
  },
  tmdl: {
    description: 'Description of Total Maximum Daily Load',
    fields: ['state'],
    label: 'Total Maximum Daily Load',
  },
};

const defaultDataProfile = 'assessmentUnits';

const defaultFileFormat = 'csv';

const dataProfileOption = (profileId: keyof typeof dataProfiles) => {
  return {
    value: profileId,
    label: (
      <DescribedOption
        description={dataProfiles[profileId].description}
        label={dataProfiles[profileId].label}
      />
    ),
  };
};

export function Home() {
  const { content } = useContentState();

  const [fileFormat, setFileFormat] = useState<string>(defaultFileFormat);
  const [profile, setProfile] = useState<{
    value: keyof typeof dataProfiles;
    label: JSX.Element;
  } | null>(dataProfileOption(defaultDataProfile));

  const clearInputs = useCallback(() => {
    setFileFormat(defaultFileFormat);
    setProfile(null);
  }, []);

  const [queryParams, setQueryParams] = useState<Array<QueryParameter>>([]);

  useEffect(() => {
    const allQueryParams: {
      [field: string]: string | number | boolean | null;
    } = {
      dataProfile: profile?.value ?? null,
      fileFormat: fileFormat,
    };

    const currentQueryParams = Object.entries(allQueryParams).filter(
      ([param, value]) => {
        if (value === null) return false;
        if (baseFields.includes(param)) return true;
        if (profile && dataProfiles[profile.value].fields.includes(param))
          return true;
        return false;
      },
    ) as Array<QueryParameter>;

    setQueryParams(currentQueryParams);
  }, [fileFormat, profile]);

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
          onChange={(ev) => setProfile(ev)}
          options={Object.keys(dataProfiles).map((profileId) => {
            return dataProfileOption(profileId as keyof typeof dataProfiles);
          })}
          value={profile}
        />
        <h3>Filters</h3>
        <h3>Download the Data</h3>
        <div className="display-flex flex-wrap">
          <RadioButtons
            legend={
              <>
                <b className="margin-right-1">File Format</b>
                <InfoTooltip text="Choose a file format to download the result set" />
              </>
            }
            onChange={(val) => setFileFormat(val)}
            options={[
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
            ]}
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
        <h4>Query URL</h4>
        <CopyBox text={window.location.href} />
      </div>
    );

  return null;
}
