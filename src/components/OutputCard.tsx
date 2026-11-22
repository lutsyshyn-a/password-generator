import { strengthLevel, type Result } from "../lib/generator";

export type CopyState = "idle" | "ok" | "fail";

interface Props {
  result: Result | null;
  hidden: boolean;
  copyState: CopyState;
  onToggleHidden: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
}

export function OutputCard({ result, hidden, copyState, onToggleHidden, onRegenerate, onCopy }: Props) {
  const level = result ? strengthLevel(result.bits) : null;
  const bits = result ? Math.round(result.bits) : 0;

  const copyLabel =
    copyState === "ok" ? "Скопійовано" : copyState === "fail" ? "Не вдалося скопіювати" : "Скопіювати";

  return (
    <section className="card result" aria-label="Результат">
      <div className="out-head">
        <span className="out-title">Результат</span>
        <button type="button" className="link" onClick={onToggleHidden} disabled={!result}>
          {hidden ? "Показати" : "Сховати"}
        </button>
      </div>

      <div className={hidden ? "out masked" : "out"}>
        {!result ? (
          <span className="empty">Увімкніть хоча б один набір символів</span>
        ) : hidden ? (
          "•".repeat(result.value.length)
        ) : (
          [...result.value].map((c, i) => (
            <span key={i} className={/[0-9]/.test(c) ? "d" : /[A-Za-z]/.test(c) ? undefined : "s"}>
              {c}
            </span>
          ))
        )}
      </div>

      <div className="meter">
        <div
          className="bar"
          role="meter"
          aria-label="Надійність"
          aria-valuemin={0}
          aria-valuemax={128}
          aria-valuenow={Math.min(128, bits)}
        >
          <i style={{ width: `${Math.min(100, bits / 1.28)}%`, background: level?.color }} />
        </div>
        <span>{level ? `${level.label} · ${bits} біт` : ""}</span>
      </div>

      <div className="actions">
        <button type="button" className="btn sec" onClick={onRegenerate}>
          Згенерувати
        </button>
        <button type="button" className={copyState === "ok" ? "btn pri ok" : "btn pri"} onClick={onCopy} disabled={!result}>
          {copyLabel}
        </button>
      </div>

      <p className="hint">Клавіші: R — згенерувати знову, C — скопіювати.</p>
      <span className="sr-only" role="status">
        {copyState === "ok" ? "Скопійовано в буфер обміну" : ""}
      </span>
    </section>
  );
}
