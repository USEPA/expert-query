import { Dialog } from '@reach/dialog';
import Close from 'images/close.svg?react';
import { uniqueId } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
// components
import { Alert } from 'components/alert';
import { Loading } from 'components/loading';
import { Table } from 'components/table';
// utils
import { isAbort, postData, useAbort } from 'utils';
// styles
import '@reach/dialog/styles.css';
// types
import type { FetchState, QueryData } from 'types';

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

  // Data to be displayed in the preview table.
  const [preview, setPreview] = useState<
    FetchState<Array<ActionsDocumentsRow>>
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
        const data = res.data.map((row: ActionsDocumentsRow) => ({
          rankPercent: row.rankPercent,
          docUrl: {
            sortValue: row.docFilename,
            value: (
              <a
                href={row.docUrl as string}
                target="_blank"
                rel="noopener,noreferrer"
              >
                {row.docFilename}
              </a>
            ),
          },
          actionId: row.actionId,
          region: row.region,
          state: row.state,
          organizationId: row.organizationId,
        }));
        setPreview({ data, status: 'success' });
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setPreview({ data: null, status: 'failure' });
      });
  }, [apiKey, queryData, queryUrl]);

  const columns = useMemo(
    () => [
      { id: 'rankPercent', name: 'Rank (%)', sortable: true },
      { id: 'docUrl', name: 'Document URL', sortable: true },
      { id: 'actionId', name: 'Action ID', sortable: false },
      { id: 'region', name: 'Region', sortable: false },
      { id: 'state', name: 'State', sortable: false },
      { id: 'organizationId', name: 'Organization ID', sortable: false },
    ],
    [],
  );

  return (
    <Dialog
      isOpen
      onDismiss={closeModal}
      className="usa-modal maxw-desktop-lg maxh-mobile tablet:maxh-tablet desktop:maxh-tablet-lg"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
    >
      <div className="usa-modal__content">
        <div className="usa-modal__main width-full">
          <h2 className="usa-modal__heading margin-bottom-05">
            Results Preview{' '}
          </h2>
          <small className="text-italic">Limited to {limit} rows</small>
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
                  <Table
                    columns={columns}
                    data={preview.data}
                    id={`${id}-table`}
                    scrollable={true}
                    initialSortDir="descending"
                    sortable={true}
                    stacked={true}
                    striped={true}
                  />
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

type ActionsDocumentsRow = {
  actionId: string;
  docFilename: string;
  docUrl: string;
  objectId: string;
  organizationId: string;
  rankPercent: number;
  region: string;
  state: string;
};

type PreviewModalProps<D extends QueryData> = {
  apiKey: string;
  limit: number;
  onClose: () => void;
  queryData: D;
  queryUrl: string;
};

export default PreviewModal;
