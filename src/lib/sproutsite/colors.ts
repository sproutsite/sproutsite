/** CSS hexadecimal colors, including the optional alpha channel. */
export function isHexColor(value: unknown): value is `#${string}` {
    return (
        typeof value === 'string' &&
        /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    );
}
