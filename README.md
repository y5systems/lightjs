# LightJS

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**A lightweight Node.js framework designed to simplify the creation of streamlined and efficient applications.**

## Features

* **Minimalistic and Intuitive:** Get started quickly.
* **Focused on Simplicity:** Ideal for small to medium-sized projects that prioritize efficiency.
* **Built for Microservices:** Easily create independent services for scalable applications.

## Installation

```bash
npm install lightjs
```

## Getting Started
This framework uses RabbitMQ for communication between services. Make sure to have it up and running before you run your application.

### Create a Project:
```bash
mkdir my-app && cd my-app
npm init -y
```
Note: This documentation uses TypeScript, make sure to install it and to add a tsconfig.json file.

### Install the Framework:
```bash
npm install -s lightjs
```

### Create your main file (e.g. index.ts):
```javascript
import startApplication from 'lightjs';

const appRootPath = dirname(fileURLToPath(import.meta.url));
startApplication(appRootPath).then();
```

### Create a service to produce messages (e.g. producer.ts):
```bash
mkdir -p services/producer
```

```javascript
import {MessageBroker, Service} from 'lightjs';

export default class Producer extends Service {

  constructor(messageBroker: MessageBroker, serviceConfiguration: Record<string, unknown>) {
    super(messageBroker, serviceConfiguration);
  }

  async run(): Promise<void> {
    const interval = setInterval(() => {
      this.sendMessage('consumer', 'messageLogger', {message: 'producing...'});
    }, 1000);
  }
}
```

### Create a service to consume messages (e.g. consumer.ts):
```bash
mkdir -p services/consumer
```

```javascript
import {MessageBroker, Service} from 'lightjs';

export default class Consumer extends Service {

  constructor(messageBroker: MessageBroker, serviceConfiguration: Record<string, unknown>) {
    super(messageBroker, serviceConfiguration);
  }

  async run(): Promise<void> {
    this.messageBroker.messageConsumers.set('messageLogger', new MessageLogger(this.messageBroker.eventEmitter));
  }
}
```

```javascript
import {EventEmitter} from 'node:events';

import {MessageConsumer} from 'lightjs';

class MessageLogger extends MessageConsumer {
  constructor(eventEmitter: EventEmitter) {
    super(eventEmitter);
  }

  async consume(data: Record<string, unknown>): Promise<void> {
    console.log(data.message);
  }
}
```

### Create the configuration file (e.g. development.json):
```bash
mkdir config
```

```json
[
  {
    "service": "producer",
    "name": "producer-01",
    "serviceConfiguration": {}
  },
  {
    "service": "consumer",
    "name": "consumer-01",
    "serviceConfiguration": {}
  }
]
```

### Setup your environment:
```dotenv
NODE_ENV=development
SERVICES=

RABBITMQ_HOSTNAME=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=rabbitmq-username
RABBITMQ_PASSWORD=rabbitmq-password
RABBITMQ_VHOST=rabbitmq-vhost
```
Note: You can choose what services to run using the SERVICES variable (An empty string will run all services on the configuration file).

### Run the application:
```bash
node --env-file=.env index.js
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.
