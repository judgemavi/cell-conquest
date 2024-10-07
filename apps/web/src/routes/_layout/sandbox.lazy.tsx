import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CellGrid } from "../../components/CellGrid";
import { runGameOfLife } from "@repo/utils";
import { Button } from "../../components/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/Tooltip";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { ColorPicker } from "../../components/ColorPicker";

const Sandbox = () => {
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [simulate, setSimulate] = useState(false);
  const [color, setColor] = useState("black");

  const handleCellClick = (x: number, y: number) => {
    if (grid[`${x}:${y}`]) {
      setGrid((prev) => {
        const newGrid = { ...prev };
        delete newGrid[`${x}:${y}`];
        return newGrid;
      });
    } else {
      setGrid((prev) => ({ ...prev, [`${x}:${y}`]: color }));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (simulate) {
        setGrid((prev) => {
          const newGrid = runGameOfLife(prev, 50);
          return newGrid;
        });
      }
    }, 300);
    return () => clearInterval(interval);
  }, [simulate]);

  return (
    <div className="flex flex-col gap-4 w-full h-full flex-1 overflow-hidden p-4">
      <h1 className="text-2xl font-bold">Sandbox</h1>
      <div className="flex w-full h-full justify-center overflow-hidden">
        <div className="flex flex-col w-fit max-w-full h-fit max-h-full overflow-hidden gap-4">
          <CellGrid
            gridSize={50}
            renderCell={({ columnIndex, rowIndex, className, key, style }) => (
              <button
                key={key}
                className={className}
                style={{
                  ...style,
                  backgroundColor:
                    grid[`${columnIndex}:${rowIndex}`] || "white",
                }}
                onClick={() => handleCellClick(columnIndex, rowIndex)}
              ></button>
            )}
          />

          <div className="flex gap-2 w-full justify-center">
            <ColorPicker onChange={setColor} value={color} />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setGrid((prev) => runGameOfLife(prev, 50))}
                >
                  <StepForward className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Step</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setSimulate((prev) => !prev)}
                >
                  {simulate ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{simulate ? "Stop" : "Start"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setGrid({})}>
                  <RotateCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute("/_layout/sandbox")({
  component: Sandbox,
});
