import { createSproutsiteCollections } from 'sproutsite/content';
import type { Loader } from 'astro/loaders';
import { setTimeout as delay } from 'node:timers/promises';

export const collections = createSproutsiteCollections();

// Keep the first article on disk before it reaches Astro's store. Requests
// during parsing must remain quiet, even on fast machines.
for (const name of ['blogPages', 'blogDocuments'] as const) {
    const collection = collections[name];
    if (!('loader' in collection) || typeof collection.loader !== 'object')
        throw new Error(`Expected an object loader for ${name}`);
    const loader = collection.loader;
    const delayedLoader: Loader = {
        ...loader,
        load(context) {
            return loader.load({
                ...context,
                async parseData(options) {
                    await delay(750);
                    return context.parseData(options);
                },
            });
        },
    };
    collection.loader = delayedLoader;
}
