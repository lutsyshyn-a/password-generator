import { useState } from "react";
import { LIMITS } from "../lib/generator";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function HexCount({ value, onChange }: Props) {
  const [draft, setDraft] = useState(String(value));
  const { min, max } = LIMITS.hexCount;
  const rangeHint = `Від ${min} до ${max} ключів`;
  const count = Number(draft);
  const valid = /^\d+$/.test(draft) && count >= min && count <= max;

  return (
    <div className="hex-count">
      <div className="len">
        <label htmlFor="hex-count">Кількість ключів</label>
        <input
          id="hex-count"
          className="num"
          type="text"
          inputMode="numeric"
          aria-describedby="hex-count-range"
          aria-invalid={!valid && draft !== ""}
          value={draft}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setDraft(next);
            const amount = Number(next);
            if (/^\d+$/.test(next) && amount >= min && amount <= max) onChange(amount);
          }}
          onBlur={() => setDraft(String(value))}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
        />
      </div>
      <p id="hex-count-range" className="hex-note">
        {valid || draft === "" ? rangeHint : `Введіть ціле число від ${min} до ${max}.`}
      </p>
    </div>
  );
}
