export const tones = ['default', 'muted', 'brand'] as const;
export type Tone = (typeof tones)[number];

export interface Link {
    label: string;
    href: string;
}

export type HeaderItem =
    | (Link & { type?: 'link' })
    | (Link & {
          type: 'cta';
          variant?:
              | 'primary'
              | 'secondary'
              | 'accent'
              | 'neutral'
              | 'info'
              | 'success'
              | 'warning'
              | 'error';
      })
    | { type: 'separator' };

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
    header: { links: HeaderItem[] };
    footer: { text: string; links: Link[] };
}
