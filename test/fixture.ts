// deno-lint-ignore-file no-explicit-any
import { Timer } from "../mod.ts";

export class Fixture<T extends any[] = any[]> extends Timer<T> {
}
