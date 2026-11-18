import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadSiteConfig } from '../src/lib/sproutsite/site-config.js';

test('footer preserves legacy links and validates optional groups, socials and controls', () => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-footer-'));
    mkdirSync(join(root, 'src/content'), { recursive: true });
    const basic = {
        text: 'A website',
        links: [{ label: 'About', href: '/about/' }],
    };
    const configure = (footer: unknown) => {
        writeFileSync(
            join(root, 'src/content/site.yaml'),
            stringify({
                name: 'Example',
                url: 'https://example.com',
                base: '/',
                language: 'en',
                header: { links: [{ label: 'Home', href: '/' }] },
                footer,
            }),
        );
        return loadSiteConfig(undefined, root).footer;
    };
    try {
        assert.deepEqual(configure(basic), basic);
        const full = {
            ...basic,
            copyright: '© 2026 Example',
            showVersion: false,
            languageSwitcher: true,
            groups: [
                {
                    title: 'Product',
                    links: [
                        {
                            label: 'Email',
                            href: 'mailto:hello@example.com',
                            icon: 'Mail',
                        },
                    ],
                },
            ],
            social: {
                title: 'Follow',
                links: [
                    {
                        label: 'GitHub',
                        platform: 'github',
                        href: 'https://github.com/sproutsite/sproutsite',
                    },
                ],
            },
        };
        assert.deepEqual(configure(full), full);
        for (const footer of [
            { ...basic, groups: [{ title: '', links: basic.links }] },
            { ...basic, groups: [{ title: 'Product', links: [] }] },
            {
                ...basic,
                groups: [
                    {
                        title: 'Product',
                        links: [{ ...basic.links[0], icon: 'mail' }],
                    },
                ],
            },
            {
                ...full,
                social: {
                    title: 'Follow',
                    links: [
                        {
                            label: 'Unknown',
                            platform: 'unknown',
                            href: 'https://example.com',
                        },
                    ],
                },
            },
            { ...basic, languageSwitcher: 'true' },
            { ...basic, showVersion: 0 },
            ...[
                'javascript:alert(1)',
                '//example.com',
                'data:text/html,test',
            ].map((href) => ({ ...basic, links: [{ label: 'Unsafe', href }] })),
        ])
            assert.throws(() => configure(footer), /footer\./);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
