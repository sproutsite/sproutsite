interface SearchExcerpt {
    url: string;
    title: string;
    excerpt: string;
}

interface ResultData {
    url: string;
    excerpt: string;
    meta: { title?: string };
    sub_results: SearchExcerpt[];
}

interface Result {
    score: number;
    data(): Promise<ResultData>;
}

interface Pagefind {
    options(options: { noWorker: boolean }): Promise<void>;
    search(query: string): Promise<{ results: Result[] }>;
}

interface SearchCopy {
    hint: string;
    searching: string;
    result: string;
    singular: string;
    plural: string;
    score: string;
    error: string;
    missingIndex: string;
    documentation: string;
    showcase: string;
}

const batchSize = 8;

function bestSection(result: ResultData, terms: Set<string>) {
    let best: SearchExcerpt | undefined;
    let bestScore = -1;
    for (const section of result.sub_results) {
        if (!section.url.includes('#')) continue;
        const title = section.title.toLowerCase();
        const excerpt = section.excerpt.toLowerCase();
        let score = 0;
        for (const term of terms) {
            if (title.includes(term)) score += 2;
            else if (excerpt.includes(term)) score++;
        }
        if (score > bestScore) {
            best = section;
            bestScore = score;
        }
    }
    return best;
}

function renderExcerpt(container: HTMLElement, excerpt: string) {
    const template = document.createElement('template');
    template.innerHTML = excerpt;
    // Use Pagefind's escaped excerpt and retain only text and its highlights.
    for (const node of template.content.childNodes) {
        if (node instanceof HTMLElement && node.tagName === 'MARK') {
            const mark = document.createElement('mark');
            mark.textContent = node.textContent;
            container.append(mark);
        } else {
            container.append(node.textContent ?? '');
        }
    }
}

