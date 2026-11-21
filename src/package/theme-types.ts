import type { ComponentProps } from 'astro/types';
import type { SiteConfig } from '../lib/sproutsite/types.js';
import type { ArticleMetadata } from '../lib/sproutsite/structured-data.js';

export interface ThemeLayoutProps {
    site: SiteConfig;
    route: string;
    layout: 'default' | 'landing';
}
export interface DocumentProps {
    site: SiteConfig;
    title: string;
    description: string;
    route: string;
    layout?: 'default' | 'landing';
    noindex?: boolean;
    article?: ArticleMetadata;
}
export interface ErrorPageProps {
    status: 404 | 500;
    site: SiteConfig;
    copy: ReturnType<typeof import('./error-copy.js').errorCopy>;
}
/** Public props match the documented content API, including rendered Content slots. */
export interface ThemeComponentProps {
    Layout: ComponentProps<
        typeof import('../themes/default/layouts/ThemeLayout/ThemeLayout.astro').default
    >;
    Alert: ComponentProps<
        typeof import('../themes/default/components/molecules/Alert/Alert.astro').default
    >;
    ContentTable: ComponentProps<
        typeof import('../themes/default/components/molecules/ContentTable/ContentTable.astro').default
    >;
    FoundationSample: ComponentProps<
        typeof import('../themes/default/components/molecules/FoundationSample/FoundationSample.astro').default
    >;
    Tabs: ComponentProps<
        typeof import('../themes/default/components/molecules/Tabs/Tabs.astro').default
    >;
    Tab: ComponentProps<
        typeof import('../themes/default/components/atoms/Tab/Tab.astro').default
    >;
    Card: ComponentProps<
        typeof import('../themes/default/components/molecules/Card/Card.astro').default
    >;
    CardActions: ComponentProps<
        typeof import('../themes/default/components/molecules/CardActions/CardActions.astro').default
    >;
    ContentImage: ComponentProps<
        typeof import('../themes/default/components/atoms/ContentImage/ContentImage.astro').default
    >;
    Eyebrow: ComponentProps<
        typeof import('../themes/default/components/atoms/Eyebrow/Eyebrow.astro').default
    >;
    Badge: ComponentProps<
        typeof import('../themes/default/components/atoms/Badge/Badge.astro').default
    >;
    Button: ComponentProps<
        typeof import('../themes/default/components/atoms/Button/Button.astro').default
    >;
    Icon: ComponentProps<
        typeof import('../themes/default/components/atoms/Icon/Icon.astro').default
    >;
    Feature: ComponentProps<
        typeof import('../themes/default/components/molecules/Feature/Feature.astro').default
    >;
    LegalIdentity: ComponentProps<
        typeof import('../themes/default/components/molecules/LegalIdentity/LegalIdentity.astro').default
    >;
    PrivacyInfrastructure: ComponentProps<
        typeof import('../themes/default/components/molecules/PrivacyInfrastructure/PrivacyInfrastructure.astro').default
    >;
    Accordion: ComponentProps<
        typeof import('../themes/default/components/molecules/Accordion/Accordion.astro').default
    >;
    AccordionItem: ComponentProps<
        typeof import('../themes/default/components/molecules/AccordionItem/AccordionItem.astro').default
    >;
    Column: ComponentProps<
        typeof import('../themes/default/components/layout/Column/Column.astro').default
    >;
    Columns: ComponentProps<
        typeof import('../themes/default/components/layout/Columns/Columns.astro').default
    >;
    Header: ComponentProps<
        typeof import('../themes/default/components/organisms/Header/Header.astro').default
    >;
    Footer: ComponentProps<
        typeof import('../themes/default/components/organisms/Footer/Footer.astro').default
    >;
    Hero: ComponentProps<
        typeof import('../themes/default/components/organisms/Hero/Hero.astro').default
    >;
    PageTitle: ComponentProps<
        typeof import('../themes/default/components/organisms/PageTitle/PageTitle.astro').default
    >;
    Section: ComponentProps<
        typeof import('../themes/default/components/organisms/Section/Section.astro').default
    >;
    BlogIndex: ComponentProps<
        typeof import('../themes/default/components/organisms/BlogIndex/BlogIndex.astro').default
    >;
    BlogPost: ComponentProps<
        typeof import('../themes/default/components/organisms/BlogPost/BlogPost.astro').default
    >;
    ErrorPage: ComponentProps<
        typeof import('../themes/default/layouts/ErrorPage/ErrorPage.astro').default
    >;
    BrandLogo: ComponentProps<
        typeof import('../themes/default/components/atoms/BrandLogo/BrandLogo.astro').default
    >;
    HeroBackground: ComponentProps<
        typeof import('../themes/default/components/atoms/HeroBackground/HeroBackground.astro').default
    >;
    LanguageSwitcher: ComponentProps<
        typeof import('../themes/default/components/molecules/LanguageSwitcher/LanguageSwitcher.astro').default
    >;
}
export type ThemeProps<K extends keyof ThemeComponentProps> =
    ThemeComponentProps[K];
