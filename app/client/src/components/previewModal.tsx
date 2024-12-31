// TODO: Move all table fields to configuration.
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
    FetchState<Array<ActionDocumentsRow> | string>
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
        if (!Array.isArray(res.data)) {
          setPreview({ data: res.message, status: 'success' });
          return;
        }

        const data = res.data.map((row: ActionDocumentsRow) => ({
          rankPercent: row.rankPercent,
          actionDocumentUrl: {
            sortValue: row.documentName,
            value: (
              <a
                href={row.actionDocumentUrl}
                target="_blank"
                rel="noopener,noreferrer"
              >
                {row.documentFileName}
              </a>
            ),
          },
          actionId: row.actionId,
          regionId: row.regionId,
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
      { id: 'actionDocumentUrl', name: 'Document', sortable: true, width: 300 },
      { id: 'actionId', name: 'Action ID', sortable: true },
      { id: 'regionId', name: 'Region', sortable: true },
      { id: 'state', name: 'State', sortable: true },
      { id: 'organizationId', name: 'Organization ID', sortable: true },
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
              {typeof preview.data === 'string' ? (
                <Alert type="info">{preview.data}</Alert>
              ) : (
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

type ActionDocumentsRow = {
  actionDocumentUrl: string;
  actionId: string;
  actionName: string;
  actionType: string;
  completionDate: string;
  documentFileName: string;
  documentFileTypeName: string;
  documentKey: number;
  documentName: string;
  documentType: string;
  organizationId: string;
  rankPercent: number;
  regionId: string;
  state: string;
  tmdlDate: string;
};

type PreviewModalProps<D extends QueryData> = {
  apiKey: string;
  limit: number;
  onClose: () => void;
  queryData: D;
  queryUrl: string;
};

export default PreviewModal;
