import assert from 'node:assert/strict';
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
            const assets = join(consumer, 'src/content/blog/_assets');
            mkdirSync(assets, { recursive: true });
            writeFileSync(join(assets, 'unused.txt'), 'No articles yet.');
            npm(['run', 'check'], consumer);
        }
        npm(['run', 'build'], consumer, false, base);
        verifyBuild(base);
    }
    verifyLegalIdentityBuilds();
    await verifyDevBlogLifecycle();
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
