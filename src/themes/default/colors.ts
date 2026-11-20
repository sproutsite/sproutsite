import type { SiteColors } from '../../lib/sproutsite/site-colors.js';
import { contrastRatio } from '../../lib/sproutsite/colors.js';

// CSS supplies the no-config defaults. The palette contract test keeps this
// contrast reference aligned with theme.css and foundation/tokens.css.
export const defaultColors = {
    surfaces: {
        default: '#ffffff',
        muted: '#f5f7fa',
        border: '#e2e8f0',
        text: '#0b1f3a',
    },
    primary: { color: '#134b70', content: '#ffffff' },
    secondary: { color: '#0f766e', content: '#ffffff' },
    accent: { color: '#b45309', content: '#ffffff' },
    neutral: { color: '#26334a', content: '#ffffff' },
    info: { color: '#1769aa', content: '#ffffff' },
    success: { color: '#19764b', content: '#ffffff' },
    warning: { color: '#9a5b00', content: '#ffffff' },
    error: { color: '#b42318', content: '#ffffff' },
    brand: {
        background: '#071a36',
        backgroundEnd: '#0d2b50',
        gradient: '#125b86',
        content: '#ffffff',
        highlight: '#70c6df',
        accent: '#74e33d',
    },
} satisfies SiteColors;

export const colorVariables = {
    surfaces: {
        default: '--color-base-100',
        muted: '--color-base-200',
        border: '--color-base-300',
        text: '--color-base-content',
    },
    primary: { color: '--color-primary', content: '--color-primary-content' },
    secondary: {
        color: '--color-secondary',
        content: '--color-secondary-content',
    },
    accent: { color: '--color-accent', content: '--color-accent-content' },
    neutral: { color: '--color-neutral', content: '--color-neutral-content' },
    info: { color: '--color-info', content: '--color-info-content' },
    success: { color: '--color-success', content: '--color-success-content' },
    warning: { color: '--color-warning', content: '--color-warning-content' },
    error: { color: '--color-error', content: '--color-error-content' },
    brand: {
        background: '--color-hero-navy',
        backgroundEnd: '--color-hero-midnight',
        gradient: '--color-hero-ocean',
        content: '--color-brand-content',
        highlight: '--color-hero-cyan',
        accent: '--color-hero-green',
    },
} satisfies {
    [G in keyof Required<SiteColors>]: {
        [K in keyof Required<Required<SiteColors>[G]>]: `--${string}`;
    };
};

type Palette = {
    [G in keyof typeof defaultColors]: Record<
        keyof (typeof defaultColors)[G],
        string
    >;
};

export function resolveColors(input?: SiteColors): Palette {
    return {
        surfaces: { ...defaultColors.surfaces, ...input?.surfaces },
        primary: { ...defaultColors.primary, ...input?.primary },
        secondary: { ...defaultColors.secondary, ...input?.secondary },
        accent: { ...defaultColors.accent, ...input?.accent },
        neutral: { ...defaultColors.neutral, ...input?.neutral },
        info: { ...defaultColors.info, ...input?.info },
        success: { ...defaultColors.success, ...input?.success },
        warning: { ...defaultColors.warning, ...input?.warning },
        error: { ...defaultColors.error, ...input?.error },
        brand: { ...defaultColors.brand, ...input?.brand },
    };
}

/** Checks known solid text/surface pairs, not image overlays or all component states. */
export function colorContrastIssues(input?: SiteColors): string[] {
    if (!input) return [];
    const palette = resolveColors(input);
    const issues: string[] = [];
    const check = (
        foreground: string,
        background: string,
        field: string,
        against: string,
        minimum = 4.5,
    ) => {
        const ratio = contrastRatio(foreground, background);
        if (ratio < minimum)
            issues.push(
                `${field} against ${against}: ${ratio.toFixed(2)}:1; expected at least ${minimum}:1. Choose a darker/lighter colour or adjust the matching content colour.`,
            );
    };
    for (const role of [
        'primary',
        'secondary',
        'accent',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
    ] as const) {
        if (input[role])
            check(
                palette[role].content,
                palette[role].color,
                `colors.${role}.content`,
                `colors.${role}.color`,
            );
    }
    if (input.surfaces) {
        for (const surface of ['default', 'muted'] as const)
            check(
                palette.surfaces.text,
                palette.surfaces[surface],
                'colors.surfaces.text',
                `colors.surfaces.${surface}`,
            );
    }
    // Primary is also used for running-text links and eyebrows.
    if (input.primary || input.surfaces) {
        for (const surface of ['default', 'muted'] as const)
            check(
                palette.primary.color,
                palette.surfaces[surface],
                'colors.primary.color',
                `colors.surfaces.${surface}`,
            );
    }
    if (input.brand) {
        for (const background of [
            'background',
            'backgroundEnd',
            'gradient',
        ] as const) {
            check(
                palette.brand.content,
                palette.brand[background],
                'colors.brand.content',
                `colors.brand.${background}`,
            );
            if (background !== 'gradient')
                check(
                    palette.brand.highlight,
                    palette.brand[background],
                    'colors.brand.highlight',
                    `colors.brand.${background}`,
                );
        }
        check(
            palette.brand.accent,
            palette.brand.background,
            'colors.brand.accent',
            'colors.brand.background',
            3,
        );
    }
    return issues;
}

/** Validated values only; no arbitrary CSS names or expressions enter markup. */
export function colorStyles(
    input?: SiteColors,
    source = 'site configuration',
): Record<string, string> {
    const issues = colorContrastIssues(input);
    if (issues.length)
        throw new Error(`Invalid ${source}: ${issues.join('; ')}`);
    const styles: Record<string, string> = {};
    for (const group of Object.keys(colorVariables) as (keyof SiteColors)[]) {
        const values = input?.[group];
        if (!values) continue;
        const variables: Record<string, string> = colorVariables[group];
        for (const [key, value] of Object.entries(values))
            if (value !== undefined) styles[variables[key]!] = value;
    }
    if (input?.brand?.background)
        styles['--ss-hero-image-overlay'] = input.brand.background;
    return styles;
}
