import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import FocusTrap from 'focus-trap-react';
import ReactDOM from 'react-dom';
import { ReactComponent as Close } from 'uswds/img/usa-icons/close.svg';

function useModal(isInitiallyOpen?: boolean) {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen ?? false);

  const allowToggle = useCallback((e: React.MouseEvent): boolean => {
    const clickedElement = e.target as Element;

    if (e && clickedElement) {
      // Element is inside a modal
      if (clickedElement.closest('.usa-modal')) {
        // Only allow toggle if element is a close button, don't allow opening a modal from with a modal
        return (
          clickedElement.hasAttribute('[data-close-modal]') ||
          !!clickedElement.closest('[data-close-modal]')
        );
      }
    }

    return true;
  }, []);

  const toggleModal = useCallback(
    (e?: React.MouseEvent, open?: boolean): boolean => {
      if (e && !allowToggle(e)) {
        e.stopPropagation();
        return false;
      }

      if (open === true) setIsOpen(true);
      else if (open === false) setIsOpen(false);
      else {
        setIsOpen((state) => !state);
      }

      return true;
    },
    [allowToggle],
  );

  return { isOpen, toggleModal };
}

function getScrollbarWidth() {
  // Only run in browser
  if (typeof document !== 'undefined') {
    const outer = document.createElement('div');

    outer.setAttribute(
      'style',
      'visibility: hidden; overflow: scroll; ms-overflow-style: scrollbar',
    );

    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = `${outer.offsetWidth - inner.offsetWidth}px`;
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  return '';
}

type ModalWrapperProps = {
  id: string;
  children: React.ReactNode;
  isVisible: boolean;
  forceAction: boolean;
  handleClose: () => void;
  className?: string;
};

const ModalWrapperForwardRef: React.ForwardRefRenderFunction<
  HTMLDivElement,
  ModalWrapperProps & JSX.IntrinsicElements['div']
> = (
  { id, children, isVisible, forceAction, className, handleClose, ...divProps },
  ref,
): React.ReactElement => {
  const classes = `usa-modal-wrapper ${
    isVisible ? 'is-visible' : 'is-hidden'
  } ${className}`;

  return (
    <div {...divProps} ref={ref} id={id} className={classes} role="dialog">
      <div
        data-testid="modalOverlay"
        className="usa-modal-overlay"
        onClick={forceAction ? undefined : handleClose}
        aria-controls={id}
      >
        {children}
      </div>
    </div>
  );
};

const ModalWrapper = forwardRef(ModalWrapperForwardRef);

type ModalCloseButtonProps = {
  handleClose: () => void;
};

const ModalCloseButton = ({
  handleClose,
  ...buttonProps
}: ModalCloseButtonProps &
  JSX.IntrinsicElements['button']): React.ReactElement => {
  return (
    <button
      aria-label="Close this window"
      {...buttonProps}
      className="usa-button usa-modal__close"
      onClick={handleClose}
      data-close-modal
      type="button"
    >
      <Close
        aria-hidden="true"
        className="usa-icon"
        focusable="false"
        role="img"
      />
    </button>
  );
};

type ModalWindowProps = {
  modalId: string;
  children: React.ReactNode;
  handleClose: () => void;
  className?: string;
  isLarge?: boolean;
  forceAction?: boolean;
};

const ModalWindowForwardRef: React.ForwardRefRenderFunction<
  HTMLDivElement,
  ModalWindowProps & JSX.IntrinsicElements['div']
> = (
  {
    modalId,
    className,
    children,
    handleClose,
    isLarge = false,
    forceAction = false,
    ...divProps
  },
  ref,
): React.ReactElement => {
  const classes = `usa-modal ${isLarge && 'usa-modal--lg'} ${className}`;

  return (
    <div
      {...divProps}
      data-testid="modalWindow"
      className={classes}
      ref={ref}
      data-force-action={forceAction}
    >
      <div className="usa-modal__content">
        <div className="usa-modal__main">{children}</div>
        {!forceAction && (
          <ModalCloseButton aria-controls={modalId} handleClose={handleClose} />
        )}
      </div>
    </div>
  );
};

const ModalWindow = forwardRef(ModalWindowForwardRef);

type ModalComponentProps = {
  id: string;
  children: React.ReactNode;
  className?: string;
  isLarge?: boolean;
  forceAction?: boolean;
  modalRoot?: string;
  onClose?: () => void;
  renderToPortal?: boolean;
  isInitiallyOpen?: boolean;
};

type ModalProps = ModalComponentProps & JSX.IntrinsicElements['div'];

export type ModalRef = {
  modalId: string;
  modalIsOpen: boolean;
  toggleModal: (event?: React.MouseEvent, open?: boolean) => boolean;
};

// Modals are rendered into the document body default. If an element exists with the id
// `modal-root`, that element will be used as the parent instead.
//
// If you wish to override this behavior, `renderToPortal` to `false` and the modal
// will render in its normal location in the document. Note that this may cause the modal to
// be inaccessible due to no longer being in the document's accessibility tree.
const ModalForwardRef: React.ForwardRefRenderFunction<ModalRef, ModalProps> = (
  {
    id,
    children,
    isLarge = false,
    forceAction = false,
    modalRoot = '.usa-modal-wrapper',
    onClose,
    renderToPortal = true,
    isInitiallyOpen,
    ...divProps
  },
  ref,
): React.ReactElement => {
  const { isOpen, toggleModal } = useModal(isInitiallyOpen);
  const [mounted, setMounted] = useState(false);
  const initialPaddingRef = useRef<string>();
  const tempPaddingRef = useRef<string>();
  const modalEl = useRef<HTMLDivElement>(null);

  const modalRootSelector = modalRoot ?? '.usa-modal-wrapper';

  const NON_MODALS = `body > *:not(${modalRootSelector}):not([aria-hidden])`;
  const NON_MODALS_HIDDEN = `[data-modal-hidden]`;

  const closeModal = useCallback(
    (e?: React.MouseEvent) => {
      if (toggleModal(e, false)) onClose?.();
    },
    [onClose, toggleModal],
  );

  useImperativeHandle(
    ref,
    () => ({
      modalId: id,
      modalIsOpen: isOpen,
      toggleModal,
    }),
    [id, isOpen, toggleModal],
  );

  const handleOpenEffect = useCallback(() => {
    const { body } = document;
    body.style.paddingRight = tempPaddingRef.current ?? '';
    body.classList.add('usa-js-modal--active');

    document.querySelectorAll(NON_MODALS).forEach((el) => {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-modal-hidden', '');
    });

    if (forceAction) {
      body.classList.add('usa-js-no-click');
    }
  }, [NON_MODALS, forceAction]);

  const handleCloseEffect = useCallback(() => {
    const { body } = document;
    body.style.paddingRight = initialPaddingRef.current ?? '';
    body.classList.remove('usa-js-modal--active');
    body.classList.remove('usa-js-no-click');

    document.querySelectorAll(NON_MODALS_HIDDEN).forEach((el) => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('data-modal-hidden');
    });
  }, [NON_MODALS_HIDDEN]);

  useEffect(() => {
    const SCROLLBAR_WIDTH = getScrollbarWidth();
    const INITIAL_PADDING =
      window
        .getComputedStyle(document.body)
        .getPropertyValue('padding-right') ?? '0px';

    const TEMPORARY_PADDING = `${
      parseInt(INITIAL_PADDING.replace(/px/, ''), 10) +
      parseInt(SCROLLBAR_WIDTH.replace(/px/, ''), 10)
    }px`;

    initialPaddingRef.current = INITIAL_PADDING;
    tempPaddingRef.current = TEMPORARY_PADDING;

    setMounted(true);

    return () => {
      // Reset as if the modal is being closed
      handleCloseEffect();
    };
  }, [handleCloseEffect]);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen === true) {
      handleOpenEffect();
    } else if (isOpen === false) {
      handleCloseEffect();
    }
  }, [handleCloseEffect, handleOpenEffect, isOpen, mounted]);

  const ariaLabelledBy = divProps['aria-labelledby'];
  const ariaDescribedBy = divProps['aria-describedby'];

  delete divProps['aria-labelledby'];
  delete divProps['aria-describedby'];

  const initialFocus = () => {
    const focusEl = modalEl.current?.querySelector('[data-focus]') as
      | HTMLElement
      | SVGElement;

    return focusEl ? focusEl : modalEl.current ?? false;
  };

  const focusTrapOptions = {
    initialFocus,
    escapeDeactivates: (): boolean => {
      if (forceAction) return false;

      closeModal();
      return true;
    },
  };

  const modal = (
    <FocusTrap active={isOpen} focusTrapOptions={focusTrapOptions}>
      <ModalWrapper
        role="dialog"
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        data-force-action={forceAction}
        isVisible={isOpen}
        handleClose={closeModal}
        forceAction={forceAction}
      >
        <ModalWindow
          modalId={id}
          {...divProps}
          ref={modalEl}
          isLarge={isLarge}
          forceAction={forceAction}
          tabIndex={-1}
          handleClose={closeModal}
        >
          {children}
        </ModalWindow>
      </ModalWrapper>
    </FocusTrap>
  );

  if (renderToPortal) {
    const modalRoot = document.getElementById('modal-root');
    const target = modalRoot ?? document.body;
    return ReactDOM.createPortal(modal, target);
  } else {
    return modal;
  }
};

export const Modal = forwardRef(ModalForwardRef);

export default Modal;
