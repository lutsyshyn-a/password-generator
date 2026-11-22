import assert from "node:assert/strict";
import test from "node:test";
import { generate, LIMITS, PASSWORD_GROUPS } from "../src/lib/generator.ts";
import { WORDS } from "../src/lib/wordlist.ts";

const passwordOptions = {
  mode: "pw",
  length: 8,
  lower: true,
  upper: false,
  digits: false,
  symbols: false,
  extraSymbols: false,
  noAmbiguous: false,
};

test("password includes every enabled group and omits ambiguous characters", () => {
  const options = {
    ...passwordOptions,
    upper: true,
    digits: true,
    symbols: true,
    extraSymbols: true,
    noAmbiguous: true,
  };
  for (let i = 0; i < 32; i++) {
    const { value } = generate(options);
    assert.equal(value.length, options.length);
    assert.doesNotMatch(value, /[0O1lIo]/);
    for (const alphabet of Object.values(PASSWORD_GROUPS)) {
      assert.ok([...value].some((char) => alphabet.includes(char)));
    }
  }
});

test("password entropy counts only strings containing every enabled group", () => {
  const { bits } = generate({ ...passwordOptions, digits: true });
  const validStrings = 36 ** 8 - 26 ** 8 - 10 ** 8;
  assert.ok(Math.abs(bits - Math.log2(validStrings)) < 1e-12);
});

test("one password group remains uniform and entropy stays finite at maximum length", () => {
  const length = LIMITS.password.max;
  const { value, bits } = generate({ ...passwordOptions, length });
  assert.equal(value.length, length);
  assert.match(value, /^[a-z]+$/);
  assert.ok(Math.abs(bits - length * Math.log2(26)) < 1e-12);
});

test("password with no groups returns no result", () => {
  assert.equal(generate({ ...passwordOptions, lower: false }), null);
});

test("Hex and Base64URL decode to the requested byte length and round-trip canonically", () => {
  for (const [mode, encoding] of [["hex", "hex"], ["b64", "base64url"]]) {
    for (const bytes of [LIMITS.key.min, 8, 9, 10, 31, 32, 33, LIMITS.key.max]) {
      const { value, bits } = generate({ mode, bytes });
      const decoded = Buffer.from(value, encoding);
      assert.equal(decoded.length, bytes);
      assert.equal(decoded.toString(encoding), value);
      assert.equal(bits, bytes * 8);
    }
  }
});

test("passphrase draws from 7,776 distinct words with unambiguous separators", () => {
  const wordSet = new Set(WORDS);
  assert.equal(WORDS.length, 7776);
  assert.equal(wordSet.size, WORDS.length);
  assert.ok(WORDS.every((word) => /^[a-z]+(?:-[a-z]+)*$/.test(word)));
  const words = LIMITS.phrase.initial;
  const { value, bits } = generate({ mode: "phrase", words });
  const parts = value.split(" ");
  assert.equal(parts.length, words);
  assert.ok(parts.every((word) => wordSet.has(word)));
  assert.equal(bits, words * Math.log2(wordSet.size));
});

test("out-of-range and fractional lengths are rejected", () => {
  for (const length of [0, 8.5, 257, NaN, Infinity]) {
    assert.throws(() => generate({ ...passwordOptions, length }), RangeError);
  }
  assert.throws(() => generate({ mode: "hex", bytes: LIMITS.key.max + 1 }), RangeError);
  assert.throws(() => generate({ mode: "b64", bytes: LIMITS.key.min - 1 }), RangeError);
  assert.throws(() => generate({ mode: "phrase", words: 4 }), RangeError);
});
