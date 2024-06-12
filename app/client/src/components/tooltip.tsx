import classNames from 'classnames';
import { uniqueId } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
// components
import { ReactComponent as Info } from 'images/info.svg';
// types
import type { ReactNode } from 'react';

const TRIANGLE_SIZE = 5;

/*
## Components
*/

export function Tooltip({ children, className, text }: Readonly<TooltipProps>) {
  const triggerElementRef = useRef<HTMLElement & HTMLButtonElement>(null);
  const tooltipBodyRef = useRef<HTMLElement>(null);
  const tooltipId = useRef(uniqueId('tooltip-'));

  const [visible, setVisible] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const [effectivePosition, setEffectivePosition] = useState<
    'top' | 'bottom' | 'left' | 'right' | undefined
  >(undefined);
  const [positionAttempts, setPositionAttempts] = useState(0);
  const [wrapTooltip, setWrapTooltip] = useState(false);
  const [positionStyles, setPositionStyles] = useState({});

  const positionTop = (e: HTMLElement, triggerEl: HTMLElement): void => {
    const topMargin = calculateMarginOffset('top', e.offsetHeight, triggerEl);
    const leftMargin = calculateMarginOffset('left', e.offsetWidth, triggerEl);

    setEffectivePosition('top');
    setPositionStyles({
      left: `50%`,
      top: `-${TRIANGLE_SIZE}px`,
      margin: `-${topMargin}px 0 0 -${leftMargin / 2}px`,
    });
  };

  const positionBottom = (e: HTMLElement, triggerEl: HTMLElement): void => {
    const leftMargin = calculateMarginOffset('left', e.offsetWidth, triggerEl);

    setEffectivePosition('bottom');
    setPositionStyles({
      left: `50%`,
      margin: `${TRIANGLE_SIZE}px 0 0 -${leftMargin / 2}px`,
    });
  };

  const positionRight = (e: HTMLElement, triggerEl: HTMLElement): void => {
    const topMargin = calculateMarginOffset('top', e.offsetHeight, triggerEl);

    setEffectivePosition('right');
    setPositionStyles({
      top: `50%`,
      left: `${triggerEl.offsetLeft + triggerEl.offsetWidth + TRIANGLE_SIZE}px`,
      margin: `-${topMargin / 2}px 0 0 0`,
    });
  };

  const positionLeft = (e: HTMLElement, triggerEl: HTMLElement): void => {
    const topMargin = calculateMarginOffset('top', e.offsetHeight, triggerEl);
    const leftMargin = calculateMarginOffset(
      'left',
      triggerEl.offsetLeft > e.offsetWidth
        ? triggerEl.offsetLeft - e.offsetWidth
        : e.offsetWidth,
      triggerEl,
    );

    setEffectivePosition('left');
    setPositionStyles({
      top: `50%`,
      left: `-${TRIANGLE_SIZE}px`,
      margin: `-${topMargin / 2}px 0 0 ${
        triggerEl.offsetLeft > e.offsetWidth ? leftMargin : -leftMargin
      }px`,
    });
  };

  const positions = useMemo(
    () => [positionTop, positionBottom, positionRight, positionLeft],
    [],
  );

  useEffect(() => {
    // When position/styles change, check if in viewport
    if (visible && triggerElementRef.current && tooltipBodyRef.current) {
      const tooltipTrigger = triggerElementRef.current;
      const tooltipBody = tooltipBodyRef.current;

      const isInViewport = isElementInViewport(tooltipBody, effectivePosition);

      if (isInViewport) {
        // We're good, show the tooltip
        setIsShown(true);
      } else {
        // Try the next position
        const maxAttempts = positions.length;
        const attempt = positionAttempts;
        if (attempt < maxAttempts || wrapTooltip === false) {
          setPositionAttempts((a) => a + 1);

          if (attempt < maxAttempts) {
            const pos = positions[attempt];
            pos(tooltipBody, tooltipTrigger);
          } else {
            // Try wrapping
            setWrapTooltip(true);
            setPositionAttempts(0);
          }
        } else {
          console.warn('Tooltip content does not fit on the current screen.');
        }
      }
    }
  }, [effectivePosition, positionAttempts, positions, visible, wrapTooltip]);

  useEffect(() => {
    if (!visible) {
      // Hide tooltip
      setIsShown(false);
      setWrapTooltip(false);
      setPositionAttempts(0);
    } else if (triggerElementRef.current && tooltipBodyRef.current) {
      // Show tooltip
      const tooltipTrigger = triggerElementRef.current;
      const tooltipBody = tooltipBodyRef.current;

      positionTop(tooltipBody, tooltipTrigger);
    }
  }, [visible]);

  const showTooltip = () => {
    setVisible(true);
  };
  const hideTooltip = () => {
    setVisible(false);
  };

  const tooltipBodyClasses = classNames(
    'line-height-sans-3',
    'font-sans-2xs',
    'text-semibold',
    'usa-tooltip__body',
    {
      'is-set': visible,
      'is-visible': isShown,
      'usa-tooltip__body--top': effectivePosition === 'top',
      'usa-tooltip__body--bottom': effectivePosition === 'bottom',
      'usa-tooltip__body--right': effectivePosition === 'right',
      'usa-tooltip__body--left': effectivePosition === 'left',
      'usa-tooltip__body--wrap': visible && wrapTooltip,
    },
  );

  return (
    <span className={classNames('usa-tooltip', className)}>
      <button
        ref={triggerElementRef}
        aria-describedby={tooltipId.current}
        tabIndex={0}
        type="button"
        className={classNames(
          'border-0',
          'bg-inherit',
          'cursor-help',
          'margin-0',
          'padding-0',
          'usa-button',
          'usa-tooltip__trigger',
          'width-auto',
        )}
        onMouseEnter={showTooltip}
        onMouseOver={showTooltip}
        onFocus={showTooltip}
        onMouseLeave={hideTooltip}
        onBlur={hideTooltip}
        onKeyDown={hideTooltip}
      >
        {children}
      </button>
      <span
        id={tooltipId.current}
        ref={tooltipBodyRef}
        className={tooltipBodyClasses}
        role="tooltip"
        aria-hidden={!visible}
        style={positionStyles}
      >
        {text}
      </span>
    </span>
  );
}

