import { useEffect, useRef, useState } from 'react';
import { ReactComponent as Filter } from 'uswds/img/usa-icons/filter_list.svg';
// types
import type { MutableRefObject, ReactNode } from 'react';

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

type Props = {
  allSources?: ReadonlyArray<Option>;
  children: ReactNode;
  onChange?: (selected: Option) => void;
  selected?: Option | null;
};

export default function SourceSelect({
  allSources = [],
  children,
  onChange = () => null,
  selected = null,
}: Props) {
  const sourceList = useRef<HTMLButtonElement | null>(null);
  const sourceDownPress = useKeyPress('ArrowDown', sourceList);
  const sourceUpPress = useKeyPress('ArrowUp', sourceList);
  const sourceEnterPress = useKeyPress('Enter', sourceList);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [sourceCursor, setSourceCursor] = useState(-1);

  useEffect(() => {
    setSourceCursor(-1);
  }, [sourcesVisible]);

  // Handle arrow down key press (sources list)
  useEffect(() => {
    if (allSources.length > 0 && sourceDownPress) {
      setSourceCursor((prevState) => {
        const newIndex = prevState < allSources.length - 1 ? prevState + 1 : 0;

        // scroll to the suggestion
        const elm = document.getElementById(`source-${newIndex}`);
        const panel = document.getElementById('search-container-source-menu');
        if (elm && panel) panel.scrollTop = elm.offsetTop;

        return newIndex;
      });
    }
  }, [allSources, sourceDownPress]);

  // Handle arrow up key press (sources list)
  useEffect(() => {
    if (allSources.length > 0 && sourceUpPress) {
      setSourceCursor((prevState) => {
        const newIndex = prevState > 0 ? prevState - 1 : allSources.length - 1;

        // scroll to the suggestion
        const elm = document.getElementById(`source-${newIndex}`);
        const panel = document.getElementById('search-container-source-menu');
        if (elm && panel) panel.scrollTop = elm.offsetTop;

        return newIndex;
      });
    }
  }, [allSources, sourceUpPress]);

  // Handle enter key press (sources list)
  useEffect(() => {
    if (!sourceEnterPress) return;

    // determine if the sources menu is visible
    const sourcesShown =
      document
        .getElementById('search-container-source-menu-div')
        ?.getBoundingClientRect().height !== 0 ?? false;

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
      onChange(allSources[sourceCursor]);
      setSourceCursor(-1);

      setTimeout(() => {
        const searchInput = document.getElementById('hmw-search-input');
        if (searchInput) searchInput.focus();
      }, 250);
    }
  }, [allSources, onChange, sourceCursor, sourceEnterPress]);

  return (
    <div className="display-flex margin-top-1 position-relative">
      {allSources.length > 0 && (
        <button
          data-node-ref="_sourceMenuButtonNode"
          aria-haspopup="true"
          aria-controls="search-container-source-menu"
          className="bg-white border-gray-30 border-1px radius-left-md hover:bg-base-lightest"
          ref={sourceList}
          onClick={() => {
            setSourcesVisible(!sourcesVisible);
          }}
          style={{ cursor: 'pointer' }}
          title="Search in"
          type="button"
        >
          <Filter
            aria-hidden="true"
            className="height-3 width-3 text-gray-50 top-2px usa-icon"
            role="presentation"
          />
        </button>
      )}

      {children}

      {sourcesVisible && (
        <div
          id="search-container-source-menu-div"
          tabIndex={-1}
          className="bg-white position-absolute shadow-2 width-full z-top"
          style={{ top: '100%' }}
        >
          <ul
            id="search-container-source-menu"
            role="menu"
            data-node-ref="_sourceListNode"
            className="padding-left-0"
            style={{ marginBottom: 0 }}
          >
            {allSources.map((source, sourceIndex) => {
              let bgClass = 'hover:bg-base-lightest';
              if (selected === source) {
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
                  id={`source-${sourceIndex}`}
                  role="menuitem"
                  className={`add-list-reset ${bgClass}`}
                  tabIndex={-1}
                  key={`source-key-${sourceIndex}`}
                  onClick={() => {
                    onChange(source);
                    setSourcesVisible(false);

                    const searchInput =
                      document.getElementById('hmw-search-input');
                    if (searchInput) searchInput.focus();
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`margin-x-1 ${border} padding-y-1`}>
                    {source.label}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
