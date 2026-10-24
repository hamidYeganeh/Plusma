# Kuro hero assets

Source: https://kuro-coffee-template.modulify.website/

The landing hero uses the template’s original coffee and matcha photographs and
ingredient sprite sheets. Photos are self-hosted WebP files (2400 px wide);
ingredient sheets are 1800 px wide. The blue-screen ingredient artwork uses the
source template’s SVG color matrix for transparency. Icons use the same Lucide
library as the reference.

Typography inherits the app’s Vazirmatn font. All hero copy and image descriptions
come from the `LandingHero` namespace in `apps/space/messages/fa.json`, with numbers
and sample USD prices formatted through `next-intl`. Interface surfaces, text,
borders, focus rings and purple accents use the shared light/dark theme variables.
The original photograph colors are preserved.

No remotely hosted runtime assets are used. The original Latin fonts remain in
`fonts/` as reference assets; the localized hero does not load them.
