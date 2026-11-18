import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { z } from 'zod';

const text = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[^\r\n]+$/);
const schema = z.object({
    LEGAL_NAME: text,
    LEGAL_STREET: text,
    LEGAL_POSTAL_CODE: text,
    LEGAL_CITY: text,
    LEGAL_COUNTRY: z
        .string()
        .trim()
        .regex(/^[A-Z]{2}$/),
    LEGAL_EMAIL: z.email(),
    LEGAL_LINKEDIN: z.url().refine((value) => {
        try {
            const url = new URL(value);
            return (
                url.protocol === 'https:' &&
                ['www.linkedin.com', 'linkedin.com'].includes(url.hostname) &&
                url.pathname.startsWith('/in/')
            );
        } catch {
            return false;
        }
    }, 'must be an HTTPS LinkedIn profile URL'),
});

export const legalIdentityExamples = {
    LEGAL_NAME: 'Max Mustermann',
    LEGAL_STREET: 'Musterstraße 123',
    LEGAL_POSTAL_CODE: '12345',
    LEGAL_CITY: 'Musterstadt',
    LEGAL_COUNTRY: 'DE',
    LEGAL_EMAIL: 'kontakt@example.com',
    LEGAL_LINKEDIN: 'https://www.linkedin.com/in/example/',
} as const;

/** Read only .env, without mutating process.env or exposing unrelated values. */
export function loadLegalIdentity(
    requireComplete = false,
    root = process.cwd(),
) {
    const file = resolve(root, '.env');
    const present = existsSync(file);
    const raw = present ? parseEnv(readFileSync(file, 'utf8')) : {};
    const values = { ...legalIdentityExamples } as Record<
        keyof typeof legalIdentityExamples,
        string
    >;
    const invalid: string[] = [];
    for (const key of Object.keys(schema.shape) as (keyof typeof values)[]) {
        const result = schema.shape[key].safeParse(raw[key]);
        if (result.success) values[key] = result.data;
        else invalid.push(key);
    }
    const exampleIdentity =
        values.LEGAL_NAME === legalIdentityExamples.LEGAL_NAME ||
        values.LEGAL_EMAIL.endsWith('@example.com') ||
        values.LEGAL_LINKEDIN === legalIdentityExamples.LEGAL_LINKEDIN;
    if (
        requireComplete &&
        (!present || invalid.length > 0 || exampleIdentity)
    ) {
        const reason = !present
            ? '.env is missing'
            : invalid.length > 0
              ? `missing or invalid fields: ${invalid.join(', ')}`
              : 'example identity values must be replaced';
        throw new Error(
            `Legal identity: ${reason}. Copy .env.dist to .env and complete the operator details before building.`,
        );
    }
    return {
        values,
        placeholder: !present || invalid.length > 0 || exampleIdentity,
    };
}
