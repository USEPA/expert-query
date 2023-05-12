import {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
// types
import type { Dispatch, ReactNode } from 'react';

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

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'REGISTER_NAV_ITEM': {
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    }
    case 'SET_ACTIVE_ITEM': {
      return {
        ...state,
        active: action.payload,
      };
    }
    case 'DEREGISTER_NAV_ITEM': {
      return {
        active: state.active === action.payload ? '' : state.active,
        items: state.items.reduce<State['items']>((current, next) => {
          if (next.id === action.payload) {
            return current;
          } else {
            return [...current, next];
          }
        }, []),
      };
    }
    default:
      throw new Error(`Unhandled action type: ${action}`);
  }
}

/*
## Contexts
*/

const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

function InPageNavProvider({ children }: { children: ReactNode }) {
  const initialState: State = { active: '', items: [] };
  const [state, dispatch] = useReducer(reducer, initialState);

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
  const dispatch = useInPageNavDispatch();

  const observer = useMemo(() => {
    return new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 1) {
            dispatch({ type: 'SET_ACTIVE_ITEM', payload: entry.target.id });
            return;
          }
        }
      },
      { rootMargin: '10% 0 10% 0' },
    );
  }, [dispatch]);

  const { active, items: navItems } = useInPageNavState();

  useEffect(() => {
    observer.takeRecords().forEach((entry) => {
      observer.unobserve(entry.target);
    });
    navItems.forEach((item) => {
      observer.observe(item.node);
    });
  }, [navItems, observer]);

  useEffect(() => {
    return function cleanup() {
      observer.disconnect();
    };
  }, [observer]);

  return <div>{children}</div>;
}

function InPageNavList() {
  return <></>;
}

export function NavHeading({ children, id, label, level }: NavHeadingProps) {
  const dispatch = useInPageNavDispatch();

  const ref = useCallback(
    (node: HTMLHeadingElement | null) => {
      if (!node) {
        dispatch({ type: 'DEREGISTER_NAV_ITEM', payload: id });
      } else {
        dispatch({
          type: 'REGISTER_NAV_ITEM',
          payload: { id, label: label ?? children, node },
        });
      }
    },
    [children, dispatch, id, label],
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

type Action =
  | {
      type: 'REGISTER_NAV_ITEM';
      payload: InPageNavItem;
    }
  | {
      type: 'SET_ACTIVE_ITEM';
      payload: string;
    }
  | {
      type: 'DEREGISTER_NAV_ITEM';
      payload: string;
    };

type InPageNavItem = {
  id: string;
  label: ReactNode;
  node: HTMLHeadingElement;
};

type NavHeadingProps = {
  children: ReactNode;
  id: string;
  label?: ReactNode;
  level: 2 | 3 | 4 | 5 | 6;
};

type State = {
  active: string;
  items: Array<InPageNavItem>;
};
