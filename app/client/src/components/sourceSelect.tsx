import { uniqueId } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import Filter from 'images/filter_list.svg?react';
// types
import type { MutableRefObject, ReactNode } from 'react';
import type { Option } from 'types';

/*
## Components
*/

export function SourceSelect({
  label,
  sources,
  children,
  onChange,
  selected,
}: Readonly<SourceSelectProps>) {
  const [id] = useState(uniqueId());
  const sourceList = useRef<HTMLButtonElement | null>(null);
  const sourceDownPress = useKeyPress('ArrowDown', sourceList);
  const sourceUpPress = useKeyPress('ArrowUp', sourceList);
  const sourceEnterPress = useKeyPress('Enter', sourceList);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [sourceCursor, setSourceCursor] = useState(-1);

  const allSources = useMemo(() => {
    const allSourcesLabel = `All ${label}s`;
    return sources
      ? [{ label: allSourcesLabel, value: Infinity }, ...sources]
      : null;
  }, [label, sources]);

  useEffect(() => {
    setSourceCursor(-1);
  }, [sourcesVisible]);

  // Handle arrow down key press (sources list)
  useEffect(() => {
    if (allSources && sourceDownPress) {
      setSourceCursor((prevState) => {
        const newIndex = prevState < allSources.length - 1 ? prevState + 1 : 0;

        // scroll to the suggestion
        const elm = document.getElementById(`${id}-source-${newIndex}`);
        const panel = document.getElementById(`${id}-source-menu`);
        if (elm && panel) panel.scrollTop = elm.offsetTop;

        return newIndex;
      });
    }
  }, [allSources, id, sourceDownPress]);

  // Handle arrow up key press (sources list)
  useEffect(() => {
    if (allSources && sourceUpPress) {
      setSourceCursor((prevState) => {
        const newIndex = prevState > 0 ? prevState - 1 : allSources.length - 1;

        // scroll to the suggestion
        const elm = document.getElementById(`${id}-source-${newIndex}`);
        const panel = document.getElementById(`${id}-source-menu`);
        if (elm && panel) panel.scrollTop = elm.offsetTop;

        return newIndex;
      });
    }
  }, [allSources, id, sourceUpPress]);

  // Handle enter key press (sources list)
  useEffect(() => {
    if (!allSources || !sourceEnterPress) return;

    // determine if the sources menu is visible
    const sourcesShown =
      document.getElementById(`${id}-source-menu-div`)?.getBoundingClientRect()
        .height !== 0;

    // determine whether or not the enter button is being used to open/close
    // the sources menu or select a source
    if (!sourcesShown) {
      setSourcesVisible(true);
      return;
    }
    if (sourcesShown && sourceCursor === -1) {
      setSourcesVisible(false);
      return;
    }

    // handle selecting a source
    if (sourceCursor < 0 || sourceCursor > allSources.length) return;
    if (allSources[sourceCursor]) {
      onChange?.(
        allSources[sourceCursor].value === Infinity
          ? null
          : (allSources[sourceCursor] as Option),
      );
      setSourceCursor(-1);
    }
  }, [allSources, id, onChange, sourceCursor, sourceEnterPress]);

  return (
    <div
      onBlur={(ev) => {
        if (
          !ev.currentTarget.contains(ev.relatedTarget) ||
          ev.relatedTarget?.tagName !== 'LI'
        ) {
          setSourcesVisible(false);
        }
      }}
      className="display-flex position-relative"
    >
      {allSources && (
        <button
          data-node-ref="_sourceMenuButtonNode"
          aria-haspopup="true"
          aria-controls={`${id}-source-menu`}
          className={`bg-white border-gray-30 border-1px border-right-0 radius-left-md hover:bg-base-lightest cursor-pointer focus:z-top`}
          ref={sourceList}
          onClick={() => setSourcesVisible(!sourcesVisible)}
          title={`Select ${label}`}
          type="button"
        >
          <Filter
            aria-hidden="true"
            focusable="false"
            className="height-3 width-3 text-gray-50 top-2px usa-icon"
            role="presentation"
          />
        </button>
      )}

      {children}

      <div
        id={`${id}-source-menu-div`}
        tabIndex={-1}
        className={`bg-white position-absolute shadow-2 width-full z-top top-full ${
          sourcesVisible ? '' : 'display-none'
        }`}
      >
        <ul
          id={`${id}-source-menu`}
          role="menu"
          data-node-ref="_sourceListNode"
          className="font-ui-xs maxh-mobile overflow-y-scroll padding-left-0"
        >
          {allSources?.map((source, sourceIndex) => {
            let bgClass = 'hover:bg-base-lightest';
            if (selected === source) {
              bgClass = 'bg-primary-lighter border-left-2px border-primary';
            } else if (!selected && source.value === Infinity) {
              bgClass = 'bg-primary-lighter border-left-2px border-primary';
            } else if (sourceIndex === sourceCursor) {
              bgClass = 'bg-primary-lighter';
            }
            const border =
              sourceIndex === allSources.length - 1
                ? null
                : 'border-bottom-1px border-gray-10';

            return (
              <li
                id={`${id}-source-${source.value}`}
                role="menuitem"
                className={`add-list-reset cursor-pointer ${bgClass}`}
                tabIndex={-1}
                key={`source-key-${source.value}`}
                onClick={() => {
                  onChange?.(
                    source.value === Infinity ? null : (source as Option),
                  );
                  setSourcesVisible(false);
                }}
              >
                <div className={`margin-x-1 ${border} padding-y-1`}>
                  {source.label}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/*
## Hooks
*/

// Custom hook that is used for handling key presses. This can be used for
// navigating lists with a keyboard.
function useKeyPress(
  targetKey: string,
  ref: MutableRefObject<HTMLElement | null>,
) {
  const [keyPressed, setKeyPressed] = useState(false);

  function downHandler(ev: KeyboardEvent) {
    if (ev.key === targetKey) {
      ev.preventDefault();
      setKeyPressed(true);
    }
  }

  const upHandler = ({ key }: { key: string }) => {
    if (key === targetKey) {
      setKeyPressed(false);
    }
  };

  useEffect(() => {
    if (!ref?.current?.addEventListener) return;
    const tempRef = ref.current;

    ref.current.addEventListener('keydown', downHandler);
    ref.current.addEventListener('keyup', upHandler);

    return function cleanup() {
      tempRef.removeEventListener('keydown', downHandler);
      tempRef.removeEventListener('keyup', upHandler);
    };
  });

  return keyPressed;
}

/*
## Types
*/

type SourceSelectProps = {
  label: string;
  sources?: ReadonlyArray<Option> | null;
  children: ReactNode;
  onChange?: ((selected: Option | null) => void) | null;
  selected?: Option | null;
};
