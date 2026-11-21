import { defineMiddleware } from 'astro:middleware';

// Website-owned discovery: installed library consumers do not inherit this URL.
export const onRequest = defineMiddleware(({ locals, site }, next) => {
    if (!site)
        throw new Error('llms.txt discovery requires the production site URL.');
    locals.llmsUrl = new URL(
        `${import.meta.env.BASE_URL.replace(/\/$/, '')}/llms.txt`,
        site,
    ).href;
    return next();
});
