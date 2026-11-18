import assert from 'node:assert/strict';
import test from 'node:test';
import { navigationCurrent } from '../src/themes/default/components/organisms/Header/navigation.js';

test('marks exact routes as pages and descendant routes as locations', () => {
    assert.equal(navigationCurrent('/', '/'), 'page');
    assert.equal(navigationCurrent('/showcase/', '/showcase/'), 'page');
    assert.equal(
        navigationCurrent('/showcase', '/showcase/layout/'),
        'location',
    );
    assert.equal(
        navigationCurrent('/blog/', '/blog/apache-2-license/'),
        'location',
    );
    assert.equal(
        navigationCurrent(
            '/documentation/',
            '/documentation/getting-started/contributing/',
        ),
        'location',
    );
    assert.equal(
        navigationCurrent(
            '/dokumentation/',
            '/dokumentation/veroeffentlichen/',
        ),
        'location',
    );
});

test('does not mark home, similar prefixes or external destinations on subpages', () => {
    for (const href of [
        '/',
        '/show/',
        '/showcase-other/',
        'https://example.com/showcase/',
        '//example.com/showcase/',
        'mailto:grow@sproutsite.dev',
        '#showcase',
    ]) {
        assert.equal(navigationCurrent(href, '/showcase/layout/'), undefined);
    }
    assert.equal(navigationCurrent('/blog/', '/blogroll/article/'), undefined);
});

test('ignores query strings and fragments in navigation destinations', () => {
    assert.equal(
        navigationCurrent('/showcase/?view=all#topics', '/showcase/'),
        'page',
    );
    assert.equal(
        navigationCurrent('/showcase/#topics', '/showcase/layout/'),
        'location',
    );
});
