import { glob, type Loader } from 'astro/loaders';
import { fileURLToPath } from 'node:url';
import {
    blogPatterns,
    hasBlogSources,
} from '../lib/sproutsite/blog-sources.js';

/** Keep an absent/empty optional blog quiet; delegate actual loading to Astro. */
export function optionalBlogLoader(
    collection: keyof typeof blogPatterns,
    base: string,
    generateId: (options: { entry: string }) => string,
): Loader {
    const loader = glob({
        base,
        pattern: blogPatterns[collection],
        generateId,
    });
    return {
        name: `sproutsite/optional-${collection}`,
        async load(context) {
            const directory = fileURLToPath(new URL(base, context.config.root));
            if (hasBlogSources(collection, directory)) {
                await loader.load(context);
                return;
            }
            context.store.clear();
            const watcher = context.watcher;
            if (!watcher) return;
            // The native glob loader takes over as soon as the first matching
            // source is created. Do not create folders, placeholder entries or
            // suppress Astro's diagnostics for content that actually exists.
            watcher.add(directory);
            let loading = false;
            const onAdd = async () => {
                if (loading || !hasBlogSources(collection, directory)) return;
                loading = true;
                try {
                    await loader.load(context);
                    watcher.off('add', onAdd);
                    watcher.off('change', onAdd);
                } catch (error) {
                    context.logger.error(
                        error instanceof Error ? error.message : String(error),
                    );
                } finally {
                    loading = false;
                }
            };
            watcher.on('add', onAdd);
            watcher.on('change', onAdd);
        },
    };
}
