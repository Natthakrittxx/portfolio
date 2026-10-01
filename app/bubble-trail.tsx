"use client";

import { useEffect, useRef } from "react";

// Cursor trail as tinted liquid glass. A small GPU fluid simulation (after Pavel Dobryakov's
// WebGL-Fluid-Simulation, MIT) pushes a "thickness" field around; the display pass fills it with the
// theme accent as ink, then reads it as a glass surface and lights it: a highlight on the side facing
// the light, a soft shadow on the far side, a rim where it's steep. Nothing is painted where there is
// no glass.
// ponytail: WebGL can't see the DOM, so the glass lights and shades the page but doesn't bend the
// text under it. Real refraction would need the page as a texture.
const CONFIG = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1024,
  DENSITY_DISSIPATION: 3.5, // how fast the glass thins out: gone in about 4.4 / this seconds
  VELOCITY_DISSIPATION: 3, // how fast the swirl calms down
  PRESSURE: 0.1,
  PRESSURE_ITERATIONS: 20,
  CURL: 1,
  SPLAT_RADIUS: 0.2,
  SPLAT_FORCE: 3500,
  SPLAT_AMOUNT: 0.08, // glass added per frame of movement
  INK_OPACITY: 0.25, // accent ink at full thickness; 0 = clear glass
  IDLE_MS: 3000, // stop the loop this long after the last move (keep it past the fade-out)
};

const VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform vec2 texelSize;
out vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const frag = (body: string) => `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
${body}`;

const SHADERS = {
  scale: frag(`
    uniform sampler2D uTexture;
    uniform float value;
    void main() { o = value * texture(uTexture, vUv); }`),
  splat: frag(`
    uniform sampler2D uTarget;
    uniform float aspectRatio, radius;
    uniform vec3 color;
    uniform vec2 point;
    void main() {
      vec2 p = vUv - point;
      p.x *= aspectRatio;
      o = vec4(texture(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.0);
    }`),
  advection: frag(`
    uniform sampler2D uVelocity, uSource;
    uniform vec2 texelSize;
    uniform float dt, dissipation;
    void main() {
      vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
      o = texture(uSource, coord) / (1.0 + dissipation * dt);
    }`),
  divergence: frag(`
    uniform sampler2D uVelocity;
    void main() {
      float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x;
      float T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
      vec2 C = texture(uVelocity, vUv).xy;
      if (vL.x < 0.0) L = -C.x;
      if (vR.x > 1.0) R = -C.x;
      if (vT.y > 1.0) T = -C.y;
      if (vB.y < 0.0) B = -C.y;
      o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`),
  curl: frag(`
    uniform sampler2D uVelocity;
    void main() {
      float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
      float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
      o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }`),
  vorticity: frag(`
    uniform sampler2D uVelocity, uCurl;
    uniform float curl, dt;
    void main() {
      float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x;
      float T = texture(uCurl, vT).x, B = texture(uCurl, vB).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force = force / (length(force) + 0.0001) * curl * texture(uCurl, vUv).x;
      force.y *= -1.0;
      o = vec4(clamp(texture(uVelocity, vUv).xy + force * dt, -1000.0, 1000.0), 0.0, 1.0);
    }`),
  pressure: frag(`
    uniform sampler2D uPressure, uDivergence;
    void main() {
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
      float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      o = vec4((L + R + B + T - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
    }`),
  gradient: frag(`
    uniform sampler2D uPressure, uVelocity;
    void main() {
      float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x;
      float T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
      o = vec4(texture(uVelocity, vUv).xy - vec2(R - L, T - B), 0.0, 1.0);
    }`),
  // The glass. Height saturates (1 - e^-4h) so a slow, heavy trail and a fast, thin one read as the
  // same material. Three premultiplied layers, each laid over the last: accent ink as thick as the
  // glass, a shaded side and rim in blue-black, a specular glint and lit side in white. On dark paper
  // broad shading reads as oil or chrome, so there it mostly drops out and thin bright lines on the
  // steep edges carry the glass.
  display: frag(`
    uniform sampler2D uTexture;
    uniform float dark, inkOpacity;
    uniform vec3 ink;
    float height(vec2 uv) { return 1.0 - exp(-4.0 * texture(uTexture, uv).x); }
    void main() {
      float h = height(vUv);
      vec3 n = normalize(vec3((height(vL) - height(vR)) * 40.0, (height(vB) - height(vT)) * 40.0, 1.0));
      vec3 light = normalize(vec3(-0.5, 0.6, 1.0));
      vec3 halfway = normalize(light + vec3(0.0, 0.0, 1.0));
      float facing = dot(n, light) - light.z; // 0 on flat glass, + toward the light, - away
      float spec = pow(max(dot(n, halfway), 0.0), mix(80.0, 400.0, dark)); // tighter on dark: a wide glint reads as haze
      float rim = 1.0 - n.z;
      float mask = smoothstep(0.02, 0.2, h);
      float lit = max(facing, 0.0) * mix(0.35, 0.08, dark);
      float hi = min((spec * 0.9 + lit + rim * rim * 0.8 * dark) * mask, 1.0);
      float lo = min((max(-facing, 0.0) * 0.35 + rim * 0.12) * (1.0 - 0.8 * dark) * mask, 1.0);
      o = vec4(ink, 1.0) * h * inkOpacity;
      o = vec4(0.02, 0.05, 0.09, 1.0) * lo + o * (1.0 - lo);
      o = vec4(0.95, 0.98, 1.0, 1.0) * hi + o * (1.0 - hi);
    }`),
};

