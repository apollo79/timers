import { assertStrictEquals } from "https://deno.land/std@0.161.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.161.0/testing/bdd.ts";
import { strToMs } from "./util.ts";

const values = {
  "45ms": 45,
  "3 second": 3000,
  "4  hours": 14_400_000,
  "5d": 432_000_000,
  "1days 50sec": 86_450_000,
  "45day and 373hours, 3 minutes": 5_230_980_000,
  "4.5h": 16_200_000,
};

describe("strToMs", () => {
  for (const key in values) {
    it(`${key}`, () => {
      assertStrictEquals(strToMs(key), values[key as keyof typeof values]);
    });
  }
});
