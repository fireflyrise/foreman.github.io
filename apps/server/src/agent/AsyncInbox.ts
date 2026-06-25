/**
 * A push-based async iterable. Producers call `push()` / `end()`; a single
 * consumer iterates with `for await`. Used to feed instruction messages into a
 * long-lived Claude Agent SDK streaming-input session one at a time.
 */
export class AsyncInbox<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private waiters: Array<(r: IteratorResult<T>) => void> = [];
  private ended = false;

  push(item: T): void {
    if (this.ended) return;
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value: item, done: false });
    } else {
      this.queue.push(item);
    }
  }

  end(): void {
    this.ended = true;
    let waiter = this.waiters.shift();
    while (waiter) {
      waiter({ value: undefined as unknown as T, done: true });
      waiter = this.waiters.shift();
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: (): Promise<IteratorResult<T>> => {
        const item = this.queue.shift();
        if (item !== undefined) {
          return Promise.resolve({ value: item, done: false });
        }
        if (this.ended) {
          return Promise.resolve({ value: undefined as unknown as T, done: true });
        }
        return new Promise((resolve) => this.waiters.push(resolve));
      },
    };
  }
}
