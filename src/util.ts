export type Epoch =
  | "millisecond"
  | "milliseconds"
  | "ms"
  | "second"
  | "seconds"
  | "sec"
  | "secs"
  | "s"
  | "minute"
  | "minutes"
  | "min"
  | "mins"
  | "m"
  | "hour"
  | "hours"
  | "h"
  | "day"
  | "days"
  | "d";

export const epochs: Record<Epoch, number> = {
  millisecond: 1,
  milliseconds: 1,
  ms: 1,
  second: 1000,
  seconds: 1000,
  sec: 1000,
  secs: 1000,
  s: 1000,
  minute: 60000,
  minutes: 60000,
  min: 60000,
  mins: 60000,
  m: 60000,
  hour: 3600000,
  hours: 3600000,
  h: 3600000,
  day: 86400000,
  days: 86400000,
  d: 86400000,
};

export const regexp =
  /([\d.]+)\s*?(milliseconds?|ms|seconds?|sec|s|minutes?|min|m|hours?|h|days?|d)/gi;

/**
 * Converts a string containing a time expressed as human readable in a number of milliseconds
 * @param str string to convert to milliseconds
 * @returns number of milliseconds
 */
export function strToMs(str: string): number {
  let ms = 0;

  let match = null;

  while ((match = regexp.exec(str))) {
    const quantity = parseFloat(match[1])!;

    const epoch = match[2]! as Epoch;

    ms += quantity * epochs[epoch];
  }

  return ms;
}
