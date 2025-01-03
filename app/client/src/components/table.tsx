/** Adapted from https://github.com/MetroStar/comet/blob/main/packages/comet-uswds/src/components/table/table.tsx */
import table from '@uswds/uswds/js/usa-table';
import classNames from 'classnames';
import { useState } from 'react';
// types
import type { ReactNode } from 'react';

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
  // Swap sort direction.
  const getSortDirection = (prevSortDir: 'ascending' | 'descending') => {
    if (prevSortDir === 'descending') {
      return 'ascending';
    } else {
      return 'descending';
    }
  };

  const [sortDir, setSortDir] = useState<'ascending' | 'descending'>(
    getSortDirection(initialSortDir), // FIXME: This is a bug (possible race condition with `epa.js`), it should be `initialSortDir`
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

  return (
    <div
      id={`${id}-container`}
      className={classNames(
        { 'usa-table-container': !scrollable },
        { 'usa-table-container--scrollable': scrollable },
      )}
      ref={(node) => {
        if (node && sortable) {
          table.on(node);
        }
      }}
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
          className,
        )}
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
                sortable: obj.sortable !== undefined ? obj.sortable : true,
              }))
              .map((column: TableColumn, index: number) => (
                <th
                  id={`${id}-${column.id}`}
                  key={column.id}
                  data-sortable={(sortable && column.sortable) || null}
                  scope="col"
                  role="columnheader"
                  aria-sort={
                    sortable && column.sortable && sortIndex === index
                      ? sortDir
                      : undefined
                  }
                  onClick={() => handleHeaderClick(index)}
                  style={{ width: column.width ? `${column.width}px` : 'auto' }}
                >
                  {column.name}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i: number) => {
            const rowData: TableCell[] = [];
            row.forEach((cell: string | number | TableCell) => {
              if (sortable) {
                rowData.push({
                  value: isCellSpec(cell) ? cell.value : cell,
                  sortValue: isCellSpec(cell)
                    ? (cell.sortValue ?? cell.value ?? '').toString()
                    : cell,
                });
              } else {
                rowData.push({
                  value: isCellSpec(cell) ? cell.value : cell,
                });
              }
            });

            return (
              <tr key={`tr-${i}`}>
                {rowData.map((col, j) => (
                  <td
                    key={`td-${j}`}
                    data-sort-value={sortable ? col.sortValue : col.value}
                  >
                    {col.value}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortable && (
        <div
          className="usa-sr-only usa-table__announcement-region"
          aria-live="polite"
        ></div>
      )}
    </div>
  );
};

/*
## Types
*/

type TableProps<T = any> = {
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
  data: T[];
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

export default Table;
