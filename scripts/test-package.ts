import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    cpSync,
    existsSync,
    lstatSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

interface PackageManifest {
    name: string;
    version: string;
    private?: boolean;
    license: string;
    exports: Record<string, string>;
    publishConfig: { access: string; registry: string };
}
interface PackageLock {
    version: string;
    packages: Record<string, { version: string }>;
}
interface PackedArchive {
    filename: string;
    name: string;
    version: string;
    files: { path: string }[];
}

const root = fileURLToPath(new URL('../', import.meta.url));
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check with npm run test:package.');
const manifest = JSON.parse(
    readFileSync(join(root, 'package.json'), 'utf8'),
) as PackageManifest;
const lock = JSON.parse(
    readFileSync(join(root, 'package-lock.json'), 'utf8'),
) as PackageLock;
assert.equal(manifest.name, 'sproutsite');
assert.notEqual(manifest.private, true, 'The package is still private.');
assert.equal(manifest.license, 'Apache-2.0');
assert.deepEqual(manifest.publishConfig, {
    access: 'public',
    registry: 'https://registry.npmjs.org/',
});
assert.equal(
    readFileSync(join(root, 'VERSION'), 'utf8').trim(),
    manifest.version,
);
assert.equal(lock.version, manifest.version);
assert.equal(lock.packages['']?.version, manifest.version);
assert.ok(
    readFileSync(join(root, 'CHANGELOG.md'), 'utf8').includes(
        `## [${manifest.version}] - `,
    ),
    'The version needs a dated changelog entry.',
);

