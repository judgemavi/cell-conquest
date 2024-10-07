import React, { Fragment } from "react";
import { cn } from "./utils";
import { useVirtualizer } from "@tanstack/react-virtual";

type Props = {
  gridSize: number;
  renderCell: (options: {
    key: number | string | bigint;
    columnIndex: number;
    rowIndex: number;
    className: string;
    style: React.CSSProperties;
  }) => JSX.Element;
  className?: string;
};

export const CellGrid: React.FC<Props> = ({
  gridSize,
  renderCell,
  className,
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: gridSize,
    estimateSize: () => 16,
    overscan: 50,
    getScrollElement: () => parentRef.current,
  });
  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: gridSize,
    estimateSize: () => 16,
    overscan: 50,
    getScrollElement: () => parentRef.current,
  });

  return (
    <div
      className={cn("w-full h-full overflow-auto", className)}
      ref={parentRef}
    >
      <div
        className="bg-black w-fit h-fit relative"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${columnVirtualizer.getTotalSize()}px`,
        }}
      >
        {gridSize > 0 &&
          rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <Fragment key={virtualRow.key}>
              {columnVirtualizer.getVirtualItems().map((virtualColumn) =>
                renderCell({
                  key: virtualColumn.key,
                  columnIndex: virtualColumn.index,
                  rowIndex: virtualRow.index,
                  className: cn(
                    "size-4 rounded-sm absolute top-0 left-0 flex align-center justify-center",
                  ),
                  style: {
                    width: `${virtualColumn.size}px`,
                    height: `${virtualRow.size}px`,
                    transform: `translateX(${virtualColumn.start}px) translateY(${virtualRow.start}px)`,
                  },
                }),
              )}
            </Fragment>
          ))}
      </div>
    </div>
  );
};
