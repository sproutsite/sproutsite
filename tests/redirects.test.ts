import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from 'node:test';
import {
    loadRedirects,
    renderRedirects,
    validateRedirectBase,
} from '../src/lib/sproutsite/redirects.js';

test('reads optional redirects and renders exact rules under the deployment base', (context) => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-redirects-'));
    context.after(() => rmSync(root, { recursive: true, force: true }));
    const file = pathToFileURL(join(root, 'redirects.yaml'));
    assert.equal(loadRedirects(file), undefined);
    writeFileSync(file, 'redirects: [{ from: /old.html, to: /de/ }]');
    const rules = loadRedirects(file);
    assert.deepEqual(rules, [{ from: '/old.html', to: '/de/', status: 301 }]);
    const { nginx, apache } = renderRedirects(rules!, '/demo/');
    assert.ok(nginx.includes('location = /demo/old.html'));
    assert.ok(nginx.includes('return 301 /demo/de/$is_args$args;'));
    assert.ok(
        apache.includes('RedirectMatch 301 "^/demo/old\\.html$" "/demo/de/"'),
    );
});

test('rejects unsafe paths, duplicate sources, and redirects to redirects', (context) => {
    const root = mkdtempSync(join(tmpdir(), 'sproutsite-redirects-'));
    context.after(() => rmSync(root, { recursive: true, force: true }));
    const file = pathToFileURL(join(root, 'redirects.yaml'));
    for (const [yaml, error] of [
        ['[{ from: //external.example, to: / }]', /redirects\.0\.from/],
        ['[{ from: /old, to: "/..\u002f" }]', /redirects\.0\.to/],
        ['[{ from: /old, to: /, status: 302 }]', /redirects\.0\.status/],
        ['[{ from: /old, to: / }, { from: /old, to: / }]', /duplicate source/],
        [
            '[{ from: /old, to: /new/ }, { from: /new, to: / }]',
            /use the final page URL/,
        ],
        ['[{ from: /old, to: /old/ }]', /use the final page URL/],
    ] as const) {
        writeFileSync(file, `redirects: ${yaml}`);
        assert.throws(() => loadRedirects(file), error);
    }
    assert.throws(
        () => validateRedirectBase('/unsafe;base/'),
        /deployment base/,
    );
});
