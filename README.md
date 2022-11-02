# timers

All timing functions you need - for Deno and the browser

## long timeouts and intervals

With `timers` it is possible to have a timeout or interval that is longer than
24.8 days (2^31-1 milliseconds).

For this usecase `timers` exports two functions: `setTimeout` and `setInterval`.

They are completely compatible with the Web API's functions.

For completeness, clearTimeout and clearInterval are exported as well, but they
are just the native methods.

```ts
import {
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
} from "https://deno.land/x/timers@0.1.0/mod.ts";

const timeout = setTimeout(() => {
  console.log("in 30 days");
}, 1000 * 60 * 60 * 24 * 30);

const interval = setInterval(() => {
  console.log("every 30 days");
}, 1000 * 60 * 60 * 24 * 30);

// Clear them
clearTimeout(timeout);
clearInterval(interval);
```

### **Note**

If you don't want the native functions overwritten, `setTimeout` and
`setInterval` are exported as `setLongTimeout` and `setLongInterval` as well.
This also applies to `clearTimeout` and `clearInterval`.\
Also you can at any time use `globalThis.setTimeout`, which applies to the other
functions as well

```ts
import {
  clearLongInterval,
  clearLongTimeout,
  setLongInterval,
  setLongTimeout,
} from "https://deno.land/x/timers@0.1.0/mod.ts";
```

## `delay`

`timers` exports the function `delay`, which resolves after a given delay. Also
with this function it is possible to have a delay longer than 24.8 days.\
Like the [delay function](https://deno.land/std/async/delay.ts) from deno's std
library, it has two options:\
`signal`: An AbortSignal that aborts the timeout. The delay function will
reject\
`persistent` (only available in Deno): Indicates whether the process should
continue to run as long as the timer exists. This is `true` by default.

```ts
import { delay } from "https://deno.land/x/timers@0.1.0/mod.ts";
const MSG = "Please type your name";
const info = document.querySelector("p.info");
const nameInput = document.querySelector("input.name");
const abort = new AbortController();
const { signal } = abort;

nameInput.addEventListener("input", () => abort.abort(), { once: true });

await delay(2000, {
  signal,
});

info.textContent = MSG;
```

## `times`

Another function `timers` provides is `times`. It is basically like
`setInterval`, but executes the interval just a certain number of times.\
Like with `delay`, you have the `signal` and `persistent` (only available in
Deno) options, plus the `args` option. Instead of passing the args as rest
parameter, like with `setInterval`, you must pass them as `array`, in order to
have the other options.

```ts
import { times } from "https://deno.land/x/timers@0.1.0/mod.ts";

const paragraph = document.querySelector("p.numbers");
const abortBtn = document.querySelector("button.abort");
const abort = new AbortController();
const { signal } = abort;

abortBtn.addEventListener("click", () => abort.abort(), { once: true });

let i = 0;
times(
  () => {
    paragraph.textContent += `${i}, `;

    i++;
  },
  200,
  20,
  {
    signal,
  },
);
```

## `pTimeout`

Timeout a promise after a specified amount of time. This function uses
[p_timeout](https://deno.land/x/p_timeout@1.0.2) from
[Khushraj Rathod](https://github.com/khrj) and uses the option to pass custom
implementations for `setTimeout` and `clearTimeout` it provides.

```ts
import { pTimeout, setTimeout } from "https://deno.land/x/timers@0.1.0/mod.ts";

const delayedPromise = new Promise((resolve) => setTimeout(resolve, 500));

await pTimeout({
  promise: delayedPromise,
  milliseconds: 50,
});

// => [TimeoutError: Promise timed out after 50 milliseconds]
```

Example taken from the Readme of
[p_timeout](https://deno.land/x/p_timeout@1.0.2)

## `timeout` and `interval`

`timeout` and `interval` are like `setTimeout` and `setInterval`, but have the
options `signal`, `persistent` (only available in Deno), `args`, and (only
`interval`), `times` and have typings, meaning that the `args` option's type
must equal the type of the argument expected by the callback.

## `Timeout` and `Interval` classes

Under the hood, all of these functions use the `Timeout` and `Interval` classes.
They are exported as well and you can use them to create timeouts without
running them directly.

```ts
import { Timeout } from "https://deno.land/x/timers@0.1.0/mod.ts";

const notifyBtn = document.querySelector("button.notify");
const timeout = new Timeout(() => {
  console.log("hello world");
}, 1000);

// WARNING: running a timeout two times will throw an error
notifyBtn.addEventListener("click", () => timeout.run(), { once: true });
```

For `Timeout`, the following options are available: `signal`, `persistent` (only
available in Deno) and `args`, for `Interval` additionally `times`.

### Properties

(Note: the word timeout will be used for both timeout and interval)\
`aborted`: A Promise, that resolves, when the timeout gets aborted, but only, if
the abort happens with a call of the `abort` method or the abortion via an
`AbortController`.\
`isAborted`: A boolean indicating whether the timeout has been aborted.\
`persistent` (only available in Deno): A boolean indicating whether the process
should continues running as long as the timer exists. This is `true` by default\
`timer`: The Id of the timer\
`ran`: A boolean indicating whether the timeout has already run\
`running`: A boolean indicating whether the timeout is currently running

#### Interval only

`runs`: A number representing the amount of times the interval has run since now

### Methods

`run()`: runs the timeout and returns the timeout's id\
`abort(reason?: any)`: aborts the timeout\
`unref()`: makes the process not continue to run as long as the timer exists\
`ref()`: makes the process continue to run as long as the timer exists

### **NOTE**

_It is highly recommended to avoid using `clearTimeout` or `clearInterval` with
an instance of Timeout or Interval, as those won't set `running`, `ran`,
`isAborted` and `abort`, so you lose warranty that those properties are up to
date! Use the `abort` method or an `AbortController` instead. It is also not
recommended to use `Deno.refTimer()` and `Deno.unrefTimer()`, as they make the
`persistent` property inconsistent_

## Running Tests

To run tests, clone the repository, run the following command

```bash
deno test
```

or, without cloning

```bash
deno test https://deno.land/x/timers@0.1.0/test.ts
```

## Contribuiting

Contributions are always welcome!

You found a bug or have an idea about a function, that is not yet implemented in
this module?\
Feel free to open an [issue](https://github.com/apollo79/timers/issues/new) or a
PR!

## License

[MIT](https://choosealicense.com/licenses/mit/)
