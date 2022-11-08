/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { After } from "../src/After.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { assert } from "https://deno.land/std@0.162.0/testing/asserts.ts";

describe("Timers", function () {
  let fn: Spy;

  beforeEach(() => {
    fn = spy();
  });
  it("every", () =>
    new Promise((done) => {
      const a = new After("50ms").do(fn);

      setTimeout(() => {
        assertSpyCall(fn, 0, { self: a });
        assert(a.timeout!.ran);
        done();
      }, 65);
    }));

  it("every stop", () =>
    new Promise((done) => {
      const fn = spy(() => {
        console.log("called", new Date().getMilliseconds());
      });

      const e = new After("50ms").do(fn);

      setTimeout(() => {
        assertSpyCalls(fn, 0);
        e.stop();
      }, 30);

      setTimeout(() => {
        assertSpyCalls(fn, 0);
        done();
      }, 65);
    }));
});
