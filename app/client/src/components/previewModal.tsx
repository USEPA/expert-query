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
import type { ColumnConfig, FetchState, QueryData, Value } from 'types';

const RANK_KEY = 'rankPercent';

export function PreviewModal<D extends QueryData>({
  apiKey,
  columns,
  limit,
  onClose,
  ranked = true,
  queryData,
  queryUrl,
}: Readonly<PreviewModalProps<D>>) {
  const { abort, getSignal } = useAbort();

  const tableColumns = useMemo(() => {
    const columnsToShow = columns.filter((column) =>
      column.hasOwnProperty('preview'),
    ) as Array<Required<ColumnConfig>>;
    const columnsOrdered = columnsToShow.toSorted(
      (a, b) => (a.preview.order ?? Infinity) - (b.preview.order ?? Infinity),
    );
    const columnDefs = columnsOrdered.map((column) => ({
      id: column.key,
      name: column.preview.label || column.key,
      sortable: column.preview.sortable ?? false,
      width: column.preview.width ?? 100,
    }));
    if (ranked) {
      return [
        {
          id: RANK_KEY,
          name: 'Rank (%)',
          sortable: true,
          width: 100,
        },
        ...columnDefs,
      ];
    }

    return columnDefs;
  }, [columns]);

  const closeModal = () => {
    abort();
    onClose();
  };

  const [id] = useState(uniqueId('modal-'));

  // Data to be displayed in the preview table.
  const [preview, setPreview] = useState<FetchState<Array<DataRow> | string>>({
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

        const columnMap = columns.reduce<Record<string, ColumnConfig>>(
          (acc, column) => {
            acc[column.key] = column;
            return acc;
          },
          {},
        );
        const data = res.data.map((row: DataRow) =>
          Object.entries(row)
            .filter(
              ([key, _value]) =>
                key === RANK_KEY || columnMap[key].hasOwnProperty('preview'),
            )
            .toSorted(([a], [b]) => {
              if (ranked) {
                if (a === RANK_KEY) return -1;
                if (b === RANK_KEY) return 1;
              }
              return (
                (columnMap[a].preview?.order ?? Infinity) -
                (columnMap[b].preview?.order ?? Infinity)
              );
            })
            .map(([key, value]) => {
              const column = columnMap[key];
              if (column?.preview?.transform?.type === 'link') {
                const textColumn = column.preview.transform.args[0];
                return {
                  sortValue: row[textColumn],
                  value: (
                    <a
                      href={value.toString()}
                      target="_blank"
                      rel="noopener,noreferrer"
                    >
                      {row[textColumn]}
                    </a>
                  ),
                };
              } else {
                return value;
              }
            }),
        );
        setPreview({ data, status: 'success' });
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
      className="usa-modal maxh-90vh maxw-desktop-lg"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
    >
      <div className="usa-modal__content">
        <div className="usa-modal__main width-full">
          <h2 className="usa-modal__heading margin-bottom-05">
            Results Preview{' '}
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
              {typeof preview.data === 'string' ? (
                <Alert type="info">{preview.data}</Alert>
              ) : (
                <>
                  {preview.data.length === 0 ? (
                    <Alert type="info">No results found</Alert>
                  ) : (
                    <>
                      {preview.data.length >= limit && (
                        <small className="text-italic">
                          Limited to {limit} rows
                        </small>
                      )}
                      <Table
                        className="margin-top-2"
                        columns={tableColumns}
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

type DataRow = Record<string, Value>;

type PreviewModalProps<D extends QueryData> = {
  apiKey: string;
  columns: ColumnConfig[];
  limit: number;
  onClose: () => void;
  ranked?: boolean;
  queryData: D;
  queryUrl: string;
};

export default PreviewModal;
