import { defineScene, type SceneDefinition } from "@repo/spatial";
import { Light, type Object3D } from "three";
import type { buildCafe } from "./barg/cafe.js";
import * as barg from "./barg/layout.js";
import type { buildComma } from "./comma/cafe.js";
import * as comma from "./comma/layout.js";
import { tableTargetId, type Cafe } from "../catalog.ts";

type CafeSceneId = Cafe["scene"];
type Layout = {
  tables: readonly { id: number; x: number; z: number; w: number; d: number }[];
  places: Record<string, { x: number; z: number; look: number[] }>;
  bounds: SceneDefinition["bounds"];
  regions: SceneDefinition["regions"];
  navigation: SceneDefinition["navigation"];
  overview: SceneDefinition["overview"];
};

function cafeScene(
  id: CafeSceneId,
  build: typeof buildCafe | typeof buildComma,
  layout: Layout,
) {
  const tableIds = new Map(
    layout.tables.map((table) => [tableTargetId(table.id), table.id]),
  );
  return defineScene({
    id,
    initialWaypoint: "entrance",
    targets: layout.tables.map(({ id, x, z, w, d }) => ({
      id: tableTargetId(id),
      x,
      z,
      w,
      d,
    })),
    waypoints: Object.fromEntries(
      Object.entries(layout.places).map(([key, point]) => [
        key,
        {
          x: point.x,
          z: point.z,
          look: [point.look[0]!, point.look[1]!] as const,
        },
      ]),
    ),
    bounds: layout.bounds,
    regions: layout.regions,
    navigation: layout.navigation,
    overview: layout.overview,
    build(renderer, quality) {
      const model = build(renderer, quality);
      return {
        scene: model.scene,
        pickTargets: model.tableHits.map((object) => ({
          id: tableTargetId(object.userData.tableId),
          object,
        })),
        setSelectedTarget(targetId) {
          model.setSelectedTable(
            targetId === null ? null : (tableIds.get(targetId) ?? null),
          );
        },
        setOverview: model.setOverview,
        setNight: model.setNight,
        update: model.update,
        dispose: model.dispose,
        reduceQuality() {
          model.reflector.visible = false;
        },
        diagnostics() {
          return { reflection: String(model.reflector.visible) };
        },
        createExportRoot() {
          const root = model.scene.clone();
          const ceiling = root.getObjectByName("ceiling");
          if (ceiling) ceiling.visible = false;
          const overlays: Object3D[] = [];
          root.traverse((object) => {
            if (object.userData.noBatch || object instanceof Light)
              overlays.push(object);
          });
          overlays.forEach((object) => object.removeFromParent());
          return root;
        },
      };
    },
  });
}

const scenes = {
  "barg-garden": {
    tables: barg.TABLES,
    places: barg.PLACES,
    bounds: { minX: -6, maxX: 6, minZ: -7, maxZ: 7 },
    regions: [
      {
        x: barg.POND.x,
        z: barg.POND.z,
        w: barg.POND.width,
        d: barg.POND.depth,
        color: "#678475",
      },
    ],
    navigation: { isWalkable: barg.isWalkable, findPath: barg.findPath },
    overview: {
      desktop: [8.5, 10.5, 11],
      compact: [11, 15, 17],
      target: [0, 0.25, 0],
    },
  },
  "comma-beheshti": {
    tables: comma.TABLES,
    places: comma.PLACES,
    bounds: comma.BOUNDS,
    regions: comma.MAP_REGIONS,
    navigation: { isWalkable: comma.isWalkable, findPath: comma.findPath },
    overview: {
      desktop: [16, 23, 29],
      compact: [23, 32, 42],
      target: [0, 0.8, 0],
    },
  },
} satisfies Record<CafeSceneId, Layout>;

export async function loadCafeScene(id: string): Promise<SceneDefinition> {
  if (!Object.hasOwn(scenes, id)) throw new Error(`Unknown cafe scene: ${id}`);
  if (id === "barg-garden") {
    const { buildCafe } = await import("./barg/cafe.js");
    return cafeScene(id, buildCafe, scenes[id]);
  }
  const { buildComma } = await import("./comma/cafe.js");
  return cafeScene("comma-beheshti", buildComma, scenes["comma-beheshti"]);
}
