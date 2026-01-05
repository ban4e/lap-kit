import * as z from 'zod';

export const configSchema = z.object({
    aliases: z.object({
        components: z.string(),
        lib: z.string()
    }),
    dirs: z.object({
        components: z.string(),
        lib: z.string()
    }),
    installedComponents: z.array(z.string()).optional()
});
export type Config = z.infer<typeof configSchema>;
