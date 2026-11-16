import AccordionItem from '../../../src/themes/default/components/molecules/AccordionItem/AccordionItem.astro';
import Button from '../../../src/themes/default/components/atoms/Button/Button.astro';

export default {
    title: 'Molecules/AccordionItem',
    component: AccordionItem,
    tags: ['autodocs'],
    parameters: { layout: 'padded', docs: { story: { height: '16rem' } } },
    args: {
        title: 'How does Sproutsite work?',
        open: false,
        color: 'primary',
        slots: {
            default:
                '<p>Astro generates a static website from Markdown and reusable components.</p>',
        },
    },
    argTypes: {
        title: { control: 'text' },
        open: { control: 'boolean' },
        icon: {
            control: 'text',
            description: 'Optional canonical PascalCase Lucide name.',
        },
        color: {
            control: 'text',
            description:
                'Semantic theme color or CSS hex color. Default primary.',
        },
        backgroundColor: {
            control: 'text',
            description: 'CSS hex icon-box background; default 8% icon color.',
        },
        surfaceColor: {
            control: 'text',
            description: 'CSS hex background when closed.',
        },
        openSurfaceColor: {
            control: 'text',
            description: 'CSS hex background when open.',
        },
        openBorderColor: {
            control: 'text',
            description: 'CSS hex border when open.',
        },
    },
};

export const Plain = {};
export const Open = { args: { open: true } };
export const WithIcon = { args: { icon: 'Layers', open: true } };
export const SecondaryIcon = { args: { icon: 'Puzzle', color: 'secondary' } };
export const HexIcon = { args: { icon: 'Leaf', color: '#527b37' } };
export const ExplicitIconBackground = {
    args: { icon: 'Server', color: '#456e70', backgroundColor: '#dfeae5' },
};
export const CustomSurfaces = {
    args: {
        icon: 'Leaf',
        color: '#456b43',
        surfaceColor: '#f2f6ed',
        openSurfaceColor: '#e9efdf',
        openBorderColor: '#527442',
        open: true,
    },
};
export const LongQuestion = {
    args: {
        icon: 'Layers',
        title: 'Can a longer question wrap onto several lines while keeping its icon and toggle correctly aligned on a small screen?',
    },
};
export const InteractiveAnswer = {
    args: {
        open: true,
        slots: {
            default: [
                '<p>Select this text without closing the answer.</p>',
                {
                    component: Button,
                    props: { size: 'sm' },
                    slots: { default: 'A real action' },
                },
                '<p><a href="https://sproutsite.dev" target="_blank" rel="noopener noreferrer">Visit Sproutsite</a></p>',
            ],
        },
    },
};
