import type { ReactNode } from "react";

interface Props {
  title: string;
  hint: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ title, hint, checked, disabled, onChange }: Props) {
  return (
    <label className={disabled ? "row dis" : "row"}>
      <span className="row-text">
        <b>{title}</b>
        <small>{hint}</small>
      </span>
      <span className="tg">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="sw" aria-hidden="true" />
      </span>
    </label>
  );
}
