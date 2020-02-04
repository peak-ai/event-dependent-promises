# Event-Dependent Promises

Proxy async methods to additionally await a prequisitve event.

```ts
import eventDependentPromises from '@peak-ai/event-dependent-promises';
import sdk, { Data, Events } from 'some-third-party- eventemitter';
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

  /* getData will wait for Ready
   * event to be emitted before
   * invoking sdk.getData(key) */
  return dependentSdk.getData(key)
};
```
