import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { z } from 'zod';

const text = z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[^\r\n]+$/);
const schema = z.object({
    PRIVACY_HOST_NAME: text,
    PRIVACY_HOST_ADDRESS: text,
    PRIVACY_HOST_URL: z.url().refine((value) => value.startsWith('https://')),
    PRIVACY_HOST_PRIVACY_URL: z
        .url()
        .refine((value) => value.startsWith('https://')),
    PRIVACY_SERVER_CITY: text,
    PRIVACY_SERVER_COUNTRY: z.string().regex(/^[A-Z]{2}$/),
    PRIVACY_LOG_SIZE_LIMIT_MIB: z.string().regex(/^[1-9]\d*$/),
    PRIVACY_LOG_RETENTION_DAYS: z
        .string()
        .regex(/^(?:|[1-9]\d*)$/)
        .default(''),
    PRIVACY_EMAIL_RETENTION_MONTHS: z.string().regex(/^[1-9]\d*$/),
});
const examples = {
    PRIVACY_HOST_NAME: 'Example Hosting GmbH',
    PRIVACY_HOST_ADDRESS: 'Musterstraße 1, 12345 Musterstadt, Deutschland',
    PRIVACY_HOST_URL: 'https://hosting.example.com',
    PRIVACY_HOST_PRIVACY_URL: 'https://hosting.example.com/privacy',
    PRIVACY_SERVER_CITY: 'Musterstadt',
    PRIVACY_SERVER_COUNTRY: 'DE',
    PRIVACY_LOG_SIZE_LIMIT_MIB: '100',
    PRIVACY_LOG_RETENTION_DAYS: '',
    PRIVACY_EMAIL_RETENTION_MONTHS: '6',
} as const;

/** Separate from legal identity: only pages using hosting details need these keys. */
export function loadPrivacyInfrastructure(
    requireComplete = false,
    root = process.cwd(),
) {
    const file = resolve(root, '.env');
    const present = existsSync(file);
    const raw = present ? parseEnv(readFileSync(file, 'utf8')) : {};
    const values = { ...examples } as Record<keyof typeof examples, string>;
    const invalid: string[] = [];
    for (const key of Object.keys(schema.shape) as (keyof typeof values)[]) {
        const result = schema.shape[key].safeParse(raw[key]);
        if (result.success) values[key] = result.data;
        else invalid.push(key);
    }
    const example =
        values.PRIVACY_HOST_NAME === examples.PRIVACY_HOST_NAME ||
        values.PRIVACY_HOST_URL === examples.PRIVACY_HOST_URL ||
        values.PRIVACY_SERVER_CITY === examples.PRIVACY_SERVER_CITY;
    if (requireComplete && (!present || invalid.length > 0 || example)) {
        const reason = !present
            ? '.env is missing'
            : invalid.length > 0
              ? `missing or invalid fields: ${invalid.join(', ')}`
              : 'example hosting values must be replaced';
        throw new Error(
            `Privacy infrastructure: ${reason}. Complete the hosting details from .env.dist before building.`,
        );
    }
    return { values, placeholder: !present || invalid.length > 0 || example };
}
