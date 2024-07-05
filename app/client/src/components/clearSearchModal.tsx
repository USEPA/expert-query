import { useCallback } from 'react';
// components
import {
  ConfirmationModal,
  ConfirmationModalFooter,
} from 'components/confirmationModal';
// styles
import '@reach/dialog/styles.css';

/*
## Components
*/

export function ClearSearchModal({
  continueDisabled,
  continueText,
  onClose,
  onContinue,
}: Readonly<ClearSearchModalProps>) {
  const confirm = useCallback(() => {
    onContinue();
    onClose();
  }, [onContinue, onClose]);

  return (
    <ConfirmationModal heading="Are you sure?" onClose={onClose}>
      <div className="usa-prose">
        <p className="text-center">
          Clearing the search will also clear out any filters you have selected
          for other profiles.
        </p>
      </div>
      <ConfirmationModalFooter
        continueDisabled={continueDisabled}
        continueText={continueText}
        onClose={onClose}
        onContinue={confirm}
      />
    </ConfirmationModal>
  );
}

/*
## Types
*/

type ClearSearchModalProps = {
  continueDisabled?: boolean;
  continueText?: string;
  onClose: () => void;
  onContinue: () => void;
};