import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as Exit } from '@uswds/uswds/img/usa-icons/launch.svg';
import { ReactComponent as Home } from '@uswds/uswds/img/usa-icons/home.svg';
// components
import { Alert } from 'components/alert';
import { Loading } from 'components/loading';
import { NavButton } from 'components/navButton';
import { Summary } from 'components/summary';
// config
import { getData, profiles, serverUrl } from 'config';
// utils
import { isAbort, useAbort } from 'utils';
// types
import type { Profile } from 'config/profiles';
import type { FetchState } from 'types';

/*
## Components
*/

export default NationalDownloads;

export function NationalDownloads() {
  const { getSignal } = useAbort();
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<FetchState<Metadata>>({
    status: 'idle',
    data: null,
  });

  useEffect(() => {
    setMetadata({ status: 'pending', data: null });
    getData<Metadata>(`${serverUrl}/api/nationalDownloads`, getSignal())
      .then((data) => setMetadata({ status: 'success', data }))
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setMetadata({ status: 'failure', data: null });
      });
  }, [getSignal]);

  return (
    <>
      <NavButton label="Home" icon={Home} onClick={() => navigate('/')} />
      <div>
        <h2>National Downloads</h2>
        <ul className="usa-list">
          <li>
            <a href="#attains">ATTAINS Data</a>
          </li>
        </ul>
        <hr />
        <Summary heading="Description">
          <p>
            Datasets provided on this page are available as prepackaged national
            downloads. They are produced and periodically updated by EPA using
            state-submitted data.
          </p>
        </Summary>
        <section className="margin-top-6" id="attains">
          <h3 className="text-primary">ATTAINS Data</h3>
          <AttainsData metadata={metadata} />
        </section>
      </div>
    </>
  );
}

type AttainsDataProps = {
  metadata: FetchState<Metadata>;
};

function AttainsData({ metadata }: AttainsDataProps) {
  const status = metadata.status;

  if (status === 'failure')
    return (
      <Alert type="error">
        There was an error retrieving ATTAINS national data, please try again
        later.
      </Alert>
    );

  if (status === 'pending') return <Loading />;

  if (status === 'success')
    return (
      <table className="margin-x-auto usa-table usa-table--stacked width-full">
        <thead>
          <tr>
            <th scope="col">Download link</th>
            <th scope="col">Time last refreshed</th>
            <th scope="col">Number of rows</th>
            <th scope="col">File size</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metadata.data)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([profile, fileInfo]) => (
              <tr key={profile}>
                <th scope="row" data-label="Download link">
                  <a href={fileInfo.url}>
                    {profiles[profile as Profile].label} Profile Data
                    <Exit
                      aria-hidden="true"
                      className="height-2 margin-left-05 text-primary top-05 usa-icon width-2"
                      focusable="false"
                      role="img"
                      title="Exit EPA's Website"
                    />
                  </a>
                </th>
                <td data-label="Time last refreshed">
                  {formatDate(fileInfo.timestamp)}
                </td>
                <td data-label="Number of rows">
                  {fileInfo.numRows.toLocaleString()}
                </td>
                <td data-label="File size">{formatBytes(fileInfo.size)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );

  return null;
}

/*
## Utils
*/

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat(
    (bytes / Math.pow(k, i)).toFixed(dm),
  ).toLocaleString()} ${sizes[i]}`;
}

function formatDate(isoTimestamp: string) {
  const datestring = new Date(isoTimestamp).toLocaleString();
  const [date, time] = datestring.split(',');
  return (
    <div className="display-flex flex-wrap">
      <span className="margin-right-05">{date},</span>
      <span>{time}</span>
    </div>
  );
}

/*
## Types
*/

type Metadata = Partial<{
  [P in Profile]: {
    url: string;
    size: number;
    numRows: number;
    timestamp: string;
  };
}>;
