import Columns from '../../../src/themes/default/components/layout/Columns/Columns.astro';

const column = (span: number, index: number): string =>
    `<div class="ss-column ss-column--span-${span}"><article class="rounded-box bg-base-200 p-6"><h3 class="m-0 text-lg font-bold">Column ${index}</h3><p class="mt-3 mb-0">${span} of 12 columns on desktop, stacked on smaller screens.</p></article></div>`;

const columns = (spans: number[]): string =>
    spans.map((span, index) => column(span, index + 1)).join('');

export default {
    title: 'Layout/Columns',
    component: Columns,
    tags: ['autodocs'],
    argTypes: {
        divider: { control: 'boolean' },
        dividerGap: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
            description:
                'Desktop preset: xs 2rem, sm 4rem, md 6rem, lg 8rem, xl 12rem.',
        },
        dividerGapMobile: {
            control: 'select',
            options: ['xs', 'sm', 'md', 'lg', 'xl'],
            description:
                'Mobile preset: xs 1rem, sm 2rem, md 3rem, lg 4rem, xl 6rem. Omit to use half the general gap.',
        },
        dividerColor: {
            control: 'text',
            description: 'Optional CSS hex color for the separators.',
        },
    },
    args: { divider: false, dividerGap: 'md' },
    parameters: {
        docs: {
            story: {
                height: '10rem',
            },
        },
    },
};

export const SingleColumn = {
    args: {
        slots: {
            default: columns([12]),
        },
    },
};

export const TwoColumns = {
    args: {
        slots: {
            default: columns([6, 6]),
        },
    },
};

export const ThreeColumns = {
    args: {
        slots: {
            default: columns([4, 4, 4]),
        },
    },
};

export const FourColumns = {
    args: {
        slots: {
            default: columns([3, 3, 3, 3]),
        },
    },
};

export const Dividers = {
    args: {
        divider: true,
        slots: { default: columns([4, 4, 4]) },
    },
};

export const CustomDividers = {
    args: {
        divider: true,
        dividerColor: '#94a3b8',
        dividerGap: 'lg',
        slots: { default: columns([4, 4, 4, 6, 6]) },
    },
};

export const MobileDividerSpacing = {
    args: {
        divider: true,
        dividerGap: 'xl',
        dividerGapMobile: 'md',
        slots: { default: columns([4, 4, 4]) },
    },
};
