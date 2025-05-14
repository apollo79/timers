# timers

All the timing functions you need - for Deno, Bun and the browser.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Deno](https://github.com/apollo79/timers/actions/workflows/deno.yml/badge.svg)](https://github.com/apollo79/timers/actions/workflows/deno.yml)

## Installation

### JSR

#### deno

```bash
deno add jsr:@apollo79/timers
```

#### npm (use any of npx, yarn dlx, pnpm dlx, or bunx)

```bash
npx jsr add @apollo79/timers
```

## Features and usage

After installing, just import the functions you need from `@apollo79/timers` /
`jsr:@apollo79/timers`.

### long timeouts and intervals

With every function `timers` exports, it is possible to have a timeout or
interval that is longer than 24.8 days (2^31-1 milliseconds).

If you need only this functionality, `timers` exports the functions
`setTimeout`, `setInterval`, `clearTimeout` and `clearInterval`.

They are almost completely compatible with the Web API's functions, but it is
not allowed to pass a string as function argument to one of them.

#### **Important Note**

_You can't use the native functions mixed with the functions exported by this
module! So, if you import `setTimeout`, you should import `clearTimeout` as
well, as the native function won't clear the timeout!_

```ts
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

#### **Tip**

If you don't want the native functions overwritten, `setTimeout` and
`setInterval` are exported as `setLongTimeout` and `setLongInterval` as well.
This also applies to `clearTimeout` and `clearInterval`. Also you can at any
time use `globalThis.setTimeout`, which applies to the other functions as well

```ts
import {
  clearLongInterval,
  clearLongTimeout,
  setLongInterval,
  setLongTimeout,
} from "@apollo79/timers";
```

### time strings

With each function expect `setInterval` and `setTimeout`, that `timers` exports,
it is possible to use a time string as delay argument instead of the number of
milliseconds. For example:

```ts
every("1minute").do(() => {
  console.log(new Date().toLocaleTimeString());
});
```

#### supported format

- ms, millisecond, milliseconds
- s, sec, secs, second, seconds
- m, min, mins, minute, minutes
- h, hour, hours
- d, day, days

##### Examples

- `2 days, 5 hours and 2 minutes`
- `3sec, 2ms`
- `5mins3secs`

### `delay`

`timers` exports the function `delay`. The API is like the
[delay function](https://deno.land/std/async/delay.ts) from deno's std library,
but it returns an `AbortablePromise`, so you can abort the promise with calling
`abort()` on it. It has two options:

- `signal`: An AbortSignal that aborts the timeout. The delay function will
  reject.
- `persistent` (only available in Deno): Indicates whether the process should
  continue to run as long as the timer exists. This is `true` by default.

```ts
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

### `times`

Another function `timers` provides is `times`. It is basically like
`setInterval`, but executes the interval just a certain number of times. Like
with `delay`, you have the `signal` and `persistent` (only available in Deno)
options, plus the `silent` (supresses errors in the callback) and the `args`
option. Instead of passing the args as rest parameter, like with `setInterval`,
you must pass them as `array`, in order to have the other options.

```ts
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

### `every`

`every` is syntactical sugar over an `Interval`. The function returns an `Every`
class instance. To start the interval, you call `do()` with your callback. To
set how often the callback should get executed, call `limit()` on it, but only
_before_ you call `do()`. Calling `stop()` aborts the interval. It supports the
following options:

- `signal`
- `persistent`
- `args`
- `silent`

```ts
every("1min").limit(60).do(() => {
  console.log(new Date().toLocaleTimeString());
});
```

### `after`

`after` is like `every`, but for timeouts. It does, of course, not have the
`limit` function, since it gets only executed once. The following options are
available:

- `signal`
- `persistent`
- `args`
- `silent`

```ts
after("1min").do(() => {
  console.log(new Date().toLocaleTimeString());
});
```

### `pTimeout`

Adapted from [p-timeout](https://github.com/sindresorhus/p-timeout). Times out a
promise after a specified amount of time.

```ts
const delayedPromise = delay(500);

await pTimeout(delayedPromise, 50);

// => [TimeoutError: Promise timed out after 50 milliseconds]
```

The function expects at least two arguments:

- `promise`: A `Promise` or a function returning a `Promise`
- `delay`: The time in milliseconds after which the function rejects
- `options` (not required):
  - `signal`: An `AbortSignal` to abort the function even before it rejects
  - `fallbackFn`: Do something other than rejecting with an error on timeout.
    You could for example retry.
  - `failMessage`: A custom error message. Default:
    `'Promise timed out after 50 milliseconds'`
  - `failError`: Specify a custom `Error`. It's recommended to sub-class of
    `TimeoutError`.

It returns a decorated `Promise`, which can be aborted with its `abort()`
method.

#### Using with a function

Instead of passing a `Promise` directly, you can pass a function that retuns a
`Promise`:

```ts
const pingApi = () => fetch("/api");

await pTimeout(pingApi, "50 ms");
```

The function can take an `AbortSignal` as parameter as well, which `abort` event
fires, when the timeout times out:

```ts
const pingApi = (signal) => fetch("/api", { signal });

await pTimeout(pingApi, 50);
```

`pTimeout` also passes down the signal it got:

```ts
const abort = new AbortController();
const { signal } = abort;

const pingApi = (signal) => fetch("/api", { signal });

pTimeout(pingApi, "100milliseconds", { signal });

delay(50).then(() => abort.abort());
```

### `timeout` and `interval`

`timeout` and `interval` are like `setTimeout` and `setInterval`, but are typed,
support `time strings` meaning that the `args` option's type must equal the type
of the argument expected by the callback. and supports these options:

- `signal`
- `persistent` (only available in Deno)
- `args`
- `times` (only `interval`)

```ts
const timeout = timeout(() => {
  console.log("in 30 days");
}, "30 days");

const interval = setInterval(() => {
  console.log("every 30 days");
}, "30 days");

// Clear them
clearTimeout(timeout);
clearInterval(interval);
```

### `Timeout` and `Interval` classes

Under the hood, all of the functions listed above use the `Timeout` and
`Interval` classes.\
They are exported as well and you can use them to create timeouts without\
running them directly.

```ts
const notifyBtn = document.querySelector("button.notify");
const timeout = new Timeout(() => {
  console.log("hello world");
}, 1000);

// WARNING: running a timeout two times will throw an error
notifyBtn.addEventListener("click", () => timeout.run(), { once: true });
```

For `Timeout`, the following options are available:

- `signal`
- `persistent` (only available in Deno)
- `silent`
- `args`
- `times` (only for `Interval`)

#### Properties

- `id`: The Id of the timer, can be used with `clearTimeout` and `clearInterval`
- `aborted`: A Promise, that resolves, when the timer gets aborted, but only, if
  the abort happens with a call of the `abort` method or the abortion via an
  `AbortController`.
- `isAborted`: A boolean indicating whether the timer has been aborted
- `persistent` (only available in Deno): A boolean indicating whether the
  process should continues running as long as the timer exists. This is `true`
  by default.
- _deprecated_: `timer`: The Id of the timer. Use `id` instead.
- `ran`: A boolean indicating whether the timer ran already. Gets only set to
  `true` on `Interval` when the `times` option has been passed and the interval
  has run `times` times.
- `running`: A boolean indicating whether the timeout is currently running

##### Only `Interval`
- `runs`: A number representing the amount of times the interval has run until now

#### Methods

- `run()`: runs the timeout and returns the timeout's id
- `abort(reason?: any)`: aborts the timeout
- `unref()`: makes the process not continue to run as long as the timer exists (only working in Deno)
- `ref()`: makes the process continue to run as long as the timer exists (only working in Deno)

##### **NOTE**

_It is not possible to use Deno.unrefTimer() or Deno.refTimer() directly with
the id returned by setInterval or setTimeout_

## Running Tests

To run tests, clone the repository, and run the following command

```bash
deno task test
```

## Contributing

Contributions are always welcome!

You found a bug or have an idea about a function, that is not yet implemented in
this module?\
Feel free to open an [issue](https://github.com/apollo79/timers/issues/new) or a
PR!

## License

[MIT](https://choosealicense.com/licenses/mit/)
