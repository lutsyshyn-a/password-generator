export type Mode = "pw" | "hex" | "b64";

export interface Options {
  mode: Mode;
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  noAmbiguous: boolean;
}

export const MIN_LEN = 8;
export const MAX_LEN = 256;

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
// Unreserved-символи з RFC 3986: безпечні в URL, консолі, JSON і формах.
export const SAFE_SYMBOLS = "-_.~";
const AMBIGUOUS = /[0O1lIo]/g;

/** Рівномірне випадкове число 0..n-1 без зміщення (rejection sampling). */
function randomInt(n: number): number {
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= max);
  return buf[0] % n;
}

function charGroups(o: Options): string[] {
  if (o.mode === "hex") return ["0123456789abcdef"];
  if (o.mode === "b64") return [LOWER + UPPER + DIGITS + "-_"];
  const groups: string[] = [];
  const add = (enabled: boolean, set: string) => {
    if (!enabled) return;
    const s = o.noAmbiguous ? set.replace(AMBIGUOUS, "") : set;
    if (s) groups.push(s);
  };
  add(o.lower, LOWER);
  add(o.upper, UPPER);
  add(o.digits, DIGITS);
  add(o.symbols, SAFE_SYMBOLS);
  return groups;
}

export interface Result {
  value: string;
  bits: number;
}

/** Повертає null, якщо не вибрано жодного набору символів. */
export function generate(o: Options): Result | null {
  const groups = charGroups(o);
  if (groups.length === 0) return null;

  const pool = groups.join("");
  const chars: string[] = [];

  // У режимі пароля гарантуємо хоча б один символ з кожного вибраного набору.
  if (o.mode === "pw") {
    for (const g of groups) chars.push(g[randomInt(g.length)]);
  }
  while (chars.length < o.length) chars.push(pool[randomInt(pool.length)]);

  // Перемішування Фішера — Єйтса.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return { value: chars.join(""), bits: o.length * Math.log2(pool.length) };
}

export function strengthLevel(bits: number): { label: string; color: string } {
  if (bits < 60) return { label: "Слабкий", color: "#ff3b30" };
  if (bits < 80) return { label: "Середній", color: "#ff9f0a" };
  if (bits < 110) return { label: "Надійний", color: "#34c759" };
  return { label: "Дуже надійний", color: "#30b0c7" };
}
