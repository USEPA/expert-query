import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from 'react';
// types
import type { ReactNode } from 'react';

/*
## Utils
*/

function getHeadingId(heading: HTMLHeadingElement) {
  const baseId = heading.textContent
    ?.toLowerCase()
    // Replace non-alphanumeric characters with dashes
    .replace(/[^a-z\d]/g, '-')
    // Replace a sequence of two or more dashes with a single dash
    .replace(/-{2,}/g, '-')
    // Trim leading or trailing dash (there should only ever be one)
    .replace(/^-|-$/g, '');

  let id;
  let suffix = 0;
  do {
    id = baseId;

    // To avoid conflicts with existing IDs on the page, loop and append an
    // incremented suffix until a unique ID is found.
    suffix += 1;
    if (suffix > 1) {
      id += `-${suffix}`;
    }
  } while (document.getElementById(id ?? ''));

  return id;
}

/*
## Contexts
*/

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<ObserverDispatch | undefined>(undefined);

function InPageNavProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState('');
  const [navItems, setNavItems] = useState<Array<InPageNavItem>>([]);

  const state: State = useMemo(() => {
    return {
      active,
      navItems,
    };
  }, [active, navItems]);

  const observer = useMemo(() => {
    const options = {
      rootMargin: '0% 0% 0% 0%',
      threshold: [0, 0.75, 1],
    };
    return new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (
          entry.isIntersecting &&
          options.threshold.some((t) => entry.intersectionRatio >= t)
        ) {
          setActive(entry.target.id);
          return;
        }
      }
    }, options);
  }, []);

  const observe = useCallback(
    (item: InPageNavItem) => {
      observer.observe(item.node);
      setNavItems((prev) => [...prev, item]);
    },
    [observer],
  );

  const unobserve = useCallback((itemId: string) => {
    setActive((prev) => (prev === itemId ? '' : prev));
    setNavItems((prev) => {
      return prev.reduce<Array<InPageNavItem>>((current, next) => {
        if (next.id === itemId) {
          return current;
        } else {
          return [...current, next];
        }
      }, []);
    });
  }, []);

  const dispatch: ObserverDispatch = {
    observe,
    unobserve,
  };

  useEffect(() => {
    return function cleanup() {
      observer.disconnect();
    };
  }, [observer]);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

/*
## Hooks
*/

function useInPageNavState() {
  const state = useContext(StateContext);

  if (state === undefined) {
    throw new Error('useInPageNavState must be called within an InPageNav');
  }

  return state;
}

function useInPageNavDispatch() {
  const dispatch = useContext(DispatchContext);

  if (dispatch === undefined) {
    throw new Error('useInPageNavDispatch must be called within an InPageNav');
  }

  return dispatch;
}

/*
## Components
*/

export function InPageNav({ children }: { children: ReactNode }) {
  return (
    <InPageNavProvider>
      <InPageNavInner>{children}</InPageNavInner>
    </InPageNavProvider>
  );
}

function InPageNavInner({ children }: { children: ReactNode }) {
  const { active, navItems } = useInPageNavState();

  return <div>{children}</div>;
}

function InPageNavList() {
  return <></>;
}

export function NavHeading({ children, id, label, level }: NavHeadingProps) {
  const { observe, unobserve } = useInPageNavDispatch();

  const ref = useCallback(
    (node: HTMLHeadingElement | null) => {
      if (!node) {
        unobserve(id);
      } else {
        observe({ id, label: label ?? children, node });
      }
    },
    [children, id, label, observe, unobserve],
  );

  switch (level) {
    case 2:
      return (
        <h2 id={id} ref={ref}>
          {children}
        </h2>
      );
    case 3:
      return (
        <h3 id={id} ref={ref}>
          {children}
        </h3>
      );
    case 4:
      return (
        <h4 id={id} ref={ref}>
          {children}
        </h4>
      );
    case 5:
      return (
        <h5 id={id} ref={ref}>
          {children}
        </h5>
      );
    case 6:
      return (
        <h6 id={id} ref={ref}>
          {children}
        </h6>
      );
    default:
      return (
        <h2 id={id} ref={ref}>
          {children}
        </h2>
      );
  }
}

/*
## Types
*/

type InPageNavItem = {
  id: string;
  label: ReactNode;
  node: HTMLHeadingElement;
};

type NavHeadingProps = {
  children: ReactNode;
  id: string;
  label?: ReactNode;
  level?: 2 | 3 | 4 | 5 | 6;
};

type ObserverDispatch = {
  observe: (item: InPageNavItem) => void;
  unobserve: (itemId: string) => void;
};

type State = {
  active: string;
  navItems: Array<InPageNavItem>;
};
