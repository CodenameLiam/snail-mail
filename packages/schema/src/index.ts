import { z } from 'zod';

export const Message = z.object({
    to: z.string(), // Conversation Id
    from: z.string(), // User Id
    body: z.string(),
    images: z.array(z.string()),
    sendTime: z.date(),
    receiveTime: z.date().optional(),
});

export type Message = z.infer<typeof Message>;
