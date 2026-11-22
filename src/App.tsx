import { useEffect, useMemo, useRef, useState } from "react";
import { HexCount } from "./components/HexCount";
import { LengthControl } from "./components/LengthControl";
import { OutputCard } from "./components/OutputCard";
import { Toggle } from "./components/Toggle";
import { useSettings } from "./hooks/useSettings";
import { copyText } from "./lib/clipboard";
import { GROUP_KEYS, LIMITS, PASSWORD_GROUPS, generate, generateHexBatch, type Mode, type PasswordGroup, type Result } from "./lib/generator";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "pw", label: "Пароль", hint: "Результат містить символи з кожного ввімкненого набору." },
  { id: "hex", label: "Hex-ключ", hint: "Два шістнадцяткові символи на кожен випадковий байт." },
  { id: "b64", label: "Base64URL", hint: "Випадкові байти в кодуванні Base64URL без доповнення «=»." },
  { id: "phrase", label: "Парольна фраза", hint: "Випадково вибрані англійські слова, розділені пробілами." },
];

const GROUP_LABELS: Record<PasswordGroup, string> = {
  lower: "Малі літери",
  upper: "Великі літери",
  digits: "Цифри",
  symbols: "Символи для URL",
  extraSymbols: "Додаткові спецсимволи",
};

const GROUP_HINTS: Record<PasswordGroup, string> = {
  lower: "a–z",
  upper: "A–Z",
  digits: "0–9",
  symbols: "- _ . ~",
  extraSymbols: PASSWORD_GROUPS.extraSymbols.split("").join(" "),
};

const LENGTH_CONTROLS = {
  length: { ...LIMITS.password, label: "Довжина в символах", presets: [16, 24, 32, 64, 128, 256] },
  keyBytes: { ...LIMITS.key, label: "Довжина в байтах", presets: [16, 24, 32, 64, 128, 192] },
  phraseWords: { ...LIMITS.phrase, label: "Кількість слів", presets: [6, 8, 10, 12] },
};

function downloadHexKeys(value: string) {
  const file = new Blob([value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hex-keys.txt";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [s, set] = useSettings();
  const [nonce, setNonce] = useState(0);
  const [copy, setCopy] = useState<{ result: Result; state: "ok" | "fail" } | null>(null);
  const copyRequest = useRef(0);
  const {
    mode, length, keyBytes, phraseWords, lower, upper, digits, symbols, extraSymbols, noAmbiguous,
  } = s;
  const keyCount = mode === "hex" ? s.hexCount : 1;

  const result = useMemo(() => {
    if (mode === "pw") {
      return generate({ mode, length, lower, upper, digits, symbols, extraSymbols, noAmbiguous });
    }
    if (mode === "phrase") return generate({ mode, words: phraseWords });
    if (mode === "hex") return generateHexBatch(keyBytes, keyCount);
    return generate({ mode, bytes: keyBytes });
  }, [mode, length, keyBytes, keyCount, phraseWords, lower, upper, digits, symbols, extraSymbols, noAmbiguous, nonce]);

  const regenerate = () => setNonce((n) => n + 1);

  const onCopy = async () => {
    if (!result) return;
    const request = ++copyRequest.current;
    const ok = await copyText(result.value);
    if (request === copyRequest.current) setCopy({ result, state: ok ? "ok" : "fail" });
  };

  useEffect(() => {
    if (!copy) return;
    const timer = window.setTimeout(() => setCopy(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copy]);

  const enabled = GROUP_KEYS.filter((key) => s[key]).length;
  const modeHint = MODES.find((m) => m.id === mode)?.hint;
  const lengthKey = mode === "pw" ? "length" : mode === "phrase" ? "phraseWords" : "keyBytes";

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
            isPhrase={mode === "phrase"}
            keyCount={keyCount}
            copyState={copy?.result === result ? copy.state : "idle"}
            onToggleHidden={() => set("hidden", !s.hidden)}
            onRegenerate={regenerate}
            onCopy={onCopy}
            onDownload={mode === "hex" && result ? () => downloadHexKeys(result.value) : undefined}
          />
        </div>

        <div className="col-settings">
          <section className="card">
            <div className="seg" role="group" aria-label="Тип результату">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={mode === m.id}
                  onClick={() => set("mode", m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="mode-hint">{modeHint}</p>
            <LengthControl
              key={lengthKey}
              {...LENGTH_CONTROLS[lengthKey]}
              value={s[lengthKey]}
              onChange={(v) => set(lengthKey, v)}
            />
            {mode === "hex" && (
              <HexCount value={s.hexCount} onChange={(value) => set("hexCount", value)} />
            )}
            {mode === "phrase" && (
              <p className="wordlist-credit">
                Словник <a href="https://www.eff.org/dice">EFF Long Wordlist</a>
                {" · "}<a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>
              </p>
            )}
          </section>

          {mode === "pw" && (
            <fieldset className="card opts">
              <legend className="sr-only">Набори символів</legend>
              {GROUP_KEYS.map((key) => (
                <Toggle
                  key={key}
                  title={GROUP_LABELS[key]}
                  hint={GROUP_HINTS[key]}
                  checked={s[key]}
                  disabled={s[key] && enabled === 1}
                  onChange={(value) => set(key, value)}
                />
              ))}
              <Toggle
                title="Без схожих символів"
                hint="Прибирає 0 O o 1 l I"
                checked={noAmbiguous}
                onChange={(value) => set("noAmbiguous", value)}
              />
            </fieldset>
          )}
        </div>
      </div>
    </div>
  );
}
