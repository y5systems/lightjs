import { ApiAdapter } from './api-adapter.js';

export class ApiServer {
    readonly #apiAdapter: ApiAdapter;

    constructor(apiAdapter: ApiAdapter) {
        this.#apiAdapter = apiAdapter;
    }

    get apiAdapter(): ApiAdapter {
        return this.#apiAdapter;
    }

    async init(servicePath?: string) {
        await this.#apiAdapter.init(servicePath);
    }

    async start(host?: string, port?: number) {
        await this.#apiAdapter.start(host, port);
    }
}
