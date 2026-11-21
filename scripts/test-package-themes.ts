import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertStructuredData } from './check-structured-data.js';

/** Exercise the published contract from an installed archive, never source aliases. */
export function verifyPackageThemes(consumer: string, build: () => void) {
    const directory = join(consumer, 'src/themes/website');
    mkdirSync(directory, { recursive: true });
    const write = (name: string, content: string) =>
        writeFileSync(join(directory, name), content);
    const names = [
        'Header',
        'Footer',
        'Hero',
        'Section',
        'PageTitle',
        'Card',
        'Button',
        'BlogIndex',
        'BlogPost',
        'ErrorPage',
    ] as const;
    for (const name of names) {
        write(
            `${name}.astro`,
            `---
import { ${name} as Base } from 'sproutsite/default-components';
import type { ThemeProps } from 'sproutsite/themes';
type Props = ThemeProps<'${name}'>;
---
<div data-selected-theme="${name}"><Base {...Astro.props}><slot /><slot name="meta" slot="meta" /></Base></div>
`,
        );
    }
    write(
        'Layout.astro',
        `---
import type { ThemeProps } from 'sproutsite/themes';
type Props = ThemeProps<'Layout'>;
---
<div data-selected-theme="Layout"><slot /></div>
`,
    );
    write(
        'parent.css',
        '.theme-probe { --theme-parent: 1; --theme-order: 1; }',
    );
    write('theme.css', '.theme-probe { --theme-child: 1; --theme-order: 2; }');
    write('site.css', '.theme-probe { --theme-order: 3; }');
    write(
        'parent.ts',
        `import {defaultTheme, type SproutsiteTheme} from 'sproutsite/themes';
export default {name:'parent', extends:defaultTheme, styles:[new URL('./parent.css', import.meta.url)], components:{Header:new URL('./Header.astro', import.meta.url)}} satisfies SproutsiteTheme;
`,
    );
    write(
        'theme.ts',
        `import parent from './parent';
import type {SproutsiteTheme} from 'sproutsite/themes';
export default {name:'website', extends:parent, styles:[new URL('./theme.css', import.meta.url)], components:{${names
            .filter((n) => n !== 'Header')
            .map((n) => `${n}:new URL('./${n}.astro',import.meta.url)`)
            .join(
                ',',
            )},Layout:new URL('./Layout.astro',import.meta.url)}} satisfies SproutsiteTheme;
`,
    );
    const config = join(consumer, 'astro.config.ts');
    writeFileSync(
        config,
        `import {defineConfig} from 'astro/config';
import {createSproutsiteConfig} from 'sproutsite/config';
import theme from './src/themes/website/theme';
export default defineConfig(createSproutsiteConfig({theme, styles:['./src/themes/website/site.css'], components:{Footer:'./src/components/Custom footer.astro'}}));
`,
    );
    const blog = join(consumer, 'src/content/blog/2026-01-01.theme-test');
    mkdirSync(blog, { recursive: true });
    // Use the known neutral starter image and actual article structure.
    writeFileSync(
        join(blog, 'page.yaml'),
        'title: Theme test\ndescription: Theme article\npubDate: 2026-01-01\nauthor:\n    name: Example Author\n    url: https://example.org/author/\nimage: ../../../..\/public/branding/sharing-image.png\nimageAlt: Theme image\n',
    );
    writeFileSync(
        join(blog, 'hero.md'),
        '---\ntitle: Theme article\n---\n\nArticle introduction.\n',
    );
    writeFileSync(
        join(blog, '01-body.md'),
        '## Article body\n\nTheme content.\n',
    );
    for (const suffix of ['', '.de']) {
        const hero = join(consumer, 'src/content/pages/hero' + suffix + '.md');
        const source = readFileSync(hero, 'utf8');
        if (!source.includes('actions:'))
            writeFileSync(
                hero,
                source.replace(
                    '\n---\n',
                    '\nactions:\n    - label: Home\n      href: /\n      variant: primary\n---\n',
                ),
            );
    }
    build();
    const html = (file: string) =>
        readFileSync(join(consumer, 'dist', file), 'utf8');
    const home = html('index.html');
    for (const name of [
        'Layout',
        'Header',
        'Hero',
        'Section',
        'Card',
        'Button',
    ])
        assert.ok(
            home.includes(`data-selected-theme="${name}"`),
            `Inherited theme component ${name} was not selected inside content.`,
        );
    assert.equal(
        home.includes('data-selected-theme="Footer"'),
        false,
        'Website override must win over the theme Footer.',
    );
    assert.ok(home.includes('data-custom-footer-locale="de"'));
    for (const [file, name] of [
        ['en/blog/index.html', 'BlogIndex'],
        ['en/blog/theme-test/index.html', 'BlogPost'],
        ['404.html', 'ErrorPage'],
        ['500-en.html', 'ErrorPage'],
    ]) {
        const source = html(file!);
        assert.ok(source.includes(`data-selected-theme="${name}"`));
        assert.equal((source.match(/<main\b/g) ?? []).length, 1);
        assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
        assert.ok(source.includes('<link rel="canonical"'));
        const canonical = source.match(
            /<link rel="canonical" href="([^"]+)"/,
        )![1]!;
        assertStructuredData(source, {
            canonical,
            locale: 'en',
            website: 'https://example.com/demo/',
            home: false,
            article: file === 'en/blog/theme-test/index.html',
            noindex: /^(404|500)/.test(file!),
        });
    }
    assert.ok(
        html('en/blog/theme-test/index.html')
            .match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1]
            ?.includes('Example Author'),
        'Configured author must also appear in the article body, not only JSON-LD.',
    );
    assert.ok(
        html('en/blog/index.html').includes('data-selected-theme="Card"'),
    );
    assert.ok(
        html('en/about/index.html').includes('data-selected-theme="PageTitle"'),
    );
    const styles = () =>
        readdirSync(join(consumer, 'dist/_astro'))
            .filter((f) => f.endsWith('.css'))
            .map((f) => readFileSync(join(consumer, 'dist/_astro', f), 'utf8'))
            .join('');
    const order = [...styles().matchAll(/--theme-order:\s*(\d+)/g)].map(
        (m) => m[1],
    );
    assert.equal(order.at(-1), '3');
    assert.ok(styles().includes('--theme-parent'));
    assert.ok(styles().includes('--theme-child'));
    // No extends: deliberate component reuse, but independent CSS and no default palette.
    write(
        'theme.ts',
        `import {defaultTheme, type SproutsiteTheme} from 'sproutsite/themes';
export default {name:'independent', styles:[new URL('./theme.css', import.meta.url)], components:{...defaultTheme.components, ${[...names, 'Layout'].map((n) => `${n}:new URL('./${n}.astro',import.meta.url)`).join(',')}}} satisfies SproutsiteTheme;
`,
    );
    build();
    assert.equal(
        styles().includes('--color-primary'),
        false,
        'Default theme CSS leaked into independent output.',
    );
    assert.equal(styles().includes('@font-face'), false);
    assert.equal(
        readdirSync(join(consumer, 'dist/_astro')).some((f) =>
            f.endsWith('.woff2'),
        ),
        false,
    );
    assert.equal(
        html('index.html').includes('--color-primary:'),
        false,
        'Default palette mapping leaked into independent output.',
    );
    assert.ok(
        html('en/blog/index.html').includes('data-selected-theme="BlogIndex"'),
    );
    assert.ok(html('500.html').includes('noindex, follow'));
    assert.ok(
        readFileSync(join(consumer, 'dist/sitemap.xml'), 'utf8').includes(
            'hreflang="en"',
        ),
    );
    // A complete replacement can render without any supplied component markup.
    write('Empty.astro', '<slot />');
    write(
        'OwnHero.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'Hero'>;
const {hero, Content}=Astro.props;
---
<section data-independent="hero"><h1>{hero.data.title}</h1>{Content ? <Content /> : <slot />}<slot name="meta" /></section>
`,
    );
    write(
        'OwnSection.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'Section'>;
const {Content}=Astro.props;
---
<section>{Content ? <Content /> : <slot />}</section>
`,
    );
    write(
        'OwnTitle.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'PageTitle'>;
---
<h1>{Astro.props.title}</h1>
`,
    );
    write(
        'OwnBlogIndex.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'BlogIndex'>;
---
<h1>Independent blog</h1>
`,
    );
    write(
        'OwnBlogPost.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'BlogPost'>;
const {post, HeroContent, sections}=Astro.props;
---
<h1>{post.entry.data.title}</h1><HeroContent />{sections.map(({Content})=><Content />)}
`,
    );
    write(
        'OwnError.astro',
        `---
import type {ThemeProps} from 'sproutsite/themes';
type Props = ThemeProps<'ErrorPage'>;
---
<h1>{Astro.props.copy.title}</h1><p>{Astro.props.copy.description}</p>
`,
    );
    write(
        'theme.ts',
        `import {defaultTheme, type SproutsiteTheme, type ThemeComponents} from 'sproutsite/themes';
const components: ThemeComponents = {};
for (const name of Object.keys(defaultTheme.components) as (keyof ThemeComponents)[]) components[name]=new URL('./Empty.astro',import.meta.url);
export default {name:'complete', styles:[new URL('./theme.css',import.meta.url)], components:{...components, Layout:new URL('./Layout.astro',import.meta.url), Hero:new URL('./OwnHero.astro',import.meta.url), Section:new URL('./OwnSection.astro',import.meta.url), PageTitle:new URL('./OwnTitle.astro',import.meta.url), BlogIndex:new URL('./OwnBlogIndex.astro',import.meta.url), BlogPost:new URL('./OwnBlogPost.astro',import.meta.url), ErrorPage:new URL('./OwnError.astro',import.meta.url)}} satisfies SproutsiteTheme;
`,
    );
    build();
    for (const file of [
        'index.html',
        'en/about/index.html',
        'en/blog/index.html',
        'en/blog/theme-test/index.html',
        '404.html',
        '500-en.html',
    ]) {
        const source = html(file);
        assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
        assert.equal((source.match(/<main\b/g) ?? []).length, 1);
        assert.ok(source.includes('<link rel="canonical"'));
        assert.equal(source.includes('ss-hero'), false);
        assert.equal(source.includes('ss-card'), false);
    }
    console.log(
        'PASS themes: multilevel inheritance, nested MDX/blog replacements, website override precedence, shared metadata/errors, CSS order, and independent styles without default fonts or palette.',
    );
}
