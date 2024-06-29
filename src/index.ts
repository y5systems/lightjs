import startApplication from './main.js';
export default startApplication;

export * from './service.js';
export * from './messaging/message-broker.js';
export * from './messaging/message-consumer.js';

import {ServiceData} from './schemas/configuration.schema.js';
export {ServiceData};

import {replacer, reviver} from './utils/string-operations.js';
export const utils = {replacer, reviver};
