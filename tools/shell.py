"""The page shell: header, side menu and footer, in one place.

Every page renders through `document()`, so the site index below is the only
description of what the site contains. A second copy of this markup drifts,
and the navigation then points at anchors half the site does not have.
"""
import html

# The site index. Paths are relative to the site root; `document()` rewrites
# them for the page being generated. This list is the navigation, the sidebar
# and the definition of the site, and there is no second copy.
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

# Where the library sits inside the site. The library is its own folder at the
# repository root and is not part of the website, so the build copies it in
# here; `website/vendor/` is generated and ignored. On the day @prismata/core
# is installed rather than copied, this becomes 'node_modules/@prismata/core'
# and nothing else on the site changes.
CORE = 'vendor/@prismata/core'
ICON = CORE + '/assets/icon.svg'
SPRITE = CORE + '/assets/icons.svg'

# Loaded by every page. Order matters: tokens define the theme the rest reads.
BASE_STYLES = [f'{CORE}/assets/prismata-theme.css', f'{CORE}/assets/prismata.css', 'assets/site.css']
# `modality.js` (Prismata 2.10.0) starts by itself and sets `data-prismata-modality`
# on the document, which Prismata's focus rings read: a ring for the keyboard,
# none for a click. A page without it draws a ring on every click.
BASE_SCRIPTS = [f'{CORE}/assets/core/modality.js',
                f'{CORE}/assets/tokens.js', f'{CORE}/assets/prismata.js', f'{CORE}/assets/core/state.js',
                f'{CORE}/assets/core/preferences.js', f'{CORE}/assets/core/spring.js',
                'assets/motion-shaders.js', 'assets/menu.js']
# Cache-busted together, because the pill focus recipe spans both files.
CONTROLS = 'v=selection-pill-1'
DESCRIPTION = ('Prismata: a reusable design system with expressive color, tactile depth '
               'and adjustable material previews.')


def prefix_for(path):
    """How many levels up the site root is, from a page at `path`."""
    return '../' * path.count('/')


def rel(prefix, target):
    """Rewrite a site-root-relative path for a page nested at `prefix`."""
    return prefix + target


def menu(path):
    """The side menu, as Prismata pill controls.

    The current entry is marked with `aria-current="page"` and, visually, with a heavier
    label. Never a check mark, which in Prismata means validated or informational, and
    never a mark set beside the label, which offsets the very thing it points at.
    """
    prefix = prefix_for(path)
    groups = []
    for heading, entries in SITE:
        items = []
        for target, label in entries:
            current = ' aria-current="page"' if target == path else ''
            items.append(f'<a class="pr-control menu-item" href="{rel(prefix, target)}"{current}>'
                         f'{html.escape(label)}</a>')
        ident = heading.lower()
        groups.append(f'<h2 class="menu-heading" id="menu-{ident}">{html.escape(heading)}</h2>'
                      f'<div class="menu-group" role="group" aria-labelledby="menu-{ident}">'
                      + ''.join(items) + '</div>')
    return ('<nav class="site-menu pr-frost pr-scroll-frost" id="site-menu" aria-label="Sections">'
            + ''.join(groups) + '</nav>')


def document(*, title, path, content, description=DESCRIPTION, styles=(), scripts=(),
             head_extra='', tail='', footer_note='Prismata 2.0', footer_link=None,
             main_class='doc-body', skip='Skip to content'):
    """Render a complete page. `path` is where the page lives under the site root."""
    prefix = prefix_for(path)
    css = ''.join(f'<link rel="stylesheet" href="{rel(prefix, s)}">'
                  for s in list(BASE_STYLES) + list(styles))
    js = ''.join(f'<script src="{rel(prefix, s)}" defer></script>'
                 for s in list(BASE_SCRIPTS) + list(scripts))
    foot = f'<p>{html.escape(footer_note)}</p>'
    if footer_link:
        # Site-root-relative, like every other link this shell writes. A
        # page-relative link here only works for callers at a depth where the
        # two coincide.
        href, label = footer_link
        foot += f'<a href="{rel(prefix, href)}">{html.escape(label)}</a>'
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light dark">'
        f'<meta name="description" content="{html.escape(description)}">'
        f'<title>{html.escape(title if title == "Prismata" else title + " · Prismata")}</title>'
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
        f'<a class="wordmark" href="{rel(prefix, "index.html")}" aria-label="Prismata design system">'
        '<span class="mark" aria-hidden="true"><svg aria-hidden="true" focusable="false" '
        f'viewBox="0 0 24 24"><use href="{rel(prefix, SPRITE)}#prismata"/></svg></span>'
        'prismata <small>Design system</small></a>'
        '<button class="pr-control menu-toggle" type="button" id="menu-toggle" '
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
