import { useCallback, useEffect, useState } from 'react';
import { ReactComponent as Copy } from 'uswds/img/usa-icons/content_copy.svg';

type Props = {
  text: string;
};

const failureMessage = 'Could not access clipboard.';

const successMessage = 'Copied to clipboard!';

export default function CopyBox({ text }: Props) {
  const [status, setStatus] = useState<'success' | 'failure' | 'idle'>('idle');
  const [statusVisible, setStatusVisible] = useState(false);

  useEffect(() => {
    if (!statusVisible) return;
    const timeout = setTimeout(() => setStatusVisible(false), 3 * 1000);

    return function cleanup() {
      clearTimeout(timeout);
    };
  }, [statusVisible]);

  const copyToClipboard = useCallback(() => {
    if (!navigator.clipboard) {
      setStatus('failure');
      setStatusVisible(true);
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setStatus('success');
      })
      .catch((_err) => {
        setStatus('failure');
      })
      .finally(() => {
        setStatusVisible(true);
      });
  }, [text]);

  return (
    <div className="bg-base-lightest radius-md">
      <p className="display-flex flex-justify margin-bottom-0 padding-2">
        <span
          className="font-mono-sm margin-right-1"
          style={{ wordBreak: 'break-word' }}
        >
          {text}
        </span>
        <span className="display-flex">
          <span
            className={`margin-right-1 flex-align-center font-sans-2xs ${
              statusVisible ? 'display-inline' : 'display-none'
            } ${status === 'failure' && 'text-secondary'}`}
          >
            {status === 'success' ? successMessage : failureMessage}
          </span>
          <button
            type="button"
            className={[
              'usa-button',
              'bg-base-lightest',
              'border-0',
              'margin-0',
              'padding-0',
              'width-auto',
              'hover:bg-base-lightest',
            ].join(' ')}
            onClick={(_ev) => copyToClipboard()}
            title="Copy content"
          >
            <Copy
              aria-hidden="true"
              className={[
                'usa-icon',
                'text-primary',
                'focus:text-primary-dark',
                'hover:text-primary-dark',
              ].join(' ')}
              focusable="false"
              role="img"
            />
            <span className="sr-only">Copy content</span>
          </button>
        </span>
      </p>
    </div>
  );
}
