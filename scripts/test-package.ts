import { verifyPackageThemes } from './test-package-themes.js';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import {
    cpSync,
    existsSync,
    lstatSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse, stringify } from 'yaml';

interface PackageManifest {
    name: string;
    version: string;
    private?: boolean;
    license: string;
    exports: Record<string, string>;
    imports: Record<string, string>;
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
        env: {
            ...process.env,
            // npm publish --dry-run passes this setting into lifecycle scripts.
            // Nested checks need real local packing/installation; the parent
            // publication remains a dry run because its environment is unchanged.
            npm_config_dry_run: 'false',
            SPROUTSITE_BASE: base,
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (!capture) {
        process.stdout.write(result.stdout ?? '');
        process.stderr.write(result.stderr ?? '');
    }
    if (result.status !== 0) {
        if (capture) process.stderr.write(result.stderr ?? '');
        throw new Error(
            `npm ${args.join(' ')} failed (${result.status ?? result.signal}).`,
        );
    }
    assertQuietBlog(`${result.stdout ?? ''}\n${result.stderr ?? ''}`);
    return result.stdout ?? '';
}

function assertQuietBlog(output: string) {
    assert.doesNotMatch(
        output,
        /The collection "blog(?:Pages|Documents)" does not exist or is empty|The base directory "[^"\n]*[/\\]blog[/\\]?" does not exist|No files found matching[^\n]*blog/,
        'Optional blog emitted missing/empty collection warnings.',
    );
}

function verifyLegalIdentityBuilds() {
    const directory = join(consumer, 'src/content/pages/legal-fixture');
    mkdirSync(directory);
    writeFileSync(
        join(directory, 'page.yaml'),
        'title: Legal fixture\ndescription: Environment-backed legal identity.\n',
    );
    writeFileSync(
        join(directory, '01-identity.mdx'),
        `import { LegalIdentity } from 'sproutsite/components';\n\n## Operator\n\n<LegalIdentity />\n\nResponsible: **<LegalIdentity part="name" />**\n`,
    );
    const envFile = join(consumer, '.env');
    const expectBuildFailure = (message: RegExp) => {
        const result = spawnSync(process.execPath, [npmCli!, 'run', 'build'], {
            cwd: consumer,
            env: {
                ...process.env,
                npm_config_dry_run: 'false',
                SPROUTSITE_BASE: '/',
            },
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024,
        });
        if (result.error) throw result.error;
        assert.notEqual(
            result.status,
            0,
            'Invalid legal identity must stop the build',
        );
        assert.match(`${result.stdout}\n${result.stderr}`, message);
    };
    expectBuildFailure(/Legal identity: \.env is missing/);
    writeFileSync(envFile, 'LEGAL_NAME="Test Operator"\n');
    expectBuildFailure(/missing or invalid fields: LEGAL_STREET/);
    cpSync(join(root, '.env.dist'), envFile);
    expectBuildFailure(/example identity values must be replaced/);
    writeFileSync(
        envFile,
        [
            'LEGAL_NAME="Test Operator"',
            'LEGAL_STREET="Teststraße 7"',
            'LEGAL_POSTAL_CODE="01234"',
            'LEGAL_CITY="Teststadt"',
            'LEGAL_COUNTRY="DE"',
            'LEGAL_EMAIL="contact@test.invalid"',
            'LEGAL_LINKEDIN="https://www.linkedin.com/in/test-operator/"',
            'UNRELATED_SECRET="never-render-this-token"',
        ].join('\n'),
    );
    const identitySection = join(directory, '01-identity.mdx');
    writeFileSync(
        identitySection,
        `import { PrivacyInfrastructure } from 'sproutsite/components';\n\n${readFileSync(identitySection, 'utf8')}\n\nEmail: <LegalIdentity part="email" />\n\n### Controller\n\n<LegalIdentity part="controller" />\n\n### Hosting\n\n<PrivacyInfrastructure />\n\nSize limit: <PrivacyInfrastructure part="log-size-limit" />\n\n<PrivacyInfrastructure part="log-retention" />\n\nEmail limit: <PrivacyInfrastructure part="email-retention" /> months.\n`,
    );
    expectBuildFailure(/Privacy infrastructure: missing or invalid fields/);
    writeFileSync(
        envFile,
        readFileSync(envFile, 'utf8') +
            '\n' +
            [
                'PRIVACY_HOST_NAME="Test Hosting GmbH"',
                'PRIVACY_HOST_ADDRESS="Teststraße 1, 12345 Testort, Deutschland"',
                'PRIVACY_HOST_URL="https://host.test.invalid"',
                'PRIVACY_HOST_PRIVACY_URL="https://host.test.invalid/privacy"',
                'PRIVACY_SERVER_CITY="Testort"',
                'PRIVACY_SERVER_COUNTRY="DE"',
                'PRIVACY_LOG_SIZE_LIMIT_MIB="100"',
                'PRIVACY_LOG_RETENTION_DAYS=""',
                'PRIVACY_EMAIL_RETENTION_MONTHS="6"',
            ].join('\n'),
    );
    npm(['run', 'build'], consumer, true, '/demo/');
    const html = readFileSync(
        join(consumer, 'dist/legal-fixture/index.html'),
        'utf8',
    );
    for (const value of [
        'Test Operator',
        'Teststraße 7',
        '01234',
        'contact@test.invalid',
    ])
        assert.ok(html.includes(value));
    assert.ok(html.includes('<address>'));
    assert.ok(
        html.includes('Test Hosting GmbH') &&
            html.includes('No fixed retention period'),
    );
    assert.ok(html.includes('Email limit: 6 months.'));
    assert.ok(
        !html.includes('Max Mustermann') &&
            !html.includes('never-render-this-token'),
    );
    rmSync(envFile);
    console.log(
        'PASS legal identity: missing, incomplete and example .env rejected; complete private values rendered from the installed package.',
    );
}

