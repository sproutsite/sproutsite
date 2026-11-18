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
    onReady: (ready: boolean) => void,
): Loader {
    const loader = glob({
        base,
        pattern: blogPatterns[collection],
        generateId,
    });
    return {
        name: `sproutsite/optional-${collection}`,
        async load(context) {
            // The filesystem may contain new files before Astro has parsed them.
            // Track actual store writes, including the native loader's watchers.
            const updateReadiness = () =>
                onReady(context.store.keys().length > 0);
            const store: typeof context.store = {
                ...context.store,
                set(entry) {
                    const result = context.store.set(entry);
                    updateReadiness();
                    return result;
                },
                delete(id) {
                    context.store.delete(id);
                    updateReadiness();
                },
                clear() {
                    onReady(false);
                    context.store.clear();
                },
            };
            const nativeContext = { ...context, store };
            updateReadiness();
            const directory = fileURLToPath(new URL(base, context.config.root));
            if (hasBlogSources(collection, directory)) {
                await loader.load(nativeContext);
                return;
            }
            store.clear();
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
                    await loader.load(nativeContext);
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
