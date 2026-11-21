import { z } from 'zod';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const webUrl = z.url({ protocol: /^https?$/ });
const sourceFile = z
    .object({
        path: z
            .string()
            .regex(/^src\/content\/pages\/(documentation|showcase)\//)
            .refine(
                (path) =>
                    !path.includes('\\') &&
                    !path
                        .split('/')
                        .some(
                            (part) =>
                                part === '..' || part === '.' || part === '',
                        ),
                'Expected a safe repository-relative source path',
            ),
        sha256: hash,
    })
    .strict();
const section = z
    .object({
        id: z.string(),
        source: sourceFile,
        markdown: z.string(),
        imports: z.array(z.string()),
        headings: z.array(
            z
                .object({
                    depth: z.number().int().min(1).max(6),
                    text: z.string(),
                    anchor: z.string().optional(),
                })
                .strict(),
        ),
        examples: z.array(
            z
                .object({
                    language: z.string(),
                    code: z.string(),
                    sha256: hash,
                })
                .strict(),
        ),
        tables: z.array(
            z
                .object({
                    headers: z.array(z.string()),
                    rows: z.array(z.array(z.string())),
                })
                .strict(),
        ),
        notices: z.array(
            z
                .object({
                    kind: z.enum(['alert', 'badge']),
                    text: z.string(),
                    variant: z.string().optional(),
                })
                .strict(),
        ),
        unresolvedExpressions: z.array(z.string()),
    })
    .strict();

export const snapshotSchema = z
    .object({
        schemaVersion: z.literal(1),
        sproutsiteVersion: z
            .string()
            .regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/),
        source: z
            .object({
                repository: webUrl,
                commit: z
                    .string()
                    .regex(/^[a-f0-9]{40,64}$/)
                    .nullable(),
                dirty: z.boolean().nullable(),
                license: z.literal('Apache-2.0'),
            })
            .strict(),
        defaultLocale: z.string(),
        locales: z.array(z.string()).min(1),
        documents: z.array(
            z
                .object({
                    id: z.string(),
                    pageId: z.string(),
                    kind: z.enum(['documentation', 'showcase']),
                    locale: z.string(),
                    title: z.string(),
                    heading: z.string(),
                    description: z.string(),
                    url: webUrl,
                    markdown: z.string(),
                    searchText: z.string(),
                    sourceFiles: z.array(sourceFile).min(1),
                    sha256: hash,
                    translations: z.array(
                        z
                            .object({
                                locale: z.string(),
                                id: z.string(),
                                url: webUrl,
                            })
                            .strict(),
                    ),
                    sections: z.array(section),
                })
                .strict(),
        ),
        components: z.array(
            z
                .object({
                    name: z.string(),
                    importPath: z.literal('sproutsite/components'),
                    documents: z
                        .array(
                            z
                                .object({ locale: z.string(), id: z.string() })
                                .strict(),
                        )
                        .min(1),
                })
                .strict(),
        ),
    })
    .strict();

export type McpSnapshot = z.infer<typeof snapshotSchema>;
export type ExportSection = z.infer<typeof section>;
