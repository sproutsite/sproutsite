import LegalIdentity from '../../../src/themes/default/components/molecules/LegalIdentity/LegalIdentity.astro';

export default {
    title: 'Molecules/LegalIdentity',
    component: LegalIdentity,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    argTypes: {
        part: {
            control: 'select',
            options: ['contact', 'name', 'email', 'controller'],
        },
    },
};

export const Contact = { args: { part: 'contact' } };
export const NameOnly = { args: { part: 'name' } };
export const EmailOnly = { args: { part: 'email' } };
export const Controller = { args: { part: 'controller' } };
