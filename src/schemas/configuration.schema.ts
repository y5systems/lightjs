import {z} from 'zod';

export const ServiceDataSchema = z.object({
  service: z.string(),
  name: z.string(),
  configuration: z.record(z.unknown()),
});
export type ServiceData = z.infer<typeof ServiceDataSchema>;

export const ServicesDataSchema = z.array(ServiceDataSchema);
