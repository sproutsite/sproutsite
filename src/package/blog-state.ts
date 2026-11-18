import type { Loader } from 'astro/loaders';
import type { blogPatterns } from '../lib/sproutsite/blog-sources.js';

/** Persist readiness alongside Astro's content, rather than infer it from files. */
export function createBlogReadinessLoader() {
    const readiness = { blogPages: false, blogDocuments: false };
    let context: Parameters<Loader['load']>[0] | undefined;
    const write = () => {
        context?.store.set({ id: 'readiness', data: { ...readiness } });
    };
    const loader: Loader = {
        name: 'sproutsite/blog-readiness',
        async load(nextContext) {
            context = nextContext;
            write();
        },
    };
    return {
        loader,
        setReady(collection: keyof typeof blogPatterns, ready: boolean) {
            if (readiness[collection] === ready) return;
            readiness[collection] = ready;
            write();
        },
    };
}
