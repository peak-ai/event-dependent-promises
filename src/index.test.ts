import eventDependent from './';
import { EventEmitter } from 'events';

describe('eventDependent', () => {
  it('should await an EventEmitter event before resolving the requested Promise', async () => {
    const source = new EventEmitter();

    const augmentedSource = eventDependent(
      source,
      'ready',
      'error',
      {
        async getFoo(suffix: string) {
          return `Foo${suffix}`;
        },

        async getBar(suffix: string) {
          return `Bar${suffix}`;
        },
      },
    );

    await augmentedSource.getBar(' bar!');
  });

  it.todo('should throw an error if the event times out');
});
