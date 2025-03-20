import { MessageBroker } from './message-broker.js';

type ProduceMessageSignature = typeof MessageBroker.prototype.produceMessage;

export abstract class MessageConsumer {
  protected produceMessage: ProduceMessageSignature;

  protected constructor(produceMessage: ProduceMessageSignature) {
    this.produceMessage = produceMessage;
  }

  abstract consume(data: Record<string, unknown>): Promise<void>;
}
