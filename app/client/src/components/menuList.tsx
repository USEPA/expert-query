import { Children, useEffect, useMemo, useRef, useState } from 'react';
import { List, useDynamicRowHeight } from 'react-window';
// types
import type { MutableRefObject, ReactNode, Ref } from 'react';
import type {
  DynamicRowHeight,
  ListImperativeAPI,
  RowComponentProps,
} from 'react-window';
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

type RowProps = {
  items: ReactNode[];
  width: number;
  rowHeightCache: DynamicRowHeight;
};

export function MenuList<T>({
  children,
  maxHeight,
  innerRef,
}: MenuListProps<T>) {
  const items = Children.toArray(children);

  const { width } = useWindowSize();
  const rowHeightCache = useDynamicRowHeight({ defaultRowHeight: 70 });

  const rowProps = useMemo(
    () => ({
      items,
      width,
      rowHeightCache,
    }),
    [items, rowHeightCache, width],
  );

  const setInnerRef = (element: HTMLDivElement | null) => {
    if (!innerRef) return;

    if (typeof innerRef === 'function') {
      innerRef(element);
      return;
    }

    (innerRef as MutableRefObject<HTMLDivElement | null>).current =
      element;
  };

  const handleListRef: Ref<ListImperativeAPI> = (api) => {
    setInnerRef(api?.element ?? null);
  };

  // Calculate total height of items in list, up to maxHeight.
  const [height, setHeight] = useState(0);
  useEffect(() => {
    let newHeight = 0;
    for (let i of Array(items.length).keys()) {
      const rowSize = rowHeightCache.getRowHeight(i) ?? 70;

      if (newHeight + rowSize > maxHeight) {
        newHeight = maxHeight;
        break;
      }
      newHeight += rowSize;
    }
    setHeight(newHeight);
  }, [items, maxHeight, rowHeightCache, width]);

  return (
    <List<RowProps>
      listRef={handleListRef}
      style={{ height }}
      rowCount={items.length}
      rowHeight={rowHeightCache}
      rowComponent={MenuItem}
      rowProps={rowProps}
    />
  );
}

type MenuItemProps = RowComponentProps<RowProps>;

function MenuItem({ index, style, width, items, rowHeightCache }: MenuItemProps) {
  const rowRef = useRef<HTMLDivElement | null>(null);

  // Keep track of the height of the rows to autosize rows.
  useEffect(() => {
    if (!rowRef?.current) return;

    rowHeightCache.setRowHeight(index, rowRef.current.getBoundingClientRect().height);
  }, [index, rowHeightCache, width]);

  return (
    <div ref={rowRef} style={{ ...style, overflowX: 'hidden' }}>
      {items[index]}
    </div>
  );
}
