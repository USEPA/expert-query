import { ReactComponent as Info } from 'uswds/img/usa-icons/info.svg';
import { Portal } from '@reach/portal';
import { TooltipPopup, useTooltip } from '@reach/tooltip';
import { cloneElement, useRef } from 'react';
// types
import type { Position } from '@reach/tooltip';
import type { ReactElement, Ref } from 'react';
// styles
import '@reach/tooltip/styles.css';

/*
## Components
*/

export default function InfoTooltip({
  description,
  styles = [],
  text,
}: InfoTooltipProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <Tooltip label={text} triggerRef={triggerRef}>
      <button
        onClick={(_ev) => triggerRef.current?.focus()}
        className={[
          ...styles,
          'usa-button',
          'border-0',
          'margin-0',
          'padding-0',
          'width-auto',
          'hover:bg-white',
        ].join(' ')}
        ref={triggerRef}
        style={{ background: 'inherit' }}
        type="button"
      >
        <Info
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
        <span className="sr-only">{description ?? 'Information Tooltip'}</span>
      </button>
    </Tooltip>
  );
}

function Tooltip({ children, label, triggerRef }: TooltipProps) {
  const [trigger, tooltip] = useTooltip({
    ref: triggerRef,
  });
  const { isVisible, triggerRect } = tooltip;

  return (
    <>
      {cloneElement(children, trigger)}

      {isVisible && (
        <Portal>
          <div
            style={{
              position: 'absolute',
              left:
                (triggerRect &&
                  triggerRect.left - 10 + triggerRect.width / 2) ??
                undefined,
              top:
                (triggerRect && triggerRect.bottom + window.scrollY) ??
                undefined,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderBottom: '10px solid black',
            }}
          />
        </Portal>
      )}

      <TooltipPopup
        {...tooltip}
        style={{
          backgroundColor: '#1b1b1b',
          border: 'none',
          borderRadius: '.25rem',
          color: 'white',
          fontSize: '1rem',
          maxWidth: '320px',
          padding: '0.5rem',
          textAlign: 'center',
          transition: 'opacity .08s ease-in-out',
          whiteSpace: 'normal',
        }}
        label={label}
        position={centered}
      />
    </>
  );
}

/*
## Utils
*/

const centered: Position = (triggerRect, tooltipRect) => {
  if (!triggerRect || !tooltipRect) return {};
  const triggerCenter = triggerRect.left + triggerRect.width / 2;
  const left = triggerCenter - tooltipRect.width / 2;
  const maxLeft = document.body.clientWidth - tooltipRect.width;
  return {
    left: Math.min(Math.max(2, left), maxLeft) + window.scrollX,
    top: triggerRect.bottom + 8 + window.scrollY,
  };
};

/*
## Types
*/

type InfoTooltipProps = {
  description?: string;
  styles?: string[];
  text: string;
};

type TooltipProps = {
  children: ReactElement;
  label: string;
  triggerRef: Ref<HTMLElement>;
};