const temporary = mkdtempSync(join(tmpdir(), 'sproutsite-package-'));
const consumer = join(temporary, 'consumer');
const registry = 'https://registry.npmjs.org/';
function npm(args: string[], cwd: string, capture = false, base = '/') {
    const result = spawnSync(process.execPath, [npmCli!, ...args], {
        cwd,
        env: { ...process.env, SPROUTSITE_BASE: base },
        stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        if (capture) process.stderr.write(result.stderr ?? '');
        throw new Error(
            `npm ${args.join(' ')} failed (${result.status ?? result.signal}).`,
        );
    }
    return result.stdout ?? '';
}

function verifyBuild(base: string) {
    const output = join(consumer, 'dist');
    const routeFiles = [
        'index.html',
        'about/index.html',
        'de/index.html',
        'de/ueber/index.html',
    ];
    for (const file of routeFiles) {
        const html = readFileSync(join(output, file), 'utf8');
        const route = file.replace(/index\.html$/, '');
        assert.ok(
            html.includes(`href="https://example.com${base}${route}"`),
            `Missing canonical for ${file}`,
        );
        assert.equal((html.match(/<main\b/g) ?? []).length, 1);
        assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
        assert.ok(html.includes(`Version ${manifest.version}`));
        assert.equal(
            html.includes('sproutsite.dev'),
            false,
            'Demo branding leaked into the consumer website.',
        );
        for (const asset of html.matchAll(
            /(?:href|src)="([^"?#]*\/_astro\/[^"?#]+)"/g,
        )) {
            assert.ok(
                asset[1]!.startsWith(base),
                `Asset misses base: ${asset[1]}`,
            );
            assert.ok(
                existsSync(join(output, asset[1]!.slice(base.length))),
                `Missing asset: ${asset[1]}`,
            );
        }
    }
    const home = readFileSync(join(output, 'index.html'), 'utf8');
    assert.ok(home.includes('ss-accordion-item'));
    assert.ok(home.includes('lucide-bot'));
    assert.ok(home.includes(`href="${base}about/"`));
    assert.ok(home.includes('Consumer content stays here.'));
    for (const file of ['404.html', '500.html', '404-de.html', '500-de.html']) {
        const html = readFileSync(join(output, file), 'utf8');
        assert.ok(html.includes('noindex, follow'));
        assert.ok(
            html.includes(`lang="${file.includes('-de') ? 'de' : 'en'}"`),
        );
    }
    const sitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
    for (const file of routeFiles)
        assert.ok(
            sitemap.includes(
                `<loc>https://example.com${base}${file.replace(/index\.html$/, '')}</loc>`,
            ),
        );
    assert.ok(sitemap.includes('hreflang="de"'));
    assert.ok(sitemap.includes('hreflang="x-default"'));
    assert.equal(/<loc>[^<]*(?:404|500)/.test(sitemap), false);
    const webManifest = JSON.parse(
        readFileSync(join(output, 'site.webmanifest'), 'utf8'),
    ) as { name: string; start_url: string };
    assert.equal(webManifest.name, 'Consumer fixture');
    assert.equal(webManifest.start_url, base);
    const assets = readdirSync(join(output, '_astro'));
    const css = assets
        .filter((file) => file.endsWith('.css'))
        .map((file) => readFileSync(join(output, '_astro', file), 'utf8'))
        .join('');
    assert.ok(
        css.includes('.ss-accordion-item'),
        'Installed theme styles were not emitted.',
    );
    assert.ok(
        assets.some((file) => file.endsWith('.woff2')),
        'Local theme font was not emitted.',
    );
    console.log(
        `PASS installed package: ${base} routes, MDX, assets, font, version, errors, manifest, and sitemap.`,
    );
}

try {
    // Suppress lifecycle scripts deliberately: packing must never recurse into
    // the publish gate, and the tarball must work without source preparation.
    const archives = JSON.parse(
        npm(
            [
                'pack',
                '--json',
                '--ignore-scripts',
                '--pack-destination',
                temporary,
            ],
            root,
            true,
        ),
    ) as PackedArchive[];
    assert.equal(archives.length, 1);
    const archive = archives[0]!;
    assert.equal(archive.name, manifest.name);
    assert.equal(archive.version, manifest.version);
    const files = new Set(archive.files.map((file) => file.path));
    for (const file of [
        'package.json',
        'README.md',
        'VERSION',
        'LICENSE',
        'NOTICE',
        'THIRD_PARTY_NOTICES.md',
        'src/themes/default/assets/hero-waves.svg',
        'src/themes/default/styles/foundation/fonts/OFL.txt',
        'third-party-licenses/lucide-LICENSE',
        ...Object.values(manifest.exports).map((file) =>
            file.replace(/^\.\//, ''),
        ),
    ])
        assert.ok(files.has(file), `Missing package file: ${file}`);
    for (const file of files)
        assert.ok(
            !/^(?:dist|node_modules|scripts|tests|stories|\.git|\.codex|\.agents|\.aws|src\/content)(?:\/|$)|(?:^|\/)\.env(?:\.|$)/.test(
                file,
            ),
            `Unexpected package file: ${file}`,
        );
    const archivePath = resolve(temporary, archive.filename);
    assert.equal(
        resolve(temporary, archive.filename).startsWith(temporary),
        true,
    );
    cpSync(join(root, 'scripts/fixtures/package-consumer'), consumer, {
        recursive: true,
    });
    const versionOf = (name: string) => {
        const version = lock.packages[`node_modules/${name}`]?.version;
        assert.ok(version, `Missing locked test dependency ${name}`);
        return version;
    };
    writeFileSync(
        join(consumer, 'package.json'),
        JSON.stringify(
            {
                name: 'sproutsite-consumer-fixture',
                version: '0.0.0',
                private: true,
                type: 'module',
                scripts: { check: 'astro check', build: 'astro build' },
                dependencies: {
                    sproutsite: pathToFileURL(archivePath).href,
                    astro: versionOf('astro'),
                    '@astrojs/mdx': versionOf('@astrojs/mdx'),
                },
                devDependencies: {
                    '@astrojs/check': versionOf('@astrojs/check'),
                    typescript: versionOf('typescript'),
                },
            },
            null,
            4,
        ),
    );
    console.log(
        `Testing ${archive.filename} in a fresh consumer. npm may download dependencies.`,
    );
    npm(
        [
            'install',
            '--ignore-scripts',
            '--no-audit',
            '--no-fund',
            '--registry',
            registry,
        ],
        consumer,
    );
    const installed = join(consumer, 'node_modules/sproutsite');
    assert.equal(
        lstatSync(installed).isSymbolicLink(),
        false,
        'Expected a real tarball installation, not a symlink.',
    );
    assert.notEqual(realpathSync(installed), realpathSync(root));
    assert.equal(
        (
            JSON.parse(
                readFileSync(join(installed, 'package.json'), 'utf8'),
            ) as PackageManifest
        ).version,
        manifest.version,
    );
    npm(['run', 'check'], consumer);
    for (const base of ['/', '/demo/']) {
        npm(['run', 'build'], consumer, false, base);
        verifyBuild(base);
    }
    rmSync(temporary, { recursive: true, force: true });
    console.log(
        'Package installation checks passed. Temporary files removed. Nothing was published.',
    );
} catch (error) {
    console.error(
        `Package check failed. Temporary files retained for inspection: ${temporary}`,
    );
    throw error;
}
