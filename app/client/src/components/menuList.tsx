import { Children, useEffect, useRef, useState } from 'react';
import { VariableSizeList } from 'react-window';
// types
import type { ReactNode } from 'react';
import type { MenuListProps } from 'react-select';

function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const changeWindowSize = () =>
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    window.addEventListener('resize', changeWindowSize);

    return function cleanup() {
      window.removeEventListener('resize', changeWindowSize);
    };
  }, []);

  return windowSize;
}

export default MenuList;
export function MenuList<T>({
  children,
  maxHeight,
  innerRef,
}: MenuListProps<T>) {
  const items = Children.toArray(children);

  const { width } = useWindowSize();
  const listRef = useRef<VariableSizeList | null>(null);

  // Keeps track of the size of the virtualized items. This handles
  // items where the text wraps.
  const sizeMap = useRef<{ [index: number]: number }>({});
  const setSize = (index: number, size: number) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
  };
  const getSize = (index: number) => sizeMap.current[index] || 35;

  const [height, setHeight] = useState(0);

  return (
    <VariableSizeList
      onItemsRendered={({ visibleStartIndex }) => {
        listRef.current?.resetAfterIndex(visibleStartIndex);
      }}
      outerRef={innerRef}
      ref={(node) => {
        if (!node) return;
        listRef.current = node;
        // Calculate total height of items in list, up to maxHeight.
        let newHeight = 0;
        for (let i of Array(items.length).keys()) {
          if (newHeight + getSize(i) > maxHeight) {
            newHeight = maxHeight;
            break;
          }
          newHeight += getSize(i);
        }
        setHeight(newHeight);
      }}
      width="100%"
      height={height}
      itemCount={items.length}
      itemSize={getSize}
    >
      {({ index, style }) => (
        <div style={{ ...style, overflow: 'hidden' }}>
          <MenuItem
            index={index}
            width={width}
            setSize={setSize}
            value={items[index]}
          />
        </div>
      )}
    </VariableSizeList>
  );
}

type MenuItemProps = {
  index: number;
  width: number;
  setSize: (index: number, size: number) => void;
  value: ReactNode;
};

function MenuItem({ index, width, setSize, value }: MenuItemProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  // Keep track of the height of the rows to autosize rows.
  const [prevWidth, setPrevWidth] = useState(width);
  if (prevWidth !== width && rowRef.current) {
    setPrevWidth(width);
    setSize(index, rowRef.current.getBoundingClientRect().height);
  }

  return (
    <div
      ref={(node) => {
        if (!node) return;
        setSize(index, node.getBoundingClientRect().height);
        rowRef.current = node;
      }}
    >
      {value}
    </div>
  );
}
