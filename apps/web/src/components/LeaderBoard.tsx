import { LeaderBoard as LeaderBoardType } from "@repo/types";

type Props = {
  leaders: LeaderBoardType;
};

export const LeaderBoard: React.FC<Props> = ({ leaders }) => {
  return (
    <div className="flex flex-col gap-2 p-2">
      <span className="text-lg font-bold">Leaderboard</span>
      {leaders.map((leader) => (
        <div key={leader.value} className="flex gap-2 items-center w-full">
          <div
            className="size-4 rounded-md"
            style={{
              backgroundColor: leader.color,
            }}
          ></div>
          <span className="font-semibold text-sm">{leader.score}</span>
          <span className="text-sm text-wrap break-words">{leader.value}</span>
        </div>
      ))}
    </div>
  );
};