type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };
type Pair = { read: Target; write: Target; swap(): void };
type Uniform = number | [number, number] | [number, number, number] | Target;
type Program = { p: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };

function start(canvas: HTMLCanvasElement): (() => void) | undefined {
  const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return; // ponytail: no WebGL2 float targets = no effect

  // Shaders build in the GPU process, and any status query makes the page wait for it (300ms+ on a
  // cold GPU, right in the load). So start every compile and link now, and read results back only once
  // KHR_parallel_shader_compile says they're done. Without the extension, the first read just blocks.
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const vert = compile(gl.VERTEX_SHADER, VERT);
  const linking = Object.entries(SHADERS).map(([name, src]) => {
    const p = gl.createProgram()!;
    gl.attachShader(p, vert);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
    gl.linkProgram(p);
    return [name, p] as const;
  });
  type Programs = Record<keyof typeof SHADERS, Program>;
  let progs: Programs | undefined;
  // The linked programs, or undefined while the GPU is still building them.
  const programs = () => {
    if (progs || (parallel && !linking.every(([, p]) => gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR)))) {
      return progs;
    }
    progs = Object.fromEntries(
      linking.map(([name, p]) => {
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "shader");
        const uniforms: Program["uniforms"] = {};
        for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
          const u = gl.getActiveUniform(p, i)!.name;
          uniforms[u] = gl.getUniformLocation(p, u);
        }
        return [name, { p, uniforms }];
      }),
    ) as Programs;
    return progs;
  };

  // One full-screen quad, drawn for every pass.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  const target = (w: number, h: number, internal: number, format: number): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h };
  };
  const pair = (w: number, h: number, internal: number, format: number): Pair => {
    let a = target(w, h, internal, format);
    let b = target(w, h, internal, format);
    return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; } };
  };
  // Long side scales with the viewport's aspect so a texel is square on screen.
  const size = (res: number) => {
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    return aspect < 1 ? [res, Math.round(res / aspect)] : [Math.round(res * aspect), res];
  };

  let dye: Pair, velocity: Pair, pressure: Pair, divergence: Target, curl: Target;
  const all = () => [dye.read, dye.write, velocity.read, velocity.write, pressure.read, pressure.write, divergence, curl];
  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    if (dye) for (const t of all()) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); }
    const [sw, sh] = size(CONFIG.SIM_RESOLUTION);
    const [dw, dh] = size(CONFIG.DYE_RESOLUTION);
    dye = pair(dw, dh, gl.R16F, gl.RED);
    velocity = pair(sw, sh, gl.RG16F, gl.RG);
    pressure = pair(sw, sh, gl.R16F, gl.RED);
    divergence = target(sw, sh, gl.R16F, gl.RED);
    curl = target(sw, sh, gl.R16F, gl.RED);
  };
  resize();

  // Runs one program into `out` (null = the canvas). Textures get units in order. texelSize is the sim
  // grid's (dye advection too: velocity is in sim texels), except display, which reads the finer dye.
  const pass = (name: keyof typeof SHADERS, out: Target | null, uniforms: Record<string, Uniform>) => {
    const { p, uniforms: loc } = progs![name];
    gl.useProgram(p);
    const grid = name === "display" ? dye.read : velocity.read;
    gl.uniform2f(loc.texelSize, 1 / grid.w, 1 / grid.h);
    let unit = 0;
    for (const [k, v] of Object.entries(uniforms)) {
      if (typeof v === "number") gl.uniform1f(loc[k], v);
      else if (!Array.isArray(v)) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, v.tex);
        gl.uniform1i(loc[k], unit++);
      } else if (v.length === 2) gl.uniform2f(loc[k], v[0], v[1]);
      else gl.uniform3f(loc[k], v[0], v[1], v[2]);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null);
    gl.viewport(0, 0, out ? out.w : gl.drawingBufferWidth, out ? out.h : gl.drawingBufferHeight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const splat = (x: number, y: number, dx: number, dy: number) => {
    const aspect = canvas.width / canvas.height;
    const radius = (CONFIG.SPLAT_RADIUS / 100) * (aspect > 1 ? aspect : 1);
    const common = { aspectRatio: aspect, point: [x, y] as [number, number], radius };
    pass("splat", velocity.write, { uTarget: velocity.read, color: [dx, dy, 0], ...common });
    velocity.swap();
    pass("splat", dye.write, { uTarget: dye.read, color: [CONFIG.SPLAT_AMOUNT, 0, 0], ...common });
    dye.swap();
  };

  const step = (dt: number) => {
    pass("curl", curl, { uVelocity: velocity.read });
    pass("vorticity", velocity.write, { uVelocity: velocity.read, uCurl: curl, curl: CONFIG.CURL, dt });
    velocity.swap();
    pass("divergence", divergence, { uVelocity: velocity.read });
    pass("scale", pressure.write, { uTexture: pressure.read, value: CONFIG.PRESSURE });
    pressure.swap();
    for (let i = 0; i < CONFIG.PRESSURE_ITERATIONS; i++) {
      pass("pressure", pressure.write, { uPressure: pressure.read, uDivergence: divergence });
      pressure.swap();
    }
    pass("gradient", velocity.write, { uPressure: pressure.read, uVelocity: velocity.read });
    velocity.swap();
    pass("advection", velocity.write, { uVelocity: velocity.read, uSource: velocity.read, dt, dissipation: CONFIG.VELOCITY_DISSIPATION });
    velocity.swap();
    pass("advection", dye.write, { uVelocity: velocity.read, uSource: dye.read, dt, dissipation: CONFIG.DENSITY_DISSIPATION });
    dye.swap();
  };

  // Pointer in texture space (y up). Deltas are corrected so a move is the same length on screen either way.
  let pointer: { x: number; y: number } | null = null;
  let delta: { dx: number; dy: number } | null = null;
  // Ink is the canvas's CSS `color` (the theme accent). It can be light-dark() or oklch, so rather than
  // parse it, paint it once on a 1px 2D canvas and read the sRGB back. Redone only when the theme flips.
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  let ink: [number, number, number] = [0, 0, 0];
  let inkTheme = -1;
  const readInk = () => {
    probe.fillStyle = getComputedStyle(canvas).color;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    ink = [r / 255, g / 255, b / 255];
  };

  let raf = 0;
  let lastFrame = 0;
  let lastMove = 0;

  const frame = (t: number) => {
    if (!programs()) {
      raf = requestAnimationFrame(frame); // shaders still building: moves made meanwhile splat once they're in
      return;
    }
    const dt = Math.min((t - lastFrame) / 1000, 1 / 60);
    lastFrame = t;
    if (delta && pointer) splat(pointer.x, pointer.y, delta.dx * CONFIG.SPLAT_FORCE, delta.dy * CONFIG.SPLAT_FORCE);
    delta = null;
    step(dt);
    const dark = document.documentElement.dataset.theme === "dark" ? 1 : 0;
    if (dark !== inkTheme) {
      readInk();
      inkTheme = dark;
    }
    pass("display", null, { uTexture: dye.read, dark, ink, inkOpacity: CONFIG.INK_OPACITY });
    if (t - lastMove < CONFIG.IDLE_MS) {
      raf = requestAnimationFrame(frame);
      return;
    }
    // Gone quiet: wipe the (by now invisible) leftovers and let the GPU rest until the next move.
    raf = 0;
    gl.clearColor(0, 0, 0, 0);
    for (const tg of [...all(), null]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, tg ? tg.fb : null);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
  };

  // Listens on the window (the hero's side margins are outside the section box) and ignores moves
  // outside the canvas. Delta comes from viewport coords so scrolling between moves isn't a flick.
  let last: { x: number; y: number } | null = null;
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = 1 - (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      pointer = last = null;
      return;
    }
    if (last) {
      const aspect = canvas.width / canvas.height;
      delta = {
        dx: ((e.clientX - last.x) / r.width) * (aspect < 1 ? aspect : 1),
        dy: (-(e.clientY - last.y) / r.height) / (aspect > 1 ? aspect : 1),
      };
    }
    last = { x: e.clientX, y: e.clientY };
    pointer = { x, y };
    lastMove = performance.now();
    if (!raf) {
      lastFrame = lastMove;
      raf = requestAnimationFrame(frame);
    }
  };

  // The hero's height moves with the viewport and font loading, not just window resizes.
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
  };
}

// Mouse and trackpad only (touch drags scroll the page), and only when motion is welcome.
export function BubbleTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    return start(ref.current);
  }, []);
  return <canvas ref={ref} className="bubble-trail" aria-hidden="true" />;
}
