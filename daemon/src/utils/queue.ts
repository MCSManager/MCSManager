export interface IQueueItem<T> {
  key: string;
  item: T;
}

export class ConsumerQueue<T> {
  private items: IQueueItem<T>[] = [];

  constructor(private readonly maxSize: number) {}

  push(item: IQueueItem<T>) {
    if (this.items.length >= this.maxSize) {
      this.items.shift();
    }
    // Deduplicate by key: if a pending item for this key exists, replace it
    // instead of stacking a stale duplicate that would trigger redundant work.
    const existingIndex = this.items.findIndex((v) => v.key === item.key);
    if (existingIndex !== -1) {
      this.items[existingIndex] = item;
    } else {
      this.items.push(item);
    }
  }

  pop() {
    const v = this.items.shift();
    if (v) {
      return v.item;
    }
    return undefined;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }

  isEmpty() {
    return this.items.length === 0;
  }
}
