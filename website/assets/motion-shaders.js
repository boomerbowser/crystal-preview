/* Crystal's optical shader layer.
 *
 * Strictly an enhancement. Every material renders completely without this file,
 * and nothing here may change a resting appearance: shaders paint only while a
 * motion is in flight, and gate G6 proves the preview is pixel-identical when
 * WebGL2 is unavailable. If anything in here throws, the surface is left exactly
 * as the stylesheet drew it.
 *
 * The contract lives in assets/shaders/manifest.json, not here. This is the web
 * implementation of it; a platform library honours the same uniforms its own way.
 */
(function (root) {
  'use strict';

  /* Resolve from this script's own URL, not the page's.
     A page-relative 'assets/shaders/...' only works for pages at the site root:
     from /docs/materials.html it resolves to /docs/assets/shaders/... and 404s.
     Because the runtime fails quietly by design, that broke the optical layer on
     ten documentation pages without any visible symptom. Deriving the base from
     the script location works at any depth and under any origin or subpath,
     which is also what a static host serving this directory requires. */
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  const ASSET_BASE = SCRIPT_SRC ? new URL('.', SCRIPT_SRC).href : 'assets/';
  const MANIFEST_URL = new URL('shaders/manifest.json', ASSET_BASE).href;
  const SHADER_DIR = new URL('shaders/', ASSET_BASE).href;

  const VERTEX = `#version 300 es
in vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`;

  const state = { manifest: null, common: null, sources: new Map(), active: new Map() };

  const prefers = (query) => {
    try { return matchMedia(query).matches; } catch { return false; }
  };

  /* Every condition that must hold for a shader to run. Checked on attach and
     re-checked whenever the environment changes, because a user can turn
     reduced motion on while a page is open. */
  function permitted() {
    if (prefers('(prefers-reduced-motion: reduce)')) return false;
    if (prefers('(prefers-reduced-transparency: reduce)')) return false;
    if (prefers('(forced-colors: active)')) return false;
    if (document.hidden) return false;
    return true;
  }

  function webgl2Available() {
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      return !!probe;
    } catch { return false; }
  }

  const supported = webgl2Available();

  async function load() {
    if (state.manifest) return state.manifest;
    const manifest = await fetch(MANIFEST_URL).then((r) => r.json());
    /* The shared GLSL is spliced in after the #version directive, which the
       language requires to be the literal first line of the source. */
    state.common = await fetch(`${SHADER_DIR}_common.glsl`).then((r) => r.text());
    state.manifest = manifest;
    return manifest;
  }

  async function sourceFor(entry) {
    if (state.sources.has(entry.id)) return state.sources.get(entry.id);
    const body = await fetch(SHADER_DIR + entry.file).then((r) => r.text());
    const match = body.match(/^\s*#version[^\n]*\n/);
    const source = match
      ? match[0] + state.common + body.slice(match[0].length)
      : state.common + body;
    state.sources.set(entry.id, source);
    return source;
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Crystal shader failed to compile: ' + log);
    }
    return shader;
  }

  function program(gl, fragmentSource) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Crystal shader failed to link: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  /* Read the material tint from the resolved palette rather than choosing a
     colour here, so a shader can never introduce colour the token set did not
     sanction. */
  /* `--cr-companion` is the same token the shadow tint is mixed from in
     CrystalMotion.exportCSS. Refracted light and the shadow it casts have to agree
     about what colour the light is, so they read one token, not two. An earlier
     draft read `--cr-accent`, which no palette defines — every palette therefore
     refracted the hardcoded fallback, and the shaders were prism-purple regardless
     of the scheme. The fallback is kept only for a surface queried before the
     theme resolves, and is the default palette's own companion linearised. */
  /* Palette tokens are authored as hex, so a bare digit scan reads "#EF48C6" as
     the two numbers 48 and 6 and silently falls through to the default every
     time. Both notations are parsed explicitly instead. */
  function parseColour(value) {
    const text = (value || '').trim();
    const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
    if (hex) {
      const digits = hex[1].length < 6
        ? hex[1].slice(0, 3).split('').map((c) => c + c).join('')
        : hex[1].slice(0, 6);
      return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    }
    const parts = (text.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
  }

  function tintOf(element) {
    const value = getComputedStyle(element).getPropertyValue('--cr-companion')
      || getComputedStyle(document.documentElement).getPropertyValue('--cr-companion');
    const parts = parseColour(value);
    /* sRGB to linear, because the shader mixes light rather than pixels. */
    if (parts) return parts.map((c) => Math.pow(c / 255, 2.2));
    return [0.867, 0.062, 0.573];
  }

  function detach(element) {
    const entry = state.active.get(element);
    if (!entry) return;
    cancelAnimationFrame(entry.frame);
    try { entry.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* best effort */ }
    entry.canvas.remove();
    /* Put back exactly what was there, so a detached surface is indistinguishable
       from one that never had a shader. */
    element.style.position = entry.previousPosition || '';
    element.style.isolation = entry.previousIsolation || '';
    state.active.delete(element);
  }

  /* Attach a shader to a surface for the duration of one motion.
     `progress` is supplied by the caller and is expected to be spring
     displacement, not a linear ramp — that is what ties the optical layer to
     the same physics as the geometry. */
  async function attach(element, shaderId, options = {}) {
    if (!supported || !permitted()) return null;
    if (state.active.has(element)) detach(element);

    let entry, source;
    try {
      const manifest = await load();
      entry = manifest.shaders.find((s) => s.id === shaderId);
      if (!entry) return null;
      source = await sourceFor(entry);
    } catch { return null; }

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    /* Never in the content flow, never interactive, never announced. */
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', mixBlendMode: entry.blend || 'screen',
      borderRadius: getComputedStyle(element).borderRadius,
      /* Below the surface's own content. A negative z-index paints after the
         element's background but before its in-flow children, which is where an
         optical layer physically belongs: light plays on the material, not on
         the label sitting on it. Painting above the content would put a
         translucent wash over text whose contrast is verified, which is not a
         trade Crystal makes. */
      zIndex: '-1',
    });

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return null;

    let compiled;
    try { compiled = program(gl, source); } catch { return null; }

    gl.useProgram(compiled);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(compiled, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniform = (name) => gl.getUniformLocation(compiled, name);
    const locations = {
      time: uniform('u_time'), resolution: uniform('u_resolution'),
      progress: uniform('u_progress'), pressure: uniform('u_pressure'),
      contact: uniform('u_contact'), tint: uniform('u_tint'),
      intensity: uniform('u_intensity'),
    };

    /* The surface must establish a containing block for the absolutely
       positioned canvas. Recorded so it can be put back on detach. */
    const previousPosition = element.style.position;
    const previousIsolation = element.style.isolation;
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
    /* A negative z-index only stays inside this element if the element is its
       own stacking context; without isolation the canvas would sink behind the
       element's background, or further. Isolation also confines the blend to
       this surface, so a shader can never tint the page around it. */
    element.style.isolation = 'isolate';
    element.appendChild(canvas);

    /* The shader must mask itself to the surface's real shape. A fixed 0.17 of
       the short side is a rounded rectangle, and on a pill — every action control
       in Crystal is one — that painted a visible rectangle inside a stadium: a
       36px corner rendered as a 12px one. Read the computed radius instead,
       expressed in the same short-side units the geometry uses, and clamp at 0.5,
       which IS a pill. */
    const shortSide = Math.min(rect.width, rect.height) || 1;
    const corner = parseFloat(getComputedStyle(element).borderRadius) || 0;
    const radius = Math.min(0.5, corner / shortSide);

    const tint = tintOf(element);
    const started = performance.now();
    const record = { canvas, gl, frame: 0, previousPosition, previousIsolation, element,
      /* Ambient surfaces keep their own clock. Interaction advances it faster rather than
         brightening the surface, which is what "faster on press" physically means: the
         light moves quicker, it does not become more light. */
      clock: 0, last: started };
    state.active.set(element, record);

    const draw = (now) => {
      if (!permitted()) { detach(element); return; }
      record.last = now;
      const seconds = (now - started) / 1000;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(locations.time, seconds);
      gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      gl.uniform1f(locations.progress, Math.max(0, Math.min(1, progress)));
      gl.uniform1f(locations.pressure, options.pressure ?? 0);
      gl.uniform2f(locations.contact, contact?.[0] ?? 0.5, contact?.[1] ?? 0.5);
      gl.uniform3f(locations.tint, tint[0], tint[1], tint[2]);
      gl.uniform1f(locations.intensity, options.intensity ?? 1);
      gl.uniform1f(locations.radius, radius);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (options.duration && (now - started) >= options.duration) { detach(element); return; }
      record.frame = requestAnimationFrame(draw);
    };
    record.frame = requestAnimationFrame(draw);
    return { detach: () => detach(element) };
  }

  function detachAll() { for (const element of [...state.active.keys()]) detach(element); }

  document.addEventListener('visibilitychange', () => { if (document.hidden) detachAll(); });

  /* The ambient tier is deferred to a later version of Crystal. What remains is
     the optical layer for a motion a person starts, which is what `attach` is. */

  root.CrystalShaders = Object.freeze({
    attach, detach, detachAll, supported, permitted, manifestUrl: MANIFEST_URL,
  });

})(window);
