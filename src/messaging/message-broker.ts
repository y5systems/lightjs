import {EventEmitter} from 'node:events';

import RabbitmqManager from './rabbitmq-manager.js';
import {RabbitmqMessage, RabbitmqMessageSchema} from '../schemas/rabbitmq-manager.schema.js';
import MessageConsumer from './message-consumer.js';

export type SendMessageType = (targetQueue: string, messageName: string, messageData: Record<string, unknown>) => void;

export const MESSAGE_BROKER_EVENTS = {
  SEND_MESSAGE: 'send-message',
} as const;

export default class MessageBroker {
  readonly #rabbitmqManager: RabbitmqManager;
  readonly #queueName: string;

  readonly #eventEmitter: EventEmitter;
  readonly #messageConsumers: Map<string, MessageConsumer>;

  constructor(rabbitmqManager: RabbitmqManager, serviceQueueName: string) {
    this.#rabbitmqManager = rabbitmqManager;
    this.#queueName = serviceQueueName;

    this.#eventEmitter = new EventEmitter();
    this.#messageConsumers = new Map();
  }

  async init(prefetchValue?: number): Promise<void> {
    await this.#rabbitmqManager.init();

    this.#eventEmitter.on(MESSAGE_BROKER_EVENTS.SEND_MESSAGE, (queue: string, name: string, data: Record<string, unknown>) => {
      this.#rabbitmqManager.emit(queue, RabbitmqMessageSchema.parse({name, data}));
    });

    if (this.#queueName === '') {
      return;
    }

    await this.#rabbitmqManager.assertQueue(this.#queueName);
    await this.#rabbitmqManager.attachConsumer(this.#queueName, async (message: RabbitmqMessage) => {
      if (!this.#messageConsumers.has(message.name)) {
        console.warn(`Message discarded as no consumer was implemented for message named ${message.name}.`);
        return;
      }

      await this.#messageConsumers.get(message.name)!.consume(message.data);
    }, prefetchValue);
  }

  async close(): Promise<void> {
    await this.#rabbitmqManager.close();
    this.#eventEmitter.removeAllListeners();
  }

  sendMessage(targetQueue: string, messageName: string, messageData: Record<string, unknown>): void {
    this.#eventEmitter.emit(MESSAGE_BROKER_EVENTS.SEND_MESSAGE, targetQueue, messageName, messageData);
  }

  createMessageConsumer<T extends MessageConsumer>(
    messageName: string,
    messageConsumerClass: new (sendMessage: SendMessageType, ...args: any[]) => T,
    ...args: any[]
  ) {
    this.#messageConsumers.set(messageName, new messageConsumerClass(this.sendMessage.bind(this), ...args));
  }
}
