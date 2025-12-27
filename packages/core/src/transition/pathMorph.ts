import type { PathMark } from "../model";
import { lerp } from "./interpolation";

/**
 * Parsed SVG path command with type and numeric arguments.
 */
export type PathCommand = {
  type: string;
  args: number[];
};

/**
 * Regex to match SVG path commands.
 * Handles commands like: M0,0 L10,20 A5,5,0,0,1,15,25 Z
 */
const PATH_COMMAND_REGEX =
  /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;

/**
 * Regex to extract numbers from command arguments.
 * Handles formats: 10 -5 .5 1e2 1e-2 with comma/space separators.
 */
const NUMBER_REGEX = /-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

/**
 * Parse an SVG path d attribute into an array of commands.
 *
 * @example
 * parsePath("M 0 0 L 10 20 Z")
 * // => [{ type: 'M', args: [0, 0] }, { type: 'L', args: [10, 20] }, { type: 'Z', args: [] }]
 */
export function parsePath(d: string): PathCommand[] {
  const commands: PathCommand[] = [];

  // Reset regex state
  PATH_COMMAND_REGEX.lastIndex = 0;

  let match = PATH_COMMAND_REGEX.exec(d);
  while (match !== null) {
    const type = match[1];
    const argsString = match[2].trim();

    const args: number[] = [];
    if (argsString) {
      const numberMatches = argsString.match(NUMBER_REGEX);
      if (numberMatches) {
        for (const numStr of numberMatches) {
          const num = Number.parseFloat(numStr);
          if (!Number.isNaN(num)) {
            args.push(num);
          }
        }
      }
    }

    commands.push({ args, type });
    match = PATH_COMMAND_REGEX.exec(d);
  }

  return commands;
}

/**
 * Serialize an array of path commands back to a d attribute string.
 */
export function serializePath(commands: PathCommand[]): string {
  return commands
    .map((cmd) => {
      if (cmd.args.length === 0) {
        return cmd.type;
      }
      // Round to 4 decimal places to avoid floating point noise
      const args = cmd.args.map((n) => Math.round(n * 10000) / 10000);
      return `${cmd.type}${args.join(",")}`;
    })
    .join("");
}

/**
 * Check if two paths are compatible for interpolation.
 * Paths are compatible if they have the same command structure.
 */
export function arePathsCompatible(
  a: PathCommand[],
  b: PathCommand[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every(
    (cmd, i) => cmd.type === b[i].type && cmd.args.length === b[i].args.length,
  );
}

/**
 * Interpolate between two compatible path command arrays.
 * If paths are incompatible, returns the target immediately.
 */
export function interpolatePath(
  from: PathCommand[],
  to: PathCommand[],
  t: number,
): PathCommand[] {
  if (!arePathsCompatible(from, to)) {
    // Incompatible paths: snap to target
    return to;
  }

  return from.map((cmd, i) => ({
    args: cmd.args.map((arg, j) => lerp(arg, to[i].args[j], t)),
    type: cmd.type,
  }));
}

/**
 * Interpolate a PathMark between two states.
 * If paths are compatible (same command structure), smoothly interpolate.
 * If incompatible, snap to target at t=1.
 */
export function interpolatePathMark(
  from: PathMark,
  to: PathMark,
  t: number,
): PathMark {
  const fromCmds = parsePath(from.d);
  const toCmds = parsePath(to.d);

  if (!arePathsCompatible(fromCmds, toCmds)) {
    // Incompatible paths: snap to target
    return t < 1 ? from : to;
  }

  const interpolated = interpolatePath(fromCmds, toCmds, t);

  return {
    ...to,
    d: serializePath(interpolated),
    fillOpacity:
      from.fillOpacity !== undefined && to.fillOpacity !== undefined
        ? lerp(from.fillOpacity, to.fillOpacity, t)
        : t < 1
          ? from.fillOpacity
          : to.fillOpacity,
    // Interpolate opacity values
    opacity:
      from.opacity !== undefined && to.opacity !== undefined
        ? lerp(from.opacity, to.opacity, t)
        : t < 1
          ? from.opacity
          : to.opacity,
    strokeOpacity:
      from.strokeOpacity !== undefined && to.strokeOpacity !== undefined
        ? lerp(from.strokeOpacity, to.strokeOpacity, t)
        : t < 1
          ? from.strokeOpacity
          : to.strokeOpacity,
    strokeWidth:
      from.strokeWidth !== undefined && to.strokeWidth !== undefined
        ? lerp(from.strokeWidth, to.strokeWidth, t)
        : t < 1
          ? from.strokeWidth
          : to.strokeWidth,
  };
}
