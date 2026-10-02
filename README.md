# Crystal preview

The documentation website for [Crystal](https://github.com/boomerbowser/crystal),
Meridian's design system. The site consumes `@crystal-ui/core` and publishes no
package of its own.

## What is in this repository

`website/` is the site and the deploy root. `tools/` builds and checks it.
`validation/` holds the visual-regression baselines, which are never served.

Crystal itself is a dependency. The tokens, the resolver, the headless core, the
stylesheets, the icons, the shaders and the eleven specification chapters are in
`@crystal-ui/core`. A wrong token value or specification sentence has to be
corrected in the library and reaches the site with the next release.

`tools/assemble-site.mjs` copies the installed library into
`website/vendor/@crystal-ui/core/`. That folder is gitignored and rebuilt on every
build, so never commit or edit anything under it. The copy is needed because a
static deployment uploads `website/` only, and `node_modules` is outside it. The
site addresses the library at a path with the same shape as the installed one.

## Running it

```
npm install
python3 -m venv .venv && .venv/bin/pip install -r tools/requirements.txt
npm run build      # assemble the library, then render every page
npm test           # the build, plus tokens, motion, documentation drift, artifacts
npm run serve      # http://127.0.0.1:4321/
```

`serve` refuses to start until the library has been assembled. A site served
without Crystal still renders, and looks like a design regression.

## The dependency

```json
"@crystal-ui/core": "^2.3.0"
```

The library comes from npm, as it does for any other consumer. The site renders
only what the published package contains.

`vercel.json` declares `installCommand: "npm ci --omit=dev"` and
`buildCommand: "node tools/assemble-site.mjs"`. The deployment installs the
library from the registry and the build copies it into `website/vendor/`.

## Checking a deployment

Locally, `assemble-site.mjs` falls back to a sibling checkout of the library when
the package is not installed. A deployment has no sibling checkout, so it is the
one build that proves the library was installed. After a deployment, request:

```
/vendor/@crystal-ui/core/assets/crystal.css
```

A `404` means the build did not run and every page renders unstyled. `npm test`
runs `tools/verify-deploy.mjs` over the assembled tree and catches the same fault
before release. It resolves every `href` and `src` as a file, the way a static
host does.

The project has Vercel Authentication turned on. An unauthenticated request to any
URL answers `302` to `vercel.com/sso-api`, so make the check from a signed-in
browser. `curl` cannot make it.

## Visual baselines

The visual check compares rendered frames with stored baselines, and the text on
a page is part of a frame. A change to page copy changes frames, so the baselines
have to be captured again on the CI runner afterwards. See
`validation/baselines/README.md`.
