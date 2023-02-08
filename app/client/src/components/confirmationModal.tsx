import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useState } from 'react';
import { ReactComponent as Close } from 'uswds/img/usa-icons/close.svg';
// styles
import '@reach/dialog/styles.css';

/*
## Components
*/

export function ConfirmationModal({
  continueHandler,
  description,
  heading,
  onClose,
}: ConfirmationModalProps) {
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
          <h2 className="usa-modal__heading d-flex justify-content-center">
            {heading}
          </h2>
          <>
            <div className="usa-prose">
              <p className="text-center">
                {description}
              </p>
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
                    onClick={continueHandler}
                    type="button"
                  >
                    Continue
                  </button>
                </li>
              </ul>
            </div>
          </>
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

type ConfirmationModalProps = {
  continueHandler: () => void;
  description: string;
  heading: string;
  onClose: () => void;
};
