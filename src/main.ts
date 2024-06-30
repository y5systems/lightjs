import cluster from 'node:cluster';
import {join} from 'node:path';
import {ZodError} from 'zod';

import {MessageBroker} from './messaging/message-broker.js';
import RabbitmqManager from './messaging/rabbitmq-manager.js';
import {ServiceData, ServiceDataSchema, ServicesDataSchema} from './schemas/configuration.schema.js';
import {Environment, EnvironmentSchema} from './schemas/environment.schema.js';
import {Service} from './service.js';
import {loadConfiguration} from './utils/config-loader.js';
import {setupLog} from './utils/logger.js';

export default async function startApplication(rootPath: string): Promise<void> {
  let env: Environment;

  try {
    env = EnvironmentSchema.parse(process.env);
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof ZodError) {
      errorMessage = `Zod Parsing Error. ${JSON.stringify(error.format())}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error(`Failed to parse environment variables. ${errorMessage}`);
    process.exit();
  }

  if (cluster.isPrimary) {
    const initTimestamp = Date.now();

    try {
      setupLog('main');

      console.log('Initializing application...');

      await initServices(rootPath, env);
    } catch (error) {
      console.error(`Error initializing application. ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit();
    }

    console.log(`Initialization completed in ${Date.now() - initTimestamp}ms`);
  } else {
    try {
      await startService(rootPath, env);
    } catch (error) {
      console.error(`Error starting service. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

async function initServices(rootPath: string, env: Environment) {
  try {
    const configFileName = env.NODE_ENV ? `${env.NODE_ENV}.json` : 'production.json';
    const configFilePath = join(rootPath, '../config', configFileName);
    const requestedServices = env.SERVICES ? env.SERVICES.split(' ') : [];

    console.log('Loading configuration file...');
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

    const promiseResults = await Promise.allSettled(servicesData.map((serviceData) => {
      return createService(serviceData);
    }));

    promiseResults.forEach((promiseResult) => {
      if (promiseResult.status === 'rejected') {
        console.warn(`Failed to create service. ${promiseResult.reason}`);
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Failed to parse service data. Zod Parsing Error. Details: ${JSON.stringify(error.format())}`);
    } else {
      throw error;
    }
  }

  process.on('SIGINT', () => {
    console.log('SIGINT event received. Stopping application...');
  });
}

function createService(serviceData: ServiceData) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const service = cluster.fork({
        SERVICE_DATA: JSON.stringify(serviceData)
      });

      // Listen for service state changes to properly manage service initialization
      service.on('message', (message: string) => {
        switch (message) {
          case 'ready': {
            service.send('init');
            break;
          }

          case 'initialized': {
            service.send('run');
            break;
          }

          case 'running': {
            resolve();
            break;
          }
        }
      });
    } catch (error) {
      reject(`Failed to spawn ${serviceData.name}. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
}

async function startService(rootPath: string, env: Environment) {
  if (!env.SERVICE_DATA) {
    throw new Error('Service data not defined');
  }

  try {
    const serviceData = ServiceDataSchema.parse(JSON.parse(env.SERVICE_DATA));
    setupLog(serviceData.name);

    console.log('Starting service...');

    const rabbitmqManager = new RabbitmqManager();
    const messageHandler = new MessageBroker(rabbitmqManager, serviceData.service);

    const modulePath = join(rootPath, 'services', serviceData.service, `${serviceData.service}.js`);
    const module = await import(modulePath);
    const service = new module.default(messageHandler, serviceData) as Service;

    // Execute service tasks based on received message from main process
    process.on('message', async (message: string): Promise<void> => {
      switch (message) {
        case 'init': {
          await service.init();
          process.send!('initialized');
          break;
        }

        case 'run': {
          await service.run();
          process.send!('running');
          break;
        }

        default: {
          console.warn(`Invalid message ${message}`);
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
    if (error instanceof SyntaxError) {
      throw new Error(`Json Parsing Error. ${error.message}`);
    } else if (error instanceof ZodError) {
      throw new Error(`Zod Parsing Error. ${JSON.stringify(error.format())}`);
    } else {
      throw error;
    }
  }
}
