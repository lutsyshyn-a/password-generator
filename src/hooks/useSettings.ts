import { useCallback, useEffect, useState } from "react";
import { MAX_LEN, MIN_LEN, type Mode } from "../lib/generator";

export interface Settings {
  mode: Mode;
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  noAmbiguous: boolean;
  hidden: boolean;
}

const KEY = "pwgen:v1";

const DEFAULTS: Settings = {
  mode: "pw",
  length: 24,
  lower: true,
  upper: true,
  digits: true,
  symbols: false,
  noAmbiguous: false,
  hidden: false,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const s = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
    if (!["pw", "hex", "b64"].includes(s.mode)) s.mode = "pw";
    s.length = Math.max(MIN_LEN, Math.min(MAX_LEN, Math.round(Number(s.length)) || DEFAULTS.length));
    if (!s.lower && !s.upper && !s.digits && !s.symbols) s.lower = true;
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
