/**
 * High-performance Circular Buffer implementation
 * Optimized for real-time performance monitoring data
 */

export class CircularBuffer<T> {
  private _data: T[];
  private _head: number = 0;
  private _tail: number = 0;
  private _size: number = 0;
  private readonly _capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }
    this._capacity = capacity;
    this._data = Array.from({ length: capacity });
  }

  /**
   * Add an item to the buffer
   * If buffer is full, overwrites the oldest item
   */
  add(item: T): void {
    this._data[this._tail] = item;

    if (this._size === this._capacity) {
      // Buffer is full, move head forward (overwrite oldest)
      this._head = (this._head + 1) % this._capacity;
    } else {
      // Buffer not full yet
      this._size++;
    }

    // Always move tail forward
    this._tail = (this._tail + 1) % this._capacity;
  }

  /**
   * Get all items in chronological order (oldest first)
   */
  getAll(): T[] {
    if (this._size === 0) {
      return [];
    }

    const result: T[] = [];
    let current = this._head;

    for (let i = 0; i < this._size; i++) {
      const safeIndex = current % this._capacity;
      if (safeIndex >= 0 && safeIndex < this._data.length) {
        const item = this._data[safeIndex];
        if (item !== undefined) {
          result.push(item);
        }
      }
      current = (current + 1) % this._capacity;
    }

    return result;
  }

  /**
   * Get the last N items in chronological order
   */
  getLast(count: number): T[] {
    if (count <= 0 || this._size === 0) {
      return [];
    }

    const actualCount = Math.min(count, this._size);
    const result: T[] = [];

    // Start from the position that gives us the last 'actualCount' items
    let start = (this._head + this._size - actualCount) % this._capacity;

    for (let i = 0; i < actualCount; i++) {
      const safeIndex = start % this._capacity;
      if (safeIndex >= 0 && safeIndex < this._data.length) {
        const item = this._data[safeIndex];
        if (item !== undefined) {
          result.push(item);
        }
      }
      start = (start + 1) % this._capacity;
    }

    return result;
  }

  /**
   * Get items within a time range (assuming T has timestamp property)
   */
  getInTimeRange(startTime: number, endTime: number): T[] {
    return this.getAll().filter(item => {
      const timestampItem = item as T & { timestamp?: number };
      const timestamp = timestampItem.timestamp ?? 0;
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  /**
   * Get the most recent item
   */
  getLatest(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }

    // The most recent item is at (tail - 1)
    const latestIndex = this._tail === 0 ? this._capacity - 1 : this._tail - 1;
    if (latestIndex >= 0 && latestIndex < this._data.length) {
      return this._data[latestIndex];
    }
    return undefined;
  }

  /**
   * Get the oldest item
   */
  getOldest(): T | undefined {
    if (this._size === 0) {
      return undefined;
    }

    return this._data[this._head];
  }

  /**
   * Clear all items from the buffer
   */
  clear(): void {
    this._head = 0;
    this._tail = 0;
    this._size = 0;
    // Don't actually clear the array for performance
  }

  /**
   * Check if buffer is empty
   */
  isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Check if buffer is full
   */
  isFull(): boolean {
    return this._size === this._capacity;
  }

  /**
   * Get current size
   */
  get size(): number {
    return this._size;
  }

  /**
   * Get maximum capacity
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * Get utilization percentage (0-100)
   */
  get utilization(): number {
    return (this._size / this._capacity) * 100;
  }

  /**
   * Find items matching a predicate
   */
  find(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Get statistical summary (for numeric values)
   */
  getStats(valueExtractor: (item: T) => number): {
    min: number;
    max: number;
    avg: number;
    median: number;
    count: number;
  } | null {
    if (this._size === 0) {
      return null;
    }

    const values = this.getAll().map(valueExtractor);
    const sorted = values.sort((a, b) => a - b);

    const min = sorted[0] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median =
      sorted.length % 2 === 0
        ? ((sorted[sorted.length / 2 - 1] ?? 0) +
            (sorted[sorted.length / 2] ?? 0)) /
          2
        : (sorted[Math.floor(sorted.length / 2)] ?? 0);

    return { min, max, avg, median, count: values.length };
  }

  /**
   * Calculate percentile (0-100)
   */
  getPercentile(
    percentile: number,
    valueExtractor: (item: T) => number,
  ): number | null {
    if (this._size === 0 || percentile < 0 || percentile > 100) {
      return null;
    }

    const values = this.getAll()
      .map(valueExtractor)
      .sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * values.length) - 1;

    return values[Math.max(0, index)] ?? null;
  }

  /**
   * Get items that exceed a threshold
   */
  getOutliers(threshold: number, valueExtractor: (item: T) => number): T[] {
    return this.getAll().filter(item => valueExtractor(item) > threshold);
  }

  /**
   * Export to array (for serialization)
   */
  toArray(): T[] {
    return this.getAll();
  }

  /**
   * Import from array
   */
  fromArray(items: T[]): void {
    this.clear();
    for (const item of items) this.add(item);
  }

  /**
   * Get memory usage estimate in bytes
   */
  getMemoryUsage(): number {
    // Rough estimate: each item + array overhead
    const itemSize = 64; // Rough estimate for typical object
    const arrayOverhead = 64;
    return this._capacity * itemSize + arrayOverhead;
  }
}
