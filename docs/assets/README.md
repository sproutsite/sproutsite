# Illustration style and asset records

The maintainer approved the getting-started and refreshed showcase illustrations on 2026-11-18 and confirmed the closer, light-background website-guide series on 2026-11-19. That latest series is the current approved standard: prominent foreground subjects, a pale upper wall around `#d9e3eb`, and a defined navy-to-teal wave fading softly into the floor. Use this style for future Sproutsite overview and card illustrations unless a different direction is explicitly requested. Keep new images consistent with this family rather than developing a new style for each topic.

This guidance concerns editorial illustrations. It does not replace the existing SVG logo, Lucide icons, screenshots or photographs, and does not authorize unrelated asset replacements.

## Approved references

- [Buttons](../../src/content/pages/showcase/_assets/buttons.png): the primary reference for the pale upper wall, defined wave crest and close foreground composition, clarified by the maintainer on 2026-11-19. These brightness and framing rules take precedence over darker or more distant examples below.
- [Your website](../../src/content/pages/documentation/getting-started/_assets/your-website.png) and [contributing](../../src/content/pages/documentation/getting-started/_assets/contributing.png): the original approved pair.
- [Cards](../../src/content/pages/showcase/_assets/cards.png), [icons](../../src/content/pages/showcase/_assets/icons.png) and [navigation](../../src/content/pages/showcase/_assets/navigation.png): examples of the coordinated showcase family.
- [Typography](../../src/content/pages/showcase/_assets/typography.png): an example with additional room around the subject for responsive cropping.

Inspect these actual images before generating another illustration. Earlier bright cobalt-and-coral images are not the reference for new work.

## Visual treatment

- Use soft, polished 3D illustrations with rounded white UI panels, gently beveled edges and smooth matte surfaces resembling clay or ceramic.
- Build a clear subject around the page topic: a browser, content cards, modular layers or a recognizable component. Prefer one compact group over scattered decorative objects.
- Use soft studio light from the upper left, delicate contact shadows and restrained depth. Avoid harsh reflections, chrome, heavy shadows, neon, glow and glassmorphism.
- Use a light cool-gray-blue studio wall around `#d9e3eb` above the wave, with a subtle pale gradient. Do not fill the upper background with dark navy. A low rounded white plinth connects the object group to the scene.
- Match the [buttons illustration](../../src/content/pages/showcase/_assets/buttons.png): a broad navy-to-teal wave has a clear organic upper crest against the pale wall and fades softly downward into the light studio floor. The upper edge may be more defined than the lower fade. Avoid narrow floating ribbons with a second hard lower outline. The maintainer clarified this reference on 2026-11-19.
- Keep the mood calm, professional and approachable. Avoid people, robots, confetti and unrelated floating shapes.
- Keep images language-neutral: use placeholder bars instead of words. Isolated letterforms are appropriate for typography illustrations. Do not generate product wordmarks or substitute artwork for existing logos or icon components.

## Palette

Use these as starting points and check the current theme tokens before generating assets. Lighting may create lighter and darker shades; it should not shift the family toward saturated royal blue or orange.

| Role                      | Starting colors      |
| ------------------------- | -------------------- |
| Navy and deep background  | `#0B1F3A`, `#071A36` |
| Muted primary blue        | `#134B70`            |
| Petrol and teal           | `#0F766E`            |
| Restrained cyan highlight | `#70C6DF`            |
| Pale surfaces             | `#F5F7FA`, `#FFFFFF` |

Green is a small organic accent, such as a leaf or a detail within a thumbnail. It must not dominate the image. Avoid coral, vivid orange, bright cobalt and fluorescent green as large surfaces.

The semantic palette is maintained in [theme.css](../../src/themes/default/styles/theme.css); additional brand and hero tokens live in [tokens.css](../../src/themes/default/styles/foundation/tokens.css).

## Composition and responsive crops

- Generate landscape overview illustrations at approximately 16:9. Preserve portrait source images where a format demonstration needs them.
- Show the topic prominently and close to the camera, like the buttons reference, rather than as a small object in a large empty studio. As a starting point, the foreground group occupies roughly 76–83% of image width and 67–73% of height, with a small breathing margin. Enlarge the actual topic, not just its plinth.
- The current Card component uses a fixed-height cover crop; a wide, single-column tablet card can crop much more vertically than a desktop card. Keep essential symbols in the central crop and inspect the actual result. The earlier 45–50% whole-subject framing made the illustrations too distant and is superseded by the closer composition requested on 2026-11-19.
- Review desktop, tablet and mobile at 1440, 768 and 375 pixels. Check clarity at thumbnail size, unintended clipping and horizontal overflow. Prefer reframing an illustration over changing the shared card layout to accommodate it.
- Keep related illustrations consistent in palette, lighting, material and perspective. They should depict distinct subjects without becoming identical copies.

## Integration and provenance

- Store final assets in the relevant content directory's `_assets/` folder. Do not reference a generator's private output directory from project content.
- Use existing image-aware components so Astro can optimize the images. Supply accurate English and German alternative text when both language versions exist.
- Record the tool, date, full prompts, output paths and any image inputs or later edits in a topic-specific file here. Keep licensing and provenance references in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) accurate; a generation record is not itself a license grant.
- Replace existing assets only when requested. Check shared examples and Storybook imports before removing or renaming files.

## Generation records

- [Your-website guide illustrations](your-website-images.md)
- [Documentation and blog background refinements](background-wave-refinements.md)
- [Blog illustrations](blog-images.md)
- [Documentation overview illustrations](documentation-images.md)
- [Getting-started illustrations](getting-started-images.md)
- [Showcase illustrations and framing refinements](showcase-images.md)
