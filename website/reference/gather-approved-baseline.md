# Approved Crystal visual baseline

**User-approved direction: September 15, 2026 · `crystal-03-balanced`.** The user explicitly approved the balanced preview as how Gather should look and feel. This is now the implementation styling requirement for Crystal, not an unresolved aesthetic proposal.

[Open the working preview](../../artifacts/gather-theme-preview.html) · [Open the preserved approval reference](../../artifacts/reference/gather-crystal-approved.html) · [Read the exact material recipes](materials.md) · [Read the complete design system](../system.md)

## What the approval establishes

Gather is a colorful, tactile social space. Its identity comes from asymmetric message bubbles, clear separation between depth levels, visibly translucent supporting surfaces, a floating glass destination toolbar, and precise, restrained details. These characteristics must survive implementation, responsive adaptation and performance work.

Crystal is the default for Web, Tauri DWA and Rust/native products, including mobile. The separately selected Native presentation retains the previously agreed platform-specific scope. The original Rolodex theme remains retired.

This approval establishes the demonstrated styling and feel. It does not imply approval of unrelated technical recommendations, a final brand mark, unseen native renderings, every inferred interview answer, or production accessibility certification. The application's production features are still specified work, not implemented services.

## Required visual characteristics

| Area | Approved requirement |
|---|---|
| Foundation | Opaque, visibly colored Mica-inspired foundation; primary and tertiary tones remain visible through the open conversation layout. Do not flatten it into a nearly uniform neutral canvas |
| Messages | Solid readable bubbles with shallow contact and ambient shadows. Incoming corner radii are 6/22/22/22px; own-message corners are 22/6/22/22px, mirrored for future RTL. Own messages use the primary-container pair |
| Supporting material | Visible Acrylic-inspired frost around the composer and appropriate overlays, with solid text wells. Preserve the contrast between translucent surroundings and opaque reading content |
| Destination toolbar | One floating glass plane, three labeled icons, an integrated primary-colored active destination, defined rim, shared label tint and the clearest floating shadow. Do not turn it into three separate glass objects |
| Depth | Messages lift from the foundation; supporting panels and composer lift farther; destination controls float above them. Modal decisions retain their own managed overlay position. Shadows, contours and surface tones work together |
| Detail | Fine boundaries, narrow highlights, deliberate optical nesting and circular person avatars. Avoid indiscriminate shine, blur on every message, or decorative effects that compete with people and conversation |
| Palette | Harbor default; Lagoon, Orchid, Rose, Ochre and Slate alternatives. Full light/dark palettes, including surfaces, must change together |
| Typography | Manrope default, Roboto and System UI alternatives. Message reading text remains 16px/24px on desktop and mobile; text scaling takes precedence |
| Interaction | Preserve the preview's clear hover, pressed, selected and focus feedback. Reference timings are 120ms press, 180ms state and 240ms spatial; platform tuning must preserve prompt feedback and respect reduced motion |
| Density | Comfortable and Compact are personal preferences. Compact reduces spacing rather than removing readable type, focus indicators or minimum target sizes |

The exact web recipes are in [crystal-recipes.json](crystal-recipes.json), with palette values in [tokens.json](../tokens.json). These are Gather-authored reference values, not vendor compositor constants. Native renderers reproduce the approved hierarchy and character through appropriate platform techniques; a CSS approximation is not a native optical specification.

## Apply the baseline across the catalog

All 70 screens, 73 components, 24 patterns and 32 flows inherit this baseline where Crystal is selected. Their existing permissions, behavior and content requirements still apply. The [component assignment table](materials.md#component-assignments-and-details) determines which material belongs to each family.

Message and group conversations preserve the approved bubbles and author hierarchy. Hubs carry the same palette, toolbar and supporting materials; a dense grouped transcript is a context-specific presentation requiring its own visual review, not permission to flatten the whole application. Profile and discovery surfaces inherit the same depth and contour language while letting community artwork remain distinct. Settings, authentication and security decisions favor stable reading surfaces while retaining Crystal's surrounding visual identity. Call controls form a single floating group; captions and consequential actions have protected contrast.

The illustrated sidebar, composer and fictional message content in the preview are visual references. Their presence does not constitute working message delivery, navigation to a backend object, or a complete rich-text editor.

## Accessibility and platform adaptation

The [strict accessibility requirement](../../delivery/accessibility.md) remains mandatory. Approval of appearance is not evidence of WCAG conformance. Normal and reduced-effect presentations must both pass applicable criteria; a compliant fallback cannot excuse an inaccessible default.

Reduced transparency removes blur and optical overlays while preserving the same shapes, readable color pairs and clear hierarchy. Forced colors use system colors and visible boundaries. Reduced motion removes spatial changes while retaining state feedback. Text enlargement, narrow viewports, keyboard navigation and assistive technology must not obscure the composer, messages or destination controls.

Do not solve a rendering or performance issue by silently replacing Crystal with the prior flat styling. First reduce costly effects on supporting surfaces while keeping palette, silhouette, contour, readable text and depth hierarchy. Record platform-specific compromises and review them with actual device captures.

## Implementation acceptance

Production Storybook must import real Gather components and the shared tokens. Visual regression references must cover incoming/own messages, composer, toolbar, cards and overlays in all six palettes and both modes, plus responsive, density, font, focus and reduced-effect states. Native clients require actual native galleries and device review. Do not record HTML specimens as implemented production components.

Review against the preserved approval reference as well as the recipes. A technically passing screenshot comparison is insufficient if the material has become visually indistinguishable, the bubbles lost their silhouette, or the elevation hierarchy collapsed. Record intentional changes as a new design revision with updated evidence; never overwrite the approval reference to conceal a regression.

The [validation report](../../validation/report.md) records checks actually performed. Existing browser and targeted contrast evidence supports this proposal iteration; full application, native, assistive-technology and arbitrary-backdrop validation remain release gates.


## Additive functional cues

The subsequent [functional-color extension](functional-color.md) adds scoped status accents and non-color selection cues while preserving this approved baseline. Its separate feedback token layer must not override the approved Crystal palette or material recipes.
