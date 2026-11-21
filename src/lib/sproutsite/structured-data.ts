import { canonicalUrl, withBase } from './urls.js';
import type { SiteConfig } from './types.js';

export interface ArticleMetadata {
    headline: string;
    datePublished: Date;
    image: string;
    author?: { name: string; url?: string };
}

interface StructuredDataInput {
    site: SiteConfig;
    title: string;
    description: string;
    route: string;
    noindex?: boolean;
    article?: ArticleMetadata;
}

/** Describe existing content only; URLs share the canonical/base-path helpers. */
export function createStructuredData({
    site,
    title,
    description,
    route,
    noindex,
    article,
}: StructuredDataInput) {
    if (noindex) return undefined;
    const url = canonicalUrl(route, site);
    const websiteUrl = new URL(withBase('/', site.base), site.url).href;
    const websiteId = `${websiteUrl}#website`;
    const pageId = `${url}#webpage`;
    const articleId = `${url}#article`;
    return {
        '@context': 'https://schema.org',
        '@graph': [
            ...(route === '/' && site.i18n.locale === site.i18n.defaultLocale
                ? [
                      {
                          '@type': 'WebSite',
                          '@id': websiteId,
                          url: websiteUrl,
                          name: site.name,
                          description,
                          inLanguage: site.i18n.locales,
                      },
                  ]
                : []),
            {
                '@type': 'WebPage',
                '@id': pageId,
                url,
                name: title,
                description,
                inLanguage: site.i18n.locale,
                isPartOf: { '@id': websiteId },
                ...(article ? { mainEntity: { '@id': articleId } } : {}),
            },
            ...(article
                ? [
                      {
                          '@type': 'BlogPosting',
                          '@id': articleId,
                          url,
                          headline: article.headline,
                          description,
                          inLanguage: site.i18n.locale,
                          datePublished: article.datePublished.toISOString(),
                          image: new URL(article.image, site.url).href,
                          mainEntityOfPage: { '@id': pageId },
                          ...(article.author
                              ? {
                                    author: {
                                        '@type': 'Person',
                                        name: article.author.name,
                                        ...(article.author.url
                                            ? { url: article.author.url }
                                            : {}),
                                    },
                                }
                              : {}),
                      },
                  ]
                : []),
        ],
    };
}

/** JSON-LD is inert data; escape HTML delimiters before inserting script text. */
export function serializeStructuredData(
    data: NonNullable<ReturnType<typeof createStructuredData>>,
): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}
