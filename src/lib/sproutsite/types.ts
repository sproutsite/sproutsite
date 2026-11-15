export const tones = ['default', 'muted', 'brand'] as const;
export type Tone = (typeof tones)[number];

export interface Link {
    label: string;
    href: string;
}

export interface SiteConfig {
    name: string;
    url: string;
    base: string;
    language: string;
    locales: string[];
    heroClasses: string[];
    blog?: {
        title: string;
        description: string;
        eyebrow: string;
        heading: string;
    };
    header: { links: (Link | { type: 'separator' })[] };
    footer: { text: string; links: Link[] };
}
