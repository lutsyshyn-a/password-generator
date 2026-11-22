import { useEffect, useState, type CSSProperties } from "react";

interface Props {
  value: number;
  min: number;
  max: number;
  label: string;
  presets: number[];
  onChange: (value: number) => void;
}

export function LengthControl({ value, min, max, label, presets, onChange }: Props) {
  // Окремий текстовий стан, щоб можна було спокійно набирати «1», «16», «128».
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const onType = (text: string) => {
    const clean = text.replace(/\D/g, "");
    setDraft(clean);
    const n = parseInt(clean, 10);
    if (n >= min && n <= max) onChange(n);
  };

  const commit = () => {
    const n = draft === "" ? value : Math.max(min, Math.min(max, Number(draft)));
    setDraft(String(n));
    onChange(n);
  };

  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="len">
        <label htmlFor="rng">{label}</label>
        <input
          className="num"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          onChange={(e) => onType(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label={`${label}, числом від ${min} до ${max}`}
        />
      </div>
      <input
        id="rng"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        style={{ "--p": `${progress}%` } as CSSProperties}
        onChange={(e) => onChange(+e.target.value)}
      />
      <div className="scale" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <div className="presets" role="group" aria-label="Швидкий вибір довжини">
        {presets.map((p) => (
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
