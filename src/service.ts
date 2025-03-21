import { ApiServer } from './api/api-server.js';
import { MessageBroker } from './messaging/message-broker.js';
import { ServiceData } from './schemas/service-data.schema.js';

export abstract class Service {
  readonly #serviceData: ServiceData;
  #messageBroker?: MessageBroker;
  #apiServer?: ApiServer;

  protected constructor(serviceData: ServiceData) {
    this.#serviceData = serviceData;
  }

  get serviceData(): ServiceData {
    return this.#serviceData;
  }

  set messageBroker(messageBroker: MessageBroker) {
    this.#messageBroker = messageBroker;
  }

  get messageBroker(): MessageBroker {
    if (!this.#messageBroker) {
      throw new Error('MessageBroker not initialized');
    }

    return this.#messageBroker;
  }

  set apiServer(apiServer: ApiServer) {
    this.#apiServer = apiServer;
  }

  get apiServer(): ApiServer {
    if (!this.#apiServer) {
      throw new Error('ApiServer not initialized');
    }

    return this.#apiServer;
  }

  public async init() {
    if (this.#messageBroker) {
      await this.#messageBroker.init(this.#serviceData.messageBroker?.prefetchValue);
    }

    if (this.#apiServer) {
      await this.#apiServer.init(this.#serviceData.apiServer?.path);
    }
  }

  public async stop() {
    if (this.#messageBroker) {
      await this.#messageBroker.stop();
    }
  }

  public async run() {
    if (this.#apiServer) {
      await this.#apiServer.start(this.#serviceData.apiServer?.host, this.#serviceData.apiServer?.port);
    }
  }
}
