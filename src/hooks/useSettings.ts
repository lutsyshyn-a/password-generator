import { useCallback, useEffect, useState } from "react";
import { GROUP_KEYS, LIMITS, type Mode, type PasswordOptions } from "../lib/generator";

export interface Settings extends PasswordOptions {
  mode: Mode;
  length: number;
  keyBytes: number;
  hexCount: number;
  phraseWords: number;
  hidden: boolean;
}

const KEY = "pwgen:v2";

const DEFAULTS: Settings = {
  mode: "pw",
  length: LIMITS.password.initial,
  keyBytes: LIMITS.key.initial,
  hexCount: LIMITS.hexCount.initial,
  phraseWords: LIMITS.phrase.initial,
  lower: true,
  upper: true,
  digits: true,
  symbols: false,
  extraSymbols: false,
  noAmbiguous: false,
  hidden: false,
};

function readLength(value: unknown, { min, max, initial }: typeof LIMITS.password) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : initial;
}

function load(): Settings {
  try {
    const current = localStorage.getItem(KEY);
    const raw = current ?? localStorage.getItem("pwgen:v1");
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Record<string, unknown> | null;
    if (!saved || typeof saved !== "object") return DEFAULTS;

    const s = { ...DEFAULTS };
    const { mode } = saved;
    if (mode === "hex" || mode === "b64" || mode === "phrase") s.mode = mode;
    s.length = readLength(saved.length, LIMITS.password);
    s.keyBytes = readLength(saved.keyBytes, LIMITS.key);
    s.hexCount = readLength(saved.hexCount, LIMITS.hexCount);
    s.phraseWords = readLength(saved.phraseWords, LIMITS.phrase);
    if (current === null && (mode === "hex" || mode === "b64")) {
      const bytes = mode === "hex" ? Math.ceil(s.length / 2) : Math.floor(s.length * 3 / 4);
      s.keyBytes = readLength(bytes, LIMITS.key);
    }
    for (const key of [...GROUP_KEYS, "noAmbiguous", "hidden"] as const) {
      const value = saved[key];
      if (typeof value === "boolean") s[key] = value;
    }
    if (!GROUP_KEYS.some((key) => s[key])) s.lower = true;
    return s;
  } catch {
    return DEFAULTS;
  }
}

/** Налаштування, які запам’ятовуються між візитами (самі паролі не зберігаються). */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* приватний режим або заборонене сховище — не критично */
    }
  }, [settings]);

  const set = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return [settings, set] as const;
}
