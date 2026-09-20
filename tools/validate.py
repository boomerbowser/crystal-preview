"""Check local HTML links/assets, semantic references and preserved source copies."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import hashlib,json,re
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
# Pages belong to the website and nowhere else. Every link below is resolved the
# way a browser resolves it — from the page, inside `website/` — so a path that
# only works because the repository happens to sit around it fails here.
SITE=ROOT/'website'
# The library as the site serves it. This repository does not contain Crystal —
# it installs it — and what a reader's browser loads is the assembled copy, so
# that is what is checked. Validating the installed package instead would pass
# while the site served something else.
CORE=SITE/'vendor/@crystal-ui/core'
errors=[];links=0;pages=sorted(list(SITE.glob('*.html'))+list((SITE/'docs').glob('*.html'))+list((SITE/'verification').glob('*.html')))
for p in pages:
    soup=BeautifulSoup(p.read_text(),'html.parser');ids=[x['id'] for x in soup.select('[id]')]
    if len(set(ids))!=len(ids):errors.append(f'{p.name}: duplicate IDs')
    if not soup.html or not soup.html.get('lang'):errors.append(f'{p.name}: no document language')
    if not soup.find('title') or not soup.find('main'):errors.append(f'{p.name}: missing title/main')
    for el in soup.select('[href],[src]'):
        for attr in ('href','src'):
            raw=el.get(attr)
            if not raw:continue
            url=urlsplit(raw)
            if url.scheme or url.netloc:continue
            target=(p.parent/unquote(url.path)).resolve() if url.path else p
            if not target.exists():errors.append(f'{p.relative_to(ROOT)}: missing {raw}');continue
            if url.fragment and target.suffix=='.html':
                linked=soup if target==p else BeautifulSoup(target.read_text(),'html.parser')
                if not linked.find(id=unquote(url.fragment)):errors.append(f'{p.name}: missing anchor {raw}')
            links+=1
    for el in soup.select('[aria-labelledby],[aria-describedby]'):
        for attr in ('aria-labelledby','aria-describedby'):
            for ident in el.get(attr,'').split():
                if ident not in ids:errors.append(f'{p.name}: missing ARIA target {ident}')
# Every sprite symbol a page references must exist, and every icon the manifest
# names must be present. A missing symbol renders as nothing at all, which no
# link check catches because the file itself resolves.
sprite=(CORE/'assets/icons.svg').read_text()
sprite_ids=set(re.findall(r'<symbol[^>]*id="([^"]+)"',sprite))
used=set()
for p_ in pages:
    for m in re.finditer(r'href="([^"]*icons\.svg)#([^"]+)"',p_.read_text()):
        used.add(m.group(2))
        if m.group(2) not in sprite_ids:
            errors.append(f'{p_.relative_to(ROOT)}: sprite has no symbol #{m.group(2)}')
manifest_path=CORE/'assets/icons/manifest.json'
icons_checked=0
if manifest_path.exists():
    manifest=json.loads(manifest_path.read_text())
    for icon in manifest['icons']:
        if icon['source']=='crystal':
            if icon['id'] not in sprite_ids:
                errors.append(f"manifest: original symbol {icon['id']} missing from the sprite")
        elif not (CORE/'assets/icons'/f"{icon['id']}.svg").exists():
            errors.append(f"manifest: {icon['id']}.svg missing from assets/icons")
        icons_checked+=1
    if manifest['total']!=len(manifest['icons']):
        errors.append('manifest: total does not match the icon list')

# Both sides of the boundary: the library's stylesheets under core/ and the
# preview's own. A url() that resolves in one tree and not the other is exactly
# what a move like this breaks.
for css in sorted(list(CORE.glob('assets/*.css'))+list((SITE/'assets').glob('*.css'))):
    if re.search(r'(?im)^\s*<(?:!doctype|html\b)',css.read_text()):errors.append(f'{css.name}: HTML in stylesheet')
    for raw in re.findall(r'url\([\'"]?([^\)\'\"]+)',css.read_text()):
        if raw.startswith('data:'):continue
        if not (css.parent/raw).exists():errors.append(f'{css.name}: missing {raw}')
# Every top-level stylesheet and script must be loaded by at least one page. An asset
# that nothing references is either dead code or — the case this exists to catch — a
# reference dropped from a page's asset list. That failure is silent: the page still
# renders, still returns 200 and still logs nothing; it just stops working. The motion
# studies page lost its suite CSS, its preview player and its suite chrome exactly this
# way, and nothing in the build noticed.
referenced=set()
for p_ in pages:
    for el in BeautifulSoup(p_.read_text(),'html.parser').select('[href],[src]'):
        for attr in ('href','src'):
            raw=el.get(attr)
            if not raw:continue
            name=urlsplit(raw).path.rsplit('/',1)[-1]
            if name:referenced.add(name)
# Only the preview's own assets. A library asset's job is to be *exported*, not to
# be loaded by a documentation page — `core/package.json`'s exports and
# `tools/verify-package.cjs` are what hold that side. Globbing core/ here would
# report every published file the site happens not to use as dead, which is how a
# gate starts being argued with instead of obeyed.
#
# The other direction still works: the link check above resolves every path a page
# references, so a library file that moves out from under the site fails there.
for asset in sorted(list(SITE.glob('assets/*.js'))+list(SITE.glob('assets/*.css'))):
    if asset.name not in referenced:errors.append(f'assets/{asset.name}: referenced by no page')
manifest=json.loads((SITE/'reference/provenance.json').read_text())
for item in manifest['files']:
    if hashlib.sha256((SITE/item['copy']).read_bytes()).hexdigest()!=item['sha256']:errors.append('Changed source copy: '+item['copy'])
report={'scope':'Static artifact integrity; not product or complete WCAG validation','htmlPages':len(pages),'localLinksAndAssets':links,'iconsChecked':icons_checked,'preservedSourceCopies':len(manifest['files']),'errors':errors}
(SITE/'verification/artifact-checks.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(bool(errors))
