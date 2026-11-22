import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LengthControl } from "./components/LengthControl";
import { OutputCard, type CopyState } from "./components/OutputCard";
import { Toggle } from "./components/Toggle";
import { useSettings } from "./hooks/useSettings";
import { copyText } from "./lib/clipboard";
import { SAFE_SYMBOLS, generate, type Mode } from "./lib/generator";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "pw", label: "Пароль", hint: "Літери, цифри та безпечні символи на ваш вибір." },
  { id: "hex", label: "Hex-ключ", hint: "Лише 0–9 і a–f. Підходить для ключів і токенів." },
  { id: "b64", label: "Base64URL", hint: "A–Z, a–z, 0–9, «-» і «_». Безпечно для URL." },
];

const UNSAFE = "$ & % ( ) { } [ ] \\ / ' \" ` < > | ; :";

export default function App() {
  const [s, set] = useSettings();
  const [nonce, setNonce] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);

  const result = useMemo(
    () =>
      generate({
        mode: s.mode,
        length: s.length,
        lower: s.lower,
        upper: s.upper,
        digits: s.digits,
        symbols: s.symbols,
        noAmbiguous: s.noAmbiguous,
      }),
    // nonce змушує створити нове значення при натисканні «Згенерувати»
    [s.mode, s.length, s.lower, s.upper, s.digits, s.symbols, s.noAmbiguous, nonce],
  );

  const regenerate = useCallback(() => setNonce((n) => n + 1), []);

  const onCopy = useCallback(async () => {
    if (!result) return;
    const ok = await copyText(result.value);
    navigator.vibrate?.(10);
    setCopyState(ok ? "ok" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopyState("idle"), 1600);
  }, [result]);

  // Гарячі клавіші працюють незалежно від розкладки (KeyR / KeyC).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "KeyR") regenerate();
      if (e.code === "KeyC") void onCopy();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate, onCopy]);

  // Не даємо вимкнути останній набір символів — результат ніколи не буде порожнім.
  const enabled = [s.lower, s.upper, s.digits, s.symbols].filter(Boolean).length;
  const lock = (on: boolean) => on && enabled === 1;
  const modeHint = MODES.find((m) => m.id === s.mode)?.hint;

  return (
    <div className="page">
      <header>
        <h1>Генератор паролів</h1>
        <p className="lead">
          Випадкові паролі та ключі. Усе створюється у вашому браузері й нікуди не надсилається.
        </p>
      </header>

      <div className="layout">
        <div className="col-result">
          <OutputCard
            result={result}
            hidden={s.hidden}
            copyState={copyState}
            onToggleHidden={() => set("hidden", !s.hidden)}
            onRegenerate={regenerate}
            onCopy={onCopy}
          />
        </div>

        <div className="col-settings">
          <section className="card">
            <div className="seg" role="group" aria-label="Тип результату">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={s.mode === m.id}
                  onClick={() => set("mode", m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mode-hint">{modeHint}</p>
            <LengthControl value={s.length} onChange={(v) => set("length", v)} />
          </section>

          <fieldset className="card opts" disabled={s.mode !== "pw"}>
            <legend className="sr-only">Набори символів</legend>
            <Toggle title="Малі літери" hint="a–z" checked={s.lower} disabled={lock(s.lower)} onChange={(v) => set("lower", v)} />
            <Toggle title="Великі літери" hint="A–Z" checked={s.upper} disabled={lock(s.upper)} onChange={(v) => set("upper", v)} />
            <Toggle title="Цифри" hint="0–9" checked={s.digits} disabled={lock(s.digits)} onChange={(v) => set("digits", v)} />
            <Toggle
              title="Безпечні символи"
              hint={
                <>
                  <code>{SAFE_SYMBOLS.split("").join(" ")}</code> — працюють в URL, консолі, JSON і формах
                </>
              }
              checked={s.symbols}
              disabled={lock(s.symbols)}
              onChange={(v) => set("symbols", v)}
            />
            <Toggle
              title="Без схожих символів"
              hint="Прибирає 0 O o 1 l I"
              checked={s.noAmbiguous}
              onChange={(v) => set("noAmbiguous", v)}
            />
          </fieldset>

          <p className="note">
            Символи {UNSAFE} свідомо не використовуються: вони ламають форми, скрипти та URL.
            Генерація йде через Web Crypto, налаштування зберігаються лише на вашому пристрої.
          </p>
        </div>
      </div>
    </div>
  );
}
