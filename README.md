# Cell Conquest

A multiplayer version of Conway's Game of Life with additional conquest mechanics. Built with Bun and ElysiaJS, featuring real-time multiplayer interactions through WebSocket and Redis pub/sub.

[try it](https://cell-conquest.jasmavi.dev/)

## Game Rules

### Core Rules
- **Survival**: Cells with 2 or 3 neighbors survive
- **Death**: Cells with less than 2 or more than 3 neighbors die
- **Birth**: Empty spaces with exactly 3 or 6 neighbors spawn new cells
- **Domination**: New cells inherit the color of the dominant neighboring color (random selection if tied)
- **Conquest**: Live cells have a 20% chance to convert to their dominant neighbor's color

### Game Management
- Game board updates every 30 seconds
- Players receive one new slot every minute (max 25 slots)
- New players start with 25 slots and 0 score

### Player Actions
- Players can place cells if they have available slots
- Players can remove their own cells to free up slots

## Technical Stack

- **Backend**
  - Bun - JavaScript runtime
  - ElysiaJS - Web framework
  - Redis - Database and pub/sub system
  - WebSocket - Real-time communication

- **Frontend**
  - React
  - TanStack Router

## Getting Started

### Prerequisites

- Bun
- Redis

### Installation

```bash
bun install
```

### Running the App

```bash
bun dev
```

### Building the App

```bash
bun build
```