import * as z from 'zod';

/** Schema for dependencies object */
export const dependenciesSchema = z.object({
    external: z.array(z.string()).default([]),
    registry: z.array(z.string()).default([]),
    shared: z.array(z.string()).default([])
});

/** Schema for a registry item (component definition) */
export const registryItemSchema = z.object({
    name: z.string(),
    dependencies: dependenciesSchema,
    files: z.array(z.string()).default([])
});

export const registryManifestSchema = z.object({
    components: z.array(z.string())
});

export type RegistryItem = z.infer<typeof registryItemSchema>;
export type RegistryManifest = z.infer<typeof registryManifestSchema>;
export type Dependencies = z.infer<typeof dependenciesSchema>;
