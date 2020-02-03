import { EventEmitter } from 'events';

const DEFAULT_TIMEOUT_MS = 10000;

type FilteredKey<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
type Awaitable = ((...args: unknown[]) => Promise<unknown>);

const isAwaitableMethod = <TSource>(awaitableMethods: (FilteredKey<TSource, Awaitable>)[], prop: keyof TSource, value: unknown): value is Awaitable =>
  awaitableMethods.includes(prop as FilteredKey<TSource, Awaitable>);

const awaitEvent = (source: EventEmitter, eventName: string) =>
  new Promise(resolve => {
    source.once(eventName, resolve);
  });

const timeout = (eventName: string, timeoutMs: number) =>
  new Promise((resolve, reject) =>
    setTimeout(() => reject(new Error(`${eventName} didn't fire after ${timeoutMs}`)), timeoutMs)
  );

const event = (source: EventEmitter, eventName: string, timeoutMs: number) =>
  Promise.race([
    awaitEvent(source, eventName),
    timeout(eventName, timeoutMs),
  ]);

const eventDependent = <TSource extends EventEmitter>(
  source: TSource,
  eventName: string,
  awaitableMethods: (FilteredKey<TSource, Awaitable>)[],
  timeoutMs = DEFAULT_TIMEOUT_MS,
): TSource => {
  let hasEmitted = false;

  return new Proxy(source, {
    get(target: TSource, prop: keyof TSource) {
      const method: unknown = target[prop];

      if (!hasEmitted && isAwaitableMethod<TSource>(awaitableMethods, prop, method)) {
        return async (...args: unknown[]) => {
          await event(source, eventName, timeoutMs);
          hasEmitted = true;

          return await method(...args);
        };
      }

      return target[prop];
    },
  });
};

export default eventDependent;
