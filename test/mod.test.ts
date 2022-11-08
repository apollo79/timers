import {
  AbortException,
  After,
  after,
  clearInterval,
  clearTimeout,
  delay,
  setInterval,
  setTimeout,
  times,
} from "../mod.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { delay as stdDelay } from "https://deno.land/std@0.162.0/async/delay.ts";
import {
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";

describe("basic functionality", () => {
  describe("setTimeout", () => {
    it("basic", async () => {
      const start = new Date();
      const fn = spy(() => {
        const diff = new Date().getTime() - start.getTime();

        assert(diff >= 100);
      });

      setTimeout(fn, 100);

      assertSpyCalls(fn, 0);

      await stdDelay(110);

      assertSpyCalls(fn, 1);
    });

    it("Arguments", async () => {
      const args: [number, string] = [1, "hello"];

      setTimeout(
        (...passedArgs) => {
          assertEquals(passedArgs, args);
        },
        100,
        ...args,
      );

      await stdDelay(110);
    });
  });

  describe("clearTimeout", () => {
    it("basic", async () => {
      const timeoutId = setTimeout(unreachable, 100);

      clearTimeout(timeoutId);

      await stdDelay(110);
    });
  });

  describe("setInterval and clearInterval", () => {
    it("basic", async () => {
      let start = new Date();
      const fn = spy(() => {
        const now = new Date(),
          diff = now.getTime() - start.getTime();

        assert(diff >= 100);

        start = now;
      });

      const intervalId = setInterval(fn, 100);

      assertSpyCalls(fn, 0);

      await stdDelay(110);

      assertSpyCalls(fn, 1);

      await stdDelay(110);

      assertSpyCalls(fn, 2);

      clearInterval(intervalId);

      await stdDelay(110);

      assertSpyCalls(fn, 2);
    });

    it("Arguments", async () => {
      const args: [number, string] = [1, "hello"];

      const timeoutId = setInterval(
        (...passedArgs) => {
          assertEquals(passedArgs, args);
        },
        100,
        ...args,
      );

      await stdDelay(110);

      clearInterval(timeoutId);
    });
  });
});

// https://deno.land/std@0.162.0/async/delay_test.ts
describe("delay", () => {
  it("delay", async function () {
    const start = new Date();
    const delayedPromise = delay(100);
    const result = await delayedPromise;
    const diff = new Date().getTime() - start.getTime();

    assert(result === undefined);
    assert(diff >= 100);
  });

  it("delay with abort", async function () {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;
    const delayedPromise = delay("100  ms", { signal });

    setTimeout(() => abort.abort(), 0);

    await assertRejects(
      () => delayedPromise,
      DOMException,
      "The timer was aborted.",
    );

    const diff = new Date().getTime() - start.getTime();

    assert(diff < 100);
  });

  it("delay with non-aborted signal", async function () {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;

    const delayedPromise = delay("100 milliseconds", { signal }); // abort.abort()
    const result = await delayedPromise;

    const diff = new Date().getTime() - start.getTime();

    assert(result === undefined);
    assert(diff >= 100);
  });

  it("delay with signal aborted after delay", async function () {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;
    const delayedPromise = delay(100, { signal });

    const result = await delayedPromise;

    abort.abort();

    const diff = new Date().getTime() - start.getTime();

    assert(result === undefined);
    assert(diff >= 100);
  });

  it("delay with already aborted signal", async function () {
    const start = new Date();
    const abort = new AbortController();

    abort.abort();

    const { signal } = abort;
    const delayedPromise = delay(100, { signal });

    await assertRejects(
      () => delayedPromise,
      AbortException,
      "The timer was aborted.",
    );

    const diff = new Date().getTime() - start.getTime();

    assert(diff < 100);
  });

  it("`clear()` method", async () => {
    const start = new Date();
    const abort = new AbortController();

    abort.abort();

    const { signal } = abort;
    const delayedPromise = delay(100, { signal });

    delayedPromise.abort();

    await assertRejects(
      () => delayedPromise,
      AbortException,
      "The timer was aborted.",
    );

    const diff = new Date().getTime() - start.getTime();

    assert(diff < 100);
  });
});

describe("times", () => {
  let fn: Spy;

  beforeEach(() => {
    fn = spy(() => {
      if (fn.calls.length > 5) {
        unreachable();
      }
    });
  });
  it("times", async () => {
    times(fn, 100, 5);

    for (let i = 0; i <= 7; i++) {
      await stdDelay(110);
    }
  });

  it("time string", async () => {
    times(fn, "100 ms", 5);

    for (let i = 0; i <= 7; i++) {
      await stdDelay(110);
    }
  });
});
