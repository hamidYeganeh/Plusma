import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Scene } from "three";
import {
  createNavigation,
  defineScene,
  type SceneDefinition,
} from "../../src/index.ts";

/** A conformance fixture, not a property listing or a public product route. */
export function residentialScene(
  onSelection: (id: string | null) => void = () => {},
  onDispose: () => void = () => {},
): SceneDefinition {
  const bounds = { minX: -5, maxX: 5, minZ: -5, maxZ: 5 };
  return defineScene({
    id: "residential-conformance",
    initialWaypoint: "foyer",
    bounds,
    navigation: createNavigation(bounds, []),
    regions: [],
    targets: [
      { id: "living-room", x: -2, z: 0, w: 3, d: 3, focus: { x: -2, z: 0 } },
      { id: "bedroom", x: 2, z: 0, w: 3, d: 3, focus: { x: 2, z: 0 } },
    ],
    waypoints: {
      foyer: { x: 0, z: 4, look: [0, 0] },
      balcony: { x: -2, z: -3, look: [-2, 0] },
    },
    overview: {
      desktop: [8, 10, 11],
      compact: [10, 13, 14],
      target: [0, 0, 0],
    },
    build() {
      const scene = new Scene();
      const geometry = new BoxGeometry(3, 0.1, 3);
      const material = new MeshStandardMaterial({
        color: "#b4c1b4",
        emissive: "#526552",
        emissiveIntensity: 0.5,
      });
      const rooms = [-2, 2].map((x) => {
        const object = new Group();
        object.add(new Mesh(geometry, material));
        object.position.set(x, 0, 0);
        scene.add(object);
        return object;
      });
      return {
        scene,
        pickTargets: rooms.map((object, i) => ({
          id: i === 0 ? "living-room" : "bedroom",
          object,
        })),
        setSelectedTarget(id) {
          onSelection(id);
        },
        setNight(value) {
          material.emissiveIntensity = value ? 0.2 : 0.5;
        },
        setOverview() {},
        update() {},
        dispose() {
          geometry.dispose();
          material.dispose();
          scene.clear();
          onDispose();
        },
      };
    },
  });
}