export function InfoTooltip({
  description,
  ...tooltipProps
}: InfoTooltipProps) {
  return (
    <Tooltip {...tooltipProps}>
      <Info
        aria-hidden="true"
        className="usa-icon text-primary focus:text-primary-dark hover:text-primary-dark"
        focusable="false"
        role="img"
      />
      {/* Accessibility tools will report contrast errors if dark text color isn't used here */}
      <span className="sr-only text-ink">
        {description ?? 'Information Tooltip'}
      </span>
    </Tooltip>
  );
}

/*
## Utils
*/

function getViewportHeight() {
  return window.innerHeight && document.documentElement.clientHeight
    ? Math.min(window.innerHeight, document.documentElement.clientHeight)
    : window.innerHeight || document.documentElement.clientHeight;
}

function getViewportWidth() {
  return window.innerWidth && document.documentElement.clientWidth
    ? Math.min(window.innerWidth, document.documentElement.clientWidth)
    : window.innerWidth || document.documentElement.clientWidth;
}

function isElementInViewport(
  el: HTMLElement,
  pos?: 'top' | 'bottom' | 'left' | 'right',
) {
  const rect = el.getBoundingClientRect();

  let verticalInView = true;
  if (pos === 'top') verticalInView = rect.top >= 0;
  if (pos === 'bottom') verticalInView = rect.bottom <= getViewportHeight();

  return verticalInView && rect.left >= 0 && rect.right <= getViewportWidth();
}

// Get margin offset calculations
function offsetMargin(target: HTMLElement, propertyValue: string) {
  return parseInt(
    window.getComputedStyle(target).getPropertyValue(propertyValue),
    10,
  );
}

// Calculate offset as tooltip trigger margin(position) offset + tooltipBody offsetWidth
const calculateMarginOffset = (
  marginPosition: string,
  tooltipBodyOffset: number,
  trigger: HTMLElement,
): number => {
  const offset =
    offsetMargin(trigger, `margin-${marginPosition}`) > 0
      ? tooltipBodyOffset - offsetMargin(trigger, `margin-${marginPosition}`)
      : tooltipBodyOffset;

  return offset;
};

/*
## Types
*/

type InfoTooltipProps = Omit<TooltipProps, 'children'> & {
  description?: string;
};

type TooltipProps = {
  text: string;
  className?: string;
  children: ReactNode;
};
