import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const usePlayer = () => {
  return useQuery({
    queryKey: ["player"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_PATH}api/player`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const data = await response.json();
      return data;
    },
    retry: false,
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_PATH}api/player`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ username }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        return data;
      }

      throw new Error(data.message);
    },
    onSuccess: async (data) => {
      await queryClient.setQueryData(["player"], data);
    },
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_PATH}api/player`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (response.ok) {
        return;
      }
      const data = await response.json();
      throw new Error(data.message);
    },
    onSuccess: async () => {
      await queryClient.setQueryData(["player"], {});
    },
  });
};
