# Crystal material and component specification — balance 03

**User-approved visual baseline, September 15, 2026.** The [approved styling contract](approved-baseline.md) defines its scope and implementation acceptance. This revision balances the earlier expressive Crystal appearance with the [74-question aesthetic recommendations](decisions.md), following the user’s request to restore color, translucency, elevation and asymmetric messages. Numeric recipes below are Gather’s approved web reference values, not published Apple/Microsoft constants. The examples implement local presentation; they do not implement native compositors, physical refraction or application services.

## What the source systems actually specify

**Mica:** Microsoft describes an opaque window foundation influenced by wallpaper and theme. It is not a transparent pane showing other windows. Native Mica has platform-managed focus and fallback behavior. Gather’s browser approximation uses a fully opaque, softly tinted base and never reads the desktop. [Microsoft Mica guidance](https://learn.microsoft.com/en-us/windows/apps/design/style/mica).

**Acrylic:** Microsoft distinguishes background Acrylic from in-app Acrylic. Its recipe combines blur, a contrast-oriented blend, tint and noise. Its guidance favors transient/supporting surfaces and cautions against adjacent or stacked Acrylic panes; fixed vertical content regions generally use opaque fills. Gather uses “in-app Acrylic” for the foreground role you requested. [Microsoft Acrylic guidance](https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic).

**Liquid Glass:** Apple separates functional navigation/controls from content. Its regular variant supports legibility; clear glass is reserved for suitable media-rich backgrounds. Gather therefore concentrates its glass treatment in the floating destination toolbar and relevant call controls. [Apple Materials HIG](https://developer.apple.com/design/human-interface-guidelines/materials).

**Optical behavior:** Apple’s material combines adaptive highlights, shadows, lensing and response to interaction. Blur alone does not reproduce it. The current web example implements a restrained visual approximation with a defined contour, tint, highlight and shadow; it does not claim the native adaptive rendering or lensing. [Apple, Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/).

**Supporting structure:** Fluent also uses solid content surfaces and a dimming smoke layer for modal focus. Those quiet supporting materials are part of the proposed Crystal system. [Fluent material roles](https://fluent2.microsoft.design/material). Shadows and contours communicate elevation; use them in proportion to the relationship being expressed, not as decoration on every row. [Windows elevation guidance](https://learn.microsoft.com/en-us/windows/apps/design/signature-experiences/layering).

Official sources were checked September 15, 2026. Local Fluent and liquid-glass-react developer references helped identify implementation pitfalls; they do not confer vendor conformance on this proposal.

## Composition and deliberate departures

From back to front: **opaque Mica-inspired foundation → solid reading/content layer with selective in-app Acrylic → Liquid Glass-inspired functional layer**. The three named materials remain the identity, but not every component must exhibit all three. A typical resting screen shows a colored opaque foundation through the open conversation plane, solid lifted message bubbles, a visibly frosted composer surround, and a distinctly elevated glass toolbar. The foundation remains opaque; its visible color is not desktop transparency.

Gather combines systems that were not specified as one interoperable design system. The composer surround is an intentional hybrid exception: it is persistent but can overlap scrolling content, so it uses restrained in-app frost around an opaque writing well. Fixed conversation/channel sidebars use solid tonal fills with a more colorful selected row. Busy Hub transcripts retain the proposed flatter density; the proposal’s reusable chat scene illustrates the personal-message treatment, not that final dense transcript. Menus, popovers and overlaid drawers use Acrylic; text-heavy or consequential dialogs use solid surfaces. The selected toolbar segment shares its parent’s material and adds a tint instead of stacking glass on glass.

The web cannot sample an OS wallpaper without a separate authorized mechanism; no such mechanism is proposed. A future user-selected in-app wallpaper can influence a cached color treatment. Browser code also must not capture a screen, duplicate conversation text into a canvas or fetch private attachments solely to fabricate refraction. Native implementations use supported system APIs where suitable, with documented custom-renderer boundaries elsewhere.

## Named material recipes

All values below are authored web reference values for the approved baseline. Use semantic palette roles rather than fixed light-mode colors. The paired light/dark values are also stored in [crystal-recipes.json](crystal-recipes.json); the builder emits the CSS recipe variables from that file.

| Role | Light / dark recipe | Use and limitation |
|---|---|---|
| Foundation | Fully opaque container; tertiary gradient contribution 36% / 20%, primary-container contribution up to 68%; no backdrop blur | One root per scene/window. A transparent conversation layout exposes this controlled background; no live desktop transparency |
| Content | Solid lowest-container in light / low-container in dark; outlined edge and shallow contact/ambient shadow | Personal messages use asymmetric corners; own messages use primary-container/on-primary-container. No message blur or grain |
| Acrylic | Surface tint 58% / 54%; blur 24px; saturation 145%; grain opacity 3.5% | Composer surround, popover, overlay drawer. No adjacent frosted tiles and no separate blur on each message |
| Glass regular approximation | Surface tint 48% / 44%; blur 20px; saturation 165%; narrow inner light and lower contour | Floating navigation/control cluster. More defined perimeter, protected labels; no claimed refraction |
| Selected control | Solid primary/on-primary fill, shared highlight and a small contact shadow | Stronger active destination; no independent backdrop filter |
| Opaque fallback | Solid surface-container and semantic outline; all blur, grain and specular overlays removed | Reduce transparency, unsupported effects, relevant OS settings/performance constraints |
| Modal smoke | Translucent dark scrim; solid dialog above it | User focus and blocking context; not a reading surface |

A tint percentage is one layer’s blend contribution, not a promise of native compositor opacity. The browser does not reproduce Microsoft’s exclusion-blend pipeline. The new recipe restores visible translucency around protected text: the composer has solid writing and formatting wells; the dock uses a single inset 68% content-tint veil behind its labels, above the translucent outer material. The comparison board uses solid label backing. No whole-element opacity is applied to text. If closer compositing is pursued in native/custom rendering, test the whole composite before accepting it. Never apply whole-element opacity to content and icons just to tune a material.

## Foundation tokens and optical detail

Retain the six existing seed palettes. The default Harbor seed is `#4669B2`; representative Harbor light semantic values are surface `#FAF8FE`, on-surface `#30323A`, primary `#4B5E8B`, secondary-container `#DBE2F9` and on-secondary-container `#4A5164`. These are distinct token roles, not five unrelated decoration colors. Light/dark palettes and authored material recipes resolve separately.

Use 1px boundaries for ordinary surfaces and a 3px focus ring with a 2px gap. Glass adds a small upper/inner highlight and a subtle lower contour. Decorative optical lines do not replace the contrast requirement for identifying a control. Test focus and selected states independently of edge shine. Grain is confined to the supporting material and kept away from message bodies. The floating toolbar gets the strongest contact-plus-ambient shadow; personal messages regain a shallower paired shadow so they lift visibly from the colored foundation. Dark mode combines brighter contours and tinted surfaces with shadow, so elevation does not rely on black shadow alone.

Four named depth roles retain visibly distinct depths without treating old Material elevation numbers as Crystal rules: **base, content, floating, modal**. The existing numeric elevation array remains a legacy palette-generation artifact until consumers migrate; Crystal recipe names are authoritative. Depth is not z-index. Retain the managed overlay stack in the main design-system specification.

Default type is Manrope in the approved baseline; Roboto and system UI remain choices. Reading body is 16px/24px even on phones. Headings use 600–700 weight; labels use 500–600; metadata uses 400–500. Avoid tracked capitals in ordinary app UI. Keep line length near 60–72ch for messages and documents, and do not justify paragraphs. The proposal’s catalog labels are documentation furniture, not prescribed product microcopy.

The spacing scale remains 4-based. Radii are role-specific: 12px fields, 6px/22px asymmetric message corners, 20px supporting panels, 24px composer surrounds and 28px large overlays, with capsule controls and circular person avatars. These are reference values; platform adaptations must preserve the approved shapes and optical nesting. An outer radius should account for its padding before deriving an inner radius.

The authored elevation tokens pair contact and ambient shadows: messages at 2px/7px offsets (3px/15px blur), support panels at 3px/14px (5px/28px blur), floating controls at 4px/20px (7px/40px blur), with separate light/dark shadow colors. Modal decisions retain the managed overlay stack. These are approved web reference values, not native elevation units. Stronger dark text roles are used for labels exposed directly to the colored foundation; small text does not depend on a low-contrast muted role there.

## Component assignments and details

| Component family | Material and construction | Required definition and behavior |
|---|---|---|
| App frame and title area | One opaque foundation | Preserve OS window controls, drag regions, safe areas and contrast; no wallpaper permission implied |
| Messages list / Hub channel pane | Solid tonal region | Selection fill and icon/shape cue, stable unread count, clear local title; overlay variant may use Acrylic |
| Destination toolbar | One regular-style glass surface | Three icons plus labels, shared inset label veil, primary-colored selected segment, visible boundary, 44–48px targets, distinct keyboard focus; no content obstruction |
| Timeline / long document | Open colored conversation plane; solid document reading surface | Stable baseline and measure, author grouping, explicit unread divider, no blur per row |
| Personal message | Solid outlined surface with shallow elevation | 16px reading text; incoming corners 6/22/22/22px, own-message corners 22/6/22/22px (mirror in RTL); stronger own-message color. No per-bubble blur or decorative shine |
| Busy Hub message | Flat transcript/grouped rows | Individual message actions remain discoverable by pointer, touch and keyboard; no hover-only ownership or timestamp access |
| Composer | Acrylic surround, solid writing well | Persistent editable area boundary, source control only for author, grouped formatting actions, clear send/disabled state; prototype remains a labeled specimen |
| Reply / quotation / callout | Solid inset support | One rule or semantic icon as needed; preserve attribution and nested reading order; document exception follows existing Markdown spec |
| Reaction / mention / role chip | Solid or high-tint secondary role | Selected outline/fill plus semantic state, legible count, no tiny text or blur |
| Hub discovery card / profile card | Solid content, original artwork | Artwork carries identity; invitation, maturity and privacy states remain plain and unambiguous |
| File / photo / video / GIF message | Independent solid frame | Correct attachment-message semantics, captions, loading/error state and sensitive-content mask applied before rendering |
| Search and inline field | Solid well with outline | Persistent label, clear focus, error text and appropriate clear action; no placeholder-only label |
| Menu / picker / overlaid drawer | In-app Acrylic container | Opaque backing behind dense text if needed, aligned labels/icons, current selection and keyboard focus; dismiss and restore focus |
| Modal / encryption / delete decision | Solid raised surface over smoke | Explicit title, scope and actions; no transparent serious consequence copy; focus containment and safe cancellation |
| Call controls / mini call | One floating group | On/off text/icon state, readable leave action and protected caption support; no raw media changes |
| Avatar / presence | Circular person image, simple status cue | Presence has accessible text and shape differentiation; no implication that presence proves encryption or identity |
| Tabs / segmented selection / switch | Shared surface with thin state overlay | No glass nested on glass; focus, hover, pressed and selected remain separate |
| Toast / banner / progress / empty state | Solid semantic support | State-specific text; real progress only; no shimmer needed to convey progress; no fake delivery |
| Tooltip / helper / keyboard hint | Solid small support | Short readable text, accessible trigger/dismissal, does not obscure target |
| Settings / moderation / data tables | Solid task surface | Dense review stays legible; material is around the task, not a filter over evidence; retain existing permission and privacy rules |

This mapping supplements every corresponding component entry, rather than introducing an alternative component library. The full state matrix still includes resting, hover, focused, pressed, selected, disabled, pending, success, error, offline and denied states where applicable. Static component boards illustrate states and are labeled as such; only actual local controls claim interaction.

## Responsive and interaction contract

Use a clear hierarchy: destination context at the top, local supporting navigation where width permits, conversation in the center, authoring at the bottom, destination toolbar separated below. Alignment follows the reading direction. No device is forced to show a desktop sidebar beside a cramped transcript.

At narrow widths the local pane becomes a separate list/sheet. The toolbar may expand to a full-width labeled surface when large text no longer fits. Keyboard display can move it out of the authoring area with a predictable return. These interactions remain real-client gates, not implemented behavior of the static scene. Keep dock and composer insets distinct and account for system gesture/navigation safe areas.

Interaction timing candidates: press 100–140ms; state changes 160–200ms; opening/reflow 220–280ms. The CSS lab demonstrates restrained hover/press/focus feedback only. It has no background animation or physics engine. Reduced motion removes spatial changes while preserving semantic state. Respect device accessibility overrides; forced-color mode removes material effects and uses system colors. Do not depend on an unavailable browser battery/energy API to promise adaptive performance control.

## Component ownership and third-party effects

Keep Gather-owned visuals and React Aria web interaction primitives. The existing Tiptap/ProseMirror and platform UI proposals continue unchanged. No new runtime dependency is introduced by this material refinement.

The supplied local liquid-glass-react reference identifies it as a web effect, not Apple’s compositor or a complete accessible UI kit. It is an optional implementation-spike candidate only. Inspect current source and license, preserve actual button semantics, and benchmark supported webviews before any adoption. A custom shader or third-party effect must not capture private content, expand browser permissions, compromise text or become required to navigate Gather.

## Acceptance and implementation boundary

The [strict latest-WCAG release policy](../../delivery/accessibility.md) is mandatory and takes precedence over every material recipe. AA is the recommended minimum; normal as well as reduced-effect presentations must pass.

| Check | Required evidence | Current scope |
|---|---|---|
| Recipe consistency | Light/dark variables generated from the JSON source; local links and schemas valid | Proposal build/static validation |
| User controls | Mode, six palettes, fonts, compact spacing, reduce transparency and reset affect actual styles | Local JavaScript browser examples; documented observed checks |
| Material separation | Foundation fully opaque; reading bodies unfiltered; Acrylic and glass visually distinct | Browser comparison board and scene review |
| Narrow layout | 320px and 390px examples have no horizontal page overflow; controls remain reachable | Browser viewport checks, not physical phone certification |
| Backdrop contrast | Text 4.5:1, essential controls/focus 3:1 where required over black/white/pattern/media; all palettes/modes | Existing semantic pairs plus future exhaustive composite test matrix; semantic checks alone are insufficient |
| Accessibility | Keyboard/assistive flows, 200% text, 400% zoom, forced colors, reduced motion/transparency | Requires full production-component and native-client review |
| Performance | No per-message filters; test timeline scrolling, live video, integrated GPU and battery-sensitive devices | Static architecture constraint now; actual performance measurements later |
| Native fidelity | Platform API/material versions, inactive states, platform accessibility and hardware captures | Future native implementation gate |
| Privacy | Sensitive masks precede effects; no capture/readback service added for optics | Architectural constraint and future security review |

The site laboratory and standalone refined preview share the same authored recipes and JavaScript runtime. Appearance controls, navigation, source disclosure and the local dialog are interactive; no backend service is represented as implemented. The former script-free experiment is archived as historical evidence. Pixel-perfect equality across browser engines or operating systems is not claimed. The package preserves older screenshots and test records as historical evidence rather than relabeling them as results from this revision.


## Balance-03 comparison and evidence

Compare the [earlier Crystal screenshot](../../artifacts/screenshots/crystal-dark-desktop.png) with the [archived refinement-02 preview](../../artifacts/history/gather-theme-preview-refinement-02.html), then open the [current JavaScript preview](../../artifacts/gather-theme-preview.html). The current design restores the older visual character while preserving the newer material distinctions and interaction details. [Dark desktop](../../artifacts/screenshots/crystal-balance-desktop-dark.jpg) and [light mobile](../../artifacts/screenshots/crystal-balance-mobile-light.jpg) captures document this iteration.

The targeted composite model checks 36 palette/mode/role cases, including the bounded foundation and shared glass-label veil, at a minimum modeled ratio of 5.01:1. This supplements the existing semantic-pair validation; it is not full WCAG conformance or an exhaustive rendering audit. Arbitrary user images, media, native renderers and all interaction states still require the specified release testing.
