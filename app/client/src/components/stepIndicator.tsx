import type { ReactNode } from 'react';

export function StepIndicator({
  children,
  currentStep,
  totalSteps,
}: StepIndicatorProps) {
  return (
    <div className="usa-step-indicator__header margin-bottom-1">
      <h4 className="usa-step-indicator__heading">
        <span className="usa-step-indicator__heading-counter">
          <span className="usa-sr-only">Step</span>
          <span className="usa-step-indicator__current-step margin-right-05">
            {currentStep}
          </span>
          <span className="usa-step-indicator__total-steps">
            of {totalSteps}
          </span>{' '}
        </span>
        <span className="usa-step-indicator__heading-text">{children}</span>
      </h4>
    </div>
  );
}

type StepIndicatorProps = {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
};
