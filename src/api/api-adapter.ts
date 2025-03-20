export interface ApiAdapter {
  init(servicePath?: string): Promise<void>;
  start(host?: string, port?: number): Promise<void>;
}
