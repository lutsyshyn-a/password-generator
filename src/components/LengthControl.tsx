import { useEffect, useState, type CSSProperties } from "react";
import { MAX_LEN, MIN_LEN } from "../lib/generator";

const PRESETS = [16, 24, 32, 64, 128, 256];
const clamp = (n: number) => Math.max(MIN_LEN, Math.min(MAX_LEN, Math.round(n)));

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export function LengthControl({ value, onChange }: Props) {
  // Окремий текстовий стан, щоб можна було спокійно набирати «1», «16», «128».
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const onType = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, 3);
    setDraft(clean);
    const n = parseInt(clean, 10);
    if (n >= MIN_LEN && n <= MAX_LEN) onChange(n);
  };

  const commit = () => {
    const n = clamp(parseInt(draft, 10) || MIN_LEN);
    setDraft(String(n));
    onChange(n);
  };

  const progress = ((value - MIN_LEN) / (MAX_LEN - MIN_LEN)) * 100;

  return (
    <div>
      <div className="len">
        <label htmlFor="rng">Довжина</label>
        <input
          className="num"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => onType(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label={`Довжина числом, від ${MIN_LEN} до ${MAX_LEN}`}
        />
      </div>
      <input
        id="rng"
        type="range"
        min={MIN_LEN}
        max={MAX_LEN}
        step={1}
        value={value}
        style={{ "--p": `${progress}%` } as CSSProperties}
        onChange={(e) => onChange(+e.target.value)}
      />
      <div className="scale" aria-hidden="true">
        <span>{MIN_LEN}</span>
        <span>{MAX_LEN}</span>
      </div>
      <div className="presets" role="group" aria-label="Швидкий вибір довжини">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="chip"
            aria-pressed={value === p}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
