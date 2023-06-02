import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ReactComponent as Close } from 'images/close.svg';
// components
import { Alert } from 'components/alert';
import { Loading, LoadingButtonIcon } from 'components/loading';
// utils
import { isAbort, postData, useAbort } from 'utils';
// config
import { serverUrl } from 'config';
// styles
import '@reach/dialog/styles.css';
// types
import type { FetchState, Status, Value } from 'types';

/*
## Components
*/

export function DownloadModal<D extends PostData>({
  apiKey,
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

  const [count, setCount] = useState<FetchState<number>>({
    status: 'pending',
    data: null,
  });
  const [maxCount, setMaxCount] = useState(0);

  // Get the row count for the current query
  useEffect(() => {
    if (!queryUrl) return;

    const countUrl = `${queryUrl}/count`;
    setCount({ status: 'pending', data: null });
    postData({ url: countUrl, apiKey, data: queryData, signal: getSignal() })
      .then((res) => {
        console.log(res);
        setCount({
          status: 'success',
          data: res.count,
        });
        setMaxCount(res.maxCount);
      })
      .catch((err) => {
        if (isAbort(err)) return;
        console.error(err);
        setCount({ status: 'failure', data: null });
      });
  }, [apiKey, getSignal, queryData, queryUrl]);

  useEffect(() => {
    if (count.status !== 'success') return;

    focusRef.current?.focus();
  }, [count]);

  // Retrieve the requested data in the specified format
  const executeQuery = useCallback(() => {
    if (!queryUrl) return;
    if (!filename) return;

    setDownloadStatus('pending');
    postData({
      url: queryUrl,
      apiKey,
      data: queryData,
      responseType: 'blob',
      signal: getSignal(),
    })
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
  }, [
    apiKey,
    closeModal,
    getSignal,
    queryUrl,
    filename,
    setDownloadStatus,
    queryData,
  ]);

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
              <Loading />
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
              <div className="usa-prose">
                <p>
                  Your query will return{' '}
                  <strong data-testid="downloadfile-length">
                    {count.data.toLocaleString()}
                  </strong>{' '}
                  rows.
                </p>
                {count.data > 0 && count.data <= maxCount && (
                  <p>Click continue to download the data.</p>
                )}
              </div>
              <div className="usa-modal__footer">
                {count.data > maxCount ? (
                  <Alert type="warning">
                    <p>
                      The current query exceeds the maximum query size of{' '}
                      <b>{maxCount.toLocaleString()}</b> rows.
                    </p>{' '}
                    <p>
                      Please refine the search, or visit the{' '}
                      <a
                        href={`${serverUrl}/national-downloads${
                          dataId ? '#' + dataId : ''
                        }`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        National Downloads
                      </a>{' '}
                      page to download a compressed dataset.
                    </p>
                  </Alert>
                ) : (
                  <ul className="flex-justify-center usa-button-group">
                    <li className="usa-button-group__item mobile-lg:margin-right-5 mobile-lg:margin-y-auto">
                      <button
                        type="button"
                        className="height-5 usa-button"
                        onClick={closeModal}
                        ref={focusRef}
                      >
                        Cancel
                      </button>
                    </li>
                    <li className="usa-button-group__item mobile-lg:margin-y-auto">
                      {downloadStatus === 'pending' ? (
                        <button
                          className="cursor-default display-flex flex-justify-center height-5 usa-button hover:bg-primary mobile-lg:width-15"
                          onClick={undefined}
                          type="button"
                        >
                          Working <LoadingButtonIcon />
                        </button>
                      ) : (
                        <button
                          className="height-5 usa-button mobile-lg:width-15"
                          disabled={count.data === 0}
                          onClick={executeQuery}
                          type="button"
                        >
                          Continue
                        </button>
                      )}
                    </li>
                  </ul>
                )}
              </div>
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
  apiKey: string;
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
    [field: string]: Value | Value[];
  };
  options: {
    [field: string]: Value;
  };
};
