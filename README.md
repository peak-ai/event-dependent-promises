# Event-Dependent Promises

![Verify](https://github.com/peak-ai/event-dependent-promises/workflows/Verify/badge.svg)

Proxy async methods to await prerequisite `EventEmitter` events

```ts
import eventDependentPromises from '@peak-ai/event-dependent-promises';
import sdk, { Data, Events } from 'some-third-party-eventemitter';
import { APIGatewayEvent } from 'aws-lambda';

const dependentSdk = eventDependentPromises(
  sdk,
  Events.READY,
  Events.INIT_TIMEOUT,
  {
    getData(key: string) {
      // sdk.getData returns Promise<Data>
      return sdk.getData(key);
    },
  },
);

export const handler = (event: APIGatewayEvent): Promise<Data> => {
  const { body: key } = event;

  /* dependentSdk.getData(key) will invoke
   * sdk.getData(key) once the READY
   * event has been emitted or immediately
   * if it's been fired already. */
  return dependentSdk.getData(key)
};
```

FLIB
