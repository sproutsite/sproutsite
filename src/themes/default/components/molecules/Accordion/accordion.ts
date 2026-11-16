function initializeAccordions() {
    for (const group of document.querySelectorAll<HTMLElement>(
        '.ss-accordion:not([data-enhanced])',
    )) {
        const items = [
            ...group.querySelectorAll<HTMLDetailsElement>(
                ':scope > .ss-accordion-item',
            ),
        ];
        if (group.dataset.multiple !== 'true') {
            const name = `ss-accordion-${crypto.randomUUID()}`;
            let hasOpen = false;
            for (const item of items) {
                if (item.open && hasOpen) item.open = false;
                hasOpen ||= item.open;
                item.name = name;
            }
        }
        group.dataset.enhanced = 'true';
    }
    for (const item of document.querySelectorAll<HTMLDetailsElement>(
        '.ss-accordion-item:not([data-enhanced])',
    )) {
        item.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof Element) || event.defaultPrevented) return;
            const control = target.closest(
                'summary, a, button, input, select, textarea, label, details, [contenteditable], [role="button"]',
            );
            if (control && control !== item) return;
            if (window.getSelection()?.toString()) return;
            item.open = !item.open;
            item.querySelector<HTMLElement>(':scope > summary')?.focus({
                preventScroll: true,
            });
        });
        item.dataset.enhanced = 'true';
    }
}

initializeAccordions();
document.addEventListener('astro:page-load', initializeAccordions);
// Storybook replaces component markup without a full navigation.
new MutationObserver(initializeAccordions).observe(document.body, {
    childList: true,
    subtree: true,
});
