import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { FollowPathBehavior, type NavMesh, Path, Vehicle, Vector3 as YukaVector3 } from "yuka";
import { syncMeshFromYuka } from "@/game/navigation/yukaSync";

export interface HeroMovementController {
  vehicle: Vehicle;
  /** Requests a NavMesh path to the given ground point and starts following it. */
  moveTo(point: Vector3): void;
  /** Cancels any in-progress path and zeroes velocity immediately (e.g. entering attack range). */
  stop(): void;
  /** True while the vehicle has meaningful velocity — drives the Idle/Moving combat state. */
  isMoving(): boolean;
  /** Copies the simulated Yuka position/orientation onto the Babylon mesh. Call once per frame. */
  syncMesh(): void;
}

const MAX_SPEED = 14;
const MAX_FORCE = 80;
const NEXT_WAYPOINT_DISTANCE = 1.5;
/** Below this squared speed, the vehicle counts as stopped for state-machine purposes. */
const MOVING_SPEED_SQ_EPSILON = 0.01;

export function createHeroMovementController(navMesh: NavMesh, mesh: Mesh): HeroMovementController {
  const vehicle = new Vehicle();
  vehicle.position.set(mesh.position.x, mesh.position.y, mesh.position.z);
  vehicle.maxSpeed = MAX_SPEED;
  vehicle.maxForce = MAX_FORCE;

  const followPathBehavior = new FollowPathBehavior(new Path(), NEXT_WAYPOINT_DISTANCE);
  followPathBehavior.active = false;
  vehicle.steering.add(followPathBehavior);

  function moveTo(point: Vector3): void {
    const from = new YukaVector3(vehicle.position.x, vehicle.position.y, vehicle.position.z);
    const to = new YukaVector3(point.x, vehicle.position.y, point.z);

    const waypoints = navMesh.findPath(from, to);

    const path = followPathBehavior.path;
    path.clear();
    for (const waypoint of waypoints) path.add(waypoint);

    followPathBehavior.active = waypoints.length > 0;
  }

  function stop(): void {
    followPathBehavior.active = false;
    followPathBehavior.path.clear();
    vehicle.velocity.set(0, 0, 0);
  }

  function isMoving(): boolean {
    return vehicle.getSpeedSquared() > MOVING_SPEED_SQ_EPSILON;
  }

  function syncMesh(): void {
    syncMeshFromYuka(vehicle, mesh);
  }

  return { vehicle, moveTo, stop, isMoving, syncMesh };
}
