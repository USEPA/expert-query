import { Children, useCallback, useEffect, useRef, useState } from 'react';
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

  // keeps track of the size of the virtualized items. This handles
  // items where the text wraps
  const sizeMap = useRef<{ [index: number]: number }>({});
  const setSize = useCallback((index: number, size: number) => {
    sizeMap.current = { ...sizeMap.current, [index]: size };
    listRef.current?.resetAfterIndex(index);
  }, []);
  const getSize = (index: number) => sizeMap.current[index] || 70;

  return (
    <VariableSizeList
      outerRef={innerRef}
      ref={listRef}
      width="100%"
      height={maxHeight}
      itemCount={items.length}
      itemSize={getSize}
    >
      {({ index, style }) => (
        <div style={{ ...style, overflowX: 'hidden' }}>
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

  // keep track of the height of the rows to autosize rows
  useEffect(() => {
    if (!rowRef?.current) return;

    setSize(index, rowRef.current.getBoundingClientRect().height);
  }, [setSize, index, width]);

  return <div ref={rowRef}>{value}</div>;
}
