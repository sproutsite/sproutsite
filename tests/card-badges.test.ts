import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
    normalizeCardBadges,
    badgeVariants,
    badgeStyles,
} from '../src/lib/sproutsite/badges.js';
import { validateSproutsiteContent } from '../src/lib/sproutsite/validation.js';

test('Card normalizes one badge or a list and shares Badge options', () => {
    assert.deepEqual(normalizeCardBadges(undefined), []);
    assert.deepEqual(normalizeCardBadges([]), []);
    assert.deepEqual(normalizeCardBadges({ text: ' Open ' }), [
        { text: 'Open' },
    ]);
    assert.deepEqual(
        normalizeCardBadges({ text: 'Open', hover: ' More details ' }),
        [{ text: 'Open', hover: 'More details' }],
    );
    for (const variant of badgeVariants)
        for (const style of badgeStyles)
            assert.deepEqual(
                normalizeCardBadges([{ text: 'Status', variant, style }]),
                [{ text: 'Status', variant, style }],
            );
    for (const value of [
        null,
        'Open',
        {},
        { text: ' ' },
        { text: 'Open', variant: 'unknown' },
        { text: 'Open', style: 'ghost' },
        { text: 'Open', size: 'lg' },
        { text: 'Open', hover: '' },
        { text: 'Open', hover: ' ' },
        { text: 'Open', hover: 42 },
        [{ text: 'Open' }, null],
    ])
        assert.throws(() => normalizeCardBadges(value), /Card badges/);
});

test('Card MDX accepts static badge objects and arrays and rejects executable expressions', () => {
    const directory = mkdtempSync(join(tmpdir(), 'sproutsite-card-badges-'));
    try {
        writeFileSync(
            join(directory, 'page.yaml'),
            'title: Cards\ndescription: Card examples\n',
        );
        const validate = (props: string) => {
            writeFileSync(
                join(directory, '01-cards.mdx'),
                `import { Card } from 'sproutsite/components';\n\n## Cards\n\n<Card ${props}>\n### Example\n\nContent.\n</Card>\n`,
            );
            validateSproutsiteContent(directory);
        };
        for (const props of [
            '',
            'badges={[]}',
            "badges={{ text: 'Open' }}",
            "badges={{ text: 'Open', hover: 'Planned for a future version.' }}",
            'badges={{ "text": "Partly available", "variant": "info", "style": "soft" }}',
            "badges={[{text:'Open', variant:'warning'}, {text:'Preview', style:'outline'}]}",
        ])
            assert.doesNotThrow(() => validate(props));
        for (const props of [
            'badges="Open"',
            'badges={null}',
            'badges={undefined}',
            'badges={labels}',
            "badges={{text:'Open', text:'Duplicate'}}",
            "badges={{text:'Open', variant:'wrong'}}",
            "badges={{text:'Open', style:'ghost'}}",
            "badges={{text:'Open', size:'md'}}",
            "badges={{text:' '}}",
            "badges={{text:'Open', hover:''}}",
            "badges={{text:'Open', hover: getHint()}}",
            "badges={[{text:'Open'}, null]}",
            "badges={[, {text:'Open'}]}",
            'badges={{...labels}}',
            'badges={{text: getText()}}',
            "badges={{['text']: 'Open'}}",
            "badges={{get text() { return 'Open'; }}}",
            'badges={[...labels]}',
            "badges={{text:'Open'}} badges={{text:'Again'}}",
        ])
            assert.throws(
                () => validate(props),
                /Card (?:badges|accepts)/,
                props,
            );
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
