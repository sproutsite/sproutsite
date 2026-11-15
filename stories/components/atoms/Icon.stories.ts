import Icon from '../../../src/themes/default/components/atoms/Icon/Icon.astro';

export default {
    title: 'Atoms/Icon',
    component: Icon,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: { story: { height: '6rem' } },
    },
    args: { name: 'Sprout', size: 24, strokeWidth: 2, color: 'inherit' },
    argTypes: {
        name: {
            control: 'text',
            description:
                'Canonical Lucide name, for example Sprout, ArrowRight, or FileText.',
        },
        size: { control: { type: 'number', min: 1, step: 4 } },
        strokeWidth: { control: { type: 'number', min: 0.25, step: 0.25 } },
        color: {
            control: 'select',
            options: [
                'inherit',
                'primary',
                'secondary',
                'accent',
                'info',
                'success',
                'warning',
                'error',
            ],
        },
        label: {
            control: 'text',
            description:
                'Optional accessible name. Leave unset for decorative icons.',
        },
    },
};

export const Decorative = {};
export const Meaningful = {
    args: { name: 'CircleCheck', color: 'success', label: 'Published' },
};
export const Large = {
    args: { name: 'Layers', size: 48, strokeWidth: 1.5, color: 'primary' },
};
