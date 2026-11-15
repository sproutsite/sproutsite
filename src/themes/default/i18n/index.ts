import { z } from 'zod';
import { parse } from 'yaml';
import english from './en.yaml?raw';
import german from './de.yaml?raw';

const messagesSchema = z
    .object({
        skipToContent: z.string().trim().min(1),
        primaryNavigation: z.string().trim().min(1),
        languageSwitcher: z.string().trim().min(1),
        openMenu: z.string().trim().min(1),
        closeMenu: z.string().trim().min(1),
        footerNavigation: z.string().trim().min(1),
        home: z.string().trim().min(1),
        blogEyebrow: z.string().trim().min(1),
        blogDescription: z.string().trim().min(1),
        blogHeading: z.string().trim().min(1),
        readMore: z.string().trim().min(1),
        foundationDefault: z.string().trim().min(1),
        foundationMuted: z.string().trim().min(1),
        foundationBorder: z.string().trim().min(1),
        foundationText: z.string().trim().min(1),
        foundationPrimary: z.string().trim().min(1),
        foundationSecondary: z.string().trim().min(1),
        foundationAccent: z.string().trim().min(1),
        foundationNeutral: z.string().trim().min(1),
        foundationInfo: z.string().trim().min(1),
        foundationSuccess: z.string().trim().min(1),
        foundationWarning: z.string().trim().min(1),
        foundationError: z.string().trim().min(1),
        foundationSquare: z.string().trim().min(1),
        foundationFields: z.string().trim().min(1),
        foundationBoxes: z.string().trim().min(1),
        foundationNoShadow: z.string().trim().min(1),
        foundationSmall: z.string().trim().min(1),
        foundationSoft: z.string().trim().min(1),
        foundationRaised: z.string().trim().min(1),
        foundationDisplayLabel: z.string().trim().min(1),
        foundationDisplay: z.string().trim().min(1),
        foundationHeadingLabel: z.string().trim().min(1),
        foundationHeading: z.string().trim().min(1),
        foundationBodyLabel: z.string().trim().min(1),
        foundationBody: z.string().trim().min(1),
        foundationFocus: z.string().trim().min(1),
        foundationFocusLink: z.string().trim().min(1),
    })
    .strict();

export type Locale = 'en' | 'de';
export type MessageKey = keyof z.infer<typeof messagesSchema>;

function loadMessages(source: string) {
    return messagesSchema.parse(parse(source));
}

const messages: Record<Locale, z.infer<typeof messagesSchema>> = {
    en: loadMessages(english),
    de: loadMessages(german),
};

export function t(locale: Locale, key: MessageKey): string {
    return messages[locale][key];
}
