import { ApiServerBuilder } from './api/api-server.builder.js';
import { MessageBroker } from './messaging/message-broker.js';
import RabbitmqManager from './messaging/rabbitmq-manager.js';
import { Service } from './service.js';
import { ServiceData } from './schemas/service-data.schema.js';

export class ServiceBuilder {
  private readonly serviceData: ServiceData;

  constructor(serviceData: ServiceData) {
    this.serviceData = serviceData;
  }

  build<T extends Service>(ServiceClass: new (...args: any[]) => T): T {
    const service = new ServiceClass(this.serviceData);

    let messageBroker: MessageBroker | undefined;
    if (this.serviceData.messageBroker) {
      const rabbitmqManager = new RabbitmqManager();
      messageBroker = new MessageBroker(rabbitmqManager, this.serviceData.messageBroker.queueName);
      service.messageBroker = messageBroker;
    }

    if (this.serviceData.apiServer) {
      switch (this.serviceData.apiServer.framework) {
        case 'fastify':
          service.apiServer = ApiServerBuilder.withFastify()
            .withDecorator((instance) => {
              instance.messageBroker = messageBroker;
            })
            .build();
          break;
        default:
          throw new Error(`Unsupported API framework: ${this.serviceData.apiServer.framework}`);
      }
    }

    return service;
  }
}
