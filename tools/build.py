"""Render the website from the specification it installed.

Every page — the overview, the playground, the motion studies and the ten
specification pages — is generated here and wrapped by `shell.py`. The
specification markdown is **not** ours: it ships inside `@crystal-ui/core` and
is read from the copy `assemble-site.mjs` places under
`website/vendor/@crystal-ui/core/docs/`. What is hand-authored here is
`website/src/overview.md` and the body fragments under `website/src/pages/`.
"""
from pathlib import Path
import json, re, subprocess, sys
import markdown
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import shell

# The library and the website are separate folders at the repository root.
# `ROOT` addresses the repository; `SITE` addresses the website, and every page
# this script writes belongs to the website.
SITE = ROOT / 'website'

# The library is a dependency, not a subproject. Its tokens, its catalogue, its
# specification sections and its theme CSS are built in the library's own
# repository and ship in the package; this repository renders what it installed
# and builds nothing of Crystal's. If a token value looks wrong here, it is
# wrong in @crystal-ui/core and cannot be corrected from this side.
subprocess.run(['node', 'tools/assemble-site.mjs'], cwd=ROOT, check=True)

# Assets the interactive pages need on top of the shared base. These lists are the
# whole definition of what each page loads, so they are kept beside each other: a page
# that silently loses one renders without error and simply stops working. `validate.py`
# fails on any asset under `assets/` that no page references, which is what catches a
# dropped entry here.
INTERACTIVE = ['assets/vendor/crystal-engines.js?v=modal-cleanup-1', 'assets/motion-catalog.js',
               # The shared preset module must load before motion.js, which reads it.
               f'{shell.CORE}/assets/core/presets.js', f'{shell.CORE}/assets/motion.js',
               'assets/motion-interactions.js']
PAGE_ASSETS = {
    'playground': {'styles': [f'{shell.CORE}/assets/motion.css'],
                   'scripts': INTERACTIVE + ['assets/site.js']},
    # The motion studies page is the suite: its own layout, the preview player and the
    # suite chrome. Without these three the page renders as unstyled, unplayable markup.
    'motion': {'styles': [f'{shell.CORE}/assets/motion.css', 'assets/motion-suite.css'],
               'scripts': INTERACTIVE + ['assets/motion-preview.js',
                                         'assets/motion-suite.js?v=pill-focus-2']},
}


def fragment(name):
    p = SITE / 'src/pages' / name
    return p.read_text().strip() if p.exists() else ''


# The specification is the library's, not the website's: it ships inside
# @crystal-ui/core and the site renders the copy it installed. Links in that
# markdown are written relative to the package — `../assets/icons.svg` resolves
# inside @crystal-ui/core wherever it sits — and the site is where they have to
# become site paths, because the package cannot know what a website calls the
# folder it put the library in.
SPEC = SITE / shell.CORE / 'docs'
LIBRARY_RELATIVE = re.compile(r'(?<=\.\./)(assets|tokens|licenses|exports)/')


def render_markdown(path):
    """Markdown to HTML, with tables wrapped so wide ones scroll rather than
    overflow the page. `md_in_html` lets a live specimen be written as plain
    HTML in the markdown source and still contain formatted prose."""
    text = LIBRARY_RELATIVE.sub(lambda m: f'{shell.CORE}/{m.group(1)}/', path.read_text())
    title = text.splitlines()[0].removeprefix('# ')
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'toc', 'md_in_html'])
    # Only wrap real document tables — a table inside an example belongs to the
    # example, and wrapping it would change what the example demonstrates.
    body = re.sub(r'<table>(?!</table>)', '<div class="cr-table-scroll"><table class="cr-table">', body)
    body = body.replace('</table>', '</table></div>')
    return title, body


built = []

# 1. The specification pages.
for p in sorted(SPEC.glob('*.md')):
    title, content = render_markdown(p)
    (SITE / 'docs' / f'{p.stem}.html').write_text(shell.document(
        title=title, path=f'docs/{p.stem}.html', content=content,
        styles=[f'{shell.CORE}/assets/motion.css'], scripts=['assets/docs.js'],
        skip='Skip to specification',
        footer_note='Crystal 2.0 · Editable specification',
        footer_link=(f'{shell.CORE}/docs/{p.name}', 'Specification source')))
    built.append(f'docs/{p.stem}.html')

# 2. The overview, which is the site's index page.
title, content = render_markdown(SITE / 'src/overview.md')
(SITE / 'index.html').write_text(shell.document(
    title=title, path='index.html', content=content,
    styles=[f'{shell.CORE}/assets/motion.css'], scripts=['assets/docs.js'],
    # Fragments never reach the server, so an inbound link to the old
    # index.html#playground anchor can only be forwarded in the page.
    head_extra='<script>if(location.hash&&/^#(playground|workbench|palettes|foundations|content-blending|supporting-materials|components|accessibility|motion|adoption|specification)$/.test(location.hash))'
               'location.replace("playground.html"+location.hash);</script>',
    footer_note='Crystal 2.0 · Meridian Digital, Inc.',
    footer_link=('verification/report.html', 'Verification')))
built.append('index.html')

# 3. The interactive pages, from hand-authored body fragments.
for name, title in [('playground', 'Playground'), ('motion', 'Motion studies')]:
    (SITE / f'{name}.html').write_text(shell.document(
        title=title, path=f'{name}.html', content=fragment(f'{name}.html'),
        styles=PAGE_ASSETS[name]['styles'], scripts=PAGE_ASSETS[name]['scripts'],
        main_class='site-main', tail=fragment(f'{name}.tail.html'),
        footer_note='Crystal 2.0 · Meridian Digital, Inc.',
        footer_link=('verification/report.html', 'Verification')))
    built.append(f'{name}.html')

print(f'Rendered {len(built)} pages through one shell, against the installed library.')
