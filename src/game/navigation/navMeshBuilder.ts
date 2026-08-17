import { NavMesh, Polygon, Vector3 as YukaVector3 } from "yuka";
import {
  CORRIDOR_MAX_X,
  CORRIDOR_MAX_Z,
  CORRIDOR_MIN_X,
  CORRIDOR_MIN_Z,
  WALL_MAX_X,
  WALL_MAX_Z,
  WALL_MIN_X,
  WALL_MIN_Z,
} from "@/game/map/mapConfig";

// Grid breakpoints shared by every cell below — reusing the same mapConfig constants (rather
// than re-deriving coordinates) guarantees adjacent cells share bit-for-bit identical vertices,
// which YUKA.NavMesh.fromPolygons requires for its exact-equality neighbor linking.
const X0 = CORRIDOR_MIN_X;
const X1 = WALL_MIN_X;
const X2 = WALL_MAX_X;
const X3 = CORRIDOR_MAX_X;
const Z0 = CORRIDOR_MIN_Z;
const Z1 = WALL_MIN_Z;
const Z2 = WALL_MAX_Z;
const Z3 = CORRIDOR_MAX_Z;

/** Builds an axis-aligned quad (x0,z0)-(x1,z0)-(x1,z1)-(x0,z1), wound CCW as viewed from above
 * (+Y), which YUKA.Polygon.fromContour requires. */
function quad(x0: number, x1: number, z0: number, z1: number): Polygon {
  return new Polygon().fromContour([
    new YukaVector3(x0, 0, z0),
    new YukaVector3(x1, 0, z0),
    new YukaVector3(x1, 0, z1),
    new YukaVector3(x0, 0, z1),
  ]);
}

/**
 * Rectangle-minus-a-notch corridor NavMesh, hand-authored as a 3x3 grid split at the wall's
 * x/z boundaries, with the center cell (the wall's footprint) omitted. Every internal edge in
 * this grid is shared exactly between two adjacent cells by construction, which is what
 * NavMesh.fromPolygons needs to link them into one connected graph. YUKA.NavMesh defaults
 * `mergeConvexRegions` to true, so adjacent cells that stay convex when combined (e.g. the
 * three cells south of the wall) are automatically merged into larger regions after linking —
 * the 8 hand-authored cells are a safe starting decomposition, not necessarily the final
 * region count.
 *
 * Pure function — no Babylon import — so it's testable headlessly (see
 * tests/navMeshBuilder.test.ts).
 */
export function buildAramNavMesh(): NavMesh {
  const polygons = [
    quad(X0, X1, Z0, Z1), // south-west
    quad(X1, X2, Z0, Z1), // south-center (in front of the wall, south side)
    quad(X2, X3, Z0, Z1), // south-east
    quad(X0, X1, Z1, Z2), // west gap beside the wall
    quad(X2, X3, Z1, Z2), // east gap beside the wall
    // center cell intentionally omitted: the wall's footprint
    quad(X0, X1, Z2, Z3), // north-west
    quad(X1, X2, Z2, Z3), // north-center (past the wall, north side)
    quad(X2, X3, Z2, Z3), // north-east
  ];

  return new NavMesh().fromPolygons(polygons);
}
