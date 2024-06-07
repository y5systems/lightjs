import {SendMessageType} from './message-broker.js';

export default abstract class MessageConsumer {
  protected sendMessage: SendMessageType;

  protected constructor(sendMessage: SendMessageType) {
    this.sendMessage = sendMessage;
  }

  abstract consume(data: Record<string, unknown>): Promise<void>;
}
