import { Grid } from "@repo/types";

export const generateUniqueColorFromUsername = (username: string) => {
  // Use a stronger hashing function (e.g., FNV-1a hash)
  let hash = 2166136261;
  for (let i = 0; i < username.length; i++) {
    hash ^= username.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash = hash >>> 0; // Convert to 32-bit unsigned integer
  }

  // Normalize the hash value to the range [0, 16777215] (maximum 6-digit hex value)
  hash = hash % 16777215;

  // Convert the hash value to a hexadecimal color code
  let color = "#" + hash.toString(16).padStart(6, "0");

  return color;
};

export const mixColors = (colors: string[]): string => {
  if (colors.length === 0) return "#000000";
  if (colors.length === 1) return colors[0];

  const rgb = colors.map((color) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return [r, g, b];
  });

  const avgRGB = rgb
    .reduce(
      (acc, val) => [acc[0] + val[0], acc[1] + val[1], acc[2] + val[2]],
      [0, 0, 0],
    )
    .map((val) => Math.round(val / colors.length));

  return `#${avgRGB.map((val) => val.toString(16).padStart(2, "0")).join("")}`;
};

export const runGameOfLife = (grid: Grid, size: number): Grid => {
  const newGrid: Grid = {};

  const getNeighbors = (x: number, y: number): [number, number][] => {
    const neighbors: [number, number][] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        let nx = (x + dx + size) % size;
        let ny = (y + dy + size) % size;
        neighbors.push([nx, ny]);
      }
    }
    return neighbors;
  };

  const countColorNeighbors = (
    x: number,
    y: number,
  ): Record<string, number> => {
    const colorCounts: Record<string, number> = {};
    getNeighbors(x, y).forEach(([nx, ny]) => {
      const color = grid[`${nx}:${ny}`];
      if (color) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }
    });
    return colorCounts;
  };

  const getDominantColors = (colorCounts: Record<string, number>): string[] => {
    const maxCount = Math.max(...Object.values(colorCounts));
    return Object.entries(colorCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([color, _]) => color);
  };

  const getDominantColorsForConquest = (
    colorCounts: Record<string, number>,
  ): string[] => {
    const validCounts = Object.fromEntries(
      Object.entries(colorCounts).filter(([_, count]) => count > 1),
    );
    if (Object.keys(validCounts).length === 0) return [];
    const maxCount = Math.max(...Object.values(validCounts));
    return Object.entries(validCounts)
      .filter(([_, count]) => count === maxCount)
      .map(([color, _]) => color);
  };

  const getRandomColor = (colors: string[]): string => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const key = `${x}:${y}`;
      const currentColor = grid[key];
      const colorNeighbors = countColorNeighbors(x, y);
      const totalNeighbors = Object.values(colorNeighbors).reduce(
        (sum, count) => sum + count,
        0,
      );

      // HighLife rules
      if (currentColor) {
        // Cell is alive
        if (totalNeighbors === 2 || totalNeighbors === 3) {
          // Cell survives
          newGrid[key] = currentColor;
        }
        // If totalNeighbors < 2 or > 3, cell dies (not added to newGrid)
      } else {
        // Cell is dead
        if (totalNeighbors === 3 || totalNeighbors === 6) {
          // New cell is born (HighLife rule)
          const dominantColors = getDominantColors(colorNeighbors);
          newGrid[key] = getRandomColor(dominantColors);
        }
      }
      // Conquest Rule: Chance to convert to dominant neighbor color
      if (newGrid[key]) {
        const dominantColors = getDominantColorsForConquest(colorNeighbors);
        const random = Math.random();
        if (
          dominantColors.length > 0 &&
          !dominantColors.includes(newGrid[key]) &&
          random < 0.2
        ) {
          newGrid[key] = getRandomColor(dominantColors);
        }
      }
    }
  }

  return newGrid;
};

export const changes = (oldGrid: Grid, newGrid: Grid) => {
  const scoreChanges: Record<string, number> = {};

  // Check for cells that have changed or been removed
  for (const [position, oldColor] of Object.entries(oldGrid)) {
    const newColor = newGrid[position];
    if (newColor === undefined) {
      // Cell died
      scoreChanges[oldColor] = (scoreChanges[oldColor] || 0) - 1;
    } else if (newColor !== oldColor) {
      // Cell changed color (taken over)
      scoreChanges[oldColor] = (scoreChanges[oldColor] || 0) - 1;
      scoreChanges[newColor] = (scoreChanges[newColor] || 0) + 1;
    }
    // If the cell hasn't changed, we don't need to do anything
  }

  // Check for new cells
  for (const [position, newColor] of Object.entries(newGrid)) {
    if (oldGrid[position] === undefined) {
      // New cell born
      scoreChanges[newColor] = (scoreChanges[newColor] || 0) + 1;
    }
  }

  return scoreChanges;
};
