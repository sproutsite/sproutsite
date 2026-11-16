import Accordion from '../../../src/themes/default/components/molecules/Accordion/Accordion.astro';
import AccordionItem from '../../../src/themes/default/components/molecules/AccordionItem/AccordionItem.astro';

// Storybook Astro's configured component slots render the real children.
const item = (title: string, answer: string, open = false) => ({
    component: AccordionItem,
    props: { title, open },
    slots: { default: `<p>${answer}</p>` },
});
const first = item(
    'Does Sproutsite contain an agent?',
    'No. Use your preferred external coding agent.',
    true,
);
const second = item(
    'Do I need a CMS server?',
    'No. Publish the static Astro output.',
);

export default {
    title: 'Molecules/Accordion',
    component: Accordion,
    tags: ['autodocs'],
    parameters: { layout: 'padded', docs: { story: { height: '24rem' } } },
    args: { multiple: false, slots: { default: [first, second] } },
    argTypes: {
        multiple: {
            control: 'boolean',
            description: 'Allow several open items; groups remain independent.',
        },
    },
};

export const SingleOpen = {};
export const AllClosed = {
    args: {
        slots: {
            default: [
                second,
                item(
                    'Can I reuse components?',
                    'Yes. Import the documented MDX components.',
                ),
            ],
        },
    },
};
export const MultipleOpen = {
    args: {
        multiple: true,
        slots: {
            default: [
                first,
                item('Can I deploy anywhere?', 'Use a static web host.', true),
            ],
        },
    },
};
