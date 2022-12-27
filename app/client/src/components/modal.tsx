import { Dialog } from '@reach/dialog';
import { uniqueId } from 'lodash';
import { useState } from 'react';
import { ReactComponent as Close } from 'uswds/img/usa-icons/close.svg';
import '@reach/dialog/styles.css';

type Props = {
  children: React.ReactNode;
  onClose?: () => void;
};

export default function Modal({ children, onClose }: Props) {
  const [id] = useState(uniqueId('modal-'));

  return (
    <div className="margin-top-2">
      <Dialog
        isOpen
        onDismiss={onClose}
        className="usa-modal"
        aria-labelledby={`${id}-heading`}
        aria-describedby={`${id}-description`}
      >
        <div className="usa-modal__content">
          <div className="usa-modal__main">{children}</div>
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
    </div>
  );
}