async function verifyDevBlogLifecycle() {
    const blog = join(consumer, 'src/content/blog');
    rmSync(blog, { recursive: true, force: true });
    const reservation = createServer();
    const port = await new Promise<number>((accept, reject) => {
        reservation.once('error', reject);
        reservation.listen(0, '127.0.0.1', () => {
            const address = reservation.address();
            assert.ok(address && typeof address !== 'string');
            reservation.close(() => accept(address.port));
        });
    });
    const astroRoot = join(consumer, 'node_modules/astro');
    const astroManifest = JSON.parse(
        readFileSync(join(astroRoot, 'package.json'), 'utf8'),
    ) as { bin: { astro: string } };
    const server = spawn(
        process.execPath,
        [
            join(astroRoot, astroManifest.bin.astro),
            'dev',
            '--ignore-lock',
            '--host',
            '127.0.0.1',
            '--port',
            String(port),
        ],
        {
            cwd: consumer,
            env: { ...process.env, SPROUTSITE_BASE: '/' },
            stdio: ['ignore', 'pipe', 'pipe'],
        },
    );
    let output = '';
    let launchError: Error | undefined;
    server.on('error', (error) => {
        launchError = error;
    });
    server.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString();
    });
    server.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString();
    });
    const waitForPage = async (
        route: string,
        predicate: (response: Response, html: string) => boolean,
    ) => {
        const deadline = Date.now() + 45_000;
        while (Date.now() < deadline) {
            if (launchError) throw launchError;
            assert.equal(
                server.exitCode,
                null,
                `Dev server exited:\n${output}`,
            );
            assert.equal(
                server.signalCode,
                null,
                `Dev server stopped:\n${output}`,
            );
            try {
                const response = await fetch(
                    `http://127.0.0.1:${port}${route}`,
                    { signal: AbortSignal.timeout(2000) },
                );
                if (predicate(response, await response.text())) return;
            } catch {
                /* Server startup and content synchronization may still be pending. */
            }
            await delay(200);
        }
        throw new Error(`Dev page did not update: ${route}\n${output}`);
    };
    try {
        await waitForPage(
            '/',
            (response, html) =>
                response.ok && html.includes('Consumer content stays here.'),
        );
        await waitForPage(
            '/legal-fixture/',
            (response, html) =>
                response.ok &&
                html.includes('Max Mustermann') &&
                html.includes('Preview with example data'),
        );
        assertQuietBlog(output);
        const assetDirectory = join(blog, '_assets');
        mkdirSync(assetDirectory, { recursive: true });
        cpSync(
            join(root, 'src/themes/default/assets/branding/favicon-32x32.png'),
            join(assetDirectory, 'article.png'),
        );
        const stagedArticle = join(temporary, 'first-article');
        mkdirSync(stagedArticle);
        writeFileSync(
            join(stagedArticle, 'page.yaml'),
            'title: First article\ndescription: Created while the dev server runs.\npubDate: 2026-01-01\nimage: ../_assets/article.png\nimageAlt: Test image\n',
        );
        writeFileSync(
            join(stagedArticle, 'hero.md'),
            '---\ntitle: First article\n---\n\nA new blog article.\n',
        );
        writeFileSync(
            join(stagedArticle, '01-content.md'),
            '## First section\n\nInitial article text.\n',
        );
        const article = join(blog, '2026-01-01.first-article');
        renameSync(stagedArticle, article);
        await waitForPage(
            '/blog/first-article/',
            (response, html) =>
                response.ok && html.includes('Initial article text.'),
        );
        writeFileSync(
            join(article, '01-content.md'),
            '## First section\n\nUpdated article text.\n',
        );
        await waitForPage(
            '/blog/first-article/',
            (response, html) =>
                response.ok && html.includes('Updated article text.'),
        );
        rmSync(article, { recursive: true });
        await waitForPage(
            '/blog/',
            (response, html) => response.ok && !html.includes('First article'),
        );
        await waitForPage(
            '/blog/first-article/',
            (response) => response.status === 404,
        );
    } finally {
        if (
            server.exitCode === null &&
            server.signalCode === null &&
            !launchError
        ) {
            const stopped = new Promise<void>((accept) =>
                server.once('close', () => accept()),
            );
            server.kill('SIGTERM');
            const forceStop = setTimeout(() => server.kill('SIGKILL'), 5000);
            try {
                await stopped;
            } finally {
                clearTimeout(forceStop);
            }
        }
    }
    assertQuietBlog(output);
    console.log(
        'PASS dev server: missing blog, first article added, edited and removed without restart or optional-blog warnings.',
    );
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
        if (
            file.endsWith('about/index.html') ||
            file.endsWith('ueber/index.html')
        )
            assert.ok(
                html.includes(
                    file.startsWith('de/')
                        ? 'ss-package-global-de'
                        : 'ss-package-global',
                ),
            );
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
    for (const file of [
        'about/index.html',
        'blog/index.html',
        '404.html',
        '500.html',
    ]) {
        assert.ok(
            readFileSync(join(output, file), 'utf8').includes(
                `src="${base}backgrounds/global.svg"`,
            ),
            `Missing global background: ${file}`,
        );
    }
    const disabledBackground = readFileSync(
        join(output, 'no-background/index.html'),
        'utf8',
    );
    assert.equal(disabledBackground.includes('ss-hero-background'), false);
    assert.ok(disabledBackground.includes('ss-package-global'));
    const localBackground = readFileSync(
        join(output, 'local-background/index.html'),
        'utf8',
    );
    assert.ok(
        localBackground.includes(`src="${base}backgrounds/override.svg"`),
    );
    assert.equal(
        localBackground.includes(`src="${base}backgrounds/global.svg"`),
        false,
    );
    assert.ok(
        readFileSync(join(output, 'blog/index.html'), 'utf8').includes(
            'ss-package-global',
        ),
    );
    assert.ok(home.includes('ss-accordion-item'));
    assert.ok(home.includes('ss-card__figure--placeholder'));
    assert.equal((home.match(/class="ss-card__badges"/g) ?? []).length, 2);
    assert.ok(home.includes('Packaged card'));
    assert.ok(home.includes('role="tooltip"'));
    assert.ok(home.includes('aria-describedby="ss-card-hint-'));
    assert.ok(home.includes('Details from the installed package.'));
    assert.ok(home.includes('badge-info badge-soft'));
    assert.ok(home.includes('lucide-bot'));
    assert.ok(home.includes('ss-footer__group'));
    assert.ok(home.includes('ss-footer__social'));
    assert.ok(home.includes('ss-language-switcher--footer'));
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
    assert.deepEqual(
        readdirSync(output).filter((name) => /^sitemap.*\.xml$/.test(name)),
        ['sitemap.xml'],
        'Small websites must emit only sitemap.xml without redundant index or chunk files.',
    );
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
    if (base === '/demo/') {
        const order = [
            ...css.matchAll(/--ss-package-style-order:\s*(\d+)/g),
        ].map((match) => match[1]);
        assert.equal(
            order.at(-1),
            '2',
            'The last configured site stylesheet must win.',
        );
        assert.match(css, /border-radius:\s*2\.25rem/);
        assert.ok(
            css.includes('/demo/_astro/background.'),
            'CSS assets must use the deployment base.',
        );
        assert.ok(assets.some((file) => /^background\..*\.svg$/.test(file)));
    } else {
        assert.equal(
            css.includes('--ss-package-style-order'),
            false,
            'Omitted styles must preserve theme-only output.',
        );
    }
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
        'src/package/starter-assets/public/branding/favicon.svg',
        'src/package/starter-assets/public/branding/apple-touch-icon.png',
        'src/package/starter-assets/public/branding/icon-192.png',
        'src/package/starter-assets/public/branding/icon-512.png',
        'src/themes/default/styles/foundation/fonts/OFL.txt',
        'src/themes/default/styles/foundation/fonts/eb-garamond-OFL.txt',
        'src/themes/default/styles/foundation/fonts/eb-garamond-latin-variable.woff2',
        'src/themes/default/styles/foundation/fonts/eb-garamond-latin-variable-italic.woff2',
        'third-party-licenses/lucide-LICENSE',
        ...Object.values(manifest.exports).map((file) =>
            file.replace(/^\.\//, ''),
        ),
        ...Object.values(manifest.imports).map((file) =>
            file.replace(/^\.\//, ''),
        ),
    ])
        assert.ok(files.has(file), `Missing package file: ${file}`);
    for (const file of files)
        assert.ok(
            !/^(?:dist|public|node_modules|scripts|tests|stories|\.git|\.codex|\.agents|\.aws|src\/content)(?:\/|$)|(?:^|\/)\.env(?:\.|$)/.test(
                file,
            ),
            `Unexpected package file: ${file}`,
        );
    const archivePath = resolve(temporary, archive.filename);
    assert.equal(
        resolve(temporary, archive.filename).startsWith(temporary),
        true,
    );
    assert.ok(
        existsSync(archivePath),
        `npm pack did not create the test archive: ${archivePath}`,
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
    const consumerRequire = createRequire(join(consumer, 'package.json'));
    const starterEntry = consumerRequire.resolve('sproutsite/starter-assets');
    assert.equal(
        starterEntry,
        join(installed, 'src/package/starter-assets/manifest.json'),
    );
    const starter = JSON.parse(readFileSync(starterEntry, 'utf8')) as {
        schemaVersion: number;
        publicDirectory: string;
        files: { path: string; sha256: string }[];
        branding: unknown;
        heroExample: {
            source: string;
            contentDestination: string;
            frontmatter: { 'background-image': string; classes: null };
        };
    };
    assert.equal(starter.schemaVersion, 1);
    const starterDirectory = dirname(starterEntry);
    const starterPublic = join(starterDirectory, starter.publicDirectory);
    for (const asset of starter.files) {
        const path = resolve(starterPublic, asset.path);
        assert.ok(!relative(starterPublic, path).startsWith('..'));
        const data = readFileSync(path);
        assert.equal(
            createHash('sha256').update(data).digest('hex'),
            asset.sha256,
        );
        assert.ok(
            data.equals(
                readFileSync(
                    join(root, 'src/package/starter-assets/public', asset.path),
                ),
            ),
        );
    }
    assert.ok(
        readFileSync(join(starterPublic, 'LICENSE.txt')).equals(
            readFileSync(join(root, 'LICENSE')),
        ),
    );
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
        if (base === '/demo/') {
            // Exercise public configuration from the installed tarball, with
            // nested CSS imports, a path containing spaces and a bundled asset.
            const styles = join(consumer, 'src/styles');
            mkdirSync(join(styles, 'parts'), { recursive: true });
            writeFileSync(
                join(styles, 'parts/cards.css'),
                ' .ss-card { --ss-package-style-order: 1; border-radius: 1.125rem; }\n',
            );
            writeFileSync(
                join(styles, 'custom.css'),
                '@import "./parts/cards.css";\n',
            );
            writeFileSync(
                join(styles, 'last overrides.css'),
                '.ss-card { --ss-package-style-order: 2; border-radius: 2.25rem; --ss-package-style-asset: url("./background.svg"); }\n',
            );
            // Dedicated CSS artwork above Vite's inline threshold, independent
            // of Astro's separately tested optimised hero-image fixture.
            writeFileSync(
                join(styles, 'background.svg'),
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">' +
                    '<rect width="16" height="16" fill="#eef3e8"/>'.repeat(
                        150,
                    ) +
                    '</svg>',
            );
            const astroConfig = join(consumer, 'astro.config.ts');
            const components = join(consumer, 'src/components');
            mkdirSync(components, { recursive: true });
            writeFileSync(
                join(components, 'Header.astro'),
                `---
import { DefaultHeader } from 'sproutsite/components';
import type { HeaderProps } from 'sproutsite';
type Props = HeaderProps;
const { site, route } = Astro.props;
---
<DefaultHeader {...Astro.props} />
<span hidden data-custom-header-route={route} data-custom-header-locale={site.i18n.locale}></span>
`,
            );
            writeFileSync(
                join(components, 'Custom footer.astro'),
                `---
import { DefaultFooter } from 'sproutsite/components';
import type { FooterProps } from 'sproutsite';
type Props = FooterProps;
const { site, route } = Astro.props;
---
<DefaultFooter {...Astro.props} />
<span hidden data-custom-footer-route={route} data-custom-footer-locale={site.i18n.locale}></span>
`,
            );
            writeFileSync(
                astroConfig,
                readFileSync(astroConfig, 'utf8').replace(
                    'createSproutsiteConfig()',
                    'createSproutsiteConfig({ styles: ["./src/styles/custom.css", "./src/styles/last overrides.css"], components: { Header: "./src/components/Header.astro" } })',
                ),
            );
            // The same archive must support a website's own public branding.
            const branding = join(consumer, 'public/branding');
            mkdirSync(branding, { recursive: true });
            const defaults = join(
                root,
                'src/package/starter-assets/public/branding',
            );
            cpSync(defaults, branding, { recursive: true });
            writeFileSync(
                join(branding, 'logo.svg'),
                '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="48"><rect width="180" height="48" fill="#164e63"/></svg>',
            );
            const configuration = join(consumer, 'src/content/site.yaml');
            writeFileSync(
                configuration,
                readFileSync(configuration, 'utf8') +
                    '\ncolors:\n    primary:\n        color: "#234e52"\n        content: "#ffffff"\n    surfaces:\n        muted: "#f2f6f4"\n    brand:\n        background: "#102a30"\n        backgroundEnd: "#173f43"\n        gradient: "#245c64"\n        highlight: "#9cdbda"\n        accent: "#b6e36c"\nbranding:\n    logo:\n        src: /branding/logo.svg\n        srcOnDark: /branding/favicon.svg\n        width: 180\n        height: 48\n    icons:\n        favicon: /branding/favicon.svg\n        appleTouch: /branding/apple-touch-icon.png\n        app192: /branding/icon-192.png\n        app512: /branding/icon-512.png\n    sharingImage:\n        src: /branding/icon-512.png\n        alt: Independent website preview\n',
            );
            const localized = join(consumer, 'src/content/site.de.yaml');
            writeFileSync(
                localized,
                readFileSync(localized, 'utf8') +
                    '\ncolors:\n    primary:\n        color: "#3d5b32"\nbranding:\n    sharingImage:\n        alt: Eigene Website-Vorschau\n',
            );
            const assets = join(consumer, 'src/content/blog/_assets');
            mkdirSync(assets, { recursive: true });
            writeFileSync(join(assets, 'unused.txt'), 'No articles yet.');
            npm(['run', 'check'], consumer);
        }
        npm(['run', 'build'], consumer, false, base);
        verifyBuild(base);
        const home = readFileSync(join(consumer, 'dist/index.html'), 'utf8');
        const german = readFileSync(
            join(consumer, 'dist/de/index.html'),
            'utf8',
        );
        assert.ok(home.includes('ss-package-global'));
        assert.ok(german.includes('ss-package-global-de'));
        if (base === '/demo/') {
            assert.ok(home.includes('data-custom-header-route="/"'));
            assert.ok(german.includes('data-custom-header-locale="de"'));
            assert.equal(
                home.includes('data-custom-footer-route'),
                false,
                'Replacing only Header must retain the default Footer.',
            );
            const about = readFileSync(
                join(consumer, 'dist/de/ueber/index.html'),
                'utf8',
            );
            assert.ok(about.includes('data-custom-header-route="/ueber/"'));
            assert.match(home, /--color-primary:\s*#234e52/);
            assert.match(german, /--color-primary:\s*#3d5b32/);
            assert.match(german, /--color-primary-content:\s*#ffffff/);
            assert.match(german, /--color-base-200:\s*#f2f6f4/);
            assert.match(german, /--color-hero-navy:\s*#102a30/);
            for (const file of ['blog/index.html', '404.html', '500-de.html']) {
                assert.match(
                    readFileSync(join(consumer, 'dist', file), 'utf8'),
                    /--color-hero-navy:\s*#102a30/,
                );
            }
            assert.ok(home.includes('src="/demo/branding/logo.svg"'));
            assert.ok(german.includes('src="/demo/branding/logo.svg"'));
            assert.ok(
                home.includes(
                    'content="https://example.com/demo/branding/icon-512.png"',
                ),
            );
            assert.ok(home.includes('content="Independent website preview"'));
            assert.ok(german.includes('content="Eigene Website-Vorschau"'));
            const icons = JSON.parse(
                readFileSync(join(consumer, 'dist/site.webmanifest'), 'utf8'),
            ).icons as { src: string }[];
            assert.ok(
                icons.every((icon) => icon.src.startsWith('/demo/branding/')),
            );
        } else {
            assert.equal(home.includes('og:image'), false);
            const favicon = home.match(
                /<link rel="icon"[^>]*href="([^"]+)"/,
            )?.[1];
            assert.ok(favicon);
            assert.equal(
                readFileSync(join(consumer, 'dist', favicon), 'utf8').includes(
                    'Sproutsite',
                ),
                false,
            );
        }
    }
    // Test the exact public copy and configuration handed to the initializer.
    const componentConfig = join(consumer, 'astro.config.ts');
    writeFileSync(
        componentConfig,
        readFileSync(componentConfig, 'utf8').replace(
            'components: { Header: "./src/components/Header.astro" }',
            'components: { Header: "./src/components/Header.astro", Footer: "./src/components/Custom footer.astro" }',
        ),
    );
    cpSync(starterPublic, join(consumer, 'public'), { recursive: true });
    const configuration = join(consumer, 'src/content/site.yaml');
    const configurationText = readFileSync(configuration, 'utf8');
    writeFileSync(
        configuration,
        configurationText.slice(0, configurationText.indexOf('\nbranding:')) +
            `\nbranding: ${JSON.stringify(starter.branding)}\n`,
    );
    const heroDestination = join(
        consumer,
        starter.heroExample.contentDestination,
    );
    mkdirSync(dirname(heroDestination), { recursive: true });
    cpSync(join(starterDirectory, starter.heroExample.source), heroDestination);
    for (const suffix of ['', '.de']) {
        const hero = join(consumer, `src/content/pages/hero${suffix}.md`);
        const content = readFileSync(hero, 'utf8');
        writeFileSync(
            hero,
            content.replace(
                '\n---\n',
                '\nbackground-image: ./_assets/hero.jpg\nclasses: null\n---\n',
            ),
        );
    }
    npm(['run', 'build'], consumer, false, '/demo/');
    verifyBuild('/demo/');
    assert.ok(
        readFileSync(
            join(consumer, 'dist/de/ueber/index.html'),
            'utf8',
        ).includes('data-custom-footer-route="/ueber/"'),
    );
    const starterHtml = readFileSync(join(consumer, 'dist/index.html'), 'utf8');
    assert.ok(starterHtml.includes('src="/demo/branding/logo.svg"'));
    assert.ok(
        starterHtml.includes(
            'https://example.com/demo/branding/sharing-image.png',
        ),
    );
    assert.ok(starterHtml.includes('ss-hero--has-background-image'));
    assert.equal(
        starterHtml.includes('ss-package-global'),
        false,
        'Local classes: null must remove the global hero classes.',
    );
    console.log(
        `PASS starter assets: ${starter.files.length} archived files verified, public copy, branding, notices and local hero image built under /demo/.`,
    );
    verifyLegalIdentityBuilds();
    await verifyDevBlogLifecycle();
    rmSync(join(consumer, 'src/content/pages/legal-fixture'), {
        recursive: true,
    });
    // The default is explicit, independent of list order and source suffixes.
    const germanDefault = parse(readFileSync(configuration, 'utf8')) as Record<
        string,
        unknown
    >;
    germanDefault.i18n = {
        locale: 'de',
        defaultLocale: 'de',
        locales: ['en', 'de'],
    };
    writeFileSync(configuration, stringify(germanDefault));
    renameSync(join(consumer, 'src/pages/de'), join(consumer, 'src/pages/en'));
    const englishRoute = join(consumer, 'src/pages/en/[...slug].astro');
    writeFileSync(
        englishRoute,
        readFileSync(englishRoute, 'utf8').replace(
            "getSproutsiteStaticPaths('de')",
            "getSproutsiteStaticPaths('en')",
        ),
    );
    const englishDetails = join(
        consumer,
        'src/content/pages/about/01-details.md',
    );
    writeFileSync(
        englishDetails,
        readFileSync(englishDetails, 'utf8') + '\n[Back home](/)\n',
    );
    npm(['run', 'build'], consumer, false, '/demo/');
    const output = join(consumer, 'dist');
    for (const [file, locale, route] of [
        ['index.html', 'de', ''],
        ['en/index.html', 'en', 'en/'],
        ['ueber/index.html', 'de', 'ueber/'],
        ['en/about/index.html', 'en', 'en/about/'],
    ]) {
        const html = readFileSync(join(output, file!), 'utf8');
        assert.ok(html.includes(`lang="${locale}"`));
        assert.ok(html.includes(`href="https://example.com/demo/${route}"`));
    }
    assert.ok(
        readFileSync(join(output, 'ueber/index.html'), 'utf8').includes(
            'href="/demo/en/about/"',
        ),
    );
    assert.ok(
        readFileSync(join(output, 'en/about/index.html'), 'utf8').includes(
            'href="/demo/ueber/"',
        ),
    );
    assert.ok(
        readFileSync(join(output, 'en/about/index.html'), 'utf8').includes(
            'href="/demo/en/">Back home</a>',
        ),
    );
    for (const code of ['404', '500']) {
        assert.ok(
            readFileSync(join(output, `${code}.html`), 'utf8').includes(
                'lang="de"',
            ),
        );
        assert.ok(
            readFileSync(join(output, `${code}-en.html`), 'utf8').includes(
                'lang="en"',
            ),
        );
    }
    const germanSitemap = readFileSync(join(output, 'sitemap.xml'), 'utf8');
    assert.ok(
        germanSitemap.includes(
            'hreflang="x-default" href="https://example.com/demo/"',
        ),
    );
    assert.ok(
        germanSitemap.includes('<loc>https://example.com/demo/en/about/</loc>'),
    );
    assert.equal(
        germanSitemap.includes('<loc>https://example.com/demo/de/'),
        false,
    );
    assert.equal(
        (
            JSON.parse(
                readFileSync(join(output, 'site.webmanifest'), 'utf8'),
            ) as { lang: string }
        ).lang,
        'de',
    );
    // A completely new footer replaces the default markup; Header falls back.
    writeFileSync(
        componentConfig,
        readFileSync(componentConfig, 'utf8').replace(
            'components: { Header: "./src/components/Header.astro", Footer: "./src/components/Custom footer.astro" }',
            'components: { Footer: "./src/components/Custom footer.astro" }',
        ),
    );
    writeFileSync(
        join(consumer, 'src/components/Custom footer.astro'),
        `---
import { getRelativeLocaleUrl } from 'astro:i18n';
import type { FooterProps } from 'sproutsite';
type Props = FooterProps;
const { site, route } = Astro.props;
---
<footer data-custom-footer-route={route} data-custom-footer-locale={site.i18n.locale}>
    <a href={getRelativeLocaleUrl(site.i18n.locale, '')}>{site.name}</a>
</footer>
`,
    );
    npm(['run', 'check'], consumer);
    npm(['run', 'build'], consumer, false, '/demo/');
    const replacedFooter = readFileSync(join(output, 'index.html'), 'utf8');
    assert.ok(replacedFooter.includes('data-custom-footer-locale="de"'));
    assert.equal(replacedFooter.includes('data-custom-header-route'), false);
    assert.equal(replacedFooter.includes('class="ss-footer"'), false);
    assert.ok(replacedFooter.includes('class="ss-header"'));
    assert.ok(replacedFooter.includes('href="/demo/"'));
    console.log(
        'PASS component overrides: defaults, Header-only, both slots, Footer-only, localized props and default delegation without recursion.',
    );
    console.log(
        'PASS grouped configuration: inherited locale settings and German default under /demo/.',
    );
    verifyPackageThemes(consumer, () => {
        npm(['run', 'check'], consumer);
        npm(['run', 'build'], consumer, false, '/demo/');
    });
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
