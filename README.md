# Shader Gradient Exploration

A dependency-free WebGL2 study of the animated mesh gradients popularised by
[ShaderGradient](https://shadergradient.co/) — a noise-displaced mesh, three
colours mixed across it, lit and grained, driven live from a control panel.

Nothing here is compiled or installed: no bundler, no npm packages, no
`three.js`. The shaders, geometry, matrix math and UI are all in `src/`.

![Default gradient](docs/preview.jpg)

| Wireframe | Sphere |
| --- | --- |
| ![Wireframe plane](docs/wireframe.jpg) | ![Displaced sphere](docs/sphere.jpg) |

Two pages share the renderer: `index.html` is the sandbox with the control
panel, and `scroll.html` is a scroll-driven rig that walks the same parameters
through four keyframes as you read down the page.

![Scroll-driven rig](docs/scroll.jpg)

Turn `metalness` up and the same mesh becomes chrome, reflecting a studio
environment generated at startup — no image assets, no library.

| Chrome | Liquid metal |
| --- | --- |
| ![Chrome sphere](docs/chrome.jpg) | ![Liquid metal plane](docs/liquid.jpg) |

## LUMEN — the showcase

`showcase.html` is the piece that puts everything together: a fictional studio
site where the two renderers are the page. The hero is liquid chrome, the
"Lumière" section relights the mesh with palettes lifted from three paintings
(a candlelit cloister, sunlit sailcloth, a renaissance sky), "Mouvement" hands
the screen to a 72 000-point field that folds from a swell into a sphere and
parts under the cursor, and "Matière" comes back to chrome up close.

![LUMEN hero](docs/lumen-hero.jpg)

| Painterly palette | Particle field |
| --- | --- |
| ![Cloister palette](docs/lumen-palette.jpg) | ![Particle field](docs/lumen-field.jpg) |

Everything on it is hand-rolled: split-line headings, magnetic buttons, a
cursor light, film grain, marquee, scroll-linked scene changes with eased
parameter blending, counters, and reveals on intersection. No animation
library, no 3D library, no images — the two Google fonts are the only external
request.

## Run it

ES modules need a real origin, so open it through any static server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Using it

- **Drag** the canvas to orbit, **scroll** to dolly in and out.
- **Space** pauses and resumes the animation, **h** hides the panel.
- **Presets** — Halo, Lagoon, Orbit, Dune, Mesh — are starting points, not modes.
- **Copy link** puts the current settings in a URL; the address bar tracks every
  change as you make it, so a reload never loses a look you liked.
- **Save PNG** grabs the current frame at the canvas' device resolution.

## Scroll rig

`scroll.html` keeps the canvas fixed behind scrolling copy and maps scroll
position onto a path through four keyframes. Continuous values interpolate;
discrete ones — mesh type, light rig, grain — step at the midpoint between two
keyframes, since there is no halfway between a sphere and a plane. The eased
position chases the raw scroll offset exponentially, so the delay feels the same
at 30fps and at 144Hz. `metalness` is one of the interpolated values, so the
painted gradient melts into chrome around the third keyframe and back out.

The rig owns every parameter it names for the whole page, and nothing else
writes them. That is the point: the usual mess in a scroll-driven 3D scene is
two animators writing the same camera and neither winning.

## Parameters

Names follow [`@shadergradient/react`](https://github.com/ruucm/shadergradient)
so settings read the same way, though the value ranges are tuned to this
renderer's own scale. Every one is a query parameter; only non-defaults appear
in the URL.

| Parameter | Values | Notes |
| --- | --- | --- |
| `type` | `plane`, `sphere`, `waterPlane` | `waterPlane` adds a travelling wave on top of the noise |
| `animate` | `on`, `off` | `off` freezes time; the mesh still responds to the sliders |
| `uSpeed` | 0–2 | Time scale of the noise field |
| `uStrength` | 0–2 | Displacement along the surface normal |
| `uDensity` | 0.05–4 | Spatial frequency of the noise |
| `uFrequency` / `uAmplitude` | 0–8 / 0–2 | Wave term, `waterPlane` only |
| `wireframe` | `true`, `false` | Draws grid lines instead of a filled surface |
| `color1` / `color2` / `color3` | hex | Ramp stops, low to high |
| `bgColor` | hex | Clear colour behind the mesh |
| `positionX/Y/Z` | -6–6 | Mesh translation |
| `rotationX/Y/Z` | -180–180 | Mesh rotation, degrees |
| `cAzimuthAngle` / `cPolarAngle` | 0–360 / 1–179 | Orbit camera, degrees |
| `cDistance` / `cameraZoom` | 1–20 / 0.4–3 | Dolly distance and field of view |
| `lightType` | `3d`, `env` | Two-light rig, or a hemisphere environment |
| `envPreset` | `city`, `dawn`, `lobby` | Sky and bounce colours for `env` |
| `metalness` | 0–1 | Blends from the painted gradient to a mirror |
| `roughness` | 0–1 | Sharp chrome to brushed metal, by mip level |
| `brightness` / `reflection` | 0–3 / 0–1 | Exposure and specular weight |
| `grain` / `grainBlending` | `on`, `off` / 0–0.6 | Per-pixel film grain |

## How it works

**Displacement.** A 200×200 grid (or UV sphere) is uploaded once and never
touched again; every frame the vertex shader offsets each vertex along its
normal by a 3D simplex noise sample whose third axis is time. `waterPlane` adds
a `sin`/`cos` wave so the surface reads as swell rather than terrain.

**Normals.** Displacing vertices invalidates the normals that came with the
geometry, so the shader samples the displaced surface three times — at the
vertex and one step along its tangent and bitangent — and takes the cross
product of the two edges. That is why each vertex carries a tangent: on a sphere
there is no canonical one to guess.

**Colour.** A second, slower noise field drives a 0–1 mix value, put through a
`smoothstep` so the ramp doesn't spend most of its area on the middle colour,
then run through two overlapping `smoothstep` blends across the three stops.
The result is shaded (Lambert plus a specular lobe, or a hemisphere ambient for
`env`) and finished with hash-based grain in screen space.

**Frame cost.** All the motion lives in the vertex shader — no buffers are
re-uploaded and no geometry is rebuilt when a slider moves, so a parameter
change is just a uniform write. Rendering stops entirely while the tab is
hidden.

**Drawing on demand.** With animation off, a frame is drawn only after something
marks the view dirty — a parameter change, a resize — rather than every 16ms.
The loop also averages its own frame time over 30 frames and scales the drawing
buffer down (to 55% at worst) when it can't hold the budget, taking the pixels
back when it can. On a software rasteriser the scale settles around 0.7; on a
real GPU it stays at 1.

**Chrome.** A mirror needs something to reflect, and this project ships no
image assets, so `src/envmap.js` generates the room: sky, floor, a bright
horizon line and three softboxes, evaluated per direction into the six faces of
a cubemap so they meet without seams. The fragment shader reflects the view
vector, samples that map — at a blurrier mip the rougher the surface — tints it
by the colour ramp and adds a Fresnel rim, then blends the result over the lit
gradient by `metalness`. The `Chrome` and `Liquid` presets are the two ends of
it.

**Teardown.** `ShaderGradient#dispose()` deletes the buffers, vertex arrays and
program it created — unbinding the program first, or `deleteProgram` merely
flags it while it is still current. Both pages register their listeners against
one `AbortController` and dispose on `pagehide`.

## Layout

```
index.html        sandbox page shell
scroll.html       scroll-driven rig page
style.css         panel, canvas and scroll-page styling
src/main.js       sandbox wiring: controls, URL state, pointer and keyboard input
src/scroll.js     scroll rig: keyframes, easing, one owner per parameter
src/gradient.js   renderer — meshes, uniforms, camera, draw loop
src/shaders.js    GLSL sources
src/geometry.js   plane, sphere and wireframe index generation
src/gl.js         program compilation, 4×4 matrix helpers, colour mixing
src/envmap.js     procedural studio cubemap for metal reflections
src/particles.js  72k-point field: swell↔sphere morph, cursor repulsion
showcase.html     LUMEN — the full showcase page
showcase.css      its design system
src/showcase.js   scene sequencing, entrances, cursor, magnetics
src/params.js     parameter schema, defaults, presets, query-string round trip
src/ui.js         control panel construction
```

## Skills

`.claude/skills/` carries 22 design and 3D skills vendored from
[freshtechbro/claudedesignskills](https://github.com/freshtechbro/claudedesignskills)
(MIT) — Three.js, React Three Fiber, GSAP ScrollTrigger, Motion, Babylon,
PlayCanvas, PixiJS, Lottie, Rive, Spline, Locomotive Scroll, Barba, the Blender
and Substance pipelines, and modern web design among them. They are committed to
the repository rather than a home directory so they survive across sessions and
machines.

## Notes

Requires WebGL2 (every current browser); the page says so plainly instead of
rendering nothing if the context is unavailable. The simplex noise
implementation is the webgl-noise port by Ashima Arts and Stefan Gustavson,
MIT licensed. This is an independent implementation of the idea — no
ShaderGradient code is used or vendored here.
