import PrivacyInfrastructure from '../../../src/themes/default/components/molecules/PrivacyInfrastructure/PrivacyInfrastructure.astro';

export default {
    title: 'Molecules/PrivacyInfrastructure',
    component: PrivacyInfrastructure,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    argTypes: {
        part: {
            control: 'select',
            options: [
                'hosting',
                'email-retention',
                'log-size-limit',
                'log-retention',
            ],
        },
    },
};
export const Hosting = { args: { part: 'hosting' } };
export const LogRetention = { args: { part: 'log-retention' } };
export const EmailRetention = { args: { part: 'email-retention' } };
