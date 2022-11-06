import {
  assert,
  assertStrictEquals,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { Interval } from "../src/Interval.ts";
import { delay as stdDelay } from "https://deno.land/std@0.161.0/async/delay.ts";

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
          },
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
          },
        );

        await timeout.aborted.then(() => {
          const diff = new Date().getTime() - start.getTime();

          assert(diff < 100);
        });

        await stdDelay(110);

        assertStrictEquals(i, 0);
      });
    });
  });
});
