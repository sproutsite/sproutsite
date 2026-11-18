import LegalIdentity from '../../../src/themes/default/components/molecules/LegalIdentity/LegalIdentity.astro';

export default {
    title: 'Molecules/LegalIdentity',
    component: LegalIdentity,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    argTypes: {
        part: { control: 'select', options: ['contact', 'name'] },
    },
};

export const Contact = { args: { part: 'contact' } };
export const NameOnly = { args: { part: 'name' } };
