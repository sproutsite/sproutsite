import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadLegalIdentity } from '../src/lib/sproutsite/legal-identity.js';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

const valid = {
    LEGAL_NAME: 'Ada Example',
    LEGAL_STREET: 'Teststraße 7',
    LEGAL_POSTAL_CODE: '01234',
    LEGAL_CITY: 'Teststadt',
    LEGAL_COUNTRY: 'DE',
    LEGAL_EMAIL: 'ada@test.invalid',
    LEGAL_LINKEDIN: 'https://www.linkedin.com/in/ada-test/',
};
function envFile(values: Record<string, string>) {
    return Object.entries(values)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join('\n');
}

test('legal identity permits preview examples but requires a complete non-example .env for builds', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-legal-'));
    try {
        assert.equal(loadLegalIdentity(false, root).placeholder, true);
        assert.throws(() => loadLegalIdentity(true, root), /\.env is missing/);
        copyFileSync('.env.dist', join(root, '.env'));
        assert.throws(() => loadLegalIdentity(true, root), /example identity/);
        writeFileSync(
            join(root, '.env'),
            envFile({ LEGAL_NAME: valid.LEGAL_NAME }),
        );
        assert.equal(
            loadLegalIdentity(false, root).values.LEGAL_NAME,
            valid.LEGAL_NAME,
        );
        assert.throws(() => loadLegalIdentity(true, root), /LEGAL_STREET/);
        writeFileSync(
            join(root, '.env'),
            envFile({ ...valid, UNRELATED_SECRET: 'not-for-output' }),
        );
        assert.deepEqual(loadLegalIdentity(true, root), {
            values: valid,
            placeholder: false,
        });
        assert.equal(
            loadLegalIdentity(true, root).values.LEGAL_POSTAL_CODE,
            '01234',
        );
        for (const invalid of [
            { ...valid, LEGAL_EMAIL: 'not-an-email' },
            { ...valid, LEGAL_LINKEDIN: 'not-a-url' },
            { ...valid, LEGAL_LINKEDIN: 'javascript:alert(1)' },
            { ...valid, LEGAL_LINKEDIN: 'https://example.com/in/ada' },
            { ...valid, LEGAL_COUNTRY: 'Germany' },
            { ...valid, LEGAL_STREET: '' },
        ]) {
            writeFileSync(join(root, '.env'), envFile(invalid));
            assert.equal(loadLegalIdentity(false, root).placeholder, true);
            assert.throws(
                () => loadLegalIdentity(true, root),
                /missing or invalid fields/,
            );
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('LegalIdentity MDX allows only documented contact/name variants without expressions or children', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-legal-mdx-'));
    try {
        writeFileSync(
            join(root, 'page.yaml'),
            'title: Legal notice\ndescription: Legal details.\n',
        );
        const validate = (markup: string) => {
            writeFileSync(
                join(root, '01-legal.mdx'),
                `import { LegalIdentity } from 'sproutsite/components';\n\n## Operator\n\n${markup}\n`,
            );
            validateSproutsiteContent(root);
        };
        for (const markup of [
            '<LegalIdentity />',
            '<LegalIdentity part="contact" />',
            '**<LegalIdentity part="name" />**',
        ])
            validate(markup);
        for (const markup of [
            '<LegalIdentity part="unknown" />',
            '<LegalIdentity part={process.exit()} />',
            '<LegalIdentity href="https://example.com" />',
            '<LegalIdentity>Text</LegalIdentity>',
        ])
            assert.throws(() => validate(markup), /LegalIdentity/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
