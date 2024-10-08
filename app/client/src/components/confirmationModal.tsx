import { uniqueId } from 'lodash';
import { Dialog } from '@reach/dialog';
import { useState } from 'react';
import Close from 'images/close.svg?react';
// styles
import '@reach/dialog/styles.css';
// types
import type { ReactNode } from 'react';
// components
import { Button } from 'components/button';

/*
## Components
*/

export function ConfirmationModal({
  children,
  heading,
  onClose,
}: Readonly<ConfirmationModalProps>) {
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
          {children}
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

export function ConfirmationModalFooter({
  continueDisabled = false,
  continueText = 'Continue',
  onClose,
  onContinue,
}: Readonly<ConfirmationModalFooterProps>) {
  return (
    <div className="usa-modal__footer">
      <ul className="flex-justify-center usa-button-group">
        <li className="usa-button-group__item mobile-lg:margin-right-5 mobile-lg:margin-y-auto">
          <Button children="Cancel" onClick={onClose} />
        </li>
        <li className="usa-button-group__item mobile-lg:margin-y-auto">
          <Button
            children={continueText}
            onClick={onContinue}
            disabled={continueDisabled}
          />
        </li>
      </ul>
    </div>
  );
}

/*
## Types
*/

export type ConfirmationModalProps = {
  children: ReactNode;
  heading: string;
  onClose: () => void;
};

export type ConfirmationModalFooterProps = {
  continueDisabled?: boolean;
  continueText?: string;
  onClose: () => void;
  onContinue: () => void;
};
