import type { KeyboardEvent } from "react";
import { strengthLevel, type Result } from "../lib/generator";

interface Props {
  result: Result | null;
  hidden: boolean;
  isPhrase: boolean;
  keyCount: number;
  copyState: "idle" | "ok" | "fail";
  onToggleHidden: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onDownload?: () => void;
}

function activateShortcut(event: KeyboardEvent<HTMLButtonElement>, code: string, action: () => void) {
  if (event.code !== code || event.repeat || event.nativeEvent.isComposing ||
      event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  action();
}

export function OutputCard({
  result, hidden, isPhrase, keyCount, copyState, onToggleHidden, onRegenerate, onCopy, onDownload,
}: Props) {
  const batch = keyCount > 1;
  const previewCount = Math.min(keyCount, 10);
  const level = result ? strengthLevel(result.bits) : null;
  const bits = result ? Math.floor(result.bits) : 0;
  const strength = level ? `${level.label} · ${bits} біт${batch ? " на ключ" : ""}` : "";

  const copyLabel =
    copyState === "ok" ? "Скопійовано" : copyState === "fail" ? "Не вдалося скопіювати" : batch ? "Скопіювати всі" : "Скопіювати";

  return (
    <section className="card result" aria-label="Результат">
      <div className="out-head">
        <span className="out-title">Результат</span>
        <button type="button" className="link" onClick={onToggleHidden} disabled={!result}>
          {hidden ? "Показати" : "Сховати"}
        </button>
      </div>

      <div
        className={`out${hidden ? " masked" : ""}${isPhrase ? " phrase" : ""}${batch ? " batch-preview" : ""}`}
        role={batch && !hidden ? "region" : undefined}
        aria-label={batch && !hidden ? "Попередній перегляд Hex-ключів" : undefined}
        tabIndex={batch && !hidden ? 0 : undefined}
      >
        {!result ? (
          <span className="empty">Увімкніть хоча б один набір символів</span>
        ) : hidden ? (
          <>
            <span aria-hidden="true">{"•".repeat(batch ? result.value.indexOf("\n") : result.value.length)}</span>
            <span className="sr-only">Результат приховано</span>
          </>
        ) : batch ? result.value.split("\n", previewCount).join("\n") : isPhrase ? result.value : (
          [...result.value].map((c, i) => (
            <span key={i} className={/[0-9]/.test(c) ? "d" : /[A-Za-z]/.test(c) ? undefined : "s"}>
              {c}
            </span>
          ))
        )}
      </div>
      {batch && !hidden && previewCount < keyCount && (
        <p className="hex-note">Показано {previewCount} із {keyCount} ключів.</p>
      )}

      <div className="meter">
        <div
          className="bar"
          role="meter"
          aria-label="Надійність"
          aria-valuemin={0}
          aria-valuemax={128}
          aria-valuenow={Math.min(128, bits)}
          aria-valuetext={strength}
        >
          <i style={{ width: `${Math.min(100, bits / 1.28)}%`, background: level?.color }} />
        </div>
        <span>{strength}</span>
      </div>

      <div className="actions">
        <button
          type="button"
          className="btn sec"
          aria-keyshortcuts="R"
          onKeyDown={(event) => activateShortcut(event, "KeyR", onRegenerate)}
          onClick={onRegenerate}
        >
          Згенерувати
        </button>
        <button
          type="button"
          className={copyState === "ok" ? "btn pri ok" : "btn pri"}
          aria-keyshortcuts="C"
          onKeyDown={(event) => activateShortcut(event, "KeyC", onCopy)}
          onClick={onCopy}
          disabled={!result}
        >
          {copyLabel}
        </button>
      </div>

      {onDownload && (
        <button type="button" className="btn sec download" onClick={onDownload}>
          Завантажити TXT
        </button>
      )}
      <p className="hint">На відповідній кнопці натисніть R для генерації або C для копіювання.</p>
      <span className="sr-only" role="status">
        {copyState === "ok" ? "Скопійовано в буфер обміну" : copyState === "fail" ? copyLabel : ""}
      </span>
    </section>
  );
}
