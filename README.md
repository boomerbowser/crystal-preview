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

## The dependency, and the one thing that is not finished

```json
"@crystal-ui/core": "file:../crystal-design-system/core"
```

That path is a **local checkout**, and it is temporary. It resolves on a
contributor's disk, where the design system sits beside this repository, and
resolves to nothing anywhere else — including on Vercel. Until
`@crystal-ui/core` is published, this repository can be built and served locally
but **cannot be deployed**.

When `2.0.0` is on npm, the dependency becomes `"^2.0.0"`, `npm install` runs,
and the deployment works with no other change: `vercel.json` already declares
`installCommand: "npm ci --omit=dev"` for exactly that moment.

Until then the live site is still built from the `crystal` repository, which
still contains a copy of `website/`. **Removing it there before Vercel has been
re-based onto this repository takes the site down.** The order is: publish
`2.0.0` → push this repository → re-base the Vercel project onto it → then
remove `website/` from `crystal`.
