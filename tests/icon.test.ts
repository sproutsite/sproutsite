import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('validates Icon content and rejects executable or unsupported props', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-icon-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Icons\ndescription: Icon examples.\n',
        );
        const validate = (component: string) => {
            writeFileSync(
                join(directory, '01-icons.mdx'),
                `import { Icon } from 'sproutsite/components';\nimport { Button } from 'sproutsite/components';\n\n## Icons\n\n${component}\n`,
            );
            validateSproutsiteContent(directory);
        };
        for (const component of [
            '<Icon name="Sprout" />',
            '<Icon name="CircleCheck" size={32} strokeWidth={1.5} color="success" label="Published" />',
            '<Button href="/contact/"><Icon name="ArrowRight" size={20} /> Contact</Button>',
        ])
            assert.doesNotThrow(() => validate(component));
        for (const component of [
            '<Icon />',
            '<Icon name="arrow-right" />',
            '<Icon name={"Sprout"} />',
            '<Icon name="Sprout" size={0} />',
            '<Icon name="Sprout" size={Infinity} />',
            '<Icon name="Sprout" size={process.exit()} />',
            '<Icon name="Sprout" size="32" />',
            '<Icon name="Sprout" strokeWidth={-1} />',
            '<Icon name="Sprout" label=" " />',
            '<Icon name="Sprout" color="pink" />',
            '<Icon name="Sprout" class="custom" />',
            '<Icon name="Sprout" name="Check" />',
            '<Icon name="Sprout">Unexpected content</Icon>',
            '<Icon name="Sprout" {...props} />',
        ])
            assert.throws(() => validate(component), /Icon requires/);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
