import {
  AbortException,
  clearInterval,
  clearTimeout,
  delay,
  setInterval,
  setTimeout,
  times,
} from "../mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import {
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@0.162.0/testing/time.ts";

describe("basic functionality", () => {
  let time: FakeTime;
  beforeEach(() => {
    time = new FakeTime();
  });
  afterEach(() => {
    time.restore();
  });

  describe("setTimeout", () => {
    it("basic", () => {
      const start = new Date();
      const fn = spy(() => {
        const diff = new Date().getTime() - start.getTime();

        assert(diff >= 100);
      });

      setTimeout(fn, 100);

      assertSpyCalls(fn, 0);

      time.tick(110);

      assertSpyCalls(fn, 1);
    });

    it("Arguments", () => {
      const args: [number, string] = [1, "hello"];
      const fn = spy((...passedArgs) => {
        assertEquals(passedArgs, args);
      });

      setTimeout(fn, 100, ...args);

      time.tick(110);
      assertSpyCalls(fn, 1);
    });
  });

  describe("clearTimeout", () => {
    it("basic", () => {
      const timeoutId = setTimeout(unreachable, 100);

      clearTimeout(timeoutId);

      time.tick(110);
    });
  });

  describe("setInterval and clearInterval", () => {
    it("basic", () => {
      let start = new Date();
      const fn = spy(() => {
        const now = new Date(),
          diff = now.getTime() - start.getTime();

        assert(diff >= 100);

        start = now;
      });

      const intervalId = setInterval(fn, 100);

      assertSpyCalls(fn, 0);

      time.tick(110);

      assertSpyCalls(fn, 1);

      time.tick(110);

      assertSpyCalls(fn, 2);

      clearInterval(intervalId);

      time.tick(110);

      assertSpyCalls(fn, 2);
    });

    it("Arguments", () => {
      const args: [number, string] = [1, "hello"];

      const timeoutId = setInterval(
        (...passedArgs) => {
          assertEquals(passedArgs, args);
        },
        100,
        ...args,
      );

      time.tick(110);

      clearInterval(timeoutId);
    });
  });
});

// https://deno.land/std@0.162.0/async/delay_test.ts
describe("delay", () => {
  it("delay", async () => {
    const start = new Date();
    const delayedPromise = delay(100);
    const result = await delayedPromise;
    const diff = new Date().getTime() - start.getTime();

    assert(result === undefined);
    assert(diff >= 100);
  });

  it("delay with abort", async () => {
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

  it("delay with non-aborted signal", async () => {
    const start = new Date();
    const abort = new AbortController();
    const { signal } = abort;

    const delayedPromise = delay("100 milliseconds", { signal }); // abort.abort()
    const result = await delayedPromise;

    const diff = new Date().getTime() - start.getTime();

    assert(result === undefined);
    assert(diff >= 100);
  });

  it("delay with signal aborted after delay", async () => {
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

  it("delay with already aborted signal", async () => {
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
  let time: FakeTime;
  beforeEach(() => {
    time = new FakeTime();
  });
  afterEach(() => {
    time.restore();
  });

  beforeEach(() => {
    fn = spy(() => {
      if (fn.calls.length > 5) {
        unreachable();
      }
    });
  });

  it("times", () => {
    times(fn, 100, 5);

    for (let i = 0; i <= 7; i++) {
      time.tick(110);
    }
  });

  it("time string", () => {
    times(fn, "100 ms", 5);

    for (let i = 0; i <= 7; i++) {
      time.tick(110);
    }
  });
});
