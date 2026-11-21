import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
    if (!site) throw new Error('llms.txt requires the production site URL.');
    const url = (path: string) =>
        new URL(`${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`, site)
            .href;
    const guide = '/documentation/getting-started/your-website/';
    const link = (title: string, path: string, description: string) =>
        `- [${title}](${url(path)}): ${description}`;
    const content = [
        '# Sproutsite',
        '',
        '> Sproutsite is an Agent-first Static CMS powered by Astro and TypeScript. Create websites with Markdown and ready-made components, manually or with an external coding agent.',
        '',
        'Published websites are static files and require no CMS backend or database. Sproutsite does not include an AI agent or a graphical content editor. Use your own coding agent, such as Codex or Claude Code, in your website project.',
        '',
        `This guide is in English. German documentation is available at ${url('/de/dokumentation/')}. Linked guides are HTML pages, not separate Markdown downloads. Guides distinguish implemented features from open or partly available features; do not treat future plans as working APIs.`,
        '',
        '## Start your own website',
        '',
        link(
            'Quick start',
            guide,
            'Create a website with npm create sproutsite@latest, run the local preview and make your first change.',
        ),
        link(
            'Coding agents',
            `${guide}coding-agents/`,
            'Open your own website folder and give an external coding agent a focused task.',
        ),
        link(
            'Pages and sections',
            `${guide}pages-and-sections/`,
            'Maintain page metadata, heroes and numbered Markdown or MDX sections.',
        ),
        '',
        '## Customize your website',
        '',
        link(
            'Website settings',
            `${guide}settings/`,
            'Configure your website through site.yaml and localized settings.',
        ),
        link(
            'Branding',
            `${guide}branding/`,
            'Replace logos, favicons, app icons and the sharing image.',
        ),
        link(
            'Colors',
            `${guide}colors/`,
            'Set semantic website colors; artwork retains its own colors.',
        ),
        link(
            'Small design changes',
            `${guide}theme-overrides/`,
            'Register website-owned CSS overrides.',
        ),
        link(
            'Custom themes',
            `${guide}custom-theme/`,
            'Derive a local theme or provide an independent theme with presentation components.',
        ),
        '',
        '## Components and layouts',
        '',
        link(
            'Component showcase',
            '/showcase/',
            'Examples and supported component parameters.',
        ),
        link(
            'Layouts and components',
            `${guide}layouts-and-components/`,
            'Arrange content with the supplied layout components.',
        ),
        '',
        '## Build and publish',
        '',
        link(
            'Deployment',
            '/documentation/deployment/',
            'Build with npm run build and deploy the complete dist directory, including error documents.',
        ),
        link(
            'SEO and metadata',
            `${guide}seo/`,
            'Configure page titles, descriptions, canonical URLs, the sitemap and robots.txt.',
        ),
        '',
        '## Contribute to Sproutsite',
        '',
        link(
            'Contributor quick start',
            '/documentation/getting-started/contributing/',
            'Work on the framework repository; this is separate from maintaining your own website.',
        ),
        '- [Source code](https://github.com/sproutsite/sproutsite): Framework source and issue tracker.',
        '- [Project generator](https://github.com/sproutsite/create-sproutsite): Separate create-sproutsite initializer.',
        '- [License](https://github.com/sproutsite/sproutsite/blob/main/LICENSE): Apache License 2.0; the software license does not grant trademark rights.',
        '',
        '## Optional',
        '',
        link(
            'Frequently asked questions',
            '/faq/',
            'Answers about the workflow and project scope.',
        ),
        link(
            'Project blog',
            '/blog/',
            'Project updates and background; use the documentation for current usage.',
        ),
        '',
    ].join('\n');
    return new Response(content, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
};
