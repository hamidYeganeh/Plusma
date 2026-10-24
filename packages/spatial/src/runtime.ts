import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  initialRenderQuality,
  needsLighterRendering,
} from "./render-quality.js";
import { routeToTarget } from "./target-navigation.js";
import { defineScene } from "./scene-definition.ts";
import type {
  ExperienceOptions,
  Point,
  ViewMode,
  Waypoint,
} from "./contracts.ts";

/** Owns the entire browser/GPU lifetime. Call dispose before mounting another scene. */
export function mountExperience(options: ExperienceOptions) {
  const { canvas, map, onReady, onError, onViewChange, onTourChange } = options;
  const definition = defineScene(options.definition);
  const {
    targets: TARGETS,
    bounds: mapBounds,
    navigation: { isWalkable, findPath },
  } = definition;
  const PLACES: Readonly<
    Record<string, { x: number; z: number; look: readonly [number, number] }>
  > = definition.waypoints;
  const mapWidth = mapBounds.maxX - mapBounds.minX;
  const mapDepth = mapBounds.maxZ - mapBounds.minZ;
  const events = new AbortController();
  const cleanupTasks: Array<() => void> = [() => events.abort()];
  try {
    const bounds = () => canvas.getBoundingClientRect();
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    let compact =
      bounds().width < 650 || matchMedia("(pointer: coarse)").matches;
    const small = () => compact;
    const quality = initialRenderQuality({
      compact,
      cores: navigator.hardwareConcurrency,
      memory: device.deviceMemory ?? 0,
      saveData: device.connection?.saveData,
    });
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "default",
    });
    cleanupTasks.push(() => renderer.dispose());
    renderer.setPixelRatio(Math.min(devicePixelRatio, quality.pixelRatio));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = quality.shadows;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const instance = definition.build(renderer, quality);
    const pickIds = new Map(
      instance.pickTargets.map(({ id, object }) => [object, id]),
    );
    const pickObjects = [...pickIds.keys()];
    cleanupTasks.push(() => instance.dispose());
    const camera = new THREE.PerspectiveCamera(61, 1, 0.08, 100);
    camera.rotation.order = "YXZ";
    const orbit = new OrbitControls(camera, canvas);
    cleanupTasks.push(() => orbit.dispose());
    orbit.enabled = false;
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.075;
    orbit.minDistance = 6;
    orbit.maxDistance = Math.max(28, mapDepth * 1.9);
    orbit.maxPolarAngle = Math.PI * 0.47;
    orbit.target.set(0, 0.6, 0);

    let disposed = false,
      paused = false,
      mode: ViewMode = "walk";
    let yaw = 0,
      pitch = -0.045,
      time = 0,
      previous = performance.now();
    let redrawUntil = performance.now() + 100;
    let path: Point[] = [],
      lookTarget: readonly number[] | null = null;
    let touring = false,
      tourIndex = 0,
      tourPause = 0;
    let drag: {
      id: number;
      x: number;
      y: number;
      moved: number;
      touch: boolean;
    } | null = null;
    let movement = { x: 0, y: 0 };
    let selectedTargetId: string | null = null;
    let tap: { id: number; x: number; y: number } | null = null;
    const activePointers = new Set<number>();
    const markerNodes = TARGETS.map((target) => ({
      target,
      node: options.markers.get(target.id),
    }));
    const projected = new THREE.Vector3();
    function updateMarkers() {
      if (mode !== "overview") {
        for (const { node } of markerNodes) if (node) node.hidden = true;
        return;
      }
      const rect = bounds();
      for (const { target, node } of markerNodes) {
        if (!node) continue;
        if (mode !== "overview") {
          node.hidden = true;
          continue;
        }
        projected
          .set(target.x, target.markerHeight ?? 1.05, target.z)
          .project(camera);
        const x = (projected.x * 0.5 + 0.5) * rect.width,
          y = (-projected.y * 0.5 + 0.5) * rect.height;
        node.hidden =
          projected.z > 1 ||
          projected.z < -1 ||
          x < 24 ||
          x > rect.width - 24 ||
          y < 95 ||
          y > rect.height - 100;
        if (!node.hidden)
          node.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      }
    }
    function selectTarget(id: string | null, notify = true) {
      if (id !== null && !TARGETS.some((target) => target.id === id)) return;
      selectedTargetId = id;
      instance.setSelectedTarget(id);
      redrawUntil = performance.now() + 100;
      wake();
      if (id !== null) {
        stopTour();
        path = [];
        lookTarget = null;
        clearInput();
        if (notify) options.onTargetSelect(id);
      }
    }
    function pickTarget(event: PointerEvent) {
      const rect = bounds();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      for (const hit of raycaster.intersectObjects(pickObjects, true)) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const id = pickIds.get(object);
          if (id !== undefined) return id;
          object = object.parent;
        }
      }
      return undefined;
    }
    const keys = new Set<string>();
    const velocity = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let savedWalk = {
      x: PLACES[definition.initialWaypoint]!.x,
      z: PLACES[definition.initialWaypoint]!.z,
      yaw: 0,
      pitch,
    };
    const tourStops = [
      ...Object.keys(PLACES).filter(
        (name) => name !== definition.initialWaypoint,
      ),
      definition.initialWaypoint,
    ];

    function wake() {
      if (!disposed && !document.hidden) {
        previous = performance.now();
        renderer.setAnimationLoop(animate);
      }
    }
    function clearInput() {
      activePointers.clear();
      tap = null;
      keys.clear();
      movement = { x: 0, y: 0 };
      velocity.set(0, 0);
      drag = null;
    }
    function stopTour() {
      if (touring) onTourChange(false);
      touring = false;
      tourPause = 0;
    }
    function setView(next: ViewMode) {
      if (next === mode || disposed) return;
      clearInput();
      path = [];
      stopTour();
      if (next === "overview") {
        savedWalk = { x: camera.position.x, z: camera.position.z, yaw, pitch };
        const position = small()
          ? definition.overview.compact
          : definition.overview.desktop;
        camera.position.set(position[0]!, position[1]!, position[2]!);
        const target = definition.overview.target;
        orbit.target.set(target[0]!, target[1]!, target[2]!);
        orbit.enabled = !paused;
        orbit.update();
      } else {
        orbit.enabled = false;
        camera.position.set(savedWalk.x, 1.66, savedWalk.z);
        yaw = savedWalk.yaw;
        pitch = savedWalk.pitch;
        camera.rotation.set(pitch, yaw, 0, "YXZ");
      }
      mode = next;
      instance.setOverview(mode === "overview");
      renderer.shadowMap.needsUpdate = true;
      onViewChange(mode);
      redrawUntil = performance.now() + 100;
      wake();
    }
    function navigate(
      point: Point,
      target: readonly number[] | null,
      automatic = false,
    ) {
      if (mode !== "walk") setView("walk");
      if (!automatic) stopTour();
      clearInput();
      path = findPath({ x: camera.position.x, z: camera.position.z }, point);
      lookTarget = target;
    }
    function nextStop() {
      const point = PLACES[tourStops[tourIndex++ % tourStops.length]!]!;
      navigate(point, point.look, true);
      tourPause = 0;
    }
    function reset() {
      setView("walk");
      clearInput();
      stopTour();
      path = [];
      lookTarget = null;
      camera.position.set(
        PLACES[definition.initialWaypoint]!.x,
        1.66,
        PLACES[definition.initialWaypoint]!.z,
      );
      yaw = Math.atan2(
        camera.position.x - PLACES[definition.initialWaypoint]!.look[0]!,
        camera.position.z - PLACES[definition.initialWaypoint]!.look[1]!,
      );
      pitch = -0.045;
      camera.rotation.set(pitch, yaw, 0, "YXZ");
    }
    reset();
    function resize() {
      const { width, height } = bounds();
      compact = width < 650 || matchMedia("(pointer: coarse)").matches;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 650 ? 69 : 61;
      camera.updateProjectionMatrix();
      redrawUntil = performance.now() + 100;
      wake();
    }
    const observer = new ResizeObserver(resize);
    cleanupTasks.push(() => observer.disconnect());
    observer.observe(canvas);
    resize();

    const moveKeys = [
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    const listen = <K extends keyof WindowEventMap>(
      name: K,
      handler: (event: WindowEventMap[K]) => void,
    ) => window.addEventListener(name, handler, { signal: events.signal });
    listen("keydown", (event) => {
      if (
        paused ||
        mode !== "walk" ||
        document.activeElement !== canvas ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return;
      if (moveKeys.includes(event.code)) {
        event.preventDefault();
        stopTour();
        path = [];
        lookTarget = null;
        keys.add(event.code);
      }
      if (event.code.startsWith("Shift")) keys.add(event.code);
      if (event.code === "Escape") {
        path = [];
        stopTour();
      }
    });
    listen("keyup", (event) => keys.delete(event.code));
    listen("blur", clearInput);
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) {
          clearInput();
          renderer.setAnimationLoop(null);
        } else if (!disposed) {
          previous = performance.now();
          renderer.setAnimationLoop(animate);
        }
      },
      { signal: events.signal },
    );
    canvas.addEventListener(
      "webglcontextlost",
      (event) => {
        event.preventDefault();
        if (!disposed) {
          paused = true;
          renderer.setAnimationLoop(null);
          onError();
        }
      },
      { signal: events.signal },
    );
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (paused || event.button > 0) return;
        activePointers.add(event.pointerId);
        if (activePointers.size === 1)
          tap = { id: event.pointerId, x: event.clientX, y: event.clientY };
        else tap = null;
        if (mode !== "walk" || drag) return;
        canvas.focus({ preventScroll: true });
        drag = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          moved: 0,
          touch: event.pointerType === "touch",
        };
        canvas.setPointerCapture(event.pointerId);
      },
      { signal: events.signal },
    );
    canvas.addEventListener(
      "pointermove",
      (event) => {
        if (!drag || drag.id !== event.pointerId || paused) return;
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        if (drag.moved > 7) {
          stopTour();
          path = [];
          lookTarget = null;
          yaw -= dx * (drag.touch ? 0.0027 : 0.0035);
          pitch = THREE.MathUtils.clamp(
            pitch - dy * (drag.touch ? 0.0027 : 0.0035),
            -0.95,
            1.03,
          );
        }
        drag.x = event.clientX;
        drag.y = event.clientY;
      },
      { signal: events.signal },
    );
    canvas.addEventListener(
      "pointerup",
      (event) => {
        const wasSingle = activePointers.size === 1;
        activePointers.delete(event.pointerId);
        if (mode === "overview") {
          if (
            tap?.id === event.pointerId &&
            wasSingle &&
            Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 8 &&
            !paused
          ) {
            const id = pickTarget(event);
            if (id !== undefined) selectTarget(id);
          }
          tap = null;
          return;
        }
        if (!drag || drag.id !== event.pointerId) return;
        const clicked = drag.moved < 8;
        drag = null;
        if (!clicked || paused) return;
        const selected = pickTarget(event);
        if (selected !== undefined) {
          selectTarget(selected);
          return;
        }
        const rect = bounds();
        raycaster.setFromCamera(
          new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            (-(event.clientY - rect.top) / rect.height) * 2 + 1,
          ),
          camera,
        );
        if (
          raycaster.ray.intersectPlane(plane, hit) &&
          isWalkable(hit.x, hit.z, 0.23)
        )
          navigate({ x: hit.x, z: hit.z }, null);
      },
      { signal: events.signal },
    );
    for (const event of ["pointercancel", "lostpointercapture"] as const)
      canvas.addEventListener(
        event,
        (event) => {
          activePointers.delete(event.pointerId);
          if (drag?.id === event.pointerId) drag = null;
          tap = null;
        },
        { signal: events.signal },
      );
    canvas.addEventListener("contextmenu", (event) => event.preventDefault(), {
      signal: events.signal,
    });

    const context = map.getContext("2d");
    const mx = (x: number) =>
      16 + ((x - mapBounds.minX) / mapWidth) * (map.width - 32);
    const mz = (z: number) =>
      16 + ((z - mapBounds.minZ) / mapDepth) * (map.height - 32);
    function drawMap() {
      if (!context) return;
      context.clearRect(0, 0, map.width, map.height);
      context.fillStyle = "#efede9";
      context.fillRect(16, 16, map.width - 32, map.height - 32);
      context.strokeStyle = "#b9b4bc";
      context.lineWidth = 4;
      context.strokeRect(16, 16, map.width - 32, map.height - 32);
      for (const region of definition.regions) {
        context.fillStyle = region.color;
        context.fillRect(
          mx(region.x - region.w / 2),
          mz(region.z - region.d / 2),
          (region.w / mapWidth) * (map.width - 32),
          (region.d / mapDepth) * (map.height - 32),
        );
      }
      for (const target of TARGETS) {
        context.fillStyle =
          target.id === selectedTargetId ? "#381ac9" : "#b79c76";
        context.fillRect(
          mx(target.x - target.w / 2),
          mz(target.z - target.d / 2),
          (target.w / mapWidth) * (map.width - 32),
          (target.d / mapDepth) * (map.height - 32),
        );
      }
      if (mode === "walk") {
        context.save();
        context.translate(mx(camera.position.x), mz(camera.position.z));
        context.rotate(-yaw);
        context.fillStyle = "#381ac933";
        context.beginPath();
        context.moveTo(0, 0);
        context.arc(0, 0, 28, -Math.PI * 0.72, -Math.PI * 0.28);
        context.closePath();
        context.fill();
        context.fillStyle = "#381ac9";
        context.strokeStyle = "white";
        context.lineWidth = 3;
        context.beginPath();
        context.arc(0, 0, 6, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.restore();
      }
    }
    map.addEventListener(
      "pointerdown",
      (event) => {
        if (paused) return;
        const rect = map.getBoundingClientRect();
        const x =
          ((((event.clientX - rect.left) / rect.width) * map.width - 16) /
            (map.width - 32)) *
            mapWidth +
          mapBounds.minX;
        const z =
          ((((event.clientY - rect.top) / rect.height) * map.height - 16) /
            (map.height - 32)) *
            mapDepth +
          mapBounds.minZ;
        const target = TARGETS.find(
          (target) =>
            Math.abs(target.x - x) < target.w / 2 + 0.25 &&
            Math.abs(target.z - z) < target.d / 2 + 0.25,
        );
        if (target) {
          selectTarget(target.id);
          return;
        }
        if (isWalkable(x, z, 0.23)) navigate({ x, z }, null);
        canvas.focus({ preventScroll: true });
      },
      { signal: events.signal },
    );

    function slide(dx: number, dz: number) {
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.08));
      for (let i = 0; i < steps; i++) {
        if (isWalkable(camera.position.x + dx / steps, camera.position.z))
          camera.position.x += dx / steps;
        if (isWalkable(camera.position.x, camera.position.z + dz / steps))
          camera.position.z += dz / steps;
      }
    }
    function turnTo(target: readonly number[], dt: number) {
      const angle = Math.atan2(
        camera.position.x - target[0]!,
        camera.position.z - target[1]!,
      );
      yaw +=
        Math.atan2(Math.sin(angle - yaw), Math.cos(angle - yaw)) *
        Math.min(1, dt * 2.5);
      pitch = THREE.MathUtils.damp(pitch, -0.06, 2.5, dt);
    }
    let ready = false,
      mapTick = 0,
      pendingFrame = 0,
      throttled = false;
    const frameTimes: number[] = [];
    const started = performance.now();
    cleanupTasks.push(() => renderer.setAnimationLoop(null));
    function animate() {
      if (disposed) return;
      const now = performance.now(),
        elapsed = (now - previous) / 1000;
      previous = now;
      if (document.hidden) return;
      if (ready && !paused && now - started > 1800 && !throttled) {
        frameTimes.push(elapsed * 1000);
        if (frameTimes.length >= 90) {
          if (needsLighterRendering(frameTimes)) {
            throttled = true;
            renderer.setPixelRatio(
              Math.max(0.65, renderer.getPixelRatio() * 0.8),
            );
            renderer.shadowMap.enabled = false;
            instance.reduceQuality?.();
            resize();
          }
          frameTimes.length = 0;
        }
      }
      pendingFrame += elapsed;
      const interval = paused ? 1 / 12 : 1 / quality.targetFps;
      if (ready && pendingFrame < interval - 0.001) return;
      const dt = Math.min(pendingFrame, 0.08);
      pendingFrame = 0;
      time += dt;
      if (!paused && mode === "walk") {
        let forward =
          Number(keys.has("KeyW") || keys.has("ArrowUp")) -
          Number(keys.has("KeyS") || keys.has("ArrowDown")) +
          movement.y;
        let side =
          Number(keys.has("KeyD") || keys.has("ArrowRight")) -
          Number(keys.has("KeyA") || keys.has("ArrowLeft")) +
          movement.x;
        if (forward || side || velocity.length() > 0.012) {
          const length = Math.max(1, Math.hypot(forward, side));
          forward /= length;
          side /= length;
          const speed =
            keys.has("ShiftLeft") || keys.has("ShiftRight")
              ? 2.7
              : small()
                ? 1.28
                : 1.7;
          const angle = camera.rotation.y;
          velocity.x = THREE.MathUtils.damp(
            velocity.x,
            (-Math.sin(angle) * forward + Math.cos(angle) * side) * speed,
            forward || side ? 10 : 18,
            dt,
          );
          velocity.y = THREE.MathUtils.damp(
            velocity.y,
            (-Math.cos(angle) * forward - Math.sin(angle) * side) * speed,
            forward || side ? 10 : 18,
            dt,
          );
          slide(velocity.x * dt, velocity.y * dt);
        } else if (path.length) {
          const point = path[0]!,
            dx = point.x - camera.position.x,
            dz = point.z - camera.position.z;
          const distance = Math.hypot(dx, dz),
            step = Math.min(distance, (touring ? 1.25 : 1.7) * dt);
          if (distance < 0.035) path.shift();
          else {
            slide((dx / distance) * step, (dz / distance) * step);
            if (touring || !lookTarget) turnTo([point.x, point.z], dt);
          }
        } else if (lookTarget) turnTo(lookTarget, dt);
        if (touring && !path.length) {
          tourPause += dt;
          if (tourPause > 3.5) nextStop();
        }
        camera.rotation.y +=
          Math.atan2(
            Math.sin(yaw - camera.rotation.y),
            Math.cos(yaw - camera.rotation.y),
          ) *
          (1 - Math.exp(-18 * dt));
        camera.rotation.x = THREE.MathUtils.damp(
          camera.rotation.x,
          pitch,
          18,
          dt,
        );
      }
      if (mode === "overview" && !paused) orbit.update();
      instance.update(time, dt);
      updateMarkers();
      try {
        renderer.render(instance.scene, camera);
      } catch {
        renderer.setAnimationLoop(null);
        onError();
        return;
      }
      mapTick += dt;
      if (mapTick > 0.1) {
        drawMap();
        mapTick = 0;
      }
      if (options.debug) {
        canvas.dataset.renderScale = renderer.getPixelRatio().toFixed(2);
        canvas.dataset.triangles = String(renderer.info.render.triangles);
        Object.assign(canvas.dataset, instance.diagnostics?.());
      }
      if (!ready) {
        ready = true;
        onReady();
      }
      if (paused && now > redrawUntil) renderer.setAnimationLoop(null);
    }
    renderer.setAnimationLoop(animate);

    return {
      selectTarget(id: string | null) {
        selectTarget(id, false);
      },
      focusTarget(id: string) {
        const target = TARGETS.find((target) => target.id === id);
        if (!target) return;
        if (mode !== "walk") setView("walk");
        const route = routeToTarget(
          { x: camera.position.x, z: camera.position.z },
          target,
          { findPath, isWalkable },
        );
        if (route) navigate(route.point, [target.x, target.z]);
      },
      setView,
      goTo(name: Waypoint) {
        const point = PLACES[name];
        if (!point) return;
        navigate(point, point.look);
      },
      setNight(value: boolean) {
        instance.setNight(value);
        redrawUntil = performance.now() + 1800;
        wake();
      },
      setTouring(value: boolean) {
        if (!value) {
          stopTour();
          path = [];
          return;
        }
        setView("walk");
        touring = true;
        tourIndex = 0;
        nextStop();
        onTourChange(true);
      },
      setPaused(value: boolean) {
        if (paused === value) return;
        paused = value;
        clearInput();
        orbit.enabled = !value && mode === "overview";
        wake();
      },
      setMovement(value: { x: number; y: number }) {
        if (paused || mode !== "walk") return;
        movement = value;
        if (value.x || value.y) {
          stopTour();
          path = [];
          lookTarget = null;
        }
      },
      reset,
      async capture() {
        renderer.render(instance.scene, camera);
        return new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
      },
      async exportModel() {
        const { GLTFExporter } =
          await import("three/addons/exporters/GLTFExporter.js");
        if (disposed) return null;
        const model = instance.createExportRoot?.() ?? instance.scene.clone();
        const data = await new GLTFExporter().parseAsync(model, {
          binary: true,
          onlyVisible: true,
        });
        return data instanceof ArrayBuffer
          ? new Blob([data], { type: "model/gltf-binary" })
          : null;
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        renderer.setAnimationLoop(null);
        clearInput();
        for (const cleanup of cleanupTasks.reverse()) cleanup();
      },
    };
  } catch (error) {
    for (const cleanup of cleanupTasks.reverse()) cleanup();
    throw error;
  }
}

export type Experience = ReturnType<typeof mountExperience>;
