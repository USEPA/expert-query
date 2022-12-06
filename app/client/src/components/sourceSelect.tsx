import { useEffect, useRef, useState } from 'react';
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
  allSources: ReadonlyArray<Option<ReactNode, string>>;
  onChange: (selected: Option<ReactNode, string>) => void;
  selected: Option<ReactNode, string> | null;
};

export default function SourceSelect({
  allSources,
  onChange,
  selected,
}: Props) {
  const sourceList = useRef<HTMLButtonElement | null>(null);
  const sourceDownPress = useKeyPress('ArrowDown', sourceList);
  const sourceUpPress = useKeyPress('ArrowUp', sourceList);
  const sourceEnterPress = useKeyPress('Enter', sourceList);
  const [sourcesVisible, setSourcesVisible] = useState(false);
  const [sourceCursor, setSourceCursor] = useState(-1);

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
    <>
      <button
        type="button"
        title="Search in"
        aria-haspopup="true"
        aria-controls="search-container-source-menu"
        className="width-8"
        ref={sourceList}
        data-node-ref="_sourceMenuButtonNode"
        onClick={() => {
          setSourcesVisible(!sourcesVisible);
        }}
      >
        <span
          aria-hidden="true"
          role="presentation"
          className="esri-icon-down-arrow esri-search__sources-button--down"
        ></span>
        <span
          aria-hidden="true"
          role="presentation"
          className="esri-icon-up-arrow esri-search__sources-button--up"
        ></span>
        <span
          aria-hidden="true"
          role="presentation"
          className="esri-search__source-name"
        >
          {selected?.label}
        </span>
      </button>
      {sourcesVisible && (
        <div
          id="search-container-source-menu-div"
          tabIndex={-1}
          className="esri-menu esri-search__sources-menu"
        >
          <ul
            id="search-container-source-menu"
            role="menu"
            data-node-ref="_sourceListNode"
            className="esri-menu__list"
          >
            {allSources.map((source, sourceIndex) => {
              let secondClass = '';
              if (selected === source) {
                secondClass = 'esri-menu__list-item--active';
              } else if (sourceIndex === sourceCursor) {
                secondClass = 'esri-menu__list-item-active';
              }

              return (
                <li
                  id={`source-${sourceIndex}`}
                  role="menuitem"
                  className={`esri-search__source esri-menu__list-item ${secondClass}`}
                  tabIndex={-1}
                  key={`source-key-${sourceIndex}`}
                  onClick={() => {
                    onChange(source);
                    setSourcesVisible(false);

                    const searchInput =
                      document.getElementById('hmw-search-input');
                    if (searchInput) searchInput.focus();
                  }}
                >
                  {source.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
