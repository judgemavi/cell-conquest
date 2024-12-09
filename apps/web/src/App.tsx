import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { usePlayer } from "./utils/hooks";
import { useEffect } from "react";

const router = createRouter({
  routeTree,
  context: {
    guest: true,
  },
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const App = () => {
  const { data: player } = usePlayer();

  useEffect(() => {
    router.invalidate();
  }, [player]);

  return (
    <RouterProvider
      router={router}
      context={{
        username: player?.username,
        color: player?.color,
        guest: !player?.username,
      }}
    />
  );
};
