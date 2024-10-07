export type Location = {
  x: number;
  y: number;
};

export type Cell = Location & {
  color: string;
  username: string;
};

export type UpdateCell = Location & {
  type: "addCell" | "removeCell";
};

export type LeaderBoard = { value: string; score: number; color: string }[];

export type AddCell = {
  type: "addCell";
  score: number;
  slots: number;
  leaders: LeaderBoard;
} & Cell;

export type RemoveCell = {
  type: "removeCell";
  score: number;
  slots: number;
  leaders: LeaderBoard;
} & Location;

export type InitialState = {
  type: "initialState";
  grid: Record<string, string>;
  size: number;
  slots: number;
  totalSlots: number;
  score: number;
  leaders: LeaderBoard;
};

export type GameOfLifeUpdate = {
  type: "gameOfLifeUpdate";
  grid: Record<string, string>;
  leaders: LeaderBoard;
};

export type ScoreUpdate = {
  type: "scoreUpdate";
  score: number;
};

export type ActivePlayers = {
  type: "activePlayers";
  players: number;
};

export type GameOfLifeNextCycle = {
  type: "gameOfLifeNextCycle";
  nextCycle: Date;
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type Grid = Record<string, string>;
