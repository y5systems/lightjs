import { z } from 'zod';

export const ServiceDataSchema = z.object({
  service: z.string(),
  name: z.string(),
  messageBroker: z.object({
    name: z.string(),
    prefetchValue: z.number().optional(),
  }).optional(),
  apiServer: z.object({
    framework: z.enum(['fastify']),
    host: z.string().optional(),
    port: z.number().optional(),
    path: z.string().optional(),
  }).optional(),
  configuration: z.record(z.unknown()),
});
export type ServiceData = z.infer<typeof ServiceDataSchema>;

export const ServicesDataSchema = z.array(ServiceDataSchema);
