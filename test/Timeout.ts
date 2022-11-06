import {
  assert,
  assertStrictEquals,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { Timeout } from "../src/Timeout.ts";
import { delay as stdDelay } from "https://deno.land/std@0.161.0/async/delay.ts";

const noop = () => {};

describe("Timeout", () => {
  it("string time", async () => {
    const start = new Date();
    let i = 0;

    const timeout = new Timeout(() => {
      const diff = new Date().getTime() - start.getTime();

      assert(diff >= 100);

      i++;
    }, "100 ms");

    timeout.run();

    await stdDelay(110);

    assertStrictEquals(i, 1);
  });

  it("persistent property", async () => {
    const timeout = new Timeout(noop, 100, {
      persistent: false,
    });

    timeout.ref();
    assert(!timeout.persistent);

    timeout.run();
    assert(!timeout.persistent);

    timeout.ref();
    assert(timeout.persistent);

    timeout.unref();
    assert(!timeout.persistent);

    await stdDelay(110);
  });
  it("running and ran property", async () => {
    const timeout = new Timeout(noop, 100);

    timeout.run();

    assert(timeout.running);
    assert(!timeout.ran);

    await stdDelay(110);

    assert(!timeout.running);
    assert(timeout.ran);
  });

  describe("abortable", () => {
    it("abort method", async () => {
      const timeout = new Timeout(unreachable, 100);

      timeout.run();

      assert(!timeout.isAborted);

      timeout.abort();

      await stdDelay(110);

      assert(timeout.isAborted);
      assert(!timeout.ran);
    });

    it("signal", async () => {
      const abort = new AbortController();

      new Timeout(
        () => {
          console;
        },
        100,
        { signal: abort.signal },
      );

      const timeout = new Timeout(unreachable, 100, {
        signal: abort.signal,
      });

      timeout.run();

      assert(!timeout.isAborted);

      abort.abort();

      await stdDelay(110);

      assert(timeout.isAborted);
    });
  });
});
