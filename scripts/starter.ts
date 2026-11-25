import { spawnSync } from 'node:child_process';
import {
    constants,
    copyFileSync,
    cpSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    renameSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { parseDocument } from 'yaml';
import starterAssets from '../src/package/starter-assets/manifest.json' with { type: 'json' };

const [mode, ...args] = process.argv.slice(2);
const { values } = parseArgs({
    args,
    options: {
        language: { type: 'string', default: 'en' },
        bilingual: { type: 'boolean', default: false },
        port: { type: 'string', default: '4322' },
    },
});
const { language, bilingual, port } = values;
if (mode !== 'dev' && mode !== 'build')
    throw new Error('Expected the dev or build command.');
if (language !== 'en' && language !== 'de')
    throw new Error('Use --language en or --language de.');
const root = fileURLToPath(new URL('../', import.meta.url));
const templates = join(root, 'starters', 'minimal');
const previewRoot = join(root, 'artifacts', 'starter');
mkdirSync(previewRoot, { recursive: true });
const secondary = language === 'de' ? 'en' : 'de';
const variant = bilingual ? `${language}-${secondary}` : language;
const project = mkdtempSync(join(previewRoot, `${variant}-`));

for (const layer of ['common', language]) {
    const source = join(templates, layer);
    const entries = readdirSync(source, {
        recursive: true,
        withFileTypes: true,
    });
    for (const entry of entries.filter((entry) => entry.isFile())) {
        const file = join(entry.parentPath, entry.name);
        const destination = join(project, relative(source, file));
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(file, destination, constants.COPYFILE_EXCL);
    }
}
renameSync(join(project, 'gitignore'), join(project, '.gitignore'));

const skillPath = '.agents/skills/sproutsite-edit-page/SKILL.md';
const sharedFiles = [
    [skillPath, skillPath],
    [skillPath, '.claude/skills/sproutsite-edit-page/SKILL.md'],
    [
        '.agents/skills/sproutsite-edit-page/agents/openai.yaml',
        '.agents/skills/sproutsite-edit-page/agents/openai.yaml',
    ],
    ['.codex/config.toml', '.codex/config.toml'],
    ['.mcp.json', '.mcp.json'],
    ['CLAUDE.md', 'CLAUDE.md'],
    ['LICENSE', 'LICENSE-SPROUTSITE'],
] as const;
for (const [source, destination] of sharedFiles) {
    const target = join(project, destination);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(root, source), target);
}

const assets = join(root, 'src', 'package', 'starter-assets');
cpSync(join(assets, starterAssets.publicDirectory), join(project, 'public'), {
    recursive: true,
});
const name = language === 'de' ? 'Meine Website' : 'My website';
const tokens = {
    PACKAGE_NAME: language === 'de' ? 'meine-website' : 'my-website',
    SITE_NAME_YAML: JSON.stringify(name),
    LOCALE_JSON: JSON.stringify(language),
};
for (const file of [
    'package.json',
    'src/content/site.yaml',
    'src/pages/[...slug].astro',
]) {
    const path = join(project, file);
    const source = readFileSync(path, 'utf8');
    writeFileSync(
        path,
        source.replace(/__([A-Z_]+)__/g, (token: string, key: string) => {
            if (!Object.hasOwn(tokens, key))
                throw new Error(`Unknown starter token ${token} in ${file}.`);
            return tokens[key as keyof typeof tokens];
        }),
    );
}

if (bilingual) {
    const overlay = join(templates, variant);
    const pages = join(project, 'src', 'content', 'pages');
    const secondaryPages = join(
        templates,
        secondary,
        'src',
        'content',
        'pages',
    );
    cpSync(secondaryPages, pages, {
        recursive: true,
        // The German-only starter's unsuffixed page.yaml duplicates its German metadata.
        filter: (source) =>
            secondary !== 'de' || source !== join(secondaryPages, 'page.yaml'),
    });
    if (language === 'en')
        cpSync(
            join(templates, 'de-en/project/src/content/pages/about'),
            join(pages, 'about'),
            { recursive: true },
        );
    cpSync(join(overlay, 'project'), project, { recursive: true });

    const sitePath = join(project, 'src', 'content', 'site.yaml');
    const site = parseDocument(readFileSync(sitePath, 'utf8'));
    const overrides = parseDocument(
        readFileSync(join(overlay, 'site-overrides.yaml'), 'utf8'),
    );
    for (const path of [
        ['i18n', 'locales'],
        ['header', 'links'],
    ]) {
        const value = overrides.getIn(path, true);
        if (!value)
            throw new Error(
                `Missing bilingual starter setting: ${path.join('.')}`,
            );
        site.setIn(path, value);
    }
    writeFileSync(sitePath, site.toString());
}

// Keep the generated package.json identical to the published starter's.
// Node resolves the development dependencies from the repository root.
const modules = join(project, 'node_modules');
mkdirSync(modules);
symlinkSync(root, join(modules, 'sproutsite'), 'junction');

const devConfig = '.astro/starter.config.ts';
if (mode === 'dev') {
    // Vite serves linked theme assets from their real path outside the project.
    mkdirSync(join(project, '.astro'));
    writeFileSync(
        join(project, devConfig),
        `import type { AstroUserConfig } from 'astro';
import { defineConfig } from 'astro/config';
import starter from '../astro.config';

const config: AstroUserConfig = starter;

export default defineConfig({
    ...config,
    vite: {
        ...config.vite,
        server: {
            ...config.vite?.server,
            fs: {
                ...config.vite?.server?.fs,
                allow: ${JSON.stringify([project, join(root, 'src', 'themes', 'default')])},
            },
        },
    },
});
`,
    );
}

console.log(`Starter (${variant}): ${relative(root, project)}`);
const result = spawnSync(
    process.execPath,
    [
        join(root, 'node_modules', 'astro', 'bin', 'astro.mjs'),
        mode,
        ...(mode === 'dev'
            ? ['--config', devConfig, '--ignore-lock', '--port', port]
            : []),
    ],
    { cwd: project, stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
