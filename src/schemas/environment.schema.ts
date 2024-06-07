import {z} from 'zod';

export const EnvironmentSchema = z.object({
  NODE_ENV: z.string().optional(),
  SERVICES: z.string().optional(),

  RABBITMQ_HOSTNAME: z.string(),
  RABBITMQ_PORT: z.coerce.number(),
  RABBITMQ_USERNAME: z.string(),
  RABBITMQ_PASSWORD: z.string(),
  RABBITMQ_VHOST: z.string(),

  SERVICE_DATA: z.string().optional(),
});
