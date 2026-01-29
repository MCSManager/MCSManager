/**
 * A circular buffer is an array-based data structure that enables element addition and overwrite operations with O(1) time complexity,
 * making it highly suitable for high-frequency push operations and the need to remove the oldest data.
 * Additionally, its memory usage is fixed and does not grow dynamically,
 * meeting the requirements for high efficiency and low memory consumption.
 */
export class CircularBuffer<T> {
  private capacity: number;
  private buffer: T[];
  private head: number;
  private tail: number;
  private size: number;
  private deleted: boolean;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Capacity must be a positive integer");
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
    this.deleted = false;
  }

  pushLog(str: string): void {
    const SIZE = 256;
    if (str.length > SIZE) {
      for (let i = 0, len = str.length; i < len; i += SIZE) {
        this.push(str.substring(i, i + SIZE) as T);
      }
    } else {
      this.push(str as T);
    }
  }

  push(item: T): void {
    if (this.size === this.capacity) {
      this.buffer[this.tail] = item;
      this.head = (this.head + 1) % this.capacity;
      this.tail = (this.tail + 1) % this.capacity;
      this.deleted = true;
    } else {
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      this.size++;
    }
  }

  getCache() {
    const result: T[] = [];
    let index = this.head;
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[index]);
      index = (index + 1) % this.capacity;
    }
    const wasDeleted = this.deleted;

    this.head = 0;
    this.tail = 0;
    this.size = 0;
    this.deleted = false;

    return {
      items: result,
      wasDeleted
    };
  }
  
  clear(){
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
    this.deleted = false;
  }
}
