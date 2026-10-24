# LandingHeroSection visual QA

final result: passed

Source: https://kuro-coffee-template.modulify.website/
Implementation: http://localhost:3001/ (production build).
Scope: the interactive hero only, embedded above the existing Plusma café directory.

## Evidence

All paths below are relative to this repository root.

| View | Source visual truth | Rendered implementation | Combined comparison |
| --- | --- | --- | --- |
| Desktop | `output/design/landing-hero/source-desktop.png` | `output/design/landing-hero/implementation-desktop.png` | `output/design/landing-hero/comparison-desktop.png` |
| Mobile | `output/design/landing-hero/source-mobile.png` | `output/design/landing-hero/implementation-mobile.png` | `output/design/landing-hero/comparison-mobile.png` |

Desktop viewport and both screenshots: 1440 × 900 CSS px and image px.
Mobile viewport and both screenshots: 390 × 844 CSS px and image px.
Density: 1 screenshot pixel per CSS pixel. No rescaling was used in comparisons.
Both comparisons place the source on the left and implementation on the right.
State: page top, Coffee, Original, no open panel, floating motion paused.

Focused typography/price comparison:
`output/design/landing-hero/comparison-typography.png`.
This combines matching 600 × 250 px crops at x=420, y=630 from the desktop captures.
The flavor picker and caramel tasting notes were also compared in-browser with
source captures at 1440 × 900.

## Findings and fidelity

No actionable P0, P1, or P2 findings remain.

- **Fonts and typography:** original self-hosted Manrope and Fraunces variable
  fonts, matching weights, SOFT/WONK settings, sizes, line heights, letter spacing,
  and mobile headline wrapping. Caption, price and headline align with source.
- **Spacing and layout:** source container-relative scene and wheel geometry,
  cup crop, ingredient orbit, header dock, caption and purchase chip positions.
  Desktop and mobile combined captures confirm composition. Additional widths
  of 320, 768 and 1440 px have no horizontal page overflow.
- **Colors and tokens:** source coffee and matcha palettes are scoped to the
  hero, including cream text, dark glass controls and accent colors. The rest of
  Plusma retains its existing theme and RTL direction.
- **Image quality:** all twelve original scene photographs and both original
  ingredient sprite sets are self-hosted and compressed to WebP. No substitute
  drawings or generated artwork. Transparency uses the original source matrix.
- **Copy and content:** original hero, flavors, descriptions, notes, prices and
  caffeine values. Existing Persian directory content remains below the hero.

Expected differences: the template's “Made in Modulify” platform badge is omitted.
The full-screen menu links to Coffee, Matcha and the existing café directory,
instead of linking to unimplemented sections of the template's full page.
Small ingredient pose differences reflect the animation phase at pause time.

## Interaction verification

Verified in the in-app browser:

- Flavor picker selection and changing scene, label, price and ingredient orbit.
- Coffee/Matcha switching with original imagery and palette.
- Tasting notes, adding a drink, quantity increase/decrease, subtotal and clearing.
- Pause/play, keyboard arrows and Escape dismissal with focus restoration.
- Horizontal pointer swipe and sticky scroll-driven flavor transitions.
- Modal menu, close control, focus containment and navigation to the café directory.
- Existing café cards remain accessible, and the directory still renders RTL.
- Reduced-motion rules disable nonessential animations and transitions.

Fresh production console inspection returned no warnings or errors.

## Comparison history

1. Initial browser check found P1 missing styles: the repository's generic CSS
   loader treated the module as plain CSS, leaving its class exports undefined.
   Replaced the module with consistently namespaced CSS and guarded initial
   zero-height scroll measurements. Re-captured desktop and mobile and compared
   both pairs together. Missing controls and layout are resolved.
2. P2 mobile compact switch used the leaf icon when switching back to coffee.
   Fixed the icon to follow the destination drink. Matched the source's pour
   reveal and wheel entrance, and eagerly loaded ingredient artwork. Rebuilt and
   verified the final production state. Latest evidence is the combined captures
   listed above, without development toolbar overlays.

The 12ui target conversion and image-based alignment kit were reviewed in
`/tmp/plusma-hero-design` and `/tmp/plusma-hero-restore`. The latter is an unanchored
visual reference, not a DOM coverage check. Original source photographs and sprites
take precedence over its screenshot-extracted layers; every depicted raster layer
is already supplied by those originals. Browser QA supplies the final comparison.

## Validation

- `npm run build --workspace space`: passed, including TypeScript and prerendering.
- `npm run lint --workspace space`: passed.
- `npm run check-types --workspace space`: passed.
- `npm test --workspace space`: all 14 existing tests passed.
- `git diff --check`: passed.

## Implementation checklist

- [x] Reusable `LandingHeroSection` mounted on `/`.
- [x] Original assets and fonts self-hosted.
- [x] Desktop/mobile source comparisons reviewed together.
- [x] Primary interactions verified in a rendered browser.
- [x] Café directory preserved and linked from the hero menu.
- [x] Production build and existing checks pass.

## Follow-up polish

No blocking visual refinements remain. Reduced motion is verified through the
CSS rule; an OS-level reduced-motion preference was not changed during testing.
