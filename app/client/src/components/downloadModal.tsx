import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactComponent as Close } from '@uswds/uswds/img/usa-icons/close.svg';
// components
import { Alert } from 'components/alert';
import { LoadingButtonIcon } from 'components/loading';
// utils
import { postData } from 'config';
import { isAbort, useAbort } from 'utils';
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
  const { abort, getSignal } = useAbort();

  const closeModal = useCallback(() => {
    abort();
    onClose();
  }, [abort, onClose]);

  const focusRef = useRef<HTMLButtonElement>(null);

  const [count, setCount] = useState<FetchState<number | null>>({
    status: 'pending',
    data: null,
  });

  // Get the row count for the current query
  useEffect(() => {
    if (!queryUrl) return;

    const countUrl = `${queryUrl}/count`;
    setCount({ status: 'pending', data: null });
    postData(countUrl, queryData, 'json', getSignal())
      .then((res) => {
        setCount({
          status: 'success',
          data: 'count' in res ? res.count : null,
        });
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setCount({ status: 'failure', data: null });
      });
  }, [getSignal, queryData, queryUrl]);

  useEffect(() => {
    if (count.status !== 'success') return;

    focusRef.current?.focus();
  }, [count]);

  // Retrieve the requested data in the specified format
  const executeQuery = useCallback(() => {
    if (!queryUrl) return;
    if (!filename) return;

    setDownloadStatus('pending');
    postData(queryUrl, queryData, 'blob', getSignal())
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
        if (isAbort(err)) {
          setDownloadStatus('idle');
          return;
        }
        console.error(err);
        setDownloadStatus('failure');
      })
      .finally(() => closeModal());
  }, [closeModal, getSignal, queryUrl, filename, setDownloadStatus, queryData]);

  const [id] = useState(uniqueId('modal-'));

  return (
    <Dialog
      isOpen
      onDismiss={closeModal}
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
                      <li className="margin-right-4 margin-y-auto usa-button-group__item">
                        <button
                          type="button"
                          className="height-5 usa-button"
                          onClick={closeModal}
                          ref={focusRef}
                        >
                          Cancel
                        </button>
                      </li>
                      <li className="margin-y-auto usa-button-group__item">
                        {downloadStatus === 'pending' ? (
                          <button
                            className="height-5 usa-button hover:bg-primary"
                            disabled={count.data === 0}
                            onClick={undefined}
                            style={{ cursor: 'initial' }}
                            type="button"
                          >
                            <span className="display-flex">
                              Working <LoadingButtonIcon />
                            </span>
                          </button>
                        ) : (
                          <button
                            className="height-5 usa-button"
                            disabled={count.data === 0}
                            onClick={executeQuery}
                            type="button"
                          >
                            Continue
                          </button>
                        )}
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
