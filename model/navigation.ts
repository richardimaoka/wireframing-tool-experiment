import type { ModelNode } from "./layout";
import { getParentPath, pathToString, type Path } from "./path";

export type Direction = "up" | "down" | "left" | "right";

function getNodeByPath(root: ModelNode, path: Path): ModelNode {
  if (path.length < 1 || path[0] !== root.id) {
    throw new Error(
      `getNodeByPath: path '${pathToString(path)}' does not start at the root node '${root.id}'.`,
    );
  }

  let node = root;
  for (let i = 1; i < path.length; i++) {
    if (node.type === "rectangle") {
      throw new Error(
        `getNodeByPath: path '${pathToString(path)}' descends into a rectangle leaf at '${pathToString(path.slice(0, i))}'.`,
      );
    }

    const child = node.children.find((c) => c.id === path[i]);
    if (!child) {
      throw new Error(
        `getNodeByPath: no child '${path[i]}' found under '${pathToString(path.slice(0, i))}'.`,
      );
    }
    node = child;
  }

  return node;
}

// Wraps index into [0, length), so moving past the last child lands back on
// the first one (and vice versa).
function cycleIndex(index: number, length: number): number {
  return (index + length) % length;
}

// Sibling navigation within a Rows parent: moves to the row above/below,
// cycling from the last child back to the first (and vice versa). Throws if
// `path` has no parent, or if the immediate parent isn't a Rows container -
// callers must check both (e.g. via getSiblingPath) before calling this.
export function getRowSiblingPath(
  root: ModelNode,
  path: Path,
  direction: "up" | "down",
): Path {
  // Unlike getSiblingPath, this is not a normal no-op case: callers must
  // have already confirmed `path` has a parent before calling this.
  if (path.length < 2) {
    throw new Error(
      `getRowSiblingPath: path '${pathToString(path)}' has no parent.`,
    );
  }

  const parentPath = getParentPath(path);
  const parent = getNodeByPath(root, parentPath);

  if (parent.type !== "rows") {
    throw new Error(
      `getRowSiblingPath: parent '${pathToString(parentPath)}' of '${pathToString(path)}' is not a Rows container.`,
    );
  }

  const currentId = path[path.length - 1];
  const currentIndex = parent.children.findIndex((c) => c.id === currentId);
  const delta = direction === "up" ? -1 : 1;
  const newIndex = cycleIndex(currentIndex + delta, parent.children.length);

  return [...parentPath, parent.children[newIndex].id];
}

// Sibling navigation within a Columns parent: moves to the column
// left/right, cycling from the last child back to the first (and vice
// versa). Throws if `path` has no parent, or if the immediate parent isn't
// a Columns container - callers must check both (e.g. via getSiblingPath)
// before calling this.
export function getColumnSiblingPath(
  root: ModelNode,
  path: Path,
  direction: "left" | "right",
): Path {
  // Unlike getSiblingPath, this is not a normal no-op case: callers must
  // have already confirmed `path` has a parent before calling this.
  if (path.length < 2) {
    throw new Error(
      `getColumnSiblingPath: path '${pathToString(path)}' has no parent.`,
    );
  }

  const parentPath = getParentPath(path);
  const parent = getNodeByPath(root, parentPath);

  if (parent.type !== "columns") {
    throw new Error(
      `getColumnSiblingPath: parent '${pathToString(parentPath)}' of '${pathToString(path)}' is not a Columns container.`,
    );
  }

  const currentId = path[path.length - 1];
  const currentIndex = parent.children.findIndex((c) => c.id === currentId);
  const delta = direction === "left" ? -1 : 1;
  const newIndex = cycleIndex(currentIndex + delta, parent.children.length);

  return [...parentPath, parent.children[newIndex].id];
}

// Dispatches to the row/column sibling navigation matching the immediate
// parent's orientation. Returns null - a no-op - if the parent's
// orientation doesn't match the direction (e.g. left/right under a Rows
// parent).
export function getSiblingPath(
  root: ModelNode,
  path: Path,
  direction: Direction,
): Path | null {
  // path has no parent (e.g. the root itself) - nothing to move to, but
  // that's a normal state (the initial, unsplit canvas), not a caller bug.
  if (path.length < 2) {
    return null;
  }

  const parentPath = getParentPath(path);
  const parent = getNodeByPath(root, parentPath);

  if (parent.type === "rectangle") {
    throw new Error(
      `getSiblingPath: parent '${pathToString(parentPath)}' of '${pathToString(path)}' is a rectangle leaf, not a container.`,
    );
  }

  if (parent.type === "rows") {
    return direction === "up" || direction === "down"
      ? getRowSiblingPath(root, path, direction)
      : null;
  }

  return direction === "left" || direction === "right"
    ? getColumnSiblingPath(root, path, direction)
    : null;
}
