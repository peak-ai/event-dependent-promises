# Event-Dependent Promises

![Build status](https://github.com/peak-ai/event-dependent-promises/workflows/Build/badge.svg)

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
* Having to manually track whether the `EventEmitter` (`sdk`) has already fired its initialisation event (required for warm lambda invocations)

Event-Dependent Promises is directed at resolving (excuse the pun) these two issues by:

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

### Why this library instead of `events.once()`?

* Internally tracks whether the required event has already been fired, in which case execution will continue; contrast this with `events.once()`, which will never resolve if the event has already occurred
* Supports a custom rejection event (over simply rejecting on `'error'` being emitted)
* Works with Node.js 10

## Getting started

You can install Event-Dependent Promises from npm:

```sh
npm i -E @peak-ai/event-dependent-promises
```

The library comprises of a single function, exposed via a `default` binding:

```ts
import eventDependentPromises from '@peak-ai/event-dependent-promises';
```

If you're using CommonJS, this means you'll have to destructure and rename the `default` binding:

```ts
const { default: eventDependentPromises } = require('@peak-ai/event-dependent-promises');
```

## API

### `eventDependentPromises()`

```ts
function eventDependentPromises<TSource extends EventEmitter, TMethods extends Methods>(
  eventSource: TSource,
  successEvent: string,
  failureEvent: string,
  methods: TMethods,
): TMethods
```

#### Arguments

* `eventSource`: any `EventEmitter`
* `successEvent`: the name of the event that suggests successful initialisation
* `failureEvent`: the name of the event that suggests unsuccessful initialisation. **If this is emitted**, then the `Promise`s returned by any of the `methods` **will reject**
* `methods`: an object whose properties refer to async methods (i.e. returns a `Promise` or uses `async/await`) e.g:

```ts
const methods = {
  fetchItems() {
    return window.fetch('/items');
  },
};
```

#### Returns

`TMethods`

This is, on the surface, the same object you passed for the `methods` argument. However, each method is augmented to await the required event emission if it hasn't already occured.

## Local development

Prerequisites:

* [Node Version Manager](https://github.com/nvm-sh/nvm)
* [Yarn v1](https://yarnpkg.com/getting-started/install)

1. Fork this repo
2. `git clone <your fork>`
3. `cd event-dependent-promises`
4. `nvm i`
5. `yarn`

You can then run:

* `yarn lint`: runs ESLint against the source code
* `yarn format`: fixes and overwrites any source files that _don't_ adhere to our Prettier config
* `yarn build`: runs the TypeScript compiler against the project and produces distributable output
* `yarn test`: runs the unit tests
* `yarn test:dist`: runs the compiled unit tests against the compiled source. Typically used by our pre-commit hook, CI, and pre-publish script

## Contributing

Despite being primarily maintained by Peak, we welcome and appreciate any contributions from the community! Please see the [contribution guidelines](https://github.com/peak-ai/event-dependent-promises/blob/master/CONTRIBUTING.md) for more info.
