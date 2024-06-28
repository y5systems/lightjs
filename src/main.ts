import cluster from 'node:cluster';
import {join} from 'node:path';

import {MessageBroker} from './messaging/message-broker.js';
import RabbitmqManager from './messaging/rabbitmq-manager.js';
import {ServiceDataSchema, ServicesDataSchema} from './schemas/configuration.schema.js';
import {EnvironmentSchema} from './schemas/environment.schema.js';
import {Service} from './service.js';
import {loadConfiguration} from './utils/config-loader.js';
import {setupLog} from './utils/logger.js';

export default async function startApplication(rootPath: string): Promise<void> {
  if (cluster.isPrimary) {
    setupLog();

    const initTimestamp = Date.now();
    console.log('Initializing application...');

    try {
      await initServices(rootPath);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error initializing application. ${errorMessage}`);
      process.exit(1);
    }

    process.on('SIGINT', () => {
      console.log('SIGINT event received. Stopping application...');
    });

    console.log(`Initialization completed in ${Date.now() - initTimestamp}ms`);
  } else {
    try {
      const env = EnvironmentSchema.parse(process.env);

      if (!env.SERVICE_DATA) {
        console.error('Error starting service. Service data not defined');
        process.exit(1);
      }

      const serviceData = ServiceDataSchema.parse(JSON.parse(env.SERVICE_DATA));

      setupLog(serviceData);

      console.log('Starting service...');

      const rabbitmqManager = new RabbitmqManager();
      const messageHandler = new MessageBroker(rabbitmqManager, serviceData.service);

      const modulePath = join(rootPath, 'services', serviceData.service, `${serviceData.service}.js`);
      const module = await import(modulePath);
      const service = new module.default(messageHandler, serviceData) as Service;

      process.on('message', async (message: string): Promise<void> => {
        switch (message) {
          case 'init': {
            await service.init();
            process.send!('init_done');
            break;
          }

          case 'run': {
            await service.run();
            process.send!('running');
            break;
          }

          default: {
            console.log(message);
            break;
          }
        }
      });

      process.on('SIGINT', async () => {
        await service.stop();
        console.log('Service stopped successfully');
        process.exit(0);
      });

      process.send!('ready');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error starting service. ${errorMessage}`);
      process.exit(1);
    }
  }
};

async function initServices(rootPath: string): Promise<void> {
  const env = EnvironmentSchema.parse(process.env);

  const configFileName = env.NODE_ENV ? `${env.NODE_ENV}.json` : 'production.json';
  const configFilePath = join(rootPath, '../config', configFileName);
  const requestedServices = env.SERVICES ? env.SERVICES.split(' ') : [];

  let servicesData = ServicesDataSchema.parse(loadConfiguration(configFilePath));
  if (requestedServices.length !== 0) {
    servicesData = servicesData.filter((serviceData) => {
      return requestedServices.find((serviceName) => serviceName === serviceData.name);
    });
  }

  if (servicesData.length === 0) {
    console.warn('No service data loaded from configuration file');
    return;
  }

  await Promise.all(servicesData.map((serviceData) => {
    return new Promise<void>(async (resolve) => {
      const service = cluster.fork({
          SERVICE_DATA: JSON.stringify(serviceData)
        }
      );

      service.on('message', (message: string) => {
        switch (message) {
          case 'ready': {
            service.send('init');
            break;
          }

          case 'init_done': {
            service.send('run');
            break;
          }

          case 'running': {
            resolve();
            break;
          }
        }
      });
    });
  }));
}
