import type { Object3D, Scene, WebGLRenderer } from "three";

export type Point = { x: number; z: number };
export type ViewMode = "walk" | "overview";
export type Waypoint = string;
export type TargetId = string;
export type RenderQuality = {
  pixelRatio: number;
  reflections: boolean;
  shadows: boolean;
  shadowSize: number;
  textureSize: number;
  foliageStep: number;
  targetFps: number;
};

/** A geometric target. Business identity and actions belong to its caller. */
export type SceneTarget = Point & {
  id: TargetId;
  w: number;
  d: number;
  markerHeight?: number;
  /** A walkable focus point, e.g. the inside of a room. */
  focus?: Point;
};

export type Navigation = {
  isWalkable: (x: number, z: number, radius?: number) => boolean;
  findPath: (start: Point, end: Point) => Point[];
};

/** Renderer-owned resources. dispose releases everything created by build. */
export type SceneInstance = {
  scene: Scene;
  pickTargets: readonly { id: TargetId; object: Object3D }[];
  setSelectedTarget: (id: TargetId | null) => void;
  setOverview: (value: boolean) => void;
  setNight: (value: boolean) => void;
  update: (time: number, dt: number) => void;
  dispose: () => void;
  reduceQuality?: () => void;
  diagnostics?: () => Record<string, string>;
  createExportRoot?: () => Object3D;
};

export type SceneDefinition = {
  id: string;
  initialWaypoint: Waypoint;
  targets: readonly SceneTarget[];
  waypoints: Readonly<
    Record<Waypoint, Point & { look: readonly [number, number] }>
  >;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  regions: readonly (Point & { w: number; d: number; color: string })[];
  overview: {
    desktop: readonly [number, number, number];
    compact: readonly [number, number, number];
    target: readonly [number, number, number];
  };
  navigation: Navigation;
  build: (renderer: WebGLRenderer, quality: RenderQuality) => SceneInstance;
};

export type ExperienceOptions = {
  definition: SceneDefinition;
  debug?: boolean;
  canvas: HTMLCanvasElement;
  map: HTMLCanvasElement;
  /** Elements are supplied by the caller; no selector or DOM naming convention. */
  markers: ReadonlyMap<TargetId, HTMLElement>;
  onReady: () => void;
  onError: () => void;
  onViewChange: (mode: ViewMode) => void;
  onTourChange: (touring: boolean) => void;
  onTargetSelect: (id: TargetId) => void;
};
