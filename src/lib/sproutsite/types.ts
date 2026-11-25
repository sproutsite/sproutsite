import type { Branding } from './branding.js';
import type { SiteColors } from './site-colors.js';

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

/** Shared layout data. route has translated segments but no locale/base prefix. */
export interface LayoutComponentProps {
    site: SiteConfig;
    route: string;
}
export type HeaderProps = LayoutComponentProps;
export type FooterProps = LayoutComponentProps;

export interface SiteConfig {
    branding?: Branding;
    colors?: SiteColors;
    name: string;
    url: string;
    base: string;
    i18n: { locale: string; defaultLocale: string; locales: string[] };
    hero: { classes: string[]; 'background-image'?: string };
    typography: {
        headings: { family: 'serif' | 'sans-serif'; weight: number };
        eyebrow: { family: 'serif' | 'sans-serif'; weight: number };
    };
    links?: {
        external?: { newTab?: boolean; icon?: boolean };
    };
    blog?: {
        hero: { title: string; description: string; eyebrow: string };
        articles: { heading: string };
    };
    header: { links: HeaderItem[] };
    footer: {
        text: string;
        'background-image'?: string | null;
        links: Link[];
        groups?: { title: string; links: (Link & { icon?: string })[] }[];
        social?: {
            title: string;
            links: (Link & { platform: 'github' | 'instagram' | 'facebook' })[];
        };
        copyright?: string;
        showVersion?: boolean;
        languageSwitcher?: boolean;
    };
}
