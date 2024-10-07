import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layout/rules")({
  component: () => (
    <div className="flex flex-col gap-4 w-full p-4 overflow-auto">
      <h1 className="text-2xl font-bold">Gameplay</h1>
      <h2 className="text-xl font-bold pl-4">Survival</h2>
      <ul className="pl-5">
        <li>
          <span className="font-bold">Survival:</span> If a cell has 2 or 3
          neighbors, it will survive.
        </li>
        <li>
          <span className="font-bold">Death:</span> If a cell has less than 2 or
          more than 3 neighbors, it will die.
        </li>
        <li>
          <span className="font-bold">Birth:</span> If a cell has 3 or 6
          neighbors, it will give birth to a new cell.
        </li>
        <li>
          <span className="font-bold">Domination:</span> When a new cell is
          born, it takes on the color of the dominant neighbor. If there are
          multiple dominant colors, one will be chosen randomly.
        </li>
        <li>
          <span className="font-bold">Conquest:</span> A live cell has a 20%
          chance to convert to its dominant neighbor color.
        </li>
      </ul>

      <h2 className="text-xl font-bold">Game Management Rules</h2>
      <ul className="pl-5">
        <li>
          <span className="font-bold">Game of Life Cycle:</span> The game board
          updates every 30 seconds, applying the core gameplay rules.
        </li>
        <li>
          <span className="font-bold">Slot Replenishment:</span> Active players
          receive one new slot every minute, up to a maximum of 25 slots.
        </li>
      </ul>

      <h2 className="text-xl font-bold">Player Interaction Rules</h2>
      <ul className="pl-5">
        <li>
          <span className="font-bold">Cell Placement:</span> Players can add
          cells to the board if they have available slots.
        </li>
        <li>
          <span className="font-bold">Cell Removal:</span> Players can remove
          their own cells from the board if they have an empty slot.
        </li>
        <li>
          <span className="font-bold">Initial Resources:</span> New players
          start with 25 slots and 0 score.
        </li>
      </ul>
    </div>
  ),
});
