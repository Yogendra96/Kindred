/**
 * Singleton.ts — Generic singleton factory utility
 *
 * Eliminates the `private static instance / static getInstance()` boilerplate
 * that was copy-pasted verbatim into 20+ service files.
 *
 * Usage (replaces ~10 lines of boilerplate per service):
 *
 *   // Before (repeated 20×):
 *   class MyService {
 *     private static instance: MyService;
 *     static getInstance(): MyService {
 *       if (!MyService.instance) MyService.instance = new MyService();
 *       return MyService.instance;
 *     }
 *   }
 *
 *   // After (1 line):
 *   export const getMyService = createSingleton(() => new MyService());
 *
 * Polymorphism via IService<T>:
 *   You can also use it with typed interfaces — see examples below.
 */

// ─── Core factory ─────────────────────────────────────────────────────────────

/**
 * Returns a getter function that lazily initialises and memoises `factory()`.
 * Thread-safe for JS (single-threaded event loop) — no double-checked locking needed.
 */
export function createSingleton<T>(factory: () => T): () => T {
  let instance: T | undefined;
  return (): T => {
    if (instance === undefined) {
      instance = factory();
    }
    return instance;
  };
}

// ─── Abstract base class for class-based singletons (OOP style) ───────────────

/**
 * Extend SingletonBase<T> if you prefer the class-based pattern.
 * Provides `getInstance()` automatically without boilerplate.
 *
 * Usage:
 *   class MyService extends SingletonBase<MyService> {
 *     protected buildInstance() { return new MyService(); }
 *     doSomething() { ... }
 *   }
 *   const svc = MyService.getInstance();
 */
export abstract class SingletonBase<_T> {
  private static _instances = new Map<string, unknown>();

  /** Override to provide the class key (default: constructor name) */
  protected static instanceKey(): string {
    return this.name;
  }

  static getInstance<T>(this: new () => T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = (this as any as typeof SingletonBase).instanceKey();
    if (!SingletonBase._instances.has(key)) {
      SingletonBase._instances.set(key, new (this as new () => T)());
    }
    return SingletonBase._instances.get(key) as T;
  }

  /** Reset the singleton (useful in tests) */
  static _reset(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = (this as any as typeof SingletonBase).instanceKey();
    SingletonBase._instances.delete(key);
  }
}

// ─── IService interface (polymorphism hook) ────────────────────────────────────

/**
 * Common interface all Kindred services should implement.
 * Enables dependency injection and mock substitution in tests.
 */
export interface IService {
  readonly name: string;
  initialize(): Promise<void>;
  dispose?(): void;
}

import { container } from 'tsyringe';

/**
 * Service registry — IoC container for dependency injection using `tsyringe`.
 * Register services at startup; retrieve anywhere without tight coupling.
 *
 * Usage:
 *   serviceRegistry.register('logger', { useValue: logger });
 *   const log = serviceRegistry.get<LoggerService>('logger');
 */
export const serviceRegistry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register<T>(token: any, instance: T): void {
    container.registerInstance(token, instance);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve<T>(token: any): T {
    if (!container.isRegistered(token)) {
      throw new Error(`ServiceRegistry: '${String(token)}' not registered.`);
    }
    return container.resolve<T>(token);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isRegistered(token: any): boolean {
    return container.isRegistered(token);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unregister(_token: any): void {
    container.clearInstances();
  },
};
