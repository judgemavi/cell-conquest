import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { createClient } from 'redis';
import { generateUniqueColorFromUsername } from '@repo/utils';
import { cron, Patterns } from '@elysiajs/cron';
import { cors } from '@elysiajs/cors';
import { addYears, differenceInMilliseconds, min, sub } from 'date-fns';

const GRID_SIZE = +(Bun.env.GRID_SIZE ?? '100');
const INITIAL_SLOTS = +(Bun.env.INITIAL_SLOTS ?? '25');
const INITIAL_SCORE = +(Bun.env.INITIAL_SCORE ?? '0');
const REDIS_URL = Bun.env.REDIS_URL;
const FRONTEND_URL = Bun.env.FRONTEND_URL;
const BASE_PATH = Bun.env.BASE_PATH;

const redisClient = createClient({
  url: REDIS_URL,
});
const subClient = redisClient.duplicate();
const pubClient = redisClient.duplicate();
redisClient.on('error', (err) => console.error('Redis client error:', err));
subClient.on('error', (err) => console.error('Redis sub client error:', err));
pubClient.on('error', (err) => console.error('Redis pub client error:', err));

await redisClient.connect();
await subClient.connect();
await pubClient.connect();

subClient.subscribe('gameOfLife', async (message) => {
  const { type } = JSON.parse(message);
  if (type === 'gameOfLifeUpdate') {
    const leaders = await getLeaders();
    app.server?.publish(
      'gameOfLifeUpdate',
      JSON.stringify({
        type: 'gameOfLifeUpdate',
        grid: JSON.parse(message).grid,
        leaders,
      })
    );
    Array.from(clients)
      .filter(([_, client]) => !client.guest)
      .forEach(async ([username, client]) => {
        client.send(
          JSON.stringify({
            type: 'scoreUpdate',
            score: await redisClient.zScore('userScores', username),
          })
        );
      });
  } else {
    app.server?.publish(type, message);
  }
});

subClient.subscribe('activePlayers', async () => {
  app.server?.publish(
    'activePlayers',
    JSON.stringify({
      type: 'activePlayers',
      players: await redisClient.zCount('activePlayers', 1, 1),
    })
  );
});

subClient.subscribe('addCell', async (message) => {
  const { type, x, y, username, color, score, slots, leaders } =
    JSON.parse(message);
  const currentClient = clients.get(username);
  if (currentClient) {
    currentClient.send(
      JSON.stringify({
        type: 'addCell',
        x,
        y,
        color,
        score,
        slots,
        leaders,
      })
    );
  }

  Array.from(clients)
    .filter(([client]) => client !== username)
    .forEach(([_, ws]) => {
      ws.send(JSON.stringify({ type: 'addCell', x, y, color, leaders }));
    });
});

subClient.subscribe('removeCell', async (message) => {
  const { type, x, y, username, score, slots, leaders } = JSON.parse(message);
  const currentClient = clients.get(username);
  if (currentClient) {
    currentClient.send(
      JSON.stringify({
        type: 'removeCell',
        x,
        y,
        score,
        slots,
        leaders,
      })
    );
  }

  Array.from(clients)
    .filter(([client]) => client !== username)
    .forEach(([_, ws]) => {
      ws.send(JSON.stringify({ type: 'removeCell', x, y, leaders }));
    });
});

subClient.subscribe('nextCycle', async () => {
  const nextCycle = await redisClient.get('nextCycle');
  app.server?.publish(
    'gameOfLifeNextCycle',
    JSON.stringify({
      type: 'gameOfLifeNextCycle',
      nextCycle,
    })
  );
});

const clients: Map<
  string,
  {
    send: (message: string) => void;
    guest: boolean;
    lastPing: Date;
  }
> = new Map();

