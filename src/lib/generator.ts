import { WORDS } from "./wordlist.ts";

export type Mode = "pw" | "hex" | "b64" | "phrase";

export const PASSWORD_GROUPS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "-_.~",
  extraSymbols: "!@#$%^&*+=?",
};

export type PasswordGroup = keyof typeof PASSWORD_GROUPS;
export const GROUP_KEYS = Object.keys(PASSWORD_GROUPS) as PasswordGroup[];

export interface PasswordOptions extends Record<PasswordGroup, boolean> {
  noAmbiguous: boolean;
}

export type Options =
  | ({ mode: "pw"; length: number } & PasswordOptions)
  | { mode: "hex" | "b64"; bytes: number }
  | { mode: "phrase"; words: number };

export const LIMITS = {
  password: { min: 8, max: 256, initial: 24 },
  key: { min: 8, max: 192, initial: 32 },
  phrase: { min: 5, max: 12, initial: 6 },
};

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

function validateLength(length: number, { min, max }: { min: number; max: number }) {
  if (!Number.isInteger(length) || length < min || length > max) {
    throw new RangeError(`Expected a whole number between ${min} and ${max}`);
  }
}

export interface Result {
  value: string;
  bits: number;
}

function passwordBits(groups: string[], length: number): number {
  // Inclusion–exclusion counts the strings that contain every selected group.
  const alphabetSizes = groups.reduce(
    (subsets, group) => {
      const withGroup = subsets.map(({ size, sign }) => ({ size: size + group.length, sign: -sign }));
      return [...subsets, ...withGroup];
    },
    [{ size: 0, sign: groups.length % 2 === 0 ? 1 : -1 }],
  );
  const count = alphabetSizes.reduce(
    (total, { size, sign }) => total + BigInt(sign) * BigInt(size) ** BigInt(length),
    0n,
  );
  // Scale before converting to Number so long passwords cannot overflow.
  const shift = Math.max(0, count.toString(2).length - 53);
  return Math.log2(Number(count >> BigInt(shift))) + shift;
}

function generatePassword(o: Extract<Options, { mode: "pw" }>): Result | null {
  validateLength(o.length, LIMITS.password);
  const groups = GROUP_KEYS.filter((key) => o[key]).map((key) => {
    const chars = PASSWORD_GROUPS[key];
    return o.noAmbiguous ? chars.replace(AMBIGUOUS, "") : chars;
  });
  if (groups.length === 0) return null;

  const pool = groups.join("");
  const groupMasks = groups.flatMap((group, index) => Array<number>(group.length).fill(1 << index));
  const required = (1 << groups.length) - 1;
  let value: string;
  let seen: number;
  // Reject the whole candidate to preserve uniformity across valid passwords.
  do {
    value = "";
    seen = 0;
    for (let i = 0; i < o.length; i++) {
      const index = randomInt(pool.length);
      value += pool[index];
      seen |= groupMasks[index];
    }
  } while (seen !== required);

  return { value, bits: passwordBits(groups, o.length) };
}

export function generate(o: Options): Result | null {
  if (o.mode === "pw") return generatePassword(o);

  if (o.mode === "phrase") {
    validateLength(o.words, LIMITS.phrase);
    const value = Array.from({ length: o.words }, () => WORDS[randomInt(WORDS.length)]).join(" ");
    return { value, bits: o.words * Math.log2(WORDS.length) };
  }

  validateLength(o.bytes, LIMITS.key);
  const bytes = crypto.getRandomValues(new Uint8Array(o.bytes));
  const value = o.mode === "hex"
    ? Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
    : btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { value, bits: bytes.length * 8 };
}

export function strengthLevel(bits: number): { label: string; color: string } {
  if (bits < 60) return { label: "Слабкий", color: "#ff3b30" };
  if (bits < 80) return { label: "Середній", color: "#ff9f0a" };
  if (bits < 110) return { label: "Надійний", color: "#34c759" };
  return { label: "Дуже надійний", color: "#30b0c7" };
}
