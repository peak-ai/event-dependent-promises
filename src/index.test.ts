import eventDependentPromises from './';
import { EventEmitter } from 'events';

describe('eventDependentPromises', () => {
  const methods = {
    async getBar(prefix: string, suffix: string) {
      return `${prefix}bar${suffix}`;
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

    const result = await augmented.getBar('Foo ', ' baz!');

    expect(result).toBe('Foo bar baz!');
    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });

  it('should reject if the fail event is emitted', async () => {
    process.nextTick(() => source.emit('error'));

    await expect(augmented.getBar('Foo ', ' baz!')).rejects.toEqual(
      new Error(`Event Dependent: Failure event error was fired`),
    );

    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });

  it('should not subscribe to the event source if a successful emission has already occured', async () => {
    process.nextTick(() => source.emit('ready'));

    await augmented.getBar('Foo ', ' baz!');
    await augmented.getBar('Foo ', ' baz!');

    expect(source.listenerCount('ready')).toBe(0);
    expect(source.listenerCount('error')).toBe(0);
  });
});
