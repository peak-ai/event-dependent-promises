# Event-Dependent Promises

![Verify](https://github.com/peak-ai/event-dependent-promises/workflows/Verify/badge.svg)

Proxy async methods to await prerequisite `EventEmitter` events:

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
   * and return sdk.getData(key) once the READY
   * event has been emitted or immediately
   * if it's been fired already. */
  return dependentSdk.getData(key);
};
```

## Why?

If we wanted to, we could subscribe to our `EventEmitter` directly:

```ts
import sdk, { Data, Events } from 'some-third-party-eventemitter';
import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import keyService from './key-service';

let hasSdkInitialised = false;

export const handler = async (event: APIGatewayEvent, context: Context, cb: Callback<Data>): void => {
  const { body: id } = event;
  const key = await keyService.getForId(id);

  if (hasSdkInitialised) {
    const data = await sdk.getData(key);
    cb(null, data);
    return;
  }

  sdk.once(Events.READY, async () => {
    hasSdkInitialised = true;
    const data = await sdk.getData(key);
    cb(null, data);
  });
};
```

There are some key drawbacks, however, that present themselves:

* Mixing multiple async paradigms (`Promise`s _and_ callbacks!)
* Having to manually track whether the `EventEmitter` (`sdk`) has already fired its initialisation event (i.e. during a warm lambda invocation)

Event-Dependent Promises is directed a resolving (excuse the pun) these two issues by:

* internally tracking when the prerequisite event has been emitted
* proxying a set of methods to return `Promise`s, which won't resolve until the prerequisite event has been fired once

Here's the previous example when using Event-Dependent Promises:

```ts
import eventDependentPromises from '@peak-ai/event-dependent-promises';
import sdk, { Data, Events } from 'some-third-party-eventemitter';
import { APIGatewayEvent } from 'aws-lambda';
import keyService from './key-service';

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

export const handler = async (event: APIGatewayEvent): Promise<Data> => {
  const { body: id } = event;
  const key = await keyService.getForId(id);

  /* Remember, dependentSdk.getData(key)
   * will wait for Events.READY to have
   * been emitted once before calling
   * and returning sdk.getData(key) */
  return dependentSdk.getData(key);
};
```

## Getting started

## API

## Local development

## Contributing
