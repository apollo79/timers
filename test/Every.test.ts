/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { Every } from "../src/Every.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";
import { describe, it } from "https://deno.land/std@0.162.0/testing/bdd.ts";

describe("Timers", function () {
  it("every", () =>
    new Promise((done) => {
      const fn = spy(() => {
        console.log("called", new Date().getMilliseconds());
      });

      const e = new Every("50ms").do(fn);

      setTimeout(() => {
        assertSpyCall(fn, 0, { self: e });
      }, 65);

      setTimeout(() => {
        assertSpyCalls(fn, 2);
      }, 130);

      setTimeout(() => {
        assertSpyCalls(fn, 3);
        e.stop();
        done();
      }, 180);
    }));

  it("every stop", () =>
    new Promise((done) => {
      const fn = spy(() => {
        console.log("called", new Date().getMilliseconds());
      });

      const e = new Every("50ms").do(fn);

      setTimeout(() => {
        assertSpyCall(fn, 0, { self: e });
        e.stop();
      }, 60);

      setTimeout(() => {
        assertSpyCalls(fn, 1);
        done();
      }, 130);
    }));
});