export function setupSiteSearch(dialog: HTMLDialogElement) {
    const form = dialog.querySelector('form');
    const input = form?.querySelector('input');
    const status = dialog.querySelector<HTMLElement>('[role="status"]');
    const list = dialog.querySelector('ol');
    const rankTemplate = dialog
        .querySelector<HTMLTemplateElement>('[data-search-rank]')
        ?.content.querySelector<HTMLElement>('.ss-badge');
    const more = dialog.querySelector<HTMLButtonElement>('[data-search-more]');
    const clear = dialog.querySelector<HTMLButtonElement>(
        '[data-search-clear]',
    );
    const modulePath = dialog.dataset.module;
    if (
        !form ||
        !input ||
        !status ||
        !list ||
        !rankTemplate ||
        !more ||
        !clear ||
        !modulePath ||
        !dialog.dataset.copy
    )
        return;

    const loadPagefind = async () => {
        const module = (await import(
            /* @vite-ignore */ modulePath
        )) as Pagefind;
        await module.options({ noWorker: true });
        return module;
    };
    const copy = JSON.parse(dialog.dataset.copy) as SearchCopy;
    const scoreFormat = new Intl.NumberFormat(dialog.dataset.locale, {
        maximumSignificantDigits: 3,
    });
    const triggers = document.querySelectorAll<HTMLButtonElement>(
        '[data-site-search-open]',
    );
    const showcase = dialog.dataset.showcase;
    let opener: HTMLButtonElement | undefined;
    let pagefind: Pagefind | undefined;
    let loading: Promise<Pagefind> | undefined;
    let timer: number | undefined;
    let requestId = 0;
    let hits: Result[] = [];
    let cursor = 0;

    function createResult(
        result: ResultData,
        terms: Set<string>,
        score: number,
        rank: number,
    ) {
        const section = bestSection(result, terms);
        const url = new URL(section?.url ?? result.url, location.origin);
        if (url.origin !== location.origin || !rankTemplate) return;
        const item = document.createElement('li');
        const link = document.createElement('a');
        const heading = document.createElement('span');
        const badge = rankTemplate.cloneNode(true) as HTMLElement;
        const title = document.createElement('span');
        const excerpt = document.createElement('p');
        const details = document.createElement('div');
        const scoreLabel = document.createElement('span');
        const destination = document.createElement('span');
        link.className = 'ss-site-search__result';
        link.href = url.href;
        link.addEventListener('click', (event) => {
            if (
                !event.defaultPrevented &&
                event.button === 0 &&
                !event.altKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey
            ) {
                dialog.close();
            }
        });
        if (showcase) {
            const category = document.createElement('span');
            category.className = 'ss-site-search__category';
            category.textContent = url.pathname.startsWith(showcase)
                ? copy.showcase
                : copy.documentation;
            link.append(category);
        }
        title.className = 'ss-site-search__title';
        heading.className = 'ss-site-search__heading';
        badge.classList.add('ss-site-search__rank');
        badge.textContent = `${rank}.`;
        badge.setAttribute('aria-hidden', 'true');
        title.id = `ss-site-search-result-${rank}`;
        link.setAttribute('aria-labelledby', title.id);
        const pageTitle = result.meta.title ?? url.pathname;
        title.textContent =
            section && section.title !== pageTitle
                ? `${pageTitle} · ${section.title}`
                : pageTitle;
        excerpt.className = 'ss-site-search__excerpt';
        renderExcerpt(excerpt, section?.excerpt ?? result.excerpt);
        details.className = 'ss-site-search__details';
        scoreLabel.textContent = `${copy.score}: ${scoreFormat.format(score)}`;
        destination.className = 'ss-site-search__destination';
        destination.textContent = url.href;
        heading.append(badge, title);
        details.append(scoreLabel, destination);
        link.append(heading, excerpt, details);
        item.append(link);
        return item;
    }

    async function appendBatch(id: number, moveFocus = false) {
        if (!more || !list || !status || !input) return;
        more.disabled = true;
        try {
            const end = cursor + batchSize;
            const results = await Promise.all(
                hits.slice(cursor, end).map(async (hit) => ({
                    data: await hit.data(),
                    score: hit.score,
                })),
            );
            if (id !== requestId) return;
            const terms = new Set(
                input.value.toLowerCase().match(/[\p{L}\p{N}]+/gu),
            );
            const items = results
                .map(({ data, score }, index) =>
                    createResult(data, terms, score, cursor + index + 1),
                )
                .filter((item) => item !== undefined);
            list.append(...items);
            cursor = end;
            more.hidden = cursor >= hits.length;
            if (moveFocus) items[0]?.querySelector('a')?.focus();
        } catch {
            if (id === requestId) status.textContent = copy.error;
        } finally {
            if (id === requestId) more.disabled = false;
        }
    }

    async function search(query: string, id: number) {
        if (!status) return;
        status.textContent = copy.searching;
        try {
            pagefind ??= await (loading ??= loadPagefind());
            if (id !== requestId) return;
            const { results } = await pagefind.search(query);
            if (id !== requestId) return;
            hits = results.toSorted((left, right) => right.score - left.score);
            const label = results.length === 1 ? copy.singular : copy.plural;
            status.textContent = `${results.length} ${label} ${copy.result} “${query}”`;
            if (results.length) await appendBatch(id);
        } catch {
            if (!pagefind) loading = undefined;
            if (id === requestId) {
                status.textContent =
                    dialog.dataset.development && !pagefind
                        ? copy.missingIndex
                        : copy.error;
            }
        }
    }

    function scheduleSearch(delay: number) {
        if (!input || !list || !more || !status || !clear) return;
        window.clearTimeout(timer);
        const id = ++requestId;
        const query = input.value.trim();
        clear.hidden = !input.value;
        list.replaceChildren();
        more.hidden = true;
        hits = [];
        cursor = 0;
        status.textContent = query ? '' : copy.hint;
        if (query)
            timer = window.setTimeout(() => void search(query, id), delay);
    }

    for (const trigger of triggers) {
        trigger.hidden = false;
        trigger.addEventListener('click', () => {
            if (dialog.open) return;
            opener = trigger;
            dialog.showModal();
            input.focus();
            if (input.value) scheduleSearch(0);
        });
    }
    dialog
        .querySelector('[data-search-close]')
        ?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        requestId++;
        window.clearTimeout(timer);
        if (opener?.getClientRects().length)
            opener.focus({ preventScroll: true });
        else
            Array.from(triggers)
                .find((trigger) => trigger.getClientRects().length)
                ?.focus({ preventScroll: true });
    });
    clear.addEventListener('click', () => {
        input.value = '';
        scheduleSearch(0);
        input.focus();
    });
    input.addEventListener('input', (event) => {
        if (!(event instanceof InputEvent) || !event.isComposing)
            scheduleSearch(180);
    });
    input.addEventListener('compositionend', () => scheduleSearch(180));
    dialog.addEventListener('keydown', (event) => {
        const { key, target } = event;
        if (
            (key !== 'ArrowDown' && key !== 'ArrowUp') ||
            event.defaultPrevented ||
            event.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        )
            return;

        const results = Array.from(
            list.querySelectorAll<HTMLAnchorElement>('.ss-site-search__result'),
        );
        let next: HTMLElement | undefined;
        if (target === input && key === 'ArrowDown') {
            next = results[0];
        } else if (target === more && key === 'ArrowUp') {
            next = results.at(-1);
        } else if (target instanceof HTMLAnchorElement) {
            const index = results.indexOf(target);
            if (index < 0) return;
            next =
                key === 'ArrowUp'
                    ? (results[index - 1] ?? input)
                    : (results[index + 1] ??
                      (!more.hidden && !more.disabled ? more : target));
        }
        if (!next) return;
        event.preventDefault();
        next.focus();
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        scheduleSearch(0);
    });
    more.addEventListener('click', () => void appendBatch(requestId, true));
}
