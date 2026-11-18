import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadPrivacyInfrastructure } from '../src/lib/sproutsite/privacy-infrastructure.js';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

const valid = {
    PRIVACY_HOST_NAME: 'Test Hosting GmbH',
    PRIVACY_HOST_ADDRESS: 'Teststraße 1, 12345 Testort, Deutschland',
    PRIVACY_HOST_URL: 'https://host.test.invalid',
    PRIVACY_HOST_PRIVACY_URL: 'https://host.test.invalid/privacy',
    PRIVACY_SERVER_CITY: 'Testort',
    PRIVACY_SERVER_COUNTRY: 'DE',
    PRIVACY_LOG_SIZE_LIMIT_MIB: '100',
    PRIVACY_LOG_RETENTION_DAYS: '',
    PRIVACY_EMAIL_RETENTION_MONTHS: '6',
};
const serialize = (values: Record<string, string>) =>
    Object.entries(values)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n');

test('privacy infrastructure validates hosting and retention without inventing a log deletion period', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-privacy-'));
    try {
        assert.equal(loadPrivacyInfrastructure(false, root).placeholder, true);
        assert.throws(
            () => loadPrivacyInfrastructure(true, root),
            /\.env is missing/,
        );
        copyFileSync('.env.dist', join(root, '.env'));
        assert.throws(
            () => loadPrivacyInfrastructure(true, root),
            /example hosting values/,
        );
        writeFileSync(
            join(root, '.env'),
            serialize({ ...valid, OTHER_SECRET: 'not-rendered' }),
        );
        assert.deepEqual(loadPrivacyInfrastructure(true, root), {
            values: valid,
            placeholder: false,
        });
        writeFileSync(
            join(root, '.env'),
            serialize({ ...valid, PRIVACY_LOG_RETENTION_DAYS: '7' }),
        );
        assert.equal(
            loadPrivacyInfrastructure(true, root).values
                .PRIVACY_LOG_RETENTION_DAYS,
            '7',
        );
        for (const invalid of [
            { ...valid, PRIVACY_HOST_NAME: '' },
            { ...valid, PRIVACY_HOST_URL: 'javascript:alert(1)' },
            { ...valid, PRIVACY_LOG_RETENTION_DAYS: '-1' },
            { ...valid, PRIVACY_LOG_SIZE_LIMIT_MIB: 'invalid' },
            { ...valid, PRIVACY_EMAIL_RETENTION_MONTHS: '0' },
        ]) {
            writeFileSync(join(root, '.env'), serialize(invalid));
            assert.equal(
                loadPrivacyInfrastructure(false, root).placeholder,
                true,
            );
            assert.throws(
                () => loadPrivacyInfrastructure(true, root),
                /missing or invalid fields/,
            );
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('PrivacyInfrastructure MDX accepts only its documented parts', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-privacy-mdx-'));
    try {
        writeFileSync(
            join(root, 'page.yaml'),
            'title: Privacy\ndescription: Privacy details.\n',
        );
        const validate = (markup: string) => {
            writeFileSync(
                join(root, '01-privacy.mdx'),
                `import { PrivacyInfrastructure } from 'sproutsite/components';\n\n## Hosting\n\n${markup}\n`,
            );
            validateSproutsiteContent(root);
        };
        for (const part of [
            'hosting',
            'email-retention',
            'log-size-limit',
            'log-retention',
        ])
            validate(`<PrivacyInfrastructure part="${part}" />`);
        validate('<PrivacyInfrastructure />');
        for (const markup of [
            '<PrivacyInfrastructure part="unknown" />',
            '<PrivacyInfrastructure part={process.exit()} />',
            '<PrivacyInfrastructure>Text</PrivacyInfrastructure>',
        ])
            assert.throws(() => validate(markup), /PrivacyInfrastructure/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
