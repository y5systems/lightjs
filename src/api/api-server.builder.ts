import { FastifyInstance } from 'fastify';

import { ApiServer } from './api-server.js';
import { FastifyAdapter } from './fastify-adapter.js';

export class ApiServerBuilder {
  static withFastify() {
    const adapter = new FastifyAdapter();
    return {
      adapter,
      withDecorator(decorator: (instance: FastifyInstance) => void) {
        adapter.asFastify().decorate(decorator);
        return this;
      },
      build() {
        return new ApiServer(adapter);
      }
    };
  }
}
