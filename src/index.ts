import { EventEmitter } from 'events';

type OneTimeEmitter = Pick<EventEmitter, 'once' | 'off'>;
type Func = (...args: unknown[]) => Promise<unknown>;

interface Methods {
  [K: string]: Func;
}

const event = (eventSource: OneTimeEmitter, successEvent: string, failureEvent: string) =>
  new Promise((resolve, reject) => {
    const onSuccess = () => {
      eventSource.off(failureEvent, onFailure);
      resolve();
    };

    const onFailure = () => {
      eventSource.off(successEvent, onSuccess);
      reject(new Error(`Event Dependent: Failure event ${failureEvent} was fired`));
    };

    eventSource.once(successEvent, resolve);
    eventSource.once(failureEvent, reject);
  });

const eventDependent = <TSource extends OneTimeEmitter, TMethods extends Methods>(
  eventSource: TSource,
  successEvent: string,
  failureEvent: string,
  methods: TMethods,
): TMethods => {
  let hasEmitted = false;

  // Node 10 doesn't support Object.fromEntries :(
  return Object.entries(methods).reduce<Methods>((proxies, [name, func]) => {
    proxies[name] = new Proxy(func, {
      async apply(target, context, ...args) {
        if (!hasEmitted) {
          await event(eventSource, successEvent, failureEvent);
          hasEmitted = true;
        }

        return await target(...args);
      }
    });

    return proxies;
  }, {}) as TMethods;
};

export default eventDependent;
