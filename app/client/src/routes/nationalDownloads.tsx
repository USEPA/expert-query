import Exit from 'images/launch.svg?react';
import { Link } from 'react-router-dom';
// components
import { Alert } from 'components/alert';
import { Loading } from 'components/loading';
import { MarkdownContent } from 'components/markdownContent';
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

  const status = content.status;

  if (status === 'failure')
    return (
      <Alert type="error">
        There was an error retrieving national downloads data, please try again
        later.
      </Alert>
    );

  if (status === 'pending') return <Loading />;

  if (status === 'success') {
    const settings = content.data.nationalDownloads;
    return (
      <div>
        <h1>{settings.heading}</h1>
        {settings.infoMessages.map((message) => {
          return message.type === 'summary' ? (
            <Summary key={message.id} heading={message.heading}>
              <MarkdownContent children={message.content} />
            </Summary>
          ) : (
            <Alert
              key={message.id}
              type={message.type}
              heading={message.heading}
            >
              <MarkdownContent
                children={message.content}
                components={{
                  p: ParagraphNoMargin,
                }}
              />
            </Alert>
          );
        })}
        <NationalDownloadsData content={content} />
      </div>
    );
  }

  return null;
}

type NationalDownloadsDataProps = {
  content: FetchState<Content>;
};

function NationalDownloadsData({
  content,
}: Readonly<NationalDownloadsDataProps>) {
  if (content.status !== 'success') return null;

  return (
    <section className="margin-top-6" id="attains">
      <h2 className="text-primary">ATTAINS Data</h2>
      Go to the <Link to="/attains">ATTAINS Query</Link> page.
      <table className="margin-x-auto usa-table usa-table--stacked width-full">
        <colgroup span={1}></colgroup>
        <colgroup span={1}></colgroup>
        <colgroup span={1}></colgroup>
        <colgroup span={2}></colgroup>
        <thead>
          <tr>
            <th scope="col" rowSpan={2}>
              Download link
              <br />
              <i className="text-normal font-body-2xs">
                All downloads are zipped (ZIP) CSV files
              </i>
            </th>
            <th scope="col" rowSpan={2}>
              Time last refreshed
            </th>
            <th scope="col" rowSpan={2}>
              Number of rows
            </th>
            <th scope="colgroup" colSpan={2} className="text-center">
              File size
            </th>
          </tr>
          <tr>
            <th scope="col">Zipped</th>
            <th scope="col">Unzipped</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(content.data.metadata)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([profile, fileInfo]) => (
              <tr key={profile}>
                <th scope="row" data-label="Download link (CSV ZIP)">
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
                <td data-label="Zipped File size">
                  {formatBytes(fileInfo.zipSize)}
                </td>
                <td data-label="Unzipped File size">
                  {formatBytes(fileInfo.csvSize)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}

function ParagraphNoMargin(
  props: React.ClassAttributes<HTMLParagraphElement> &
    React.HTMLAttributes<HTMLParagraphElement>,
) {
  return <p className="margin-0">{props.children}</p>;
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
