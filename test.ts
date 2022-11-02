import {
  Interval,
  Timeout,
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
  delay,
  times,
  pTimeout,
} from "./mod.ts";
import { describe, it } from "https://deno.land/std@0.161.0/testing/bdd.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertStrictEquals,
  assertThrows,
  unreachable,
} from "https://deno.land/std@0.161.0/testing/asserts.ts";
import { delay as stdDelay } from "https://deno.land/std@0.161.0/async/delay.ts";
import { AbortException } from "./Base.ts";
import { TimeoutError } from "https://deno.land/x/p_timeout@1.0.2/mod.ts";

const noop = () => {};

describe("basic functionality", () => {
  describe("setTimeout", () => {
    it("basic", async () => {
      let i = 0;

      setTimeout(() => {
        i++;
      }, 100);

      assertStrictEquals(i, 0);

      await stdDelay(110);

      assertStrictEquals(i, 1);
    });

    it("Arguments", async () => {
      const args: [number, string] = [1, "hello"];

      setTimeout(
        (...passedArgs) => {
          assertEquals(passedArgs, args);
        },
        100,
        ...args
      );

      await stdDelay(110);
    });
  });

  describe("clearTimeout", () => {
    it("basic", async () => {
      const timeoutId = setTimeout(() => {
        unreachable();
      }, 100);

      clearTimeout(timeoutId);

      await stdDelay(110);
    });
  });

  describe("setInterval and clearInterval", () => {
    it("basic", async () => {
      let i = 0;

      const intervalId = setInterval(() => {
        i++;
      }, 100);

      assertStrictEquals(i, 0);

      await stdDelay(110);

      assertStrictEquals(i, 1);

      await stdDelay(110);

      assertStrictEquals(i, 2);

      clearInterval(intervalId);

      await stdDelay(110);

      assertStrictEquals(i, 2);
    });

    it("Arguments", async () => {
      const args: [number, string] = [1, "hello"];

      const timeoutId = setInterval(
        (...passedArgs) => {
          assertEquals(passedArgs, args);
        },
        100,
        ...args
      );

      await stdDelay(110);

      clearInterval(timeoutId);
    });
  });
});

describe("advanced functionality", () => {
  describe("Timeout", () => {
    it("persistent property", async () => {
      const timeout = new Timeout(noop, 100, {
        persistent: false,
      });

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
          { signal: abort.signal }
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

    describe("errors", () => {
      it("throws if already running", async () => {
        const timeout = new Timeout(() => {}, 100);

        timeout.run();

        assertThrows(() => timeout.run(), "The timeout is already running");

        await stdDelay(100);
      });

      it("throws if it ran already", async () => {
        const timeout = new Timeout(() => {}, 100);

        timeout.run();

        assertThrows(() => timeout.run(), "The timeout ran already");

        await stdDelay(100);
      });

      it("throws if it has been aborted", async () => {
        const timeout = new Timeout(() => {}, 100);

        timeout.run();

        timeout.abort();

        assertThrows(
          () => timeout.run(),
          "The timeout has been aborted before running"
        );

        await stdDelay(100);
      });
    });
  });

  describe("Interval", () => {
    describe("abortable", () => {
      it("abort method", async () => {
        let i = 0;

        const interval = new Interval(() => {
          i++;

          if (i == 2) {
            unreachable();
          }
        }, 100);

        interval.run();

        assert(!interval.isAborted);

        await stdDelay(110);

        assert(!interval.isAborted);

        interval.abort();

        await stdDelay(110);

        assert(interval.isAborted);
      });

      describe("signal", () => {
        it("aborted while running", async () => {
          const start = new Date();
          const abort = new AbortController();

          const { signal } = abort;

          let i = 0;

          const timeout = new Interval(
            () => {
              i++;

              if (i == 2) {
                unreachable();
              }
            },
            100,
            {
              signal,
            }
          );

          timeout.run();

          await stdDelay(110);

          abort.abort();

          await timeout.aborted.then(() => {
            const diff = new Date().getTime() - start.getTime();

            assert(diff < 200);
            assertStrictEquals(i, 1);
          });

          await stdDelay(110);

          assert(timeout.isAborted);
          assertStrictEquals(i, 1);
        });

        it("aborted before running", async () => {
          const start = new Date();
          const abort = new AbortController();

          const { signal } = abort;

          let i = 0;

          abort.abort();

          const timeout = new Interval(
            () => {
              i++;

              if (i == 2) {
                unreachable();
              }
            },
            100,
            {
              signal,
            }
          );

          await timeout.aborted.then(() => {
            const diff = new Date().getTime() - start.getTime();

            assert(diff < 100);
          });

          assertThrows(() => {
            timeout.run();
          }, "The interval has been aborted before running");

          await stdDelay(110);

          assertStrictEquals(i, 0);
        });
      });

      describe("errors", () => {
        it("throws if already running", async () => {
          const interval = new Interval(() => {}, 100);

          interval.run();

          assertThrows(() => interval.run(), "The timeout is already running");

          await stdDelay(100);

          interval.abort();
        });

        it("throws if it ran already", async () => {
          const interval = new Interval(() => {}, 100);

          interval.run();

          assertThrows(() => interval.run(), "The timeout ran already");

          await stdDelay(100);

          interval.abort();
        });

        it("throws if it has been aborted", async () => {
          const timeout = new Timeout(() => {}, 100);

          timeout.run();

          timeout.abort();

          assertThrows(
            () => timeout.run(),
            "The timeout has been aborted before running"
          );

          await stdDelay(100);
        });
      });
    });

    it("times", async () => {
      let i = 0;

      const interval = new Interval(
        () => {
          i++;

          if (i > 5) {
            unreachable();
          }
        },
        100,
        {
          times: 5,
        }
      );

      interval.run();

      for (let i = 0; i <= 7; i++) {
        await stdDelay(110);
      }
    });

    it("runs property", async () => {
      let i = 0;

      const interval = new Interval(
        () => {
          i++;

          assertEquals(interval.runs, i);
        },
        100,
        {
          times: 5,
        }
      );

      interval.run();

      for (let i = 0; i <= 5; i++) {
        await stdDelay(110);
      }
    });
  });

  // https://deno.land/std@0.161.0/async/delay_test.ts
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
      const delayedPromise = delay(100, { signal });

      setTimeout(() => abort.abort(), 0);

      await assertRejects(
        () => delayedPromise,
        DOMException,
        "Delay was aborted"
      );

      const diff = new Date().getTime() - start.getTime();

      assert(diff < 100);
    });

    it("delay with non-aborted signal", async function () {
      const start = new Date();
      const abort = new AbortController();
      const { signal } = abort;

      const delayedPromise = delay(100, { signal }); // abort.abort()
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
        "Delay was aborted"
      );

      const diff = new Date().getTime() - start.getTime();

      assert(diff < 100);
    });
  });

  it("times", async () => {
    let i = 0;

    const interval = times(
      () => {
        i++;

        if (i > 5) {
          unreachable();
        }
      },
      100,
      5
    );

    for (let i = 0; i <= 7; i++) {
      await stdDelay(110);
    }
  });

  it("pTimeout", async () => {
    let timeout: number;

    const delayedPromise = new Promise((resolve) => {
      timeout = setTimeout(resolve, 500);
    });

    await assertRejects(
      () =>
        pTimeout({
          promise: delayedPromise,
          milliseconds: 50,
        }),
      TimeoutError,
      "Promise timed out after 50 milliseconds"
    );

    clearTimeout(timeout!);
  });
});
