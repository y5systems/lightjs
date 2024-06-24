import MessageBroker from './messaging/message-broker.js';
import {ServiceData} from './schemas/configuration.schema.js';

export default abstract class Service {
  readonly #messageBroker: MessageBroker;
  readonly #serviceData: ServiceData;

  protected constructor(messageHandler: MessageBroker, serviceData: ServiceData) {
    this.#messageBroker = messageHandler;
    this.#serviceData = serviceData;
  }

  get messageBroker(): MessageBroker {
    return this.#messageBroker;
  }

  get serviceData(): ServiceData {
    return this.#serviceData;
  }

  public async init(): Promise<void> {
    await this.#messageBroker.init(this.#serviceData.prefetchValue);
  }

  public async stop(): Promise<void> {
    await this.#messageBroker.close();
  }

  public abstract run(): Promise<void>;
}
