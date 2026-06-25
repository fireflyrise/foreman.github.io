import { describe, expect, it } from "vitest";
import { AsyncInbox } from "./AsyncInbox.js";

describe("AsyncInbox", () => {
  it("yields pushed items in order", async () => {
    const inbox = new AsyncInbox<number>();
    inbox.push(1);
    inbox.push(2);
    const out: number[] = [];
    const consumer = (async () => {
      for await (const n of inbox) {
        out.push(n);
        if (out.length === 3) inbox.end();
      }
    })();
    inbox.push(3);
    await consumer;
    expect(out).toEqual([1, 2, 3]);
  });

  it("resolves a pending waiter when an item arrives later", async () => {
    const inbox = new AsyncInbox<string>();
    const iterator = inbox[Symbol.asyncIterator]();
    const pending = iterator.next();
    inbox.push("hello");
    const result = await pending;
    expect(result).toEqual({ value: "hello", done: false });
  });

  it("ends cleanly and reports done", async () => {
    const inbox = new AsyncInbox<number>();
    const iterator = inbox[Symbol.asyncIterator]();
    inbox.end();
    const result = await iterator.next();
    expect(result.done).toBe(true);
  });
});
