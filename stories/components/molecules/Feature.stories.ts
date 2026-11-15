import Feature from '../../../src/themes/default/components/molecules/Feature/Feature.astro';

export default {
    title: 'Molecules/Feature',
    component: Feature,
    tags: ['autodocs'],
    parameters: { layout: 'padded', docs: { story: { height: '9rem' } } },
    args: {
        icon: 'Zap',
        title: 'Static output',
        variant: 'soft',
        color: 'primary',
        headingLevel: 3,
        slots: {
            default: 'Prebuilt pages that can be served by static hosting.',
        },
    },
    argTypes: {
        icon: {
            control: 'text',
            description: 'Canonical PascalCase Lucide name.',
        },
        title: { control: 'text' },
        variant: { control: 'select', options: ['soft', 'solid', 'plain'] },
        color: {
            control: 'text',
            description:
                'Semantic theme color or CSS hex value. Hex colors use a soft background and ignore variant.',
        },
        headingLevel: { control: 'select', options: [3, 4, 5, 6] },
    },
};

export const Soft = {};
export const HexColor = { args: { color: '#527b37' } };
export const HexIgnoresVariant = {
    args: { color: '#527b37', variant: 'solid' },
};
export const Solid = {
    args: {
        icon: 'Layers',
        title: 'Reusable components',
        variant: 'solid',
        color: 'secondary',
    },
};
export const Plain = {
    args: {
        icon: 'Code',
        title: 'Markdown and Astro',
        variant: 'plain',
        color: 'accent',
    },
};
export const LongDescription = {
    args: {
        title: 'Content maintained in version control',
        slots: {
            default:
                'A longer description demonstrates how the feature wraps within the available width while keeping its icon aligned beside the text.',
        },
    },
};
