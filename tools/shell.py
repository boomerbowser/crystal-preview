"""The page shell: header, side menu and footer, in one place.

The preview previously carried four copies of this markup — the documentation
builder, the verification report and the two hand-authored pages each had their
own. They drifted, which is how the navigation came to point at anchors that
half the site does not have. Every page now renders through `document()`, so
the site index below is the only description of what the site contains.
"""
import html

# The site index. Paths are relative to the site root; `document()` rewrites
# them for the page being generated. This list is the navigation, the sidebar
# and the definition of the site, and there is deliberately no second copy.
SITE = [
    ('Start', [
        ('index.html', 'Overview'),
        ('playground.html', 'Playground'),
    ]),
    ('Specification', [
        ('docs/principles.html', 'Foundations'),
        ('docs/colors.html', 'Color'),
        ('docs/materials.html', 'Materials'),
        ('docs/components.html', 'Components'),
        ('docs/catalogue.html', 'Catalogue'),
        ('docs/icons.html', 'Icons'),
        ('docs/tokens.html', 'Tokens'),
        ('docs/motion.html', 'Motion'),
        ('docs/motion-components.html', 'Component motion'),
        ('docs/accessibility.html', 'Accessibility'),
        ('docs/adoption.html', 'Adoption'),
    ]),
    ('Evidence', [
        ('motion.html', 'Motion studies'),
        ('verification/report.html', 'Verification'),
    ]),
]

# Where the library sits *inside the site*. The library is its own folder at the
# repository root and is not part of the website, so the build copies it in
# here; `website/vendor/` is generated and ignored. The shape is deliberate: on
# the day @crystal-ui/core is installed rather than copied, this becomes
# 'node_modules/@crystal-ui/core' and nothing else on the site changes.
CORE = 'vendor/@crystal-ui/core'
ICON = CORE + '/assets/icon.svg'
SPRITE = CORE + '/assets/icons.svg'

# Loaded by every page. Order matters: tokens define the theme the rest reads.
BASE_STYLES = [f'{CORE}/assets/crystal-theme.css', f'{CORE}/assets/crystal.css', 'assets/site.css']
BASE_SCRIPTS = [f'{CORE}/assets/tokens.js', f'{CORE}/assets/crystal.js', f'{CORE}/assets/core/state.js',
                f'{CORE}/assets/core/preferences.js', f'{CORE}/assets/core/spring.js',
                'assets/motion-shaders.js', 'assets/menu.js']
# Cache-busted together, because the pill focus recipe spans both files.
CONTROLS = 'v=pill-focus-2'
DESCRIPTION = ('Crystal: a reusable design system with expressive color, tactile depth '
               'and adjustable material previews.')


def prefix_for(path):
    """How many levels up the site root is, from a page at `path`."""
    return '../' * path.count('/')


def rel(prefix, target):
    """Rewrite a site-root-relative path for a page nested at `prefix`."""
    return prefix + target


def menu(path):
    """The side menu, as Crystal pill controls.

    The current entry is marked with `aria-current="page"` and, visually, with a heavier
    label — never a check mark, which in Crystal means validated or informational, and
    never a mark set beside the label, which offsets the very thing it points at.
    """
    prefix = prefix_for(path)
    groups = []
    for heading, entries in SITE:
        items = []
        for target, label in entries:
            current = ' aria-current="page"' if target == path else ''
            items.append(f'<a class="cr-control menu-item" href="{rel(prefix, target)}"{current}>'
                         f'{html.escape(label)}</a>')
        ident = heading.lower()
        groups.append(f'<h2 class="menu-heading" id="menu-{ident}">{html.escape(heading)}</h2>'
                      f'<div class="menu-group" role="group" aria-labelledby="menu-{ident}">'
                      + ''.join(items) + '</div>')
    return ('<nav class="site-menu cr-frost cr-scroll-frost" id="site-menu" aria-label="Sections">'
            + ''.join(groups) + '</nav>')


def document(*, title, path, content, description=DESCRIPTION, styles=(), scripts=(),
             head_extra='', tail='', footer_note='Crystal 2.0', footer_link=None,
             main_class='doc-body', skip='Skip to content'):
    """Render a complete page. `path` is where the page lives under the site root."""
    prefix = prefix_for(path)
    css = ''.join(f'<link rel="stylesheet" href="{rel(prefix, s)}">'
                  for s in list(BASE_STYLES) + list(styles))
    js = ''.join(f'<script src="{rel(prefix, s)}" defer></script>'
                 for s in list(BASE_SCRIPTS) + list(scripts))
    foot = f'<p>{html.escape(footer_note)}</p>'
    if footer_link:
        # Site-root-relative, like every other link this shell writes. It used to
        # be page-relative, alone among them, and the two callers happened to be
        # at depths where that made no difference — so the inconsistency could
        # not show itself until a third caller sat somewhere else.
        href, label = footer_link
        foot += f'<a href="{rel(prefix, href)}">{html.escape(label)}</a>'
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light dark">'
        f'<meta name="description" content="{html.escape(description)}">'
        f'<title>{html.escape(title if title == "Crystal" else title + " · Crystal")}</title>'
        f'<link rel="icon" href="{rel(prefix, ICON)}" type="image/svg+xml">'
        f'{css}'
        f'<link rel="stylesheet" href="{rel(prefix, "assets/controls.css")}?{CONTROLS}">'
        f'{js}'
        f'<script src="{rel(prefix, "assets/controls.js")}?{CONTROLS}" defer></script>'
        f'{head_extra}'
        '</head><body>'
        f'<a class="skip" href="#main">{html.escape(skip)}</a>'
        '<div class="shell">'
        '<header class="site-header">'
        f'<a class="wordmark" href="{rel(prefix, "index.html")}" aria-label="Crystal design system">'
        '<span class="mark" aria-hidden="true"><svg aria-hidden="true" focusable="false" '
        f'viewBox="0 0 24 24"><use href="{rel(prefix, SPRITE)}#crystal"/></svg></span>'
        'crystal <small>Design system</small></a>'
        '<button class="cr-control menu-toggle" type="button" id="menu-toggle" '
        'aria-expanded="false" aria-controls="site-menu">Sections</button>'
        '</header>'
        '<div class="site-layout">'
        f'{menu(path)}'
        f'<main id="main" class="{main_class}">{content}</main>'
        '</div>'
        f'<footer class="site-footer">{foot}</footer>'
        '</div>'
        f'{tail}'
        '</body></html>'
    )
