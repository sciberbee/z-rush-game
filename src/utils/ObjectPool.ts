import type { Poolable } from '../types';

export class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private factory: () => T;
  private maxSize: number;

  constructor(factory: () => T, initialSize: number, maxSize: number = initialSize * 2) {
    this.factory = factory;
    this.maxSize = maxSize;

    // Pre-populate the pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      obj.active = false;
      this.pool.push(obj);
    }
  }

  public acquire(): T | null {
    // Find an inactive object
    for (const obj of this.pool) {
      if (!obj.active) {
        obj.active = true;
        obj.reset();
        return obj;
      }
    }

    // Create a new one if under max size
    if (this.pool.length < this.maxSize) {
      const obj = this.factory();
      obj.active = true;
      this.pool.push(obj);
      return obj;
    }

    return null;
  }

  public release(obj: T): void {
    obj.active = false;
  }

  public releaseAll(): void {
    for (const obj of this.pool) {
      obj.active = false;
    }
  }

  public getActive(): T[] {
    return this.pool.filter(obj => obj.active);
  }

  public getActiveCount(): number {
    return this.pool.filter(obj => obj.active).length;
  }

  public forEach(callback: (obj: T) => void): void {
    for (const obj of this.pool) {
      if (obj.active) {
        callback(obj);
      }
    }
  }

  public dispose(): void {
    this.pool = [];
  }
}
