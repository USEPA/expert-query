import { useEffect, useState } from 'react';
// components
import { Loading } from 'components/loading';
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
      <h2>National Downloads</h2>
      {/* page links? */}
      <hr />
      <Summary heading="Description">
        <></>
      </Summary>
      <section className="margin-top-6">
        <h3 id="attains" className="text-primary">
          ATTAINS Data
        </h3>
        <AttainsData metadata={metadata} />
      </section>
    </>
  );
}

type AttainsDataProps = {
  metadata: FetchState<Metadata>;
};

function AttainsData({ metadata }: AttainsDataProps) {
  const status = metadata.status;

  if (status === 'failure') return <></>;

  if (status === 'pending') return <Loading />;

  if (status === 'success')
    return (
      <table className="margin-x-auto usa-table usa-table--borderless width-full maxw-tablet-lg">
        <caption>Extracted on {metadata.data.julianDate}</caption>
        <thead>
          <tr>
            <th scope="col">Download link</th>
            <th scope="col">File size</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(metadata.data.files).map(([profile, fileInfo]) => (
            <tr key={profile}>
              <th scope="row">
                <a href={fileInfo.url}>{profiles[profile as Profile].label}</a>
              </th>
              <td>{formatBytes(fileInfo.size)}</td>
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
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/*
## Types
*/

type Metadata = {
  julianDate: number;
  files: Partial<{
    [P in Profile]: {
      url: string;
      size: number;
    };
  }>;
};
