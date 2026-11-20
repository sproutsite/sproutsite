/** CSS hexadecimal colors, including the optional alpha channel. */
export function isHexColor(value: unknown): value is `#${string}` {
    return (
        typeof value === 'string' &&
        /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)
    );
}

/** Relative luminance for opaque, validated sRGB hex colours (WCAG). */
function luminance(hex: string): number {
    const value =
        hex.length === 4
            ? [...hex.slice(1)].map((digit) => digit + digit).join('')
            : hex.slice(1);
    const channels = [0, 2, 4].map((offset) => {
        const channel =
            Number.parseInt(value.slice(offset, offset + 2), 16) / 255;
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return (
        channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    );
}

export function contrastRatio(first: string, second: string): number {
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
