# Spatial

Deep spatial module for browser rendering, walking, overview, guided tours, target selection, capture and GLB export. Business-owned scene adapters provide geometry and navigation. No application, React, catalog, booking or payment dependency is allowed.

## Interface

- `@repo/spatial`: `SceneDefinition` and related types, `defineScene`, navigation, target approach, input and rendering budgets. Importing this entry does not load the renderer.
- `@repo/spatial/runtime`: dynamically import `mountExperience` after browser mount. Supply a validated scene definition, canvas, map, marker elements and callbacks. Call the returned `dispose()` on unmount or before mounting another experience; repeated disposal is safe.

`SceneDefinition` owns an explicit initial waypoint, geometric targets with stable string identities, walkable navigation and a renderer build function. Target identities are scene-local and are independent of business entities. `SceneInstance` owns every resource allocated by its builder. The runtime owns browser listeners, animation, renderer and controls. A builder that throws during allocation must clean up its own partial resources.

`pickTargets` may register leaf meshes or groups; descendant hits resolve to the nearest registered ancestor. Room targets can supply a walkable `focus` point; furniture targets use the supplied navigation to find reachable standing space. An invalid scene fails before renderer allocation. Unknown target and waypoint requests leave the current experience unchanged.

Rendering-quality reduction, diagnostics and model-export preparation are optional scene hooks. Runtime export has no knowledge of cafe roofs or selection overlays. UI copy, business panels and actions remain with the caller.

## Verification

```sh
npm run test --workspace @repo/spatial
npm run check-types --workspace @repo/spatial
npm run dev:fixture --workspace @repo/spatial
```

The browser fixture opens at `http://127.0.0.1:3112`. It renders a residential scene through the same interface without cafe fields, an `entrance` waypoint or a reflection object. Verify grouped target picking, focus, overview, tour, capture, pause and repeated dispose/remount. It is a local verification surface and is never included in the public app.
