import {z} from 'zod';

export const RabbitmqMessageSchema = z.object({
  name: z.string(),
  data: z.record(z.unknown()),
});
export type RabbitmqMessage = z.infer<typeof RabbitmqMessageSchema>;
