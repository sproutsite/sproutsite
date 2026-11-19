interface ActiveHint {
    element: HTMLElement;
    close: () => void;
    position: () => void;
}

let activeHint: ActiveHint | undefined;

function initializeCardHints() {
    if (activeHint && !activeHint.element.isConnected) activeHint.close();
    for (const hint of document.querySelectorAll<HTMLElement>(
        '.ss-card__badge-hint:not([data-enhanced])',
    )) {
        const tooltip = hint.querySelector<HTMLElement>('[role="tooltip"]');
        if (!tooltip) continue;
        let closeTimer: number | undefined;
        const cancelClose = () => window.clearTimeout(closeTimer);
        const close = () => {
            cancelClose();
            if (
                typeof tooltip.hidePopover === 'function' &&
                tooltip.matches(':popover-open')
            )
                tooltip.hidePopover();
            tooltip.hidden = true;
            if (activeHint?.element === hint) activeHint = undefined;
        };
        const position = () => {
            const anchor = hint.getBoundingClientRect();
            const width = document.documentElement.clientWidth;
            const height = window.innerHeight;
            if (anchor.bottom < 0 || anchor.top > height) {
                close();
                return;
            }
            const box = tooltip.getBoundingClientRect();
            const above = anchor.top - box.height - 8;
            const top = above >= 16 ? above : anchor.bottom + 8;
            tooltip.style.left = `${Math.max(16, Math.min(anchor.right - box.width, width - box.width - 16))}px`;
            tooltip.style.top = `${Math.max(16, Math.min(top, height - box.height - 16))}px`;
        };
        const show = () => {
            cancelClose();
            if (activeHint?.element === hint) return;
            activeHint?.close();
            tooltip.hidden = false;
            // The native top layer prevents clipping at the card's rounded edges.
            if (typeof tooltip.showPopover === 'function')
                tooltip.showPopover();
            activeHint = { element: hint, close, position };
            position();
        };
        const scheduleClose = () => {
            cancelClose();
            closeTimer = window.setTimeout(() => {
                if (
                    !hint.matches(':hover') &&
                    !tooltip.matches(':hover') &&
                    document.activeElement !== hint
                )
                    close();
            }, 100);
        };
        hint.addEventListener('pointerenter', show);
        hint.addEventListener('pointerleave', scheduleClose);
        hint.addEventListener('focus', () => {
            // Resolve focus scrolling before positioning, including smooth-scroll pages.
            hint.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
                behavior: 'instant',
            });
            show();
        });
        hint.addEventListener('blur', scheduleClose);
        tooltip.addEventListener('pointerenter', cancelClose);
        tooltip.addEventListener('pointerleave', scheduleClose);
        hint.dataset.enhanced = 'true';
    }
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeHint) {
        activeHint.close();
        event.preventDefault();
    }
});
window.addEventListener('resize', () => activeHint?.position());
window.addEventListener('scroll', () => activeHint?.position(), true);
document.addEventListener('astro:before-swap', () => activeHint?.close());
document.addEventListener('astro:page-load', initializeCardHints);
initializeCardHints();
// Match the existing component workshop lifecycle when Storybook replaces a story.
new MutationObserver(initializeCardHints).observe(document.body, {
    childList: true,
    subtree: true,
});
