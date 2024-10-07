import { ChangeEvent, FC, useCallback } from "react";
import { cn } from "./utils";
import { buttonVariants } from "./Button";

type Props = {
  value?: string;
  onChange?: (color: string) => void;
};

export const ColorPicker: FC<Props> = ({ value, onChange }) => {
  const handleColorChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;

      onChange?.(newColor);
    },
    [onChange],
  );

  return (
    <div className={cn(buttonVariants({ variant: "outline" }))}>
      <input
        type="color"
        value={value}
        onChange={handleColorChange}
        className="w-6 h-6 rounded-md"
      />
    </div>
  );
};
