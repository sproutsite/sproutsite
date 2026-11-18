# Documentation and blog background refinements

Edited on 2026-11-18 with OpenAI’s built-in image-generation tool. The maintainer requested matching the broad atmospheric background wave in the showcase illustrations, replacing the sharply bounded ribbons in the documentation and blog overview images. All fourteen existing illustrations were inspected in a contact sheet; the documentation content image was also inspected individually before the initial edit. Its edited output was reviewed before applying the same prompt to the remaining images. Each edit used its original illustration as image 1 and the existing first-party `src/content/pages/showcase/_assets/cards.png` as image 2 (background style only). Foreground subjects, framing and palette were to be preserved. Final files retain their original paths for both locales. No external reference artwork was introduced. This record documents provenance rather than granting a separate artwork license.

## Shared edit prompt

```text
Edit image 1 only. Image 2 is the approved BACKGROUND STYLE REFERENCE, not content to copy. Preserve image 1's entire foreground subject, all UI objects, sizes, arrangement, colors, small plant, white plinth, lighting, landscape aspect ratio and framing. Change ONLY its background wave. Replace the hard-edged thin ribbon with the SAME broad atmospheric sculpted navy-to-teal landscape backdrop seen in image 2: a soft organic upper crest, substantial color mass flowing behind the objects, softly varying blue/petrol depth, and a very gradual diffuse transition into the pale gray studio floor towards the bottom. Crucial: the wave has NO visible lower outline, NO cutout ribbon lower edge, NO second sharp boundary, NO floating narrow stripe; it fills the area below its crest and dissolves naturally into the lit floor. Navy #0B1F3A to muted blue #134B70 to teal #0F766E, restrained cyan. Keep calm matte 3D studio appearance, subtle atmospheric depth without glow or blur on foreground. Do not zoom, add objects, text, logos or change content.
```

## Inputs and outputs

Each path below is both the original edit target and the final output. The source SHA-256 identifies the image before this background refinement. The common style reference is `src/content/pages/showcase/_assets/cards.png`.

| Target and output                                             | Source SHA-256                                                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/content/pages/documentation/_assets/content.png`         | `4b7834d8f0804568da7b949266993eb07938c994a5aafa90af0fdd2154267ec1` |
| `src/content/pages/documentation/_assets/deployment.png`      | `c93c5458011b9f972babe21b8efd4cb53860bba252732a0c1eee9a46b7c6829b` |
| `src/content/pages/documentation/_assets/checks.png`          | `42a11deb88b9ff279a4cc968aed2a16c7b680e4b7fd35337d797f0ea457dd75d` |
| `src/content/pages/documentation/_assets/getting-started.png` | `e4e16c359875ac864a82c96fcd1f668f27bcc09d249043330114299241c79e43` |
| `src/content/pages/documentation/_assets/layout.png`          | `c07fc1c48d27634a5e28ebd481422ff88f21709dbe224e2c31025a777ba47ed3` |
| `src/content/pages/documentation/_assets/package.png`         | `f6e6f0a4df39750b6ae3dc34df4cfb975a6c078c735e2b5e28461143deb30149` |
| `src/content/pages/documentation/_assets/storybook.png`       | `82d6815820b9cffda4149955a21368cdfb6043fb8ea743078d6f37cef7a4853b` |
| `src/content/pages/documentation/_assets/theme.png`           | `8078bf8ecdc7d1cb6970e6a0d52744af4d9bf7574ed5cdb304f3609cb308cb28` |
| `src/content/blog/_assets/content-collections.png`            | `02b4f6b2f7710eebc6910e29bd0b46232588fcc2815b754eacf3d5719ebb5ab6` |
| `src/content/blog/_assets/apache-2-license.png`               | `c4eb91741d3526ff5d4cf95ce68f4b74ab13455da2f1ebf721b47d6ae760cb34` |
| `src/content/blog/_assets/project-foundation.png`             | `c3cc17078e2def6d0508a37b5ba4c3c4c50cf068bf577d72b0b44aae8e0ba8bf` |
| `src/content/blog/_assets/sproutsite-brand.png`               | `9f95050751da1d6af2077bf4b7d06edca3fda5ae27b26cae5782ffebb75e8890` |
| `src/content/blog/_assets/component-system.png`               | `5ce8c4f43da74119c9edf117b684dab3aca5b2c21cc6e8e12c265dcc12c64f72` |
| `src/content/blog/_assets/quality-workshop.png`               | `c53e541c4cd2b1f984402ff38821b65e4cb0de0fd28f2cbf2b63a22b2d727fbe` |
