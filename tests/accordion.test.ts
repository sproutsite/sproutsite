import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('validates accordion structure, booleans, icon names and safe color values', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-accordion-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Accordions\ndescription: Examples\n',
        );
        const validate = (body: string) => {
            writeFileSync(
                join(directory, '01-example.mdx'),
                `import { Accordion, AccordionItem } from 'sproutsite/components';\n\n## Answers\n\n${body}\n`,
            );
            validateSproutsiteContent(directory);
        };
        validate(
            '<Accordion>\n<AccordionItem title="Question" icon="Layers" color="#134b70" backgroundColor="#eef" open>\nAnswer.\n</AccordionItem>\n</Accordion>',
        );
        validate(
            '<Accordion multiple={true}>\n<AccordionItem title="First" open>\nAnswer.\n</AccordionItem>\n<AccordionItem title="Second" open>\nAnswer.\n</AccordionItem>\n</Accordion>',
        );
        validate(
            '<Accordion multiple={false}>\n<AccordionItem title="Question" open={false} surfaceColor="#fff" openSurfaceColor="#eaf2f8" openBorderColor="#134b70">\nAnswer.\n</AccordionItem>\n</Accordion>',
        );
        for (const props of [
            'title=""',
            'title="Q" icon="mail-icon"',
            'title="Q" color="red"',
            'title="Q" backgroundColor="url(evil)"',
            'title="Q" surfaceColor="#fff;display:none"',
            'title="Q" open="true"',
            'title="Q" open={1}',
            'title="Q" unknown="x"',
            'title="Q" color={"primary"}',
        ]) {
            assert.throws(
                () =>
                    validate(
                        `<Accordion>\n<AccordionItem ${props}>\nAnswer.\n</AccordionItem>\n</Accordion>`,
                    ),
                /AccordionItem/,
            );
        }
        assert.throws(
            () =>
                validate(
                    '<AccordionItem title="Orphan">\nAnswer.\n</AccordionItem>',
                ),
            /direct child/,
        );
        assert.throws(
            () =>
                validate(
                    '<Accordion multiple="true">\n<AccordionItem title="Q">\nA.\n</AccordionItem>\n</Accordion>',
                ),
            /Accordion/,
        );
        assert.throws(
            () => validate('<Accordion>\nSome loose content.\n</Accordion>'),
            /Accordion/,
        );
        assert.throws(
            () =>
                validate(
                    '<Accordion>\n<AccordionItem title="A" open>\nA.\n</AccordionItem>\n<AccordionItem title="B" open>\nB.\n</AccordionItem>\n</Accordion>',
                ),
            /only one/,
        );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
