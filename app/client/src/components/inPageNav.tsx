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
## Contexts
*/

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<ObserverDispatch | undefined>(undefined);

function InPageNavProvider({ children }: Readonly<{ children: ReactNode }>) {
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
      rootMargin: '48px 0px -80% 0px',
      threshold: 1,
    };
    return new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= options.threshold
        ) {
          setActive(entry.target.id);
          return;
        }
      }
    }, options);
  }, []);

  const observe = useCallback(
    (item: InPageNavItem, node: HTMLDivElement) => {
      observer.observe(node);
      setNavItems((prev) => [...prev, item]);
    },
    [observer],
  );

  const unobserve = useCallback((itemId: string) => {
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

  const dispatch: ObserverDispatch = useMemo(
    () => ({ observe, unobserve }),
    [observe, unobserve],
  );

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

export function InPageNavLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <InPageNavProvider>
      <InPageNavLayoutInner>{children}</InPageNavLayoutInner>
    </InPageNavProvider>
  );
}

function InPageNavLayoutInner({ children }: Readonly<{ children: ReactNode }>) {
  const { active, navItems } = useInPageNavState();

  const sortedNavItems = useMemo(() => {
    const sorted: InPageNavItem[] = [];
    document
      .querySelectorAll('[data-role="in-page-nav-anchor"]')
      .forEach((node) => {
        const navItem = navItems.find((item) => item.id === node.id);
        if (navItem) sorted.push(navItem);
      });
    return sorted;
  }, [navItems]);

  return (
    <div className="usa-in-page-nav-container">
      {sortedNavItems.length > 0 && (
        <aside
          aria-labelledby="in-page-nav-heading"
          className="usa-in-page-nav"
        >
          <nav className="usa-in-page-nav__nav">
            <h4 className="usa-in-page-nav__heading" id="in-page-nav-heading">
              On this page
            </h4>
            <ul className="usa-in-page-nav__list">
              {sortedNavItems.map((item) => (
                <li
                  className={`usa-in-page-nav__item ${
                    item.subItem ? 'usa-in-page-nav__item--sub-item' : ''
                  }`}
                  key={item.id}
                >
                  <a
                    href={`#${item.id}`}
                    className={`usa-in-page-nav__link ${
                      active === item.id ? 'usa-current' : ''
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      )}
      <div className="flex-fill">{children}</div>
    </div>
  );
}

export function InPageNavAnchor({
  children,
  id,
  label,
  subItem = false,
}: Readonly<InPageNavAnchorProps>) {
  const { observe, unobserve } = useInPageNavDispatch();

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        unobserve(id);
      } else {
        observe({ id, label, subItem }, node);
      }
    },
    [id, label, observe, unobserve, subItem],
  );

  return (
    <div data-role="in-page-nav-anchor" id={id} ref={ref}>
      {children}
    </div>
  );
}

export function NumberedInPageNavLabel({
  children,
  number,
}: Readonly<NumberedInPageNavLabelProps>) {
  return (
    <>
      <span className="bg-primary display-inline-block font-family-mono height-205 line-height-sans-3 margin-right-1 radius-pill text-center text-white width-205">
        {number}
      </span>
      {children}
    </>
  );
}

/*
## Types
*/

type InPageNavItem = {
  id: string;
  label: ReactNode;
  subItem: boolean;
};

type InPageNavAnchorProps = {
  children: ReactNode;
  id: string;
  label: ReactNode;
  subItem?: boolean;
};

type ObserverDispatch = {
  observe: (item: InPageNavItem, node: HTMLDivElement) => void;
  unobserve: (itemId: string) => void;
};

type State = {
  active: string;
  navItems: Array<InPageNavItem>;
};

type NumberedInPageNavLabelProps = {
  children: ReactNode;
  number: number;
};
