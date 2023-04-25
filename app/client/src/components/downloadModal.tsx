import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useCallback, useEffect, useState } from 'react';
import { ReactComponent as Close } from '@uswds/uswds/img/usa-icons/close.svg';
// components
import { Alert } from 'components/alert';
// utils
import { postData } from 'config';
// styles
import '@reach/dialog/styles.css';
// types
import type { FetchState, Primitive, Status } from 'types';

/*
## Components
*/

export function DownloadModal<D extends PostData>({
  dataId,
  downloadStatus,
  filename,
  onClose,
  queryData,
  queryUrl,
  setDownloadStatus,
}: DownloadModalProps<D>) {
  const [count, setCount] = useState<FetchState<number | null>>({
    status: 'idle',
    data: null,
  });

  // Get the row count for the current query
  useEffect(() => {
    if (!queryUrl) return;

    const countUrl = `${queryUrl}/count`;
    setCount({ status: 'pending', data: null });
    postData(countUrl, queryData)
      .then((res) => {
        setCount({
          status: 'success',
          data: 'count' in res ? res.count : null,
        });
      })
      .catch((err) => {
        console.error(err);
        setCount({ status: 'failure', data: null });
      });
  }, [queryData, queryUrl]);

  // Retrieve the requested data in the specified format
  const executeQuery = useCallback(() => {
    if (!queryUrl) return;
    if (!filename) return;

    setDownloadStatus('pending');
    postData(queryUrl, queryData, 'blob')
      .then((res) => {
        const fileUrl = window.URL.createObjectURL(res);
        const trigger = document.createElement('a');
        trigger.style.display = 'none';
        trigger.href = fileUrl;
        trigger.download = filename;
        trigger.click();
        window.URL.revokeObjectURL(fileUrl);
        setDownloadStatus('success');
      })
      .catch((err) => {
        console.error(err);
        setDownloadStatus('failure');
      })
      .finally(() => onClose());
  }, [queryUrl, filename, setDownloadStatus, queryData, onClose]);

  const [id] = useState(uniqueId('modal-'));

  return (
    <Dialog
      isOpen
      onDismiss={onClose}
      className="usa-modal"
      aria-labelledby={`${id}-heading`}
      aria-describedby={`${id}-description`}
    >
      <div className="usa-modal__content">
        <div className="usa-modal__main">
          <h2 className="usa-modal__heading">Download Status</h2>
          {count.status === 'pending' && (
            <div className="usa-prose">
              <p>Validating query, please wait...</p>
            </div>
          )}
          {count.status === 'failure' && (
            <Alert type="error">
              The specified query could not be executed at this time.
            </Alert>
          )}
          {count.status === 'success' && (
            <>
              {count.data === null ? (
                <Alert type="warning">
                  <p>The current query exceeds the maximum query size.</p>{' '}
                  <p>
                    Please refine the search, or visit the{' '}
                    <a
                      href={`/national-downloads${dataId ? '#' + dataId : ''}`}
                    >
                      National Downloads
                    </a>{' '}
                    page to download a compressed dataset.
                  </p>
                </Alert>
              ) : (
                <>
                  <div className="usa-prose">
                    <p>
                      Your query will return{' '}
                      <strong data-testid="downloadfile-length">
                        {count.data.toLocaleString()}
                      </strong>{' '}
                      rows.
                    </p>
                    <p>Click continue to download the data.</p>
                  </div>
                  <div className="usa-modal__footer">
                    <ul className="flex-justify-center usa-button-group">
                      <li className="usa-button-group__item">
                        <button
                          type="button"
                          className="usa-button"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </li>
                      <li className="usa-button-group__item">
                        <button
                          className="usa-button"
                          disabled={count.data === 0}
                          onClick={executeQuery}
                          type="button"
                        >
                          {downloadStatus === 'pending'
                            ? 'Working...'
                            : 'Continue'}
                        </button>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <button
          aria-label="Close this window"
          className="usa-button usa-modal__close"
          onClick={onClose}
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

type DownloadModalProps<D extends PostData> = {
  dataId?: string;
  downloadStatus: Status;
  filename: string | null;
  onClose: () => void;
  queryData: D;
  queryUrl: string | null;
  setDownloadStatus: (status: Status) => void;
};

type PostData = {
  columns: string[];
  filters: {
    [field: string]: Primitive | Primitive[];
  };
  options: {
    [field: string]: string;
  };
};
