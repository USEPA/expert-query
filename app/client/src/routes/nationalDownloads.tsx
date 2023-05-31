import { ReactComponent as Exit } from 'images/launch.svg';
import { Link } from 'react-router-dom';
// components
import { Alert } from 'components/alert';
import { Loading } from 'components/loading';
import { Summary } from 'components/summary';
// contexts
import { useContentState } from 'contexts/content';
// types
import type { Content } from 'contexts/content';
import type { FetchState } from 'types';

/*
## Components
*/

export default NationalDownloads;

export function NationalDownloads() {
  const { content } = useContentState();

  return (
    <div>
      <h1>National Downloads</h1>
      <Summary heading="Description">
        <p>
          Datasets provided on this page are available as prepackaged national
          downloads. They are produced and periodically updated by EPA using
          state-submitted data.
        </p>
      </Summary>
      <NationalDownloadsData content={content} />
    </div>
  );
}

type NationalDownloadsDataProps = {
  content: FetchState<Content>;
};

function NationalDownloadsData({ content }: NationalDownloadsDataProps) {
  const status = content.status;

  if (status === 'failure')
    return (
      <Alert type="error">
        There was an error retrieving national downloads data, please try again
        later.
      </Alert>
    );

  if (status === 'pending') return <Loading />;

  if (status === 'success')
    return (
      <section className="margin-top-6" id="attains">
        <h2 className="text-primary">ATTAINS Data</h2>
        Go to the <Link to="/attains">ATTAINS Query</Link> page.
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
            {Object.entries(content.data.metadata)
              .filter(([_profile, fileInfo]) => fileInfo.size !== null)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([profile, fileInfo]) => (
                <tr key={profile}>
                  <th scope="row" data-label="Download link">
                    <a href={fileInfo.url}>
                      {content.data.profileConfig[profile].label} Profile
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
                  <td data-label="File size">{formatBytes(fileInfo.size!)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
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