const app = new Elysia()
  .use(
    cors({
      origin: ({ url }) => {
        const allowedOrigins = (FRONTEND_URL ?? '').split('|');
        return allowedOrigins.some((origin) => {
          const check = new RegExp(
            `^(?:[\\w-]+\\.)?${origin.replace('.', '\\.')}$`
          ).test(url);
          return check;
        });
      },
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: 'very basic secrent',
    })
  )
  .use(
    cron({
      name: 'ping',
      pattern: Patterns.everySenconds(30),
      run: async () => {
        const timestamp = new Date();
        app.server?.publish(
          'ping',
          JSON.stringify({
            type: 'ping',
            timestamp,
          })
        );
        Array.from(clients).forEach(([username, client]) => {
          if (!client.guest) {
            clients.set(username, {
              ...client,
              lastPing: timestamp,
            });
          }
        });
      },
    })
  )
  .use(
    cron({
      name: 'replenishment',
      pattern: Patterns.everyMinute(),
      run: async () => {
        const currentTime = new Date();
        const activeUsers = Array.from(clients.entries()).filter(
          ([_, client]) =>
            !client.guest &&
            client.lastPing &&
            differenceInMilliseconds(currentTime, client.lastPing) <= 90000
        );
        const usersWithOpenSlots = await redisClient.zRangeByScore(
          'userSlots',
          25,
          25
        );
        activeUsers
          .filter(([username]) => !usersWithOpenSlots.includes(username))
          .forEach(async ([username, { send }]) => {
            await redisClient.zIncrBy('userSlots', 1, username);
            send(
              JSON.stringify({
                type: 'replenishSlot',
                slots: await redisClient.zScore('userSlots', username),
              })
            );
          });
      },
    })
  )
  .get(`${BASE_PATH}api/health`, () => {
    return { status: 'ok' };
  })
  .post(
    `${BASE_PATH}api/player`,
    async ({ body, cookie: { sessionToken }, jwt, set }) => {
      const { username } = body;
      const color = generateUniqueColorFromUsername(username);
      const userExists = await redisClient.hExists('users', username);
      if (userExists) {
        set.status = 400;
        throw new Error('Username already exists');
      }
      try {
        const commands = redisClient.multi();
        commands.hSet('users', username, color);
        commands.zAdd('userSlots', {
          score: INITIAL_SLOTS,
          value: username,
        });
        commands.zAdd('userScores', {
          score: INITIAL_SCORE,
          value: username,
        });
        await commands.exec();
      } catch (error) {
        set.status = 400;
        throw new Error('Error creating user');
      }
      sessionToken.set({
        value: await jwt.sign({ username }),
        sameSite: 'lax',
        expires: addYears(new Date(), 100),
        secure: true,
        path: '/',
      });
      return {
        color,
        username,
      };
    },
    {
      body: t.Object({
        username: t.String({
          minLength: 4,
          maxLength: 16,
        }),
      }),
    }
  )
  .get(
    `${BASE_PATH}api/player`,
    async ({ jwt, cookie: { sessionToken } }) => {
      const deocded = await jwt.verify(sessionToken.value);

      if (!deocded) {
        throw new Error('Invalid session token');
      }

      const color = await redisClient.hGet('users', `${deocded['username']}`);
      return {
        username: deocded['username'],
        color,
      };
    },
    {
      cookie: t.Cookie({
        sessionToken: t.String({
          error: 'Session token is required',
        }),
      }),
    }
  )
  .delete(
    `${BASE_PATH}api/player`,
    async ({ jwt, cookie: { sessionToken }, set }) => {
      const deocded = await jwt.verify(sessionToken.value);

      if (!deocded) {
        throw new Error('Invalid session token');
      }
      try {
        const username = deocded['username'] as string;
        const commands = redisClient.multi();
        // commands.hDel('users', username);
        commands.zRem('userSlots', username);
        await commands.exec();
        sessionToken.remove();
      } catch (error) {
        set.status = 400;
        throw new Error('Error deleting user');
      }
    }
  )
  .ws(`${BASE_PATH}ws/guest`, {
    open: async ({ id, send, subscribe }) => {
      const [grid, leaders] = await Promise.all([
        redisClient.hGetAll('cellGrid'),
        getLeaders(),
      ]);
      clients.set(id, { send, guest: true, lastPing: new Date() });
      send(
        JSON.stringify({
          type: 'gameOfLifeNextCycle',
          nextCycle: await redisClient.get('nextCycle'),
        })
      );
      send(
        JSON.stringify({
          type: 'activePlayers',
          players: await redisClient.zCount('activePlayers', 1, 1),
        })
      );
      subscribe('gameOfLifeUpdate');
      subscribe('gameOfLifeNextCycle');
      subscribe('activePlayers');
      subscribe('ping');
      send({
        type: 'initialState',
        grid,
        size: GRID_SIZE,
        leaders,
      });
    },
    close: (ws) => {
      clients.delete(ws.id);
    },
    idleTimeout: 60,
  
  })
  .ws(`${BASE_PATH}ws/player`, {
    query: t.Object({
      sessionToken: t.String(),
    }),
    body: t.Object({
      type: t.Union([t.Literal('addCell'), t.Literal('removeCell')]),
      x: t.Number(),
      y: t.Number(),
    }),
    beforeHandle: async ({ jwt, query }) => {
      const { sessionToken } = query;
      const decoded = await jwt.verify(sessionToken);
      if (!decoded) {
        throw new Error('Invalid session token');
      }
      query.sessionToken = decoded['username'] as string;
    },
    open: async ({ data, send, subscribe }) => {
      const { sessionToken: username } = data.query;
      const commands = redisClient.multi();
      commands.hGetAll('cellGrid');
      commands.zScore('userSlots', username);
      commands.zScore('userScores', username);
      const [[grid, slots, score], leaders] = await Promise.all([
        commands.exec(),
        getLeaders(),
      ]);
      subscribe('gameOfLifeUpdate');
      subscribe('gameOfLifeStart');
      subscribe('gameOfLifeEnd');
      subscribe('gameOfLifeNextCycle');
      subscribe('ping');
      send(
        JSON.stringify({
          type: 'gameOfLifeNextCycle',
          nextCycle: await redisClient.get('nextCycle'),
        })
      );
      clients.set(username, { send, guest: false, lastPing: new Date() });
      await redisClient.zRem('activePlayers', username);
      await redisClient.zAdd('activePlayers', {
        score: 1,
        value: username,
      });
      subscribe('activePlayers');
      redisClient.publish('activePlayers', '');
      send({
        type: 'initialState',
        grid,
        size: GRID_SIZE,
        totalSlots: INITIAL_SLOTS,
        leaders,
        slots,
        score,
      });
    },
    message: async (
      {
        data: {
          query: { sessionToken },
        },
      },
      message
    ) => {
      try {
        const { type, x, y } = message;
        if (type === 'addCell') {
          await addCell(x, y, sessionToken);
        } else {
          await removeCell(x, y, sessionToken);
        }
      } catch (error) {
        console.error(error);
      }
    },
    close: async ({ data }) => {
      const { sessionToken: username } = data.query;
      clients.delete(username);
      await redisClient.zRem('activePlayers', username);
      redisClient.publish('activePlayers', '');
    },
    idleTimeout: 60,
  })
  .listen(3000);

