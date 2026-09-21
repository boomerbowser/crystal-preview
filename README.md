# Crystal preview

The documentation website for [Crystal](https://github.com/boomerbowser/crystal),
Meridian's design system. It is a site and nothing else: it consumes
`@crystal-ui/core` and publishes no package of its own.

## What is here, and what is not

`website/` is the site and the deploy root. `tools/` builds and checks it.
`validation/baselines/` holds the visual-regression baselines, which are the one
thing here that is never served.

**Crystal is not here.** The tokens, the resolver, the headless core, the
stylesheets, the icons, the shaders and the eleven specification pages all live
in `@crystal-ui/core` and arrive as a dependency. If a token value or a
specification sentence looks wrong, it is wrong in the library and cannot be
corrected from this side.

`tools/assemble-site.mjs` copies the installed library into
`website/vendor/@crystal-ui/core/`, which is **gitignored and rebuilt on every
build** — never commit or edit anything under it. A browser cannot load from
`node_modules`, because a static deployment uploads `website/` and
`node_modules` is not inside it, so the site addresses the library at a path
shaped like the one it is installed at. That shape is the whole trick: nothing
on the site knows where the copy came from.

## Running it

```
npm install
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
npm run build      # assemble the library, then render every page
npm test           # the build, plus tokens, motion, documentation drift, artifacts
npm run serve      # http://127.0.0.1:4321/
```

`serve` refuses to start if the library has not been assembled, rather than
serving a site with no Crystal in it — which does not look broken, it looks like
a design regression.

## The dependency

```json
"@crystal-ui/core": "^2.0.0"
```

From npm, like any other consumer. That is the point of the split: this site has
no privileged access to Crystal and renders only what the published package
contains, so a specification sentence the site can show is a sentence a consumer
also got.

`vercel.json` declares `installCommand: "npm ci --omit=dev"` and
`buildCommand: "node tools/assemble-site.mjs"`, so the deployment installs the
library from the registry and the build copies it into `website/vendor/`. Nothing
about Crystal is in this repository's git history, and nothing needs to be.

## Checking a deployment

The build is the only place that proves the library is *installed* rather than
*found beside the repository on somebody's disk* — locally, `assemble-site.mjs`
would fall back to a sibling checkout. So after a deployment, the load-bearing
check is:

```
/vendor/@crystal-ui/core/assets/crystal.css
```

A `404` there means the build did not run, and every page would render unstyled.
`npm test` runs `tools/verify-deploy.mjs` over the assembled tree and catches the
same thing before it ships, because it resolves every `href` and `src` as a file
the way a static host does rather than as a path the way a filesystem does.

The project has Vercel Authentication turned on, so an unauthenticated request to
any URL answers `302` to `vercel.com/sso-api`. That is deployment protection
working as configured, and it is why the check above has to be made from a signed-in
browser rather than with `curl`.
