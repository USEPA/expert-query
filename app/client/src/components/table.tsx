/** Adapted from https://github.com/MetroStar/comet/blob/main/packages/comet-uswds/src/components/table/table.tsx */
import classNames from 'classnames';
import { Fragment, useRef, useState } from 'react';
// components
import ArrowDown from 'images/sort_arrow_down.svg?react';
import ArrowUnsorted from 'images/sort_arrow_unsorted.svg?react';
import ArrowUp from 'images/sort_arrow_up.svg?react';
// types
import type { ReactNode, UIEvent } from 'react';

function isCellSpec(value: any): value is TableCell {
  return (
    typeof value === 'object' && value !== null && value.hasOwnProperty('value')
  );
}

export const Table = ({
  id,
  caption,
  columns,
  data,
  sortable = false,
  initialSortIndex = 0,
  initialSortDir = 'ascending',
  scrollable = false,
  borderless = false,
  stacked = false,
  stickyHeader = false,
  striped = false,
  className,
  tabIndex = -1,
}: TableProps): React.ReactElement => {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const topScrollbarRef = useRef<HTMLDivElement | null>(null);
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    if (contentRef.current) contentRef.current.scrollLeft = scrollLeft;
    if (topScrollbarRef.current)
      topScrollbarRef.current.scrollLeft = scrollLeft;
  };

  // Swap sort direction.
  const getSortDirection = (prevSortDir: 'ascending' | 'descending') => {
    if (prevSortDir === 'descending') {
      return 'ascending';
    } else {
      return 'descending';
    }
  };

  const [sortDir, setSortDir] = useState<'ascending' | 'descending'>(
    initialSortDir,
  );
  const [sortIndex, setSortIndex] = useState(initialSortIndex);

  // If a header of a sortable column is clicked, sort the column or change the sort direction.
  const handleHeaderClick = (index: number) => {
    const column = columns[index];
    if (column?.sortable) {
      if (sortIndex === index) {
        setSortDir((prevSortDir) => getSortDirection(prevSortDir));
      } else {
        setSortIndex(index);
      }
    }
  };

  const [width, setWidth] = useState(0);

  return (
    <div className={className}>
      <div
        className="scroll-container"
        onScroll={handleScroll}
        ref={topScrollbarRef}
      >
        <div
          className="scrollbar"
          id={`${id}-top-scrollbar`}
          style={{
            width,
          }}
        ></div>
      </div>
      <div
        id={`${id}-container`}
        className={classNames(
          { 'usa-table-container': !scrollable },
          { 'usa-table-container--scrollable': scrollable },
          'margin-top-0',
          'scroll-container',
        )}
        onScroll={handleScroll}
        ref={contentRef}
      >
        <table
          className={classNames(
            'usa-table',
            { 'usa-table--borderless': borderless },
            { 'usa-table--striped': striped },
            { 'usa-table--stacked': stacked },
            { 'usa-table--sticky-header': stickyHeader },
            'layout-fixed',
            'width-full',
            'whitespace-wrap',
          )}
          ref={(node) => {
            if (!node) {
              setWidth(0);
              return;
            }
            setWidth(node.offsetWidth);
          }}
          tabIndex={scrollable ? Math.max(0, tabIndex) : tabIndex}
        >
          <caption hidden={!caption} className="text-italic">
            {caption}
          </caption>
          <thead>
            <tr>
              {columns
                .map((obj) => ({
                  ...obj,
                  sortable: obj.sortable ?? true, // Default to sortable if not specified
                }))
                .map((column: TableColumn, index: number) => {
                  const colSortable = sortable && column.sortable;
                  const colSorted = colSortable && sortIndex === index;
                  const sortIcon = (() => {
                    if (!colSortable) return null;

                    const attributes = {
                      className: 'usa-icon',
                      'aria-hidden': true,
                      focusable: false,
                    };

                    if (sortIndex === index) {
                      return sortDir === 'ascending' ? (
                        <ArrowUp {...attributes} />
                      ) : (
                        <ArrowDown {...attributes} />
                      );
                    } else {
                      return <ArrowUnsorted {...attributes} />;
                    }
                  })();
                  return (
                    <Fragment key={column.id}>
                      <th
                        aria-label={
                          colSortable
                            ? `${column.name}, sortable column, currently ${colSorted ? `sorted ${sortDir}` : 'unsorted'}`
                            : undefined
                        }
                        aria-sort={colSorted ? sortDir : undefined}
                        id={`${id}-${column.id}`}
                        scope="col"
                        role="columnheader"
                        style={{
                          width: column.width ? `${column.width}px` : 'auto',
                        }}
                      >
                        <div className="display-flex flex-align-center flex-justify">
                          {column.name}
                          <button
                            className="usa-button sort-button"
                            onClick={() => handleHeaderClick(index)}
                            title={`Click to sort by ${column.name} in ${
                              colSorted ? getSortDirection(sortDir) : sortDir
                            } order`}
                            type="button"
                          >
                            {sortIcon}
                          </button>
                        </div>
                      </th>
                    </Fragment>
                  );
                })}
            </tr>
          </thead>
          <tbody>
            {data
              .map((row) =>
                row.map((cell) => ({
                  value: isCellSpec(cell) ? cell.value : cell,
                  sortValue: isCellSpec(cell)
                    ? (cell.sortValue ?? cell.value ?? '')
                    : cell,
                })),
              )
              .sort((a, b) => {
                if (!sortable || sortIndex < 0) return 0;

                const isAscending = sortDir === 'ascending';
                const value1 = (isAscending ? a : b)[sortIndex].sortValue;
                const value2 = (isAscending ? b : a)[sortIndex].sortValue;

                // If neither value is empty, and if both values are already numbers, compare numerically.
                if (
                  value1 &&
                  value2 &&
                  !Number.isNaN(Number(value1)) &&
                  !Number.isNaN(Number(value2))
                ) {
                  return (value1 as number) - (value2 as number);
                }
                // Otherwise, compare alphabetically based on current user locale.
                return value1
                  .toString()
                  .localeCompare(value2.toString(), navigator.language, {
                    numeric: true,
                    ignorePunctuation: true,
                  });
              })
              .map((row, i: number) => (
                <tr key={`tr-${i}`}>
                  {row.map((col, j) => (
                    <td
                      key={`td-${j}`}
                      data-sort-active={j === sortIndex ? 'true' : undefined}
                    >
                      {col.value}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {sortable && (
          <div
            className="usa-sr-only usa-table__announcement-region"
            aria-live="polite"
          ></div>
        )}
      </div>
    </div>
  );
};

/*
## Types
*/

type TableProps = {
  /**
   * The unique identifier for this component
   */
  id: string;
  /**
   * The table header details for the table
   */
  columns: TableColumn[];
  /**
   * The data to display in the table rows
   */
  data: TableRow[];
  /**
   * An optional caption to display above the table
   */
  caption?: string;
  /**
   * A boolean indicating if the table is sortable or not
   */
  sortable?: boolean;
  /**
   * The column index to set as the default sort
   */
  initialSortIndex?: number;
  /**
   * The default sort direction if sortIndex is provided
   */
  initialSortDir?: 'ascending' | 'descending';
  /**
   * A function to call when the table is sorted
   */
  onSort?: () => void;
  /**
   * A boolean indicating if the table is scrollable or not
   */
  scrollable?: boolean;
  /**
   * A boolean indicating if the table is borderless or not
   */
  borderless?: boolean;
  /**
   * A boolean indicating if the table should use a stacked layout or not
   */
  stacked?: boolean;
  /**
   * A boolean indicating if the table has a sticky header or not
   */
  stickyHeader?: boolean;
  /**
   * A boolean indicating if the table is striped or not
   */
  striped?: boolean;
  /**
   * Additional class names for the table
   */
  className?: string;
  /**
   * Used primarily to make table focusable
   */
  tabIndex?: number;
};

type TableColumn = {
  id: string;
  name: string;
  sortable?: boolean;
  width?: number;
};

type TableCell = {
  value: ReactNode;
  sortValue?: string | number;
};

type TableRow = (string | number | TableCell)[];

export default Table;
