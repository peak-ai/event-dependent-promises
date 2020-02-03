import { EventEmitter } from 'events';

type Methods = {
  [name: string]: Function;
}

const event = (
  eventSource: EventEmitter,
  successEvent: string,
  failureEvent: string,
) =>
  new Promise((resolve, reject) => {
    /* We want to manually remove
     * any remaining events to which
     * we've subscribed to allow our
     * source to be garbage collected. */
    const onSuccess = () => {
      eventSource.off(failureEvent, onFailure);
      resolve();
    };

    const onFailure = () => {
      eventSource.off(successEvent, onSuccess);
      reject(
        new Error(`Event Dependent: Failure event ${failureEvent} was fired`),
      );
    };

    eventSource.once(successEvent, onSuccess);
    eventSource.once(failureEvent, onFailure);
  });

const eventDependent = <TSource extends EventEmitter, TMethods extends Methods>(
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
      },
    });

    return proxies;
  }, {}) as TMethods;
};

export default eventDependent;
