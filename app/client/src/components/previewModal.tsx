import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useEffect, useState } from 'react';
import Close from 'images/close.svg?react';
// components
import { Alert } from 'components/alert';
import { Loading } from 'components/loading';
// utils
import { isAbort, postData, useAbort } from 'utils';
// styles
import '@reach/dialog/styles.css';
// types
import type { FetchState, QueryData, Value } from 'types';

export function PreviewModal<D extends QueryData>({
  apiKey,
  limit,
  onClose,
  queryData,
  queryUrl,
}: Readonly<PreviewModalProps<D>>) {
  const { abort, getSignal } = useAbort();

  const closeModal = () => {
    abort();
    onClose();
  };

  const [id] = useState(uniqueId('modal-'));

  const [preview, setPreview] = useState<
    FetchState<Array<Record<string, Value | null>>>
  >({
    data: null,
    status: 'idle',
  });

  useEffect(() => {
    setPreview({ data: null, status: 'pending' });
    postData({
      url: queryUrl,
      apiKey,
      data: {
        ...queryData,
        options: {
          ...queryData.options,
          format: 'json',
          pageSize: limit,
        },
      },
      signal: getSignal(),
    })
      .then((res) => {
        setPreview({ data: res.data, status: 'success' });
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setPreview({ data: null, status: 'failure' });
      });
  }, [apiKey, queryData, queryUrl]);

  return (
    <Dialog
      isOpen
      onDismiss={closeModal}
      className="usa-modal maxw-desktop maxh-mobile tablet:maxh-tablet"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
    >
      <div className="usa-modal__content">
        <div className="usa-modal__main width-full">
          <h2 className="usa-modal__heading">
            Results Preview{' '}
            <small className="font-heading-2xs">
              (limited to {limit} rows)
            </small>
          </h2>
          {preview.status === 'pending' && (
            <div className="usa-prose">
              <Loading />
              <p>Searching, please wait...</p>
            </div>
          )}
          {preview.status === 'failure' && (
            <Alert type="error">
              The specified query could not be executed at this time.
            </Alert>
          )}
          {preview.status === 'success' && (
            <>
              {preview.data.length === 0 ? (
                <Alert type="info">No results found</Alert>
              ) : (
                <>
                  <div className="border usa-table-container--scrollable overflow-y-scroll">
                    <table className="usa-table usa-table--sticky-header usa-table--striped width-full border-0">
                      {/*<div className="overflow-y-scroll margin-x-auto width-mobile width-fit">
                    <table className="usa-table usa-table--stacked width-full">*/}
                      <thead>
                        <tr>
                          <th data-sortable scope="col">
                            Rank (%)
                          </th>
                          <th data-sortable scope="col">
                            Document URL
                          </th>
                          <th scope="col">Action ID</th>
                          <th scope="col">Region</th>
                          <th scope="col">State</th>
                          <th scope="col">Organization ID</th>
                          <th scope="col">HMW Plan Summary URL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.map((row) => (
                          <tr key={row.objectId}>
                            <td data-label="Rank (%)">{row.rankPercent}</td>
                            <td
                              data-label="Document URL"
                              data-sort-value={row.docUrl}
                            >
                              <a
                                href={row.docUrl as string}
                                target="_blank"
                                rel="noopener,noreferrer"
                              >
                                {row.docFilename}
                              </a>
                            </td>
                            <td data-label="ActionID">{row.actionId}</td>
                            <td data-label="Region">{row.region}</td>
                            <td data-label="State">{row.state}</td>
                            <td data-label="Organization ID">
                              {row.organizationId}
                            </td>
                            <td data-label="HMW Plan Summary URL"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <button
          aria-label="Close this window"
          className="usa-button usa-modal__close"
          onClick={closeModal}
          type="button"
        >
          <Close
            aria-hidden
            className="usa-icon"
            focusable="false"
            role="img"
          />
        </button>
      </div>
    </Dialog>
  );
}

/*
## Types
*/

type PreviewModalProps<D extends QueryData> = {
  apiKey: string;
  limit: number;
  onClose: () => void;
  queryData: D;
  queryUrl: string;
};

export default PreviewModal;
