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
            control: { type: 'number', min: 1 },
            description:
                'Total gap in pixels; half on either side of each line.',
        },
        dividerGapMobile: {
            control: { type: 'number', min: 1 },
            description: 'Optional gap below 64rem; defaults to dividerGap.',
        },
        dividerColor: {
            control: 'text',
            description: 'Optional CSS hex color for the separators.',
        },
    },
    args: { divider: false, dividerGap: 48 },
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
        dividerGap: 64,
        slots: { default: columns([4, 4, 4, 6, 6]) },
    },
};

export const MobileDividerSpacing = {
    args: {
        divider: true,
        dividerGap: 96,
        dividerGapMobile: 48,
        slots: { default: columns([4, 4, 4]) },
    },
};
