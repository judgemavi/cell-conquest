import { createLazyFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AddCell,
  GameOfLifeUpdate,
  InitialState,
  LeaderBoard as LeaderBoardType,
} from '@repo/types';
import { CellGrid } from '../../components/CellGrid';
import { LeaderBoard } from '../../components/LeaderBoard';
import { Separator } from '../../components/Separator';
import { differenceInSeconds } from 'date-fns';
import { cn } from '../../components/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/Button';

const Home = () => {
  const [grid, setGrid] = useState<Record<string, string>>({});
  const [gridSize, setGridSize] = useState(0);
  const [leaderBoard, setLeaderBoard] = useState<LeaderBoardType>([]);
  const [userSlots, setSlots] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [userScore, setScore] = useState(0);
  const [golInProgress, setGolInProgress] = useState(false);
  const [golNextCycle, setGolNextCycle] = useState<number>();
  const [activePlayers, setActivePlayers] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const context = Route.useRouteContext();

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const sessionToken = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('sessionToken='))
      ?.split('=')[1];
    const ws = new WebSocket(
      `ws${import.meta.env.VITE_SECURE ? 's': ''}://${window.location.host}${import.meta.env.VITE_BASE_PATH}ws/${sessionToken ? `player?sessionToken=${sessionToken}` : 'guest'}`
    );
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      const response = JSON.parse(ev.data as string);
      const type = response.type as string;
      if (type === 'initialState') {
        const { grid, size, leaders, slots, score, totalSlots } =
          response as InitialState;
        setGridSize(size);
        setGrid(grid);
        setLeaderBoard(leaders);
        if (slots) {
          setSlots(slots);
        }
        if (totalSlots) {
          setTotalSlots(totalSlots);
        }
        if (score) {
          setScore(score);
        }
      }
      if (type === 'addCell') {
        const { x, y, color, leaders, slots, score } = response as AddCell;
        setGrid((prev) => ({
          ...prev,
          [`${x}:${y}`]: color,
        }));
        setLeaderBoard(leaders);
        if (slots) {
          setSlots(slots);
        }
        if (score) {
          setScore(score);
        }
      }
      if (type === 'removeCell') {
        const { x, y, leaders, slots, score } = response as AddCell;
        setGrid((prev) => {
          delete prev[`${x}:${y}`];
          return prev;
        });
        setLeaderBoard(leaders);
        if (slots !== undefined) {
          setSlots(slots);
        }
        if (score !== undefined) {
          setScore(score);
        }
      }
      if (type === 'gameOfLifeUpdate') {
        const { grid, leaders } = response as GameOfLifeUpdate;
        setGrid(grid);
        setLeaderBoard(leaders);
      }
      if (type === 'gameOfLifeStart') {
        setGolInProgress(true);
      }
      if (type === 'gameOfLifeEnd') {
        setGolInProgress(false);
      }
      if (type === 'gameOfLifeNextCycle') {
        const { nextCycle } = response;
        const nextCycleDate = new Date(+nextCycle);
        const interval = setInterval(() => {
          if (differenceInSeconds(nextCycleDate, new Date()) <= 0) {
            setGolNextCycle(0);
            clearInterval(interval);
          } else {
            setGolNextCycle(differenceInSeconds(nextCycleDate, new Date()));
          }
        }, 1000);
      }
      if (type === 'activePlayers') {
        setActivePlayers(response.players);
      }
      if (type === 'ping') {
        ws.send('pong');
      }
      if (type === 'replenishSlot') {
        setSlots(response.slots);
      }
      if (type === 'scoreUpdate') {
        setScore(response.score);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [context]);

  const handleClick = useCallback(
    (x: number, y: number, color: string) => {
      if (golInProgress) return;
      const userColor = context.color;
      if (color !== userColor && color) {
        return;
      }
      if (color === userColor) {
        wsRef.current?.send(
          JSON.stringify({
            type: 'removeCell',
            x,
            y,
          })
        );
        return;
      }
      if (userSlots > 0) {
        wsRef.current?.send(
          JSON.stringify({
            type: 'addCell',
            x,
            y,
          })
        );
      }
    },
    [context.color, userSlots, golInProgress]
  );

  return (
    <div className='flex w-full h-full overflow-hidden'>
      <div className='flex-1 p-4 overflow-hidden'>
        <CellGrid
          gridSize={gridSize}
          renderCell={({ columnIndex, rowIndex, className, style, key }) =>
            context.guest ? (
              <div
                key={key}
                className={className}
                style={{
                  ...style,
                  backgroundColor:
                    grid[`${columnIndex}:${rowIndex}`] || 'white',
                }}
              ></div>
            ) : (
              <button
                key={key}
                className={className}
                style={{
                  ...style,
                  backgroundColor:
                    grid[`${columnIndex}:${rowIndex}`] || 'white',
                }}
                onClick={() =>
                  handleClick(
                    columnIndex,
                    rowIndex,
                    grid[`${columnIndex}:${rowIndex}`]
                  )
                }
              ></button>
            )
          }
        />
      </div>
      <div
        className={cn(
          'transition-all duration-300 ease-in-out relative',
          isSidebarOpen ? 'w-52' : 'w-0'
        )}
      >
        <Button
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          size='icon'
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2  rounded-full',
            isSidebarOpen ? 'right-48' : 'right-0'
          )}
        >
          {isSidebarOpen ? (
            <ChevronRight className='size-4' />
          ) : (
            <ChevronLeft className='size-4' />
          )}
        </Button>
        {isSidebarOpen && (
          <div className='flex gap-2 w-full h-full overflow-auto'>
            <Separator orientation='vertical' />
            <div className='flex flex-col gap-4 w-full pt-4'>
              {!context.guest && (
                <>
                  <div className='flex flex-col gap-2 w-full px-2'>
                    <div className='flex gap-1 items-center'>
                      <span className='text-sm font-bold'>Player:</span>
                      <span className='text-sm'>{context.username}</span>
                    </div>
                    <div className='flex gap-1 items-center'>
                      <span className='text-sm font-bold'>Score:</span>
                      <span className='text-sm'>{userScore}</span>
                    </div>
                    <span className='text-sm font-bold'>Slots:</span>
                    <div className='grid grid-cols-5 gap-1 w-fit'>
                      {Array.from({ length: totalSlots }).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            'size-4 rounded-sm border',
                            index < userSlots && 'border-none'
                          )}
                          style={{
                            backgroundColor:
                              index < userSlots ? context.color : 'transparent',
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div className='flex gap-1 items-center px-2'>
                <span className='text-sm font-bold'>Active Players:</span>
                <span className='text-sm'>{activePlayers}</span>
              </div>
              <Separator />
              {golNextCycle !== undefined && (
                <>
                  <div className='flex gap-1 items-center px-2'>
                    {golNextCycle ? (
                      <>
                        <span className='text-sm font-bold'>Next Cycle:</span>
                        <span className='text-sm'>{golNextCycle} s</span>
                      </>
                    ) : (
                      <span className='text-sm font-bold'>
                        Simulation in progress
                      </span>
                    )}
                  </div>
                  <Separator />
                </>
              )}
              <LeaderBoard leaders={leaderBoard} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Route = createLazyFileRoute('/_layout/')({
  component: Home,
});
