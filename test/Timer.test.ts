import { describe, it } from "https://deno.land/std@0.162.0/testing/bdd.ts";
import {
  assert,
  assertThrows,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { Fixture } from "./fixture.ts";

const noop = () => {};

describe("Timer", () => {
  it("throws when delay is a negative number", () => {
    assertThrows(
      () => new Fixture(noop, -100, {}),
      TypeError,
      `Expected \`delay\` to be a positive number, got \`${-100}\``,
    );
  });

  it("throws when delay is Nan", () => {
    assertThrows(
      () => new Fixture(noop, NaN, {}),
      TypeError,
      `Expected \`delay\` to be a positive number, got \`${NaN}\``,
    );
  });

  it("throws when delay is Infinity", () => {
    assertThrows(
      () => new Fixture(noop, Infinity, {}),
      TypeError,
      "`delay` must not be `Infinity`",
    );
  });

  it;

  it("persistent property", () => {
    const fixture = new Fixture(noop, 100, {
      persistent: false,
    });

    fixture.ref();
    assert(!fixture.persistent);

    fixture.run();
    assert(!fixture.persistent);

    fixture.ref();
    assert(fixture.persistent);

    fixture.unref();
    assert(!fixture.persistent);
    fixture.abort();
  });
});
