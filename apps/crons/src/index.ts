import { createClient } from "redis";
import { runGameOfLife, changes } from "@repo/utils";
import { deepEquals } from "bun";
import { CronJob } from "cron";

const REDIS_URL = Bun.env.REDIS_URL;
const GAME_OF_LIFE_ROUNDS = +(Bun.env.GAME_OF_LIFE_ROUNDS ?? "1");
const GRID_SIZE = +(Bun.env.GRID_SIZE ?? "100");
const GOL_INTERVAL = +(Bun.env.GOL_INTERVAL ?? "30");

const redisClient = createClient({
  url: REDIS_URL,
});

const pubClient = redisClient.duplicate();

redisClient.on("error", (err) => console.error("Redis client error:", err));
pubClient.on("error", (err) => console.error("Redis pub client error:", err));

await redisClient.connect();
await pubClient.connect();

const job = CronJob.from({
  cronTime: `*/${GOL_INTERVAL} * * * * *`,
  onTick: async () => {
    await startGameOfLifeCycle();
  },
  start: true,
});

async function startGameOfLifeCycle() {
  await pubClient.publish(
    "gameOfLife",
    JSON.stringify({ type: "gameOfLifeStart" }),
  );

  for (let i = 0; i < GAME_OF_LIFE_ROUNDS; i++) {
    const grid = await redisClient.hGetAll("cellGrid");
    if (!grid || Object.keys(grid).length === 0) break;

    const newGrid = runGameOfLife(grid, GRID_SIZE);
    if (deepEquals(grid, newGrid)) break;
    const scoreChanges = changes(grid, newGrid);
    const users = await redisClient.hGetAll("users");
    const pipeline = redisClient.multi();
    pipeline.del("cellGrid");

    if (Object.keys(newGrid).length > 0) {
      pipeline.hSet("cellGrid", newGrid);
    }

    Object.entries(users).forEach(([username, color]) => {
      pipeline.zIncrBy("userScores", scoreChanges[color] || 0, username);
    });

    await pipeline.exec();

    await pubClient.publish(
      "gameOfLife",
      JSON.stringify({
        type: "gameOfLifeUpdate",
        grid: newGrid,
        scoreChanges,
      }),
    );

    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  pubClient.publish("gameOfLife", JSON.stringify({ type: "gameOfLifeEnd" }));
  await redisClient.set("nextCycle", job.nextDate().toMillis());
  pubClient.publish("nextCycle", "");
}