const getLeaders = async () => {
  const leaders = await redisClient.zRangeWithScores('userScores', 0, 9, {
    REV: true,
  });
  if (leaders.length === 0) return [];
  const leadersWithScores = leaders.filter((leader) => leader.score !== 0);
  if (leadersWithScores.length === 0) return [];
  const colors = await redisClient.hmGet(
    'users',
    leadersWithScores.map((leader) => leader.value as string)
  );
  return leadersWithScores.map((leader, idx) => ({
    value: leader.value,
    score: leader.score,
    color: colors[idx],
  }));
};

const cleanUpUsers = async (): Promise<string[]> => {
  const commands = redisClient.multi();
  commands.zRangeByScore('userScores', 0, 0);
  commands.zRangeByScore('userSlots', 0, 0);
  const [scores, slots] = await commands.exec();
  if (!scores || !slots) return [];
  const usersToRemove = (scores as unknown as string[]).filter((member) =>
    (slots as unknown as string[]).includes(member)
  );
  usersToRemove.forEach((member) => {
    commands.zRem('userScores', member);
    commands.zRem('userSlots', member);
    commands.hDel('users', member);
    commands.hDel('sessionToken', member);
  });
  await commands.exec();
  return usersToRemove;
};

const addCell = async (x: number, y: number, username: string) => {
  const commands = redisClient.multi();
  const userColor = await redisClient.hGet('users', username);
  if (!userColor) {
    throw new Error('Invalid user');
  }

  const currentColor = await redisClient.hGet('cellGrid', `${x}:${y}`);

  if (currentColor) {
    throw new Error('Cell already occupied');
  }

  const slots = await redisClient.zScore('userSlots', username);
  if (!slots || slots <= 0) {
    throw new Error('No slots remaining');
  }
  commands.hSet('cellGrid', `${x}:${y}`, userColor);
  commands.zIncrBy('userSlots', -1, username);
  commands.zIncrBy('userScores', 1, username);
  await commands.exec();
  const [userscore, userSlots, leaders] = await Promise.all([
    redisClient.zScore('userScores', username),
    redisClient.zScore('userSlots', username),
    getLeaders(),
  ]);

  pubClient.publish(
    'addCell',
    JSON.stringify({
      type: 'addCell',
      x,
      y,
      username,
      color: userColor,
      score: userscore,
      slots: userSlots,
      leaders,
    })
  );
};

const removeCell = async (x: number, y: number, username: string) => {
  const userColor = await redisClient.hGet('users', username);
  if (!userColor) {
    throw new Error('Invalid user');
  }

  const currentColor = await redisClient.hGet('cellGrid', `${x}:${y}`);

  if (!currentColor || currentColor !== userColor) {
    throw new Error('Cannot remove this cell');
  }

  const slots = await redisClient.zScore('userSlots', username);

  if ((slots || 0) + 1 > INITIAL_SLOTS) {
    throw new Error('Cannot remove this cell');
  }

  const commands = redisClient.multi();
  commands.hDel('cellGrid', `${x}:${y}`);
  commands.zIncrBy('userSlots', 1, username);
  commands.zIncrBy('userScores', -1, username);
  await commands.exec();
  const [userscore, userSlots, leaders] = await Promise.all([
    redisClient.zScore('userScores', username),
    redisClient.zScore('userSlots', username),
    getLeaders(),
  ]);

  pubClient.publish(
    'removeCell',
    JSON.stringify({
      type: 'removeCell',
      x,
      y,
      username,
      score: userscore,
      slots: userSlots,
      leaders,
    })
  );
};
