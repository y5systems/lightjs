import { join } from 'node:path';

import fastifyCors from '@fastify/cors';
import fastifyAutoload from '@fastify/autoload';
import Fastify, { FastifyInstance } from 'fastify';

import { ApiAdapter } from './api-adapter.js';
import { MessageBroker } from '../messaging/message-broker.js';

declare module 'fastify' {
  interface FastifyInstance {
    messageBroker?: MessageBroker;
  }
}

export interface FastifyExtensions {
  decorate(decorator: (instance: FastifyInstance) => void): void;
}

export class FastifyAdapter implements ApiAdapter {
  readonly #fastify: FastifyInstance;

  constructor() {
    this.#fastify = Fastify();
  }

  getInstance() {
    return this.#fastify;
  }

  public async init(servicePath?: string) {
    this.#fastify.register(fastifyCors)
    this.#fastify.register(fastifyAutoload, {
      dir: join(servicePath ?? '', 'routes'),
      routeParams: true,
      autoHooks: true,
      cascadeHooks: true,
    });
  }

  public async start(host?: string, port?: number) {
    await this.#fastify.listen({ host: host ?? '0.0.0.0', port: port ?? 3000 });
    console.log(`Listening for requests on ${host}:${port}`);
  }

  public asFastify(): FastifyExtensions {
    return {
      decorate: (decorator) => decorator(this.#fastify),
    };
  }
}
