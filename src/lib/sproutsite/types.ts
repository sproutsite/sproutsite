export const tones = ['default', 'muted', 'brand'] as const;
export type Tone = (typeof tones)[number];
export type SectionTone = Tone | { odd: Tone; even: Tone };
export const heroTypes = ['small', 'big', 'fullscreen'] as const;
export const sectionSpacings = ['small', 'default', 'large'] as const;

export interface Link {
    label: string;
    href: string;
}

export type HeaderItem =
    | (Link & { type?: 'link'; icon?: string })
    | (Link & {
          type: 'cta';
          icon?: string;
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
    | { type: 'separator' }
    | { type: 'language-switcher' };

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
