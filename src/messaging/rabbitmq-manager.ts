import {Channel, connect, Connection, ConsumeMessage} from 'amqplib';
import {EnvironmentSchema} from '../schemas/environment.schema.js';

import {RabbitmqMessageSchema, RabbitmqMessage} from '../schemas/rabbitmq-manager.schema.js';
import {replacer, reviver} from '../utils/logger.js';

export default class RabbitmqManager {
  #connection: Connection | null;
  #channel: Channel | null;

  constructor() {
    this.#connection = null;
    this.#channel = null;
  }

  async init(): Promise<void> {
    try {
      await this.connectClient();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to initialize RabbitmqManager. ${errorMessage}`);
    }
  }

  async close(): Promise<void> {
    await this.#channel?.close();
    await this.#connection?.close();
  }

  private async connectClient(): Promise<void> {
    const env = EnvironmentSchema.parse(process.env);

    this.#connection = await connect({
      hostname: env.RABBITMQ_HOSTNAME,
      port: env.RABBITMQ_PORT,
      username: env.RABBITMQ_USERNAME,
      password: env.RABBITMQ_PASSWORD,
      vhost: env.RABBITMQ_VHOST,
    });

    this.#channel = await this.#connection.createChannel();
  }

  async assertQueue(queueName: string): Promise<void> {
    await this.#channel?.assertQueue(queueName);
  }

  async attachConsumer(queueName: string, onMessage: (message: RabbitmqMessage) => Promise<void>, prefetch?: number) {
    if (!this.#channel) {
      return;
    }

    await this.#channel.prefetch(prefetch ? prefetch : 0);
    await this.#channel.consume(queueName, async (msg: ConsumeMessage | null) => {
      if (!msg || !this.#channel) {
        return;
      }

      await onMessage(RabbitmqMessageSchema.parse(JSON.parse(msg.content.toString(), reviver)));

      this.#channel.ack(msg);
    });

    console.log(`Consumer ready on '${queueName}'`);
  }

  emit(queue: string, message: RabbitmqMessage): boolean {
    if (!this.#channel) {
      return false;
    }

    return this.#channel.sendToQueue(queue, Buffer.from(JSON.stringify(message, replacer)));
  }
}
