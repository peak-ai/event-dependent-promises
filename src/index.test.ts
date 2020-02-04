import eventDependentPromises from './';
import { EventEmitter } from 'events';

describe('eventDependentPromises', () => {
  const methods = {
    async getFoo(suffix: string) {
      return `Foo${suffix}`;
    },
  };

  let source: EventEmitter;
  let augmented: typeof methods;

  beforeEach(() => {
    source = new EventEmitter();
    augmented = eventDependentPromises(source, 'ready', 'error', methods);
  });

  it('should await an EventEmitter event before resolving the requested Promise', async () => {
    process.nextTick(() => source.emit('ready'));

    const result = await augmented.getFoo(' bar!');

    expect(result).toBe('Foo bar!');
    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });

  it('should reject if the fail event is emitted', async () => {
    process.nextTick(() => source.emit('error'));

    await expect(augmented.getFoo(' bar!')).rejects.toEqual(
      new Error(`Event Dependent: Failure event error was fired`),
    );

    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });

  it('should not subscribe to the event source if a successful emission has already occured', async () => {
    process.nextTick(() => source.emit('ready'));

    await augmented.getFoo(' bar!');
    await augmented.getFoo(' bar!');

    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });
});
