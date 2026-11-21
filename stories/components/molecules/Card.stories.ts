import layoutLandscape from '../../../src/content/pages/showcase/_assets/layout-landscape.png';
import Card from '../../../src/themes/default/components/molecules/Card/Card.astro';

export default {
    title: 'Molecules/Card',
    component: Card,
    tags: ['autodocs'],
    argTypes: {
        badges: {
            control: 'object',
            description:
                'One badge descriptor or an array: text, optional variant, style and hover hint. Labels appear at the bottom right of the image or a theme-colored surface.',
        },
        imageAlt: {
            control: 'text',
            description: 'Meaningful alternative text for the optional image.',
        },
        shadow: {
            control: {
                type: 'select',
                labels: {
                    none: 'No shadow',
                    sm: 'Small shadow',
                    md: 'Medium shadow',
                    lg: 'Large shadow',
                    xl: 'Extra large shadow',
                },
            },
            options: ['none', 'sm', 'md', 'lg', 'xl'],
            description: 'Card elevation. The default is a small shadow.',
        },
    },
};

export const TextOnly = {
    args: {
        shadow: 'sm',
        slots: {
            default:
                '<h3>Simple content card</h3><p>A reusable card with standard body content and no image.</p>',
        },
    },
};

export const WithImage = {
    args: {
        image: layoutLandscape,
        imageAlt: 'Abstract blue representation of a modular website layout',
        shadow: 'md',
        slots: {
            default:
                '<h3>Card with image</h3><p>Local Astro assets work directly in Storybook stories.</p>',
        },
    },
};

export const ResponsiveWithImage = {
    name: 'Responsive image and content',
    args: {
        image: layoutLandscape,
        imageAlt: 'Abstract blue representation of structured website content',
        shadow: 'lg',
        slots: {
            default:
                '<h3>A card that remains readable on small screens</h3><p>This longer text makes line wrapping, image cropping, and the available content width easy to review with the Storybook viewport toolbar.</p>',
        },
    },
};

export const SingleBadge = {
    args: {
        image: layoutLandscape,
        imageAlt: 'Illustration of a modular website layout',
        badges: { text: 'Partly available', variant: 'info', style: 'soft' },
        slots: {
            default:
                '<h3>A single status badge</h3><p>The label sits inside the image area.</p>',
        },
    },
};

export const MultipleBadges = {
    args: {
        image: layoutLandscape,
        imageAlt: 'Illustration of a modular website layout',
        badges: [
            { text: 'Preview', variant: 'info', style: 'soft' },
            { text: 'Open', variant: 'warning', style: 'outline' },
        ],
        slots: {
            default:
                '<h3>Several labels</h3><p>Labels keep their input order and wrap when the available width is too small.</p>',
        },
    },
};

export const BadgesWithoutImage = {
    args: {
        badges: [
            { text: 'Documentation', variant: 'secondary', style: 'solid' },
            { text: 'New', variant: 'primary', style: 'dash' },
        ],
        slots: {
            default:
                '<h3>A theme-colored media area</h3><p>When labels are present without an image, the card supplies a matching empty surface.</p>',
        },
    },
};

export const HoverHints = {
    args: {
        image: layoutLandscape,
        imageAlt: 'Illustration of a modular website layout',
        badges: [
            {
                text: 'Partly available',
                variant: 'info',
                style: 'soft',
                hover: 'The documented options work today; further customization is still open.',
            },
            {
                text: 'Open',
                variant: 'warning',
                style: 'soft',
                hover: 'This capability is planned for a future release.',
            },
            { text: 'Preview', variant: 'neutral', style: 'solid' },
        ],
        slots: {
            default:
                '<h3>Hover or Tab for details</h3><p>Only badges with a hint join the tab order. Escape dismisses a hint without moving focus.</p>',
        },
    },
};
