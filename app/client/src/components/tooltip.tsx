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

export function Tooltip({
  children,
  className,
  text,
  position = 'top',
}: TooltipProps) {
  const triggerElementRef = useRef<HTMLElement & HTMLButtonElement>(null);
  const tooltipBodyRef = useRef<HTMLElement>(null);
  const tooltipId = useRef(uniqueId('tooltip-'));

  const [isVisible, setVisible] = useState(false);
  const [isShown, setIsShown] = useState(false);
  const [effectivePosition, setEffectivePosition] = useState<
    'top' | 'bottom' | 'left' | 'right' | undefined
  >(undefined);
  const [positioningAttempts, setPositionAttempts] = useState(0);
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
    if (isVisible && triggerElementRef.current && tooltipBodyRef.current) {
      const tooltipTrigger = triggerElementRef.current;
      const tooltipBody = tooltipBodyRef.current;

      const isInViewport = isElementInViewport(tooltipBody);

      if (isInViewport) {
        // We're good, show the tooltip
        setIsShown(true);
      } else {
        // Try the next position
        const maxAttempts = positions.length;
        const attempt = positioningAttempts;
        if (attempt < maxAttempts || wrapTooltip === false) {
          setPositionAttempts((a) => a + 1);

          if (attempt < maxAttempts) {
            const pos = positions[parseInt(`${attempt}`)];
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
  }, [
    effectivePosition,
    isVisible,
    positioningAttempts,
    positions,
    wrapTooltip,
  ]);

  useEffect(() => {
    if (!isVisible) {
      // Hide tooltip
      setIsShown(false);
      setWrapTooltip(false);
      setPositionAttempts(0);
    } else {
      // Show tooltip
      if (triggerElementRef.current && tooltipBodyRef.current) {
        const tooltipTrigger = triggerElementRef.current;
        const tooltipBody = tooltipBodyRef.current;

        switch (position) {
          case 'top':
            positionTop(tooltipBody, tooltipTrigger);
            break;
          case 'bottom':
            positionBottom(tooltipBody, tooltipTrigger);
            break;
          case 'right':
            positionRight(tooltipBody, tooltipTrigger);
            break;
          case 'left':
            positionLeft(tooltipBody, tooltipTrigger);
            break;

          default:
            // skip default case
            break;
        }
      }
    }
  }, [isVisible, position]);

  const showTooltip = () => {
    setVisible(true);
  };
  const hideTooltip = () => {
    setVisible(false);
  };

  const tooltipBodyClasses = classNames(
    'line-height-sans-3',
    'font-sans-2xs',
    'usa-tooltip__body',
    {
      'is-set': isVisible,
      'usa-tooltip__body--top': effectivePosition === 'top',
      'usa-tooltip__body--bottom': effectivePosition === 'bottom',
      'usa-tooltip__body--right': effectivePosition === 'right',
      'usa-tooltip__body--left': effectivePosition === 'left',
      'opacity-0': !isShown,
      'usa-tooltip__body--wrap': isVisible && wrapTooltip,
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
        aria-hidden={!isVisible}
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

function isElementInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const win = window;
  const docEl = document.documentElement;

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (win.innerHeight || docEl.clientHeight) &&
    rect.right <= (win.innerWidth || docEl.clientWidth)
  );
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
  position?: 'top' | 'bottom' | 'left' | 'right' | undefined;
  className?: string;
  children: ReactNode;
};
