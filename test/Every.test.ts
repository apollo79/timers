/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { Every } from "../src/Every.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";
import {
  beforeAll,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { assert } from "https://deno.land/std@0.162.0/testing/asserts.ts";

describe("every", function () {
  let fn: Spy;

  beforeEach(() => {
    fn = spy();
  });

  it("every", () =>
    new Promise((done) => {
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

  it("times", () =>
    new Promise((done) => {
      const e = new Every("50ms").times(3).do(fn);

      setTimeout(() => {
        assertSpyCall(fn, 0, { self: e });
      }, 65);

      setTimeout(() => {
        assertSpyCalls(fn, 2);
      }, 130);

      setTimeout(() => {
        assertSpyCalls(fn, 3);
        assert(e.interval!.ran);
        done();
      }, 180);
    }));

  it("stop", () =>
    new Promise((done) => {
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
